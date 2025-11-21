// backend/routes/bookings.js
const express = require("express");
const router = express.Router();

const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Mongoose models
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const User = require("../models/User");

// ============ TẠO BOOKING MỚI ============
// POST /api/bookings
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { room_id, hotel_id, check_in, check_out, guests, special_requests } =
      req.body;

    const userId = req.user.id;

    // 1. Kiểm tra phòng tồn tại + lấy giá
    const room = await Room.findById(room_id).lean();
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate) || isNaN(checkOutDate)) {
      return res
        .status(400)
        .json({ message: "Ngày check-in/check-out không hợp lệ" });
    }

    if (checkOutDate <= checkInDate) {
      return res
        .status(400)
        .json({ message: "Ngày trả phòng phải sau ngày nhận phòng" });
    }

    // 2. Kiểm tra phòng còn trống (không bị overlap)
    const overlapping = await Booking.findOne({
      room: room_id,
      status: { $ne: "cancelled" },
      $or: [
        // khoảng mới giao với khoảng cũ
        {
          checkIn: { $lte: checkOutDate },
          checkOut: { $gte: checkInDate },
        },
      ],
    }).lean();

    if (overlapping) {
      return res.status(400).json({
        message: "Phòng đã được đặt trong khoảng thời gian này",
      });
    }

    // 3. Tính số đêm + tổng tiền
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );
    const total_price = room.price * nights;

    // 4. Tạo booking mới
    const booking = await Booking.create({
      user: userId,
      room: room_id,
      hotel: hotel_id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice: total_price,
      guests,
      specialRequests: special_requests || "",
      status: "pending",
    });

    res.status(201).json({
      message: "Đặt phòng thành công, đang chờ xác nhận",
      booking_id: booking._id.toString(),
      total_price,
      nights,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Lỗi khi đặt phòng" });
  }
});

// ============ LẤY BOOKING CỦA USER ============
// GET /api/bookings/my-bookings
router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("hotel")
      .populate("room")
      .lean();

    const mapped = bookings.map((b) => ({
      id: b._id.toString(),
      user_id: b.user?.toString(),
      room_id: b.room?._id?.toString(),
      hotel_id: b.hotel?._id?.toString(),
      check_in: b.checkIn,
      check_out: b.checkOut,
      total_price: b.totalPrice,
      guests: b.guests,
      special_requests: b.specialRequests,
      status: b.status,
      created_at: b.createdAt,
      updated_at: b.updatedAt,

      hotel_name: b.hotel?.name,
      address: b.hotel?.address,
      city: b.hotel?.city,
      hotel_image_url: b.hotel?.imageUrl,
      hotel_image_urls: b.hotel?.imageUrls,

      room_type: b.room?.roomType,
      room_number: b.room?.roomNumber,
    }));

    res.json({ bookings: mapped });
  } catch (error) {
    console.error("❌ Get my bookings error:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng" });
  }
});

// ============ LẤY TẤT CẢ BOOKING (ADMIN) ============
// GET /api/bookings/all?status=...
router.get("/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate("hotel")
      .populate("room")
      .populate("user")
      .lean();

    const mapped = bookings.map((b) => ({
      id: b._id.toString(),
      user_id: b.user?._id?.toString(),
      hotel_id: b.hotel?._id?.toString(),
      room_id: b.room?._id?.toString(),

      check_in: b.checkIn,
      check_out: b.checkOut,
      total_price: b.totalPrice,
      guests: b.guests,
      special_requests: b.specialRequests,
      status: b.status,
      created_at: b.createdAt,
      updated_at: b.updatedAt,

      hotel_name: b.hotel?.name,
      room_type: b.room?.roomType,
      room_number: b.room?.roomNumber,

      user_name: b.user?.fullName,
      user_email: b.user?.email,
      user_phone: b.user?.phone,
    }));

    res.json({ bookings: mapped });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng" });
  }
});

// ============ LẤY CHI TIẾT BOOKING ============
// GET /api/bookings/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("hotel")
      .populate("room")
      .populate("user")
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    // Kiểm tra quyền: chỉ user tạo booking hoặc admin mới xem được
    if (req.user.role !== "admin" && booking.user?.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem booking này" });
    }

    const mapped = {
      id: booking._id.toString(),
      user_id: booking.user?._id?.toString(),
      hotel_id: booking.hotel?._id?.toString(),
      room_id: booking.room?._id?.toString(),

      check_in: booking.checkIn,
      check_out: booking.checkOut,
      total_price: booking.totalPrice,
      guests: booking.guests,
      special_requests: booking.specialRequests,
      status: booking.status,
      created_at: booking.createdAt,
      updated_at: booking.updatedAt,

      hotel_name: booking.hotel?.name,
      address: booking.hotel?.address,
      city: booking.hotel?.city,
      hotel_image: booking.hotel?.imageUrl,

      room_type: booking.room?.roomType,
      room_number: booking.room?.roomNumber,
      room_image: booking.room?.imageUrl,

      user_name: booking.user?.fullName,
      user_email: booking.user?.email,
      user_phone: booking.user?.phone,
    };

    res.json({ booking: mapped });
  } catch (error) {
    console.error("Get booking detail error:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết booking" });
  }
});

// ============ CẬP NHẬT TRẠNG THÁI (ADMIN) ============
// PATCH /api/bookings/:id/status
router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (
        !["pending", "confirmed", "cancelled", "completed"].includes(status)
      ) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      await Booking.updateOne(
        { _id: req.params.id },
        { status, updatedAt: new Date() }
      );

      res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật trạng thái" });
    }
  }
);

// ============ HỦY BOOKING (USER) ============
// PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    // quyền: chủ booking hoặc admin
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền hủy booking này" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking đã được hủy trước đó" });
    }

    if (booking.status === "completed") {
      return res
        .status(400)
        .json({ message: "Không thể hủy booking đã hoàn thành" });
    }

    booking.status = "cancelled";
    booking.updatedAt = new Date();
    await booking.save();

    res.json({ message: "Hủy booking thành công" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Lỗi khi hủy booking" });
  }
});

// ============ XOÁ BOOKING (ADMIN) ============
// DELETE /api/bookings/:id
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Booking.deleteOne({ _id: req.params.id });
    res.json({ message: "Xóa booking thành công" });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ message: "Lỗi khi xóa booking" });
  }
});

module.exports = router;

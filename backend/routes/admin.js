// backend/routes/admin.js
const express = require("express");
const router = express.Router();

const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Mongoose models
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const User = require("../models/User");

// ============ DASHBOARD STATISTICS ============

// GET /api/admin/stats/overview - Tổng quan
router.get(
  "/stats/overview",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // --- Ngày / tháng hiện tại ---
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfNextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );

      // --- Tổng doanh thu (confirmed + completed) ---
      const [revenueAgg] = await Booking.aggregate([
        {
          $group: {
            _id: null,
            total_revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["confirmed", "completed"]] },
                  "$totalPrice",
                  0,
                ],
              },
            },
            confirmed_revenue: {
              $sum: {
                $cond: [{ $eq: ["$status", "confirmed"] }, "$totalPrice", 0],
              },
            },
            completed_revenue: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, "$totalPrice", 0],
              },
            },
          },
        },
      ]);

      const totalRevenue = revenueAgg?.total_revenue || 0;
      const confirmedRevenue = revenueAgg?.confirmed_revenue || 0;
      const completedRevenue = revenueAgg?.completed_revenue || 0;

      // --- Thống kê booking theo status ---
      const bookingAgg = await Booking.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const bookingStatsMap = bookingAgg.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {});

      const totalBookings = bookingAgg.reduce((sum, x) => sum + x.count, 0);

      // --- Số hotel / room / user ---
      const [hotelCount, roomCount, userCount, todayBookings] =
        await Promise.all([
          Hotel.countDocuments(),
          Room.countDocuments(),
          User.countDocuments({ role: "user" }),
          Booking.countDocuments({
            createdAt: { $gte: startOfToday, $lt: endOfToday },
          }),
        ]);

      // --- Doanh thu tháng này (confirmed + completed) ---
      const [monthAgg] = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
            status: { $in: ["confirmed", "completed"] },
          },
        },
        {
          $group: {
            _id: null,
            month_revenue: { $sum: "$totalPrice" },
          },
        },
      ]);

      const monthRevenue = monthAgg?.month_revenue || 0;

      res.json({
        success: true,
        stats: {
          revenue: {
            total: totalRevenue,
            confirmed: confirmedRevenue,
            completed: completedRevenue,
            month: monthRevenue,
          },
          bookings: {
            total: totalBookings,
            pending: bookingStatsMap.pending || 0,
            confirmed: bookingStatsMap.confirmed || 0,
            cancelled: bookingStatsMap.cancelled || 0,
            completed: bookingStatsMap.completed || 0,
            today: todayBookings,
          },
          hotels: hotelCount,
          rooms: roomCount,
          users: userCount,
        },
      });
    } catch (error) {
      console.error("Get overview stats error:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi khi lấy thống kê tổng quan" });
    }
  }
);

// GET /api/admin/stats/revenue-by-month - Doanh thu theo tháng (12 tháng gần nhất)
router.get(
  "/stats/revenue-by-month",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const now = new Date();
      const twelveMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1
      );

      // Aggregate doanh thu theo tháng trong 12 tháng gần nhất
      const agg = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
            status: { $in: ["confirmed", "completed"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$totalPrice" },
            booking_count: { $sum: 1 },
          },
        },
      ]);

      // Map nhanh để điền đủ 12 tháng
      const map = new Map();
      agg.forEach((row) => {
        const key = `${row._id.year}-${row._id.month}`;
        map.set(key, {
          revenue: row.revenue || 0,
          booking_count: row.booking_count || 0,
        });
      });

      const monthNames = [
        "T1",
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "T8",
        "T9",
        "T10",
        "T11",
        "T12",
      ];

      const chartData = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const key = `${year}-${month}`;
        const found = map.get(key);

        chartData.push({
          month: `${monthNames[month - 1]}/${year}`,
          revenue: found?.revenue || 0,
          bookings: found?.booking_count || 0,
        });
      }

      res.json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      console.error("Get revenue by month error:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi khi lấy doanh thu theo tháng" });
    }
  }
);

// GET /api/admin/stats/top-hotels - Top khách sạn được đặt nhiều nhất
router.get(
  "/stats/top-hotels",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const agg = await Booking.aggregate([
        {
          $group: {
            _id: "$hotel",
            booking_count: { $sum: 1 },
            total_revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["confirmed", "completed"]] },
                  "$totalPrice",
                  0,
                ],
              },
            },
          },
        },
        { $sort: { booking_count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "hotels",
            localField: "_id",
            foreignField: "_id",
            as: "hotel",
          },
        },
        { $unwind: "$hotel" },
        {
          $project: {
            _id: 0,
            id: "$hotel._id",
            name: "$hotel.name",
            city: "$hotel.city",
            rating: { $ifNull: ["$hotel.rating", 0] },
            bookings: "$booking_count",
            revenue: "$total_revenue",
          },
        },
      ]);

      res.json({
        success: true,
        data: agg.map((row) => ({
          id: row.id,
          name: row.name,
          city: row.city,
          bookings: row.bookings,
          revenue: row.revenue || 0,
          rating: row.rating || 0,
        })),
      });
    } catch (error) {
      console.error("Get top hotels error:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi khi lấy top khách sạn" });
    }
  }
);

// GET /api/admin/stats/booking-status - Thống kê trạng thái booking (Pie Chart)
router.get(
  "/stats/booking-status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const agg = await Booking.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["confirmed", "completed"]] },
                  "$totalPrice",
                  0,
                ],
              },
            },
          },
        },
      ]);

      const statusLabels = {
        pending: "Chờ xác nhận",
        confirmed: "Đã xác nhận",
        cancelled: "Đã hủy",
        completed: "Hoàn thành",
      };

      const data = agg.map((row) => ({
        status: statusLabels[row._id] || row._id,
        count: row.count,
        revenue: row.revenue || 0,
      }));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Get booking status stats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê trạng thái",
      });
    }
  }
);

// GET /api/admin/stats/recent-bookings - Booking gần đây
router.get(
  "/stats/recent-bookings",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;

      const bookings = await Booking.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("hotel")
        .populate("room")
        .populate("user")
        .lean();

      const data = bookings.map((b) => ({
        id: b._id,
        check_in: b.checkIn,
        check_out: b.checkOut,
        total_price: b.totalPrice,
        status: b.status,
        created_at: b.createdAt,
        hotel_name: b.hotel?.name,
        room_type: b.room?.roomType,
        user_name: b.user?.fullName,
        user_email: b.user?.email,
      }));

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Get recent bookings error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy booking gần đây",
      });
    }
  }
);

// GET /api/admin/stats/top-customers - Khách hàng đặt nhiều nhất
router.get(
  "/stats/top-customers",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const agg = await Booking.aggregate([
        {
          $match: {
            status: { $in: ["confirmed", "completed"] },
          },
        },
        {
          $group: {
            _id: "$user",
            booking_count: { $sum: 1 },
            total_spent: { $sum: "$totalPrice" },
          },
        },
        { $sort: { booking_count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            id: "$user._id",
            name: "$user.fullName",
            email: "$user.email",
            phone: "$user.phone",
            bookings: "$booking_count",
            totalSpent: "$total_spent",
          },
        },
      ]);

      res.json({
        success: true,
        data: agg,
      });
    } catch (error) {
      console.error("Get top customers error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy top khách hàng",
      });
    }
  }
);

// ============ QUICK ACTIONS ============

// PATCH /api/admin/bookings/:id/quick-status - Cập nhật nhanh trạng thái
router.patch(
  "/bookings/:id/quick-status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      await Booking.updateOne(
        { _id: req.params.id },
        { status, updatedAt: new Date() }
      );

      res.json({
        success: true,
        message: `Đã cập nhật trạng thái thành ${status}`,
      });
    } catch (error) {
      console.error("Quick status update error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái",
      });
    }
  }
);

// GET /api/admin/search - Tìm kiếm tổng hợp
router.get("/search", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        results: { bookings: [], hotels: [], users: [] },
      });
    }

    const keyword = q.trim();
    const regex = new RegExp(keyword, "i");

    // --- Search bookings (theo tên user / email / tên hotel) ---
    const bookings = await Booking.aggregate([
      {
        $lookup: {
          from: "hotels",
          localField: "hotel",
          foreignField: "_id",
          as: "hotel",
        },
      },
      { $unwind: "$hotel" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          $or: [
            { "user.fullName": regex },
            { "user.email": regex },
            { "hotel.name": regex },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          status: 1,
          total_price: "$totalPrice",
          hotel_name: "$hotel.name",
          user_name: "$user.fullName",
        },
      },
    ]);

    // --- Search hotels ---
    const hotels = await Hotel.find({
      $or: [{ name: regex }, { city: regex }, { address: regex }],
    })
      .limit(5)
      .select("name city rating")
      .lean();

    // --- Search users ---
    const users = await User.find({
      $or: [{ fullName: regex }, { email: regex }, { phone: regex }],
    })
      .limit(5)
      .select("fullName email phone role")
      .lean();

    res.json({
      success: true,
      results: {
        bookings,
        hotels,
        users,
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi tìm kiếm" });
  }
});

module.exports = router;

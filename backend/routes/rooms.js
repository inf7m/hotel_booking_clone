// backend/routes/rooms.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Mongoose model
const Room = require("../models/Room");

/* -------- helpers -------- */
const roomDir = path.join(__dirname, "..", "uploads", "rooms");
fs.mkdirSync(roomDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, roomDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(
      null,
      "room_" + Date.now() + "_" + Math.random().toString(36).slice(2) + ext
    );
  },
});
const upload = multer({ storage });

// parse JSON an toàn -> trả về array nếu có thể
function parseJsonSafe(val, fallback) {
  try {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.trim().startsWith("[")) {
      return JSON.parse(val);
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// chuẩn hoá amenities -> array
function normalizeAmenities(amenities) {
  if (!amenities) return [];

  if (Array.isArray(amenities)) {
    return amenities.map((x) => String(x).trim()).filter(Boolean);
  }

  if (typeof amenities === "string") {
    const t = amenities.trim();
    if (!t) return [];
    if (t.startsWith("[") && t.endsWith("]")) {
      const arr = parseJsonSafe(t, []);
      if (Array.isArray(arr)) {
        return arr.map((x) => String(x).trim()).filter(Boolean);
      }
    }
    return t
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

// chuẩn hoá image_urls -> array
function normalizeImageUrls(image_urls) {
  if (!image_urls) return [];
  if (Array.isArray(image_urls)) return image_urls.map(String);

  if (typeof image_urls === "string") {
    const t = image_urls.trim();
    if (!t) return [];
    if (t.startsWith("[") && t.endsWith("]")) {
      const arr = parseJsonSafe(t, []);
      if (Array.isArray(arr)) return arr.map(String);
    }
    return t
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

// map Room document -> giống format FE đang dùng
function mapRoomDoc(r) {
  return {
    id: r._id.toString(),
    hotel_id: r.hotel?.toString(),
    room_number: r.roomNumber || r.room_number,
    room_type: r.roomType || r.room_type,
    price: r.price,
    capacity: r.capacity,
    description: r.description || "",
    image_url: r.imageUrl || r.image_url || "",
    image_urls: r.imageUrls || r.image_urls || [],
    amenities: r.amenities || [],
    available: typeof r.available === "boolean" ? r.available : true,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

/* -------------- PUBLIC -------------- */

// GET /rooms/hotel/:hotelId - danh sách phòng theo khách sạn
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const roomsDocs = await Room.find({ hotel: req.params.hotelId })
      .sort({ price: 1 })
      .lean();

    const rooms = roomsDocs.map(mapRoomDoc);

    res.json({ success: true, rooms });
  } catch (e) {
    console.error("rooms by hotel error:", e);
    res
      .status(500)
      .json({ success: false, message: "Lỗi lấy danh sách phòng" });
  }
});

// GET /rooms/:id - chi tiết 1 phòng
router.get("/:id", async (req, res) => {
  try {
    const r = await Room.findById(req.params.id).lean();
    if (!r) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng" });
    }

    const room = mapRoomDoc(r);
    res.json({ success: true, room });
  } catch (e) {
    console.error("get room error:", e);
    res.status(500).json({ success: false, message: "Lỗi lấy chi tiết phòng" });
  }
});

/* -------------- ADMIN -------------- */

// POST /rooms - tạo phòng
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      hotel_id,
      room_number,
      room_type,
      price,
      capacity,
      description,
      image_url,
      image_urls,
      amenities,
    } = req.body;

    if (!hotel_id) {
      console.error("❌ Thiếu hotel_id trong body:", req.body);
      return res
        .status(400)
        .json({ success: false, message: "Thiếu hotel_id khi tạo phòng" });
    }

    const imgArr = normalizeImageUrls(image_urls);
    const amenitiesArr = normalizeAmenities(amenities);

    const room = await Room.create({
      hotel: hotel_id,
      roomNumber: room_number || null,
      roomType: room_type,
      price,
      capacity,
      description: description || "",
      imageUrl: image_url || "",
      imageUrls: imgArr,
      amenities: amenitiesArr,
      available: true,
    });

    res.status(201).json({ success: true, room_id: room._id.toString() });
  } catch (e) {
    console.error("create room error:", e);
    res.status(500).json({ success: false, message: "Lỗi tạo phòng" });
  }
});

// PUT /rooms/:id - cập nhật phòng
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      room_number,
      room_type,
      price,
      capacity,
      description,
      image_url,
      image_urls,
      amenities,
      available,
    } = req.body;

    const imgArr = normalizeImageUrls(image_urls);
    const amenitiesArr = normalizeAmenities(amenities);

    await Room.findByIdAndUpdate(
      req.params.id,
      {
        roomNumber: room_number || null,
        roomType: room_type,
        price,
        capacity,
        description: description || "",
        imageUrl: image_url || "",
        imageUrls: imgArr,
        amenities: amenitiesArr,
        available: typeof available === "boolean" ? available : true,
      },
      { new: true }
    );

    res.json({ success: true, message: "Cập nhật phòng thành công" });
  } catch (e) {
    console.error("update room error:", e);
    res.status(500).json({ success: false, message: "Lỗi cập nhật phòng" });
  }
});

// DELETE /rooms/:id - xoá phòng
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Room.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Xóa phòng thành công" });
  } catch (e) {
    console.error("delete room error:", e);
    res.status(500).json({ success: false, message: "Lỗi xóa phòng" });
  }
});

/* ---- Upload ảnh: đơn & nhiều ---- */

router.post(
  "/upload-image",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Không có file nào được upload" });
    }
    const rel = `/uploads/rooms/${req.file.filename}`;
    const base =
      process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    res.json({ success: true, url: rel, absoluteUrl: `${base}${rel}` });
  }
);

router.post(
  "/upload-images",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 10),
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Không có file nào được upload" });
    }
    const urls = (req.files || []).map((f) => `/uploads/rooms/${f.filename}`);
    const base =
      process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const absolute = urls.map((u) => `${base}${u}`);
    res.json({ success: true, urls, absolute });
  }
);

module.exports = router;

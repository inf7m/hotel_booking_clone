// backend/routes/hotels.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Mongoose models
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const Review = require("../models/Review");

/* -------- helpers -------- */
const hotelDir = path.join(__dirname, "..", "uploads", "hotels");
fs.mkdirSync(hotelDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, hotelDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(
      null,
      "hotel_" + Date.now() + "_" + Math.random().toString(36).slice(2) + ext
    );
  },
});
const upload = multer({ storage });

// parse JSON an toàn (cho các field image_urls/amenities gửi lên dạng string)
function parseJsonSafe(val, fallback) {
  try {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val.trim().startsWith("[")) {
      return JSON.parse(val);
    }
    return fallback;
  } catch (e) {
    console.error("JSON parse error:", e);
    return fallback;
  }
}

// normalize amenities -> LƯU DẠNG ARRAY trong Mongo
function normalizeAmenities(amenities) {
  if (!amenities) return [];

  if (Array.isArray(amenities)) {
    return amenities.map((x) => String(x).trim()).filter(Boolean);
  }

  if (typeof amenities === "string") {
    const trimmed = amenities.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim()).filter(Boolean);
        }
      } catch {
        // ignore -> fallback dưới
      }
    }
    const arr = trimmed
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    return arr;
  }

  return [];
}

// đảm bảo imageUrls là array
function normalizeImageUrls(image_urls) {
  if (!image_urls) return [];
  if (Array.isArray(image_urls)) return image_urls.map(String);
  if (typeof image_urls === "string") {
    const maybeJson = image_urls.trim();
    if (maybeJson.startsWith("[") && maybeJson.endsWith("]")) {
      return parseJsonSafe(maybeJson, []).map(String);
    }
    return maybeJson
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

// map doc về đúng format FE dùng
function mapHotelDoc(h) {
  return {
    id: h._id?.toString?.() || h.id,
    name: h.name,
    description: h.description,
    address: h.address,
    city: h.city,
    rating: h.rating || 0,
    image_url: h.imageUrl || h.image_url || "",
    image_urls: h.imageUrls || h.image_urls || [],
    amenities: h.amenities || [],
    latitude: h.latitude,
    longitude: h.longitude,
    created_at: h.createdAt,
    updated_at: h.updatedAt,
    min_price: h.min_price ?? null,
    review_count: h.review_count ?? 0,
  };
}

/* ---------------- PUBLIC ROUTES ---------------- */

// GET /hotels - danh sách + filter cơ bản
router.get("/", async (req, res) => {
  try {
    const { city, search, min_price, max_price, rating } = req.query;

    const match = {};
    if (city) {
      match.city = { $regex: city, $options: "i" };
    }

    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    if (rating) {
      const r = parseFloat(rating);
      if (!isNaN(r)) {
        match.rating = { $gte: r };
      }
    }

    // Dùng aggregate để tính min_price + review_count
    const hotelsRaw = await Hotel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "rooms",
          localField: "_id",
          foreignField: "hotel",
          as: "rooms",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "hotel",
          as: "reviews",
        },
      },
      {
        $addFields: {
          min_price: {
            $min: {
              $map: {
                input: {
                  $filter: {
                    input: "$rooms",
                    as: "r",
                    cond: { $eq: ["$$r.available", true] },
                  },
                },
                as: "r",
                in: "$$r.price",
              },
            },
          },
          review_count: { $size: "$reviews" },
        },
      },
      {
        $project: {
          rooms: 0,
          reviews: 0,
        },
      },
      { $sort: { rating: -1, createdAt: -1 } },
    ]);

    let hotels = hotelsRaw.map(mapHotelDoc);

    if (min_price || max_price) {
      hotels = hotels.filter((h) => {
        const p = h.min_price;
        if (p == null) return false;
        if (min_price && p < parseFloat(min_price)) return false;
        if (max_price && p > parseFloat(max_price)) return false;
        return true;
      });
    }

    res.json({ success: true, count: hotels.length, hotels });
  } catch (e) {
    console.error("Get hotels error:", e);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách khách sạn" });
  }
});

// GET /hotels/search - tìm kiếm nâng cao (name/city/rating/amenities)
router.get("/search", async (req, res) => {
  try {
    const { name, city, rating, amenity } = req.query;
    let { amenities } = req.query;

    const amenityList = [];

    if (amenity) {
      amenityList.push(amenity);
    }

    if (amenities) {
      if (Array.isArray(amenities)) {
        amenityList.push(
          ...amenities.map((x) => String(x).trim()).filter(Boolean)
        );
      } else {
        amenityList.push(
          ...String(amenities)
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        );
      }
    }

    const match = {};

    if (name && name.trim()) {
      match.name = { $regex: name.trim(), $options: "i" };
    }

    if (city && city.trim()) {
      match.city = { $regex: city.trim(), $options: "i" };
    }

    if (rating && rating !== "all") {
      const r = parseFloat(rating);
      if (!isNaN(r)) {
        match.rating = { $gte: r };
      }
    }

    if (amenityList.length) {
      match.amenities = { $all: amenityList };
    }

    const hotelsRaw = await Hotel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "rooms",
          localField: "_id",
          foreignField: "hotel",
          as: "rooms",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "hotel",
          as: "reviews",
        },
      },
      {
        $addFields: {
          min_price: {
            $min: {
              $map: {
                input: {
                  $filter: {
                    input: "$rooms",
                    as: "r",
                    cond: { $eq: ["$$r.available", true] },
                  },
                },
                as: "r",
                in: "$$r.price",
              },
            },
          },
          review_count: { $size: "$reviews" },
        },
      },
      { $project: { rooms: 0, reviews: 0 } },
      { $sort: { rating: -1, createdAt: -1 } },
    ]);

    const hotels = hotelsRaw.map(mapHotelDoc);

    res.json({
      success: true,
      count: hotels.length,
      data: hotels,
      hotels,
    });
  } catch (e) {
    console.error("Search hotels error:", e);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm khách sạn",
      error: e.message,
    });
  }
});

// GET /hotels/cities/list
router.get("/cities/list", async (_req, res) => {
  try {
    const citiesRaw = await Hotel.distinct("city", { city: { $ne: null } });
    const cities = citiesRaw
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "vi"));

    res.json({
      success: true,
      cities,
    });
  } catch (e) {
    console.error("Get cities error:", e);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi lấy danh sách thành phố" });
  }
});

/* --- /hotels/discover/:vibe - gợi ý theo vibe, group theo city --- */
router.get("/discover/:vibe", async (req, res) => {
  const vibe = (req.params.vibe || "").toLowerCase();

  const VIBE_CITY_MAP = {
    beach: [
      "Đà Nẵng",
      "Nha Trang",
      "Vũng Tàu",
      "Phú Quốc",
      "Quy Nhơn",
      "Mũi Né",
      "Hạ Long",
    ],
    mountains: ["Đà Lạt", "Sa Pa", "Tam Đảo", "Mộc Châu", "Ninh Bình"],
    culture: ["Hà Nội", "Huế", "Hội An", "Ninh Bình"],
    city: [
      "Hà Nội",
      "TP.HCM",
      "TP. Hồ Chí Minh",
      "Đà Nẵng",
      "Hải Phòng",
      "Cần Thơ",
    ],
    island: ["Phú Quốc", "Lý Sơn", "Cù Lao Chàm", "Cô Tô", "Cát Bà"],
  };

  const cities = VIBE_CITY_MAP[vibe];
  if (!cities) {
    return res.status(400).json({
      success: false,
      message: "Vibe không hợp lệ",
    });
  }

  try {
    const hotelsRaw = await Hotel.aggregate([
      { $match: { city: { $in: cities } } },
      {
        $lookup: {
          from: "rooms",
          localField: "_id",
          foreignField: "hotel",
          as: "rooms",
        },
      },
      {
        $addFields: {
          min_price: {
            $min: {
              $map: {
                input: {
                  $filter: {
                    input: "$rooms",
                    as: "r",
                    cond: { $eq: ["$$r.available", true] },
                  },
                },
                as: "r",
                in: "$$r.price",
              },
            },
          },
        },
      },
      { $project: { rooms: 0 } },
      { $sort: { city: 1, rating: -1, createdAt: -1 } },
    ]);

    const hotels = hotelsRaw.map(mapHotelDoc);

    const grouped = {};
    hotels.forEach((h) => {
      const city = h.city || "Khác";
      if (!grouped[city]) grouped[city] = [];
      grouped[city].push(h);
    });

    res.json({
      success: true,
      vibe,
      data: grouped,
    });
  } catch (e) {
    console.error("Discover hotels error:", e);
    res.status(500).json({
      success: false,
      message: "Lỗi khi gợi ý khách sạn theo vibe",
      error: e.message,
    });
  }
});

// GET /hotels/:id - chi tiết
router.get("/:id", async (req, res) => {
  try {
    const hotelDoc = await Hotel.findById(req.params.id).lean();

    if (!hotelDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khách sạn" });
    }

    const roomsDocs = await Room.find({ hotel: req.params.id })
      .sort({ price: 1 })
      .lean();

    const reviewsDocs = await Review.find({ hotel: req.params.id })
      .sort({ createdAt: -1 })
      .populate("user", "fullName email")
      .lean();

    const hotel = mapHotelDoc(hotelDoc);

    const rooms = roomsDocs.map((r) => ({
      id: r._id.toString(),
      hotel_id: r.hotel?.toString(),
      room_type: r.roomType,
      room_number: r.roomNumber,
      price: r.price,
      available: r.available,
      amenities: r.amenities || [],
      image_url: r.imageUrl || "",
      image_urls: r.imageUrls || [],
    }));

    const reviews = reviewsDocs.map((rv) => ({
      id: rv._id.toString(),
      hotel_id: rv.hotel?.toString(),
      user_id: rv.user?._id?.toString(),
      rating: rv.rating,
      comment: rv.comment,
      created_at: rv.createdAt,
      full_name: rv.user?.fullName,
      email: rv.user?.email,
    }));

    res.json({
      success: true,
      hotel,
      rooms,
      reviews,
    });
  } catch (e) {
    console.error("Get hotel detail error:", e);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết khách sạn",
    });
  }
});

/* --------------- ADMIN ROUTES --------------- */

// POST /hotels/add
router.post("/add", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      rating,
      image_url,
      image_urls,
      amenities,
      latitude,
      longitude,
    } = req.body;

    const imageUrlsArr = normalizeImageUrls(image_urls);
    const amenitiesArr = normalizeAmenities(amenities);

    const hotel = await Hotel.create({
      name,
      description: description || "",
      address: address || "",
      city,
      rating: rating ? Number(rating) : 0,
      imageUrl: image_url || "",
      imageUrls: imageUrlsArr,
      amenities: amenitiesArr,
      latitude: latitude || null,
      longitude: longitude || null,
    });

    res.status(201).json({
      success: true,
      message: "Thêm khách sạn thành công ✅",
      hotel_id: hotel._id.toString(),
    });
  } catch (e) {
    console.error("Create hotel error:", e);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo khách sạn",
      error: e.message,
    });
  }
});

// PUT /hotels/:id
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      rating,
      image_url,
      image_urls,
      amenities,
      latitude,
      longitude,
    } = req.body;

    const imageUrlsArr = normalizeImageUrls(image_urls);
    const amenitiesArr = normalizeAmenities(amenities);

    await Hotel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description: description || "",
        address: address || "",
        city,
        rating: rating ? Number(rating) : 0,
        imageUrl: image_url || "",
        imageUrls: imageUrlsArr,
        amenities: amenitiesArr,
        latitude: latitude || null,
        longitude: longitude || null,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Cập nhật khách sạn thành công ✅",
    });
  } catch (e) {
    console.error("Update hotel error:", e);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật khách sạn",
      error: e.message,
    });
  }
});

// DELETE /hotels/:id
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Hotel.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: "Xóa khách sạn thành công ✅",
    });
  } catch (e) {
    console.error("Delete hotel error:", e);
    res.status(500).json({
      success: false,
      message: "Lỗi xóa khách sạn",
    });
  }
});

/* -------- UPLOAD ROUTES -------- */

router.post(
  "/upload-image",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file nào được upload",
      });
    }

    const rel = `/uploads/hotels/${req.file.filename}`;
    const base =
      process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;

    res.json({
      success: true,
      url: rel,
      absoluteUrl: `${base}${rel}`,
      message: "Upload ảnh thành công ✅",
    });
  }
);

router.post(
  "/upload-images",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 10),
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có file nào được upload",
      });
    }

    const urls = (req.files || []).map((f) => `/uploads/hotels/${f.filename}`);
    const base =
      process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const absolute = urls.map((u) => `${base}${u}`);

    res.json({
      success: true,
      urls,
      absolute,
      count: urls.length,
      message: `Upload ${urls.length} ảnh thành công ✅`,
    });
  }
);

module.exports = router;

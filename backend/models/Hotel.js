const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, required: true, trim: true },
    rating: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    imageUrls: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Hotel", hotelSchema);

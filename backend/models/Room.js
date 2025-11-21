const mongoose = require("mongoose");
const { Schema } = mongoose;

const roomSchema = new Schema(
  {
    hotel: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    roomNumber: { type: String, default: null },
    roomType: { type: String, required: true },
    price: { type: Number, required: true },
    capacity: { type: Number, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imageUrls: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    available: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);

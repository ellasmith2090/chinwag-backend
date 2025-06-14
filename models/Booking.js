// models/Booking.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new mongoose.Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    guest: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    hostNotes: {
      type: String,
      default: "",
    },
    guestNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure indexes for efficient queries
bookingSchema.index({ event: 1, guest: 1 }, { unique: true });

module.exports = mongoose.model("Booking", bookingSchema);

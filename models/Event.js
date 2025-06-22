// models/Event.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: (date) => date > new Date(),
        message: "Date must be in the future",
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "/uploads/event/default-event.png",
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seatsAvailable: {
      type: Number,
      required: true,
      min: [0, "Seats available cannot be negative"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);

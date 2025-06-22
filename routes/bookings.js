//routes/booking.js

const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const verifyToken = require("../middleware/verifyToken");

console.log("[Loaded] /routes/bookings.js");

// POST create booking
router.post(
  "/",
  verifyToken,
  [body("eventId").isMongoId().withMessage("Invalid event ID")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.user.accessLevel !== 1) {
      return res.status(403).json({ message: "Unauthorized: Guests only" });
    }
    const { eventId } = req.body;
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.seatsAvailable <= 0) {
        return res.status(400).json({ message: "No seats available" });
      }
      const existingBooking = await Booking.findOne({
        event: eventId,
        guest: req.user.id,
      });
      if (existingBooking) {
        return res
          .status(400)
          .json({ message: "Already booked for this event" });
      }
      const newBooking = new Booking({ event: eventId, guest: req.user.id });
      const savedBooking = await newBooking.save();
      await Event.findByIdAndUpdate(eventId, { $inc: { seatsAvailable: -1 } });
      res.status(201).json(savedBooking);
    } catch (err) {
      console.error("[bookings.js] Error creating booking:", err.message);
      res.status(500).json({
        message: `Failed to create booking: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

// GET guest bookings
router.get("/guest", verifyToken, async (req, res) => {
  if (req.user.accessLevel !== 1) {
    return res.status(403).json({ message: "Unauthorized: Guests only" });
  }
  try {
    const bookings = await Booking.find({ guest: req.user.id }).populate({
      path: "event",
      populate: { path: "host", select: "firstName lastName email avatar" },
    });
    res.json(bookings);
  } catch (err) {
    console.error("[bookings.js] Error fetching guest bookings:", err.message);
    res.status(500).json({
      message: `Failed to fetch bookings: ${
        process.env.NODE_ENV === "development" ? err.message : ""
      }`,
    });
  }
});

// GET host bookings
router.get("/host", verifyToken, async (req, res) => {
  if (req.user.accessLevel !== 2) {
    return res.status(403).json({ message: "Unauthorized: Hosts only" });
  }
  try {
    const events = await Event.find({ host: req.user.id }).select("_id");
    const eventIds = events.map((e) => e._id);
    const bookings = await Booking.find({ event: { $in: eventIds } })
      .populate("event")
      .populate("guest", "firstName lastName email avatar");
    res.json(bookings);
  } catch (err) {
    console.error("[bookings.js] Error fetching host bookings:", err.message);
    res.status(500).json({
      message: `Failed to fetch bookings: ${
        process.env.NODE_ENV === "development" ? err.message : ""
      }`,
    });
  }
});

// PUT cancel booking
router.put(
  "/:id/cancel",
  verifyToken,
  [param("id").isMongoId().withMessage("Invalid booking ID")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const booking = await Booking.findById(req.params.id).populate("event");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (
        (req.user.accessLevel === 1 &&
          booking.guest.toString() !== req.user.id) ||
        (req.user.accessLevel === 2 &&
          booking.event.host.toString() !== req.user.id)
      ) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      if (booking.status === "confirmed") {
        await Event.findByIdAndUpdate(booking.event._id, {
          $inc: { seatsAvailable: 1 },
        });
      }
      booking.status = "cancelled";
      const updatedBooking = await booking.save();
      res.json(updatedBooking);
    } catch (err) {
      console.error("[bookings.js] Error cancelling booking:", err.message);
      res.status(500).json({
        message: `Failed to cancel booking: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

// PUT add host notes
router.put(
  "/:id/notes",
  verifyToken,
  [
    param("id").isMongoId().withMessage("Invalid booking ID"),
    body("notes").trim().notEmpty().withMessage("Notes are required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.user.accessLevel !== 2) {
      return res.status(403).json({ message: "Unauthorized: Hosts only" });
    }
    const { notes } = req.body;
    try {
      const booking = await Booking.findById(req.params.id).populate("event");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.event.host.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      booking.hostNotes = notes;
      const updatedBooking = await booking.save();
      res.json(updatedBooking);
    } catch (err) {
      console.error("[bookings.js] Error adding notes:", err.message);
      res.status(500).json({
        message: `Failed to add notes: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

// POST contact host
router.post(
  "/:id/contact",
  verifyToken,
  [
    param("id").isMongoId().withMessage("Invalid booking ID"),
    body("message").trim().notEmpty().withMessage("Message is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.user.accessLevel !== 1) {
      return res.status(403).json({ message: "Unauthorized: Guests only" });
    }
    try {
      const booking = await Booking.findById(req.params.id).populate("event");
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.guest.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      // Placeholder for messaging logic (e.g., save to database or send email)
      console.log(
        `[bookings.js] Guest ${req.user.id} sent message to host ${booking.event.host}: ${req.body.message}`
      );
      res.json({ message: "Message sent to host" });
    } catch (err) {
      console.error("[bookings.js] Error contacting host:", err.message);
      res.status(500).json({
        message: `Failed to contact host: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

module.exports = router;

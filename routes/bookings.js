//routes/booking.js

const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const verifyToken = require("../middleware/verifyToken");

console.log("[Loaded] /routes/bookings.js");

// POST create booking
router.post("/", verifyToken, async (req, res) => {
  if (req.user.accessLevel !== 1) {
    return res.status(403).json({ message: "Access denied" });
  }

  const { eventId } = req.body;
  if (!eventId) {
    return res.status(400).json({ message: "Event ID is required" });
  }

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
      return res.status(400).json({ message: "Already booked for this event" });
    }

    const newBooking = new Booking({
      event: eventId,
      guest: req.user.id,
    });

    const savedBooking = await newBooking.save();
    await Event.findByIdAndUpdate(eventId, { $inc: { seatsAvailable: -1 } });
    res.status(201).json(savedBooking);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Problem creating booking", error: err.message });
  }
});

// GET guest bookings
router.get("/guest", verifyToken, async (req, res) => {
  if (req.user.accessLevel !== 1) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const bookings = await Booking.find({ guest: req.user.id }).populate({
      path: "event",
      populate: { path: "host", select: "firstName lastName email avatar" },
    });
    res.json(bookings);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Problem getting bookings", error: err.message });
  }
});

// GET host bookings
router.get("/host", verifyToken, async (req, res) => {
  if (req.user.accessLevel !== 2) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const events = await Event.find({ host: req.user.id }).select("_id");
    const eventIds = events.map((e) => e._id);
    const bookings = await Booking.find({ event: { $in: eventIds } })
      .populate("event")
      .populate("guest", "firstName lastName email avatar");
    res.json(bookings);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Problem getting bookings", error: err.message });
  }
});

// PUT cancel booking
router.put("/:id/cancel", verifyToken, async (req, res) => {
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
      return res.status(403).json({ message: "Access denied" });
    }

    booking.status = "cancelled";
    const updatedBooking = await booking.save();
    if (booking.status === "confirmed") {
      await Event.findByIdAndUpdate(booking.event._id, {
        $inc: { seatsAvailable: 1 },
      });
    }
    res.json(updatedBooking);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Problem cancelling booking", error: err.message });
  }
});

// PUT add host notes
router.put("/:id/notes", verifyToken, async (req, res) => {
  if (req.user.accessLevel !== 2) {
    return res.status(403).json({ message: "Access denied" });
  }

  const { notes } = req.body;
  if (!notes) {
    return res.status(400).json({ message: "Notes are required" });
  }

  try {
    const booking = await Booking.findById(req.params.id).populate("event");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.event.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    booking.hostNotes = notes;
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Problem adding notes", error: err.message });
  }
});

module.exports = router;

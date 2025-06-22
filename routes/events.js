// routes/events.js
const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const Event = require("../models/Event");
const verifyToken = require("../middleware/verifyToken");
const { upload, resizeImage } = require("../middleware/upload");

console.log("[Loaded] /routes/events.js");

// GET all events with optional filtering
router.get(
  "/",
  [
    query("host").optional().isMongoId().withMessage("Invalid host ID"),
    query("dateRange")
      .optional()
      .isIn(["weekend", "nextWeek"])
      .withMessage("Invalid date range"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let query = {};
      if (req.query.host) {
        query.host = req.query.host;
      }
      if (req.query.dateRange) {
        const now = new Date();
        if (req.query.dateRange === "weekend") {
          const friday = new Date(now);
          friday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
          friday.setHours(0, 0, 0, 0);
          const sunday = new Date(friday);
          sunday.setDate(friday.getDate() + 2);
          sunday.setHours(23, 59, 59, 999);
          query.date = { $gte: friday, $lte: sunday };
        } else if (req.query.dateRange === "nextWeek") {
          const monday = new Date(now);
          monday.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7) + 7);
          monday.setHours(0, 0, 0, 0);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          query.date = { $gte: monday, $lte: sunday };
        }
      }
      const events = await Event.find(query).populate(
        "host",
        "firstName lastName avatar"
      );
      res.json(events);
    } catch (err) {
      console.error("[events.js] Error fetching events:", err.message);
      res.status(500).json({
        message: `Failed to fetch events: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

// GET single event
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid event ID")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const event = await Event.findById(req.params.id).populate(
        "host",
        "firstName lastName avatar"
      );
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (err) {
      console.error("[events.js] Error fetching event:", err.message);
      res.status(500).json({
        message: `Failed to fetch event: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

// POST create event
router.post(
  "/",
  verifyToken,
  upload.single("image"),
  resizeImage,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("date").isISO8601().withMessage("Invalid date format"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("seatsAvailable")
      .isInt({ min: 0 })
      .withMessage("Seats available must be a non-negative integer"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.user.accessLevel !== 2) {
      return res.status(403).json({ message: "Unauthorized: Hosts only" });
    }
    try {
      const { title, description, date, location, seatsAvailable } = req.body;
      const eventData = {
        title,
        description,
        date,
        location,
        host: req.user.id,
        seatsAvailable: parseInt(seatsAvailable),
      };
      if (req.file) {
        eventData.image = `/uploads/event/${req.file.filename}`;
      }
      const newEvent = new Event(eventData);
      const savedEvent = await newEvent.save();
      res.status(201).json(savedEvent);
    } catch (err) {
      console.error("[events.js] Error creating event:", err.message);
      res.status(500).json({
        message: `Failed to create event: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

// PUT update event
router.put(
  "/:id",
  verifyToken,
  upload.single("image"),
  resizeImage,
  [
    param("id").isMongoId().withMessage("Invalid event ID"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("date").isISO8601().withMessage("Invalid date format"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("seatsAvailable")
      .isInt({ min: 0 })
      .withMessage("Seats available must be a non-negative integer"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.user.accessLevel !== 2) {
      return res.status(403).json({ message: "Unauthorized: Hosts only" });
    }
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.host.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const { title, description, date, location, seatsAvailable } = req.body;
      const updates = {
        title,
        description,
        date,
        location,
        seatsAvailable: parseInt(seatsAvailable),
      };
      if (req.file) {
        updates.image = `/uploads/event/${req.file.filename}`;
      }
      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );
      res.json(updatedEvent);
    } catch (err) {
      console.error("[events.js] Error updating event:", err.message);
      res.status(500).json({
        message: `Failed to update event: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

// DELETE event
router.delete(
  "/:id",
  verifyToken,
  [param("id").isMongoId().withMessage("Invalid event ID")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (req.user.accessLevel !== 2) {
      return res.status(403).json({ message: "Unauthorized: Hosts only" });
    }
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.host.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      await Event.findByIdAndDelete(req.params.id);
      res.json({ message: "Event deleted" });
    } catch (err) {
      console.error("[events.js] Error deleting event:", err.message);
      res.status(500).json({
        message: `Failed to delete event: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

module.exports = router;

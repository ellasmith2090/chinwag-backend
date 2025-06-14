// routes/events.js

const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, `event-${Date.now()}.png`),
});
const upload = multer({ storage });

// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().populate(
      "host",
      "firstName lastName avatar"
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Problem getting events", error: err });
  }
});

// GET single event
router.get("/:id", async (req, res) => {
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
    res.status(500).json({ message: "Problem getting event", error: err });
  }
});

// POST create event
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  if (req.user.user.accessLevel !== 2) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const eventData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
      host: req.user.user.id,
    };

    if (req.file) {
      const buffer = await sharp(req.file.path)
        .resize(800, 600)
        .png()
        .toBuffer();
      await sharp(buffer).toFile(req.file.path);
      eventData.image = `/uploads/${req.file.filename}`;
    }

    const newEvent = new Event(eventData);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: "Problem creating event", error: err });
  }
});

// PUT update event
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  if (req.user.user.accessLevel !== 2) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.host.toString() !== req.user.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
    };

    if (req.file) {
      const buffer = await sharp(req.file.path)
        .resize(800, 600)
        .png()
        .toBuffer();
      await sharp(buffer).toFile(req.file.path);
      updates.image = `/uploads/${req.file.filename}`;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: "Problem updating event", error: err });
  }
});

// DELETE event
router.delete("/:id", verifyToken, async (req, res) => {
  if (req.user.user.accessLevel !== 2) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.host.toString() !== req.user.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Problem deleting event", error: err });
  }
});

module.exports = router;

// User routes
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const verifyToken = require("../middleware/verifyToken");
const Utils = require("../Utils");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) =>
    cb(null, `${req.user.user.id}-${Date.now()}.png`),
});
const upload = multer({ storage });

// GET all users
router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.user.accessLevel !== 2) {
      return res.status(403).json({ message: "Access denied" });
    }
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Problem getting users", error: err });
  }
});

// GET single user
router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.user.id !== req.params.id && req.user.user.accessLevel !== 2) {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User doesn't exist" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Problem getting user", error: err });
  }
});

// POST create user
router.post("/", async (req, res) => {
  if (
    !req.body.firstName ||
    !req.body.lastName ||
    !req.body.email ||
    !req.body.password ||
    !req.body.accessLevel
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      accessLevel: req.body.accessLevel,
      password: req.body.password,
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ message: "Problem creating user", error: err });
  }
});

// PUT update user
router.put("/:id", verifyToken, async (req, res) => {
  if (req.user.user.id !== req.params.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      bio: req.body.bio,
    };

    if (req.body.password) {
      updates.password = await Utils.hashPassword(req.body.password);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Problem updating user", error: err });
  }
});

// POST upload avatar
router.post(
  "/:id/avatar",
  verifyToken,
  upload.single("avatar"),
  async (req, res) => {
    if (req.user.user.id !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const buffer = await sharp(req.file.path)
        .resize(200, 200)
        .png()
        .toBuffer();
      await sharp(buffer).toFile(req.file.path);
      const avatarUrl = `/uploads/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { avatar: avatarUrl },
        { new: true }
      ).select("-password");
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Problem uploading avatar", error: err });
    }
  }
);

// DELETE user
router.delete("/:id", verifyToken, async (req, res) => {
  if (req.user.user.id !== req.params.id && req.user.user.accessLevel !== 2) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Problem deleting user", error: err });
  }
});

module.exports = router;

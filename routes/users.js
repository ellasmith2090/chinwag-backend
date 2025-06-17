// routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const Utils = require("../Utils");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}.png`),
});
const upload = multer({ storage });

// GET user profile
router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.user.id !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// PUT update user profile
router.put("/:id", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    if (req.user.user.id !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {
      firstName: req.body.firstName || user.firstName,
      lastName: req.body.lastName || user.lastName,
      email: req.body.email || user.email,
      bio: req.body.bio || user.bio,
      isFirstLogin:
        req.body.isFirstLogin !== undefined
          ? req.body.isFirstLogin
          : user.isFirstLogin,
    };

    if (req.file) {
      const buffer = await sharp(req.file.path)
        .resize(200, 200)
        .png()
        .toBuffer();
      await sharp(buffer).toFile(req.file.path);
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    if (req.body.password) {
      updates.password = await Utils.hashPassword(req.body.password);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");
    res.json(updatedUser);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error", error: err });
  }
});

// PUT update user password
router.put("/:id/password", verifyToken, async (req, res) => {
  try {
    if (req.user.user.id !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { currentPassword, newPassword } = req.body;
    const isMatch = await Utils.verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = await Utils.hashPassword(newPassword);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// POST create user (for SignUp)
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password, accessLevel } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await Utils.hashPassword(password);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accessLevel: parseInt(accessLevel),
      isFirstLogin: true,
    });

    await user.save();

    const userObject = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      accessLevel: user.accessLevel,
      isFirstLogin: user.isFirstLogin,
    };
    const accessToken = Utils.generateAccessToken(userObject);

    res
      .status(201)
      .json({ message: "User created", user: userObject, accessToken });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

module.exports = router;

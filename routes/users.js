// routes/users.js

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { upload, resizeImage } = require("../middleware/upload");
const router = express.Router();

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    next();
  } catch (err) {
    console.error("[users.js] Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

router.get("/:id", authenticate, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    res.status(200).json({
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      accessLevel: req.user.accessLevel,
      avatar: req.user.avatar,
    });
  } catch (err) {
    console.error("[users.js] Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put(
  "/:id",
  authenticate,
  upload.single("avatar"),
  resizeImage,
  async (req, res) => {
    try {
      if (req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const { firstName, lastName, email, password } = req.body;
      const updates = {};
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (email) updates.email = email;
      if (password) updates.password = password;
      if (req.file) updates.avatar = `/uploads/avatar/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");
      res.status(200).json({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: user.accessLevel,
        avatar: user.avatar,
      });
    } catch (err) {
      console.error("[users.js] Update user error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;

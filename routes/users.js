// routes/users.js

const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const User = require("../models/User");
const AuthUtils = require("./AuthUtils");
const verifyToken = require("../middleware/verifyToken");
const { upload, resizeImage } = require("../middleware/upload");

router.get(
  "/:id",
  verifyToken,
  [param("id").isMongoId().withMessage("Invalid user ID")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      if (req.user.id !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const user = await User.findById(req.params.id).select("-password");
      res.status(200).json({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: user.accessLevel,
        avatar: user.avatar,
      });
    } catch (err) {
      console.error("[users.js] Error fetching user:", err.message);
      res.status(500).json({
        message: `Server error: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

router.put(
  "/:id",
  verifyToken,
  upload.single("avatar"),
  resizeImage,
  [
    param("id").isMongoId().withMessage("Invalid user ID"),
    body("firstName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid email format"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      if (req.user.id !== req.params.id) {
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
      console.error("[users.js] Error updating user:", err.message);
      res.status(500).json({
        message: `Server error: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

module.exports = router;

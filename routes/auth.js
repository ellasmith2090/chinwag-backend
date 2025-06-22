// routes/auth.js
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const AuthUtils = require("./AuthUtils");
const verifyToken = require("../middleware/verifyToken");

router.post(
  "/signup",
  [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("accessLevel").isIn([1, 2]).withMessage("Invalid access level"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { firstName, lastName, email, password, accessLevel } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        accessLevel: Number(accessLevel),
      });
      await user.save();
      const accessToken = AuthUtils.generateAccessToken(user);
      return res.json({
        accessToken,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accessLevel: user.accessLevel,
          isFirstLogin: user.isFirstLogin,
        },
      });
    } catch (err) {
      console.error("[auth.js] Signup error:", err.message);
      res.status(500).json({
        message: `Server error: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

router.post(
  "/signin",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid email format"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      const accessToken = AuthUtils.generateAccessToken(user);
      return res.json({
        accessToken,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accessLevel: user.accessLevel,
          isFirstLogin: user.isFirstLogin,
        },
      });
    } catch (err) {
      console.error("[auth.js] Signin error:", err.message);
      res.status(500).json({
        message: `Server error: ${
          process.env.NODE_ENV === "development" ? err.message : ""
        }`,
      });
    }
  }
);

router.get("/validate", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    return res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      accessLevel: user.accessLevel,
      isFirstLogin: user.isFirstLogin,
    });
  } catch (err) {
    console.error("[auth.js] Validate error:", err.message);
    res.status(401).json({
      message: `Invalid token: ${
        process.env.NODE_ENV === "development" ? err.message : ""
      }`,
    });
  }
});

module.exports = router;

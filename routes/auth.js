// Routes - auth.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, accessLevel } = req.body;
    if (!firstName || !lastName || !email || !password || !accessLevel) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (![1, 2].includes(Number(accessLevel))) {
      return res.status(400).json({ message: "Invalid access level" });
    }
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
    const token = jwt.sign(
      { id: user._id, accessLevel: user.accessLevel },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(201).json({
      accessToken: token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: user.accessLevel,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (err) {
    console.error("[auth.js] Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, accessLevel: user.accessLevel },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({
      accessToken: token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: user.accessLevel,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (err) {
    console.error("[auth.js] Signin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/validate", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      accessLevel: user.accessLevel,
      isFirstLogin: user.isFirstLogin,
    });
  } catch (err) {
    console.error("[auth.js] Validate error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;

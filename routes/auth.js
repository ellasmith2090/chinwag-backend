// Routes - auth.js

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Utils = require("../Utils");

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User doesn't exist" });
    }

    if (await Utils.verifyPassword(password, user.password)) {
      const userObject = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: user.accessLevel,
        isFirstLogin: user.isFirstLogin,
      };
      const accessToken = Utils.generateAccessToken(userObject);
      res.json({ accessToken, user: userObject });
    } else {
      res.status(400).json({ message: "Password or email is incorrect" });
    }
  } catch (err) {
    res.status(500).json({ message: "Problem signing in", error: err.message });
  }
});

router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, accessLevel } = req.body;
  if (!firstName || !lastName || !email || !password || !accessLevel) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (![1, 2].includes(parseInt(accessLevel))) {
    return res.status(400).json({ message: "Invalid access level" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
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
      .json({ message: "User created", accessToken, user: userObject });
  } catch (err) {
    res.status(500).json({ message: "Problem signing up", error: err.message });
  }
});

router.get("/validate", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  const tokenData = Utils.verifyToken(token);
  if (!tokenData) {
    return res.status(403).json({ message: "Invalid token" });
  }

  try {
    const user = await User.findById(tokenData.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      accessLevel: user.accessLevel,
      isFirstLogin: user.isFirstLogin,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Problem validating token", error: err.message });
  }
});

module.exports = router;

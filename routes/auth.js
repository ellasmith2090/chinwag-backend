// Routes - auth.js-------------------------------------------------
require("dotenv").config();
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Utils = require("../Utils");

router.post("/signin", async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "User doesn't exist" });
    }

    if (await Utils.verifyPassword(req.body.password, user.password)) {
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
    res.status(500).json({ message: "Problem signing in", error: err });
  }
});

router.get("/validate", (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  const tokenData = Utils.verifyToken(token);
  if (!tokenData) {
    return res.status(403).json({ message: "Invalid token" });
  }
  res.json(tokenData);
});

module.exports = router;

// Routes - auth.js-------------------------------------------------
require("dotenv").config();
const express = require("express");
const Utils = require("../Utils");
const router = express.Router();
const User = require("./../models/User");
const jwt = require("jsonwebtoken");

// POST /auth/signin - User Login-----------------------------------
router.post("/signin", (req, res) => {
  // 1. Validate request (email and password) - checks neither is faulty
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  // 2. Find user in database
  User.findOne({ email: req.body.email })
    .then((user) => {
      // If the user doesn't exist
      if (user == null) {
        return res.status(400).json({
          message: "User doesn't exist",
        });
      }

      // If user exists - continue
      // 3. Verify password
      if (Utils.verifyPassword(req.body.password, user.password)) {
        // 4. If password is correct > create user object without password
        const userObject = {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        };

        // 5. Generate JWT Token
        const accessToken = Utils.generateAccessToken(userObject);

        // 6. Send back response with accessToken and user object
        res.json({
          accessToken: accessToken,
          user: userObject,
        });
      } else {
        // If password doesn't match - send back error
        return res.status(400).json({
          message: "Password / email is incorrect",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: "Problem signing in",
        error: err,
      });
    });
});

// GET /auth/validate - Validate JWT Token--------------------------
router.get("/validate", (req, res) => {
  // Get token from header
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  // Validate token using the jwt.verify()
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, tokenData) => {
    if (err) {
      // If token invalid
      return res.status(403).json({ message: "Invalid token" });
    } else {
      // Token must be valid
      res.json(tokenData);
    }
  });
});

module.exports = router;

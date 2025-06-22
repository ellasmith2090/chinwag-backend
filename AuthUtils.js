// backend/authUtils.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AuthUtils = {
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, 10);
    } catch (error) {
      console.error("[AuthUtils] Hash password failed:", error.message);
      throw new Error(
        `Failed to hash password: ${
          process.env.NODE_ENV === "development" ? error.message : ""
        }`
      );
    }
  },

  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error("[AuthUtils] Verify password failed:", error.message);
      throw new Error(
        `Failed to verify password: ${
          process.env.NODE_ENV === "development" ? error.message : ""
        }`
      );
    }
  },

  generateAccessToken(user) {
    try {
      return jwt.sign(
        {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accessLevel: user.accessLevel,
          isFirstLogin: user.isFirstLogin,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
    } catch (error) {
      console.error("[AuthUtils] Generate access token failed:", error.message);
      throw new Error(
        `Failed to generate access token: ${
          process.env.NODE_ENV === "development" ? error.message : ""
        }`
      );
    }
  },

  verifyToken(token) {
    try {
      return {
        valid: true,
        decoded: jwt.verify(token, process.env.ACCESS_TOKEN_SECRET),
      };
    } catch (error) {
      console.error("[AuthUtils] Token verification failed:", error.message);
      return { valid: false, error: error.message };
    }
  },
};

module.exports = AuthUtils;

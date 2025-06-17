// Utils.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class Utils {
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accessLevel: user.accessLevel,
        isFirstLogin: user.isFirstLogin,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      console.error("[Utils.js] Token verification failed:", error.message);
      return null;
    }
  }
}

module.exports = new Utils();

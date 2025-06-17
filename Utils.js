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
    return jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new Utils();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

class Utils {
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateAccessToken(user) {
    return jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30m",
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new Utils();

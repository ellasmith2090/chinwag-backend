const Utils = require("../Utils");

module.exports = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  const tokenData = Utils.verifyToken(token);
  if (!tokenData) {
    return res.status(403).json({ message: "Invalid token" });
  }

  req.user = tokenData;
  next();
};

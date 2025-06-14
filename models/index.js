// models/index.js

const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

module.exports = {
  User: require("./User"),
  Event: require("./Event"),
  Booking: require("./Booking"),
};

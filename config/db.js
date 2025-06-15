// backend/config/db.js

const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Connecting to Mongo URI:", process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

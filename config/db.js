// config/db.js

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Mask password in URI for logging
    const safeUri = process.env.MONGO_URI.replace(/:([^@]+)@/, ":****@");
    console.log("Connecting to Mongo URI:", safeUri);

    // Connect with modern options
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      maxPoolSize: 10, // Max connections
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // Retry after 5 seconds
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;

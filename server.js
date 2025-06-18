// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:1234", // Replace in prod
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Serve uploaded avatars/images
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// API Routes
try {
  app.use("/api/auth", require("./routes/auth"));
  console.log("[server.js] Auth routes loaded");
} catch (err) {
  console.error("[server.js] Error loading auth routes:", err);
}

try {
  app.use("/api/users", require("./routes/users"));
  console.log("[server.js] User routes loaded");
} catch (err) {
  console.error("[server.js] Error loading user routes:", err);
}

try {
  app.use("/api/events", require("./routes/events"));
  console.log("[server.js] Event routes loaded");
} catch (err) {
  console.error("[server.js] Error loading event routes:", err);
}

try {
  app.use("/api/bookings", require("./routes/bookings"));
  console.log("[server.js] Booking routes loaded");
} catch (err) {
  console.error("[server.js] Error loading booking routes:", err);
}

// Global Error Handler ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

// MongoDB Debug + Connection
mongoose.set("debug", true);
connectDB();

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

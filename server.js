// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { handleMulterError } = require("./middleware/upload"); // Ensure correct import

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:1234",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

// Routes
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

// Error-handling middleware (must be after routes)
app.use(handleMulterError); // Handle Multer-specific errors
app.use((err, req, res, next) => {
  console.error("[server.js] Error:", err.stack);
  res.status(500).json({ message: "Server error" });
});

// MongoDB connection
mongoose.set("debug", true);
connectDB();

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

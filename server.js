// backend/server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { handleMulterError } = require("./middleware/upload");

const app = express();
const PORT = process.env.PORT || 3000;

// Confirm .env values (avoid logging sensitive data)
console.log("[server.js] FRONTEND_URL:", process.env.FRONTEND_URL);

// Connect DB
connectDB();

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { message: "Too many requests, please try again later" },
  })
);

// CORS config
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:1234"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/events", require("./routes/events"));
app.use("/api/bookings", require("./routes/bookings"));

// Fallback route
app.use((req, res) => {
  console.warn("[server.js] 404 - Route not found:", req.originalUrl);
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global error handling
app.use(handleMulterError);
app.use((err, req, res, next) => {
  console.error("[server.js] Error:", err.stack);
  res.status(500).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[server.js] Server running on port ${PORT}`);
});

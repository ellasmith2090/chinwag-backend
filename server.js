// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Log URI for debugging (mask password)
console.log(
  "Connecting to Mongo URI:",
  MONGO_URI.replace(/:([^@]+)@/, ":****@")
);

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/events", require("./routes/events"));
app.use("/bookings", require("./routes/bookings"));

// MongoDB Connection
mongoose.set("debug", true); // Enable debug logging
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

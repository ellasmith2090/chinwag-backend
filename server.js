require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: ["https://chinwag-frontend.netlify.app"],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes with error handling
try {
  app.use("/auth", require("./routes/auth"));
  console.log("[server.js] Auth routes loaded");
} catch (err) {
  console.error("[server.js] Error loading auth routes:", err);
}
try {
  app.use("/users", require("./routes/users"));
  console.log("[server.js] User routes loaded");
} catch (err) {
  console.error("[server.js] Error loading user routes:", err);
}
try {
  app.use("/events", require("./routes/events"));
  console.log("[server.js] Event routes loaded");
} catch (err) {
  console.error("[server.js] Error loading event routes:", err);
}
try {
  app.use("/bookings", require("./routes/bookings"));
  console.log("[server.js] Booking routes loaded");
} catch (err) {
  console.error("[server.js] Error loading booking routes:", err);
}

// Enable Mongoose debug logging
mongoose.set("debug", true);

// Connect to MongoDB
connectDB();

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

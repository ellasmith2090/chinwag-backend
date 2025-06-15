// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/events", require("./routes/events"));
app.use("/bookings", require("./routes/bookings"));

// Enable Mongoose debug logging
mongoose.set("debug", true);

// Connect to MongoDB
connectDB();

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

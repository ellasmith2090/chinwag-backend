require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const port = process.env.PORT || 3000;

// Database Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("db connected!"))
  .catch((err) => console.log("db connection failed!", err));

// Express App Setup
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
app.get("/", (req, res) => res.send("Chinwag API"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users")); // Corrected from 'user'
app.use("/events", require("./routes/events"));
app.use("/bookings", require("./routes/bookings"));

// Start Server
app.listen(port, () => console.log(`App is running on port ${port}`));

// Models - User.js

const mongoose = require("mongoose");
const Utils = require("../Utils");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$/, "Invalid email format"],
    },
    accessLevel: {
      type: Number,
      required: true,
      enum: [1, 2], // 1: guest, 2: host
      default: 1,
    },
    password: { type: String, required: true },
    avatar: { type: String, default: "/images/defaultavatar.jpg" },
    isFirstLogin: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await Utils.hashPassword(this.password);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);

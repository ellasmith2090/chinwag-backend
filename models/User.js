// backend/models/User.js
const mongoose = require("mongoose");
const AuthUtils = require("./AuthUtils");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        "Invalid email format",
      ],
    },
    accessLevel: {
      type: Number,
      required: true,
      enum: [1, 2], // 1: guest, 2: host
      default: 1,
    },
    password: { type: String, required: true },
    avatar: { type: String, default: "/uploads/avatar/defaultavatar.jpg" },
    isFirstLogin: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      this.password = await AuthUtils.hashPassword(this.password);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

userSchema.pre(["findOneAndUpdate"], async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    try {
      update.password = await AuthUtils.hashPassword(update.password);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  try {
    return await AuthUtils.verifyPassword(password, this.password);
  } catch (err) {
    throw new Error(
      `Password verification failed: ${
        process.env.NODE_ENV === "development" ? err.message : ""
      }`
    );
  }
};

module.exports = mongoose.model("User", userSchema);

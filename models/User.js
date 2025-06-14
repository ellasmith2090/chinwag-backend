// Models - User.js--------------------------------------------------
// Dependencies------------------------------------------------------
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require("mongoose-type-email");
const Utils = require("./../Utils");

// User Schema Definition-------------------------------------------
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: mongoose.SchemaTypes.Email,
      required: true,
      unique: true,
    },
    accessLevel: {
      type: Number,
      required: true,
      enum: [1, 2], // Only 1 (regular user) or 2 (admin) allowed
      default: 1, // Default to regular user
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
); // Automatically add createdAt and updatedAt fields

// Middleware to Hash Password Before Saving------------------------
userSchema.pre("save", function (next) {
  // Check if password is present and is modified
  if (this.password && this.isModified()) {
    // Replace original password with the new hashed password
    this.password = Utils.hashPassword(this.password);
  }
  next();
});

// Create and Export Mongoose Model----------------------------------
const userModel = mongoose.model("User", userSchema);
module.exports = userModel;

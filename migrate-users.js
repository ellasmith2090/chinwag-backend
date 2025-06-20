const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

async function migrateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("[migrate-users.js] Connected to MongoDB");

    // Update all users to set accessLevel and remove role
    const users = await User.find({});
    for (const user of users) {
      let needsUpdate = false;
      let newAccessLevel = user.accessLevel;

      // If role exists, map it to accessLevel
      if (user.role) {
        newAccessLevel = user.role === "guest" ? 1 : 2;
        needsUpdate = true;
        console.log(
          `[migrate-users.js] Mapping role=${user.role} to accessLevel=${newAccessLevel} for ${user.email}`
        );
      }

      // Ensure accessLevel is set
      if (!user.accessLevel) {
        newAccessLevel = 1; // Default to guest
        needsUpdate = true;
        console.log(
          `[migrate-users.js] Setting default accessLevel=1 for ${user.email}`
        );
      }

      // Set default avatar if missing
      if (!user.avatar) {
        user.avatar = "/images/default-avatar.png";
        needsUpdate = true;
        console.log(
          `[migrate-users.js] Setting default avatar for ${user.email}`
        );
      }

      // Remove role field
      if (user.role !== undefined) {
        user.role = undefined;
        needsUpdate = true;
      }

      if (needsUpdate) {
        user.accessLevel = newAccessLevel;
        await user.save();
        console.log(
          `[migrate-users.js] Updated user ${user.email}: accessLevel=${user.accessLevel}, avatar=${user.avatar}`
        );
      } else {
        console.log(`[migrate-users.js] No changes needed for ${user.email}`);
      }
    }

    console.log("[migrate-users.js] Migration complete");
    await mongoose.disconnect();
  } catch (err) {
    console.error("[migrate-users.js] Migration error:", err);
    process.exit(1);
  }
}

migrateUsers();

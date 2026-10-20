const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },

    // Google profile picture or user's profile image URL
    profilePicture: {
      type: String,
      default: "",
      trim: true,
    },

    // Set when user signs in with Google
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many users without googleId
      default: undefined,
    },

    // Google-only users have no password
    password: {
      type: String,
      minlength: 6,
      required: function () {
        return !this.googleId;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google-only account
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
const mongoose = require("mongoose")

const passwordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

passwordResetSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)

module.exports =
  mongoose.models.PasswordReset ||
  mongoose.model("PasswordReset", passwordResetSchema)

const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema(
  {
    client: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Google profile image or another avatar URL
    profilePicture: {
      type: String,
      trim: true,
      default: "",
    },

    service: {
  type: String,
  trim: true,
  default: "",
},

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Published"],
      default: "Pending",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    adminReply: {
      type: String,
      trim: true,
      default: "",
    },

    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Review", reviewSchema)

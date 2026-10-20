const mongoose = require("mongoose")

const settingsSchema = new mongoose.Schema(
  {
    general: {
      studioName: {
        type: String,
        trim: true,
        default: "Midhun Frames",
      },

      tagline: {
        type: String,
        trim: true,
        default: "Studio · Digital",
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "hello@midhunframes.com",
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },

      location: {
        type: String,
        trim: true,
        default: "Kerala, India",
      },
    },

    website: {
      title: {
        type: String,
        trim: true,
        default: "Midhun Frames",
      },

      description: {
        type: String,
        trim: true,
        default:
          "Photography, visual storytelling and web development.",
      },

      instagram: {
        type: String,
        trim: true,
        default: "",
      },

      whatsapp: {
        type: String,
        trim: true,
        default: "",
      },

      websiteUrl: {
        type: String,
        trim: true,
        default: "",
      },
    },

    notifications: {
      newBooking: {
        type: Boolean,
        default: true,
      },

      newEnquiry: {
        type: Boolean,
        default: true,
      },

      newReview: {
        type: Boolean,
        default: true,
      },

      payment: {
        type: Boolean,
        default: true,
      },
    },

    appearance: {
      theme: {
        type: String,
        enum: ["dark", "light"],
        default: "dark",
      },
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Settings", settingsSchema)
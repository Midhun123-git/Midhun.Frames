
const mongoose = require("mongoose")

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    client: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Wedding",
        "Portrait",
        "Pre Wedding",
        "Engagement",
        "Events",
      ],
      required: true,
    },

    date: {
      type: String,
      required: function () {
        return this.category !== "Portrait"
      },
      default: undefined,
    },

    // Cloudinary URL
    imageUrl: {
      type: String,
      required: true,
    },

    // Cloudinary public ID
    imagePublicId: {
      type: String,
      default: "",
    },

    // Image or video
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Gallery", gallerySchema)

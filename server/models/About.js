// server/models/About.js

const mongoose = require("mongoose")

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
)

const aboutSchema = new mongoose.Schema(
  {
    mainImage: {
      type: imageSchema,
      default: null,
    },

    filmStripImages: {
      type: [imageSchema],
      default: [],
    },

    selectedWorkImages: {
      type: [imageSchema],
      default: [],
    },

    heading: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    approachTitle: {
      type: String,
      required: true,
      trim: true,
    },

    approachText: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("About", aboutSchema)
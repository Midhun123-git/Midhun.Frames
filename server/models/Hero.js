
const mongoose = require("mongoose");

const heroSchema = new mongoose.Schema(
  {
    eyebrow: {
      type: String,
      default: "PHOTOGRAPHY & FILM",
      trim: true,
    },
    heading: {
      type: String,
      default: "Midhun\nFrames",
      trim: true,
    },
    subheading: {
      type: String,
      default: "Cinematic Reality × Personal Imagination",
      trim: true,
    },
    description: {
      type: String,
      default:
        "Stories captured with creativity, emotion, and a cinematic eye.",
      trim: true,
    },
    buttonText: {
      type: String,
      default: "Explore My Work",
      trim: true,
    },
    buttonLink: {
      type: String,
      default: "/portfolio",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hero", heroSchema);

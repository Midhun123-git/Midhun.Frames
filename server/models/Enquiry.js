const mongoose = require("mongoose")

const enquirySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    project: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "In Progress",
        "Converted",
        "Closed",
      ],
      default: "New",
    },
  },
  {
    timestamps: true,
  }
)

module.exports =
  mongoose.models.Enquiry ||
  mongoose.model("Enquiry", enquirySchema)
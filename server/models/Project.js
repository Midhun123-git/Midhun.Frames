const mongoose = require("mongoose")

// ==========================================
// SYNTAX FLOW PROJECT SCHEMA
// ==========================================
// Projects are ONLY for Syntax Flow
// Web Development work.
//
// Photography projects are NOT stored here.
// ==========================================

const projectSchema = new mongoose.Schema(
  {
    // ==========================================
    // CLIENT INFORMATION
    // ==========================================

    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    company: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },

    // ==========================================
    // PROJECT INFORMATION
    // ==========================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    service: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    // ==========================================
    // PROJECT STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "Planning",
        "In Progress",
        "Review",
        "Completed",
        "On Hold",
        "Cancelled",
      ],
      default: "Planning",
    },

    // ==========================================
    // PROJECT DATES
    // ==========================================

    startDate: {
      type: Date,
      default: null,
    },

    deadline: {
      type: Date,
      default: null,
    },

    completedDate: {
      type: Date,
      default: null,
    },

    // ==========================================
    // FINANCIAL INFORMATION
    // ==========================================

    budget: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ==========================================
    // PROJECT PAYMENT STATUS
    // ==========================================

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Partially Paid",
        "Paid",
      ],
      default: "Pending",
    },

    // ==========================================
    // LIVE PROJECT URL
    // ==========================================

    liveUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    // ==========================================
    // INTERNAL ADMIN NOTES
    // ==========================================

    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Project", projectSchema)
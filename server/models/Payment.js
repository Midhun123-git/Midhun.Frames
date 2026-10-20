const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema(
  {
    sourceType: {
  type: String,
  enum: ["Booking", "Enquiry"],
  required: true,
},

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Booking or project id is required."],
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    clientName: {
      type: String,
      required: [true, "Client name is required."],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      required: [true, "Amount is required."],
      min: [1, "Amount must be greater than 0."],
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentType: {
      type: String,
      enum: [
        "Advance",
        "Partial Payment",
        "Final Payment",
        "Full Payment",
        "Other",
      ],
      default: "Full Payment",
    },

    paymentMethod: {
      type: String,
      default: "Razorpay",
    },

    status: {
      type: String,
      enum: ["Created", "Pending", "Paid", "Failed", "Refunded"],
      default: "Created",
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    transactionId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    razorpaySignature: {
      type: String,
      default: "",
      select: false,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
)

paymentSchema.index({ status: 1, sourceType: 1 })

module.exports = mongoose.model("Payment", paymentSchema)
const express = require("express")
const router = express.Router()

const protect = require("../middleware/authMiddleware")
const userProtect = require("../middleware/userMiddleware")

const paymentController = require("../controllers/paymentController")

const {
  getPayments,
  getPaymentById,
  deletePayment,
  createOrder,
  verifyPayment,
  getMyBookings,
  createUserOrder,
  verifyUserPayment,
} = paymentController

router.get("/my-bookings", userProtect, getMyBookings)

router.post("/user/create-order", userProtect, createUserOrder)

router.post("/user/verify", userProtect, verifyUserPayment)

router.post("/create-order", protect, createOrder)

router.post("/verify", protect, verifyPayment)

router.get("/", protect, getPayments)

router.get("/:id", protect, getPaymentById)

router.delete("/:id", protect, deletePayment)

module.exports = router
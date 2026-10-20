const express = require("express")

const {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingStats,
} = require("../controllers/bookingController")

const protect = require("../middleware/authMiddleware")
const userProtect = require("../middleware/userMiddleware")

const router = express.Router()

router.post("/", userProtect, createBooking)

router.get("/", protect, getBookings)

router.get("/stats", protect, getBookingStats)

router.get("/:id", protect, getBookingById)

router.put("/:id", protect, updateBooking)

router.delete("/:id", protect, deleteBooking)

module.exports = router
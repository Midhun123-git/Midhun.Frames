const express = require("express")

const protect = require("../middleware/authMiddleware")
const protectUser = require("../middleware/userMiddleware")

const {
  createReview,
  getReviews,
  getPublicReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController")

const router = express.Router()

router.get("/public", getPublicReviews)

router.post("/", protectUser, createReview)

router.get("/", protect, getReviews)

router.get("/:id", protect, getReviewById)

router.put("/:id", protect, updateReview)

router.delete("/:id", protect, deleteReview)

module.exports = router
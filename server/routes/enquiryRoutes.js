const express = require("express")

const {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
} = require("../controllers/enquiryController")

const protect = require("../middleware/authMiddleware")
const userProtect = require("../middleware/userMiddleware")

const router = express.Router()

router.post("/", (req, res, next) => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return userProtect(req, res, next)
  }

  next()
}, createEnquiry)

router.get("/", protect, getEnquiries)

router.get("/:id", protect, getEnquiryById)

router.put("/:id", protect, updateEnquiry)

router.delete("/:id", protect, deleteEnquiry)

module.exports = router
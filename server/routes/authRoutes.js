const express = require("express")
const { loginAdmin } = require("../controllers/AuthController.js")
const protect = require("../middleware/authMiddleware")

const router = express.Router()

// Login
router.post("/login", loginAdmin)

// Protected admin profile test
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    admin: req.admin,
  })
})

module.exports = router
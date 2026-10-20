const express = require("express")
const protect = require("../middleware/authMiddleware")

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController")

const router = express.Router()

// Get settings
router.get("/", protect, getSettings)

// Update settings
router.put("/", protect, updateSettings)

module.exports = router
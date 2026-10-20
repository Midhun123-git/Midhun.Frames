const express = require("express")
const protect = require("../middleware/authMiddleware")

const {
  getPublicServices,
  getAdminServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController")

const router = express.Router()

router.get("/public", getPublicServices)

router.get("/", protect, getAdminServices)

router.get("/:id", protect, getServiceById)

router.post("/", protect, createService)

router.put("/:id", protect, updateService)

router.delete("/:id", protect, deleteService)

module.exports = router
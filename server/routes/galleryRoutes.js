const express = require("express")

const protect = require("../middleware/authMiddleware")
const upload = require("../middleware/upload")

const {
  getPublicGallery,
  getGallery,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
} = require("../controllers/galleryController")

const router = express.Router()

router.get("/public", getPublicGallery)

router.get("/", protect, getGallery)

router.post(
  "/",
  protect,
  upload.single("image"),
  createGallery
)

router.get("/:id", protect, getGalleryById)

router.put(
  "/:id",
  protect,
  upload.single("image"),
  updateGallery
)

router.delete(
  "/:id",
  protect,
  deleteGallery
)

module.exports = router
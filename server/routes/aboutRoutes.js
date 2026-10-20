// server/routes/aboutRoutes.js

const express = require("express")
const router = express.Router()

const protect = require("../middleware/authMiddleware")
const upload = require("../middleware/aboutUpload")

const {
  getPublicAbout,
  getAdminAbout,
  createAbout,
  updateAbout,
  deleteFilmStripImage,
  deleteSelectedWorkImage,
  deleteMainImage,
  deleteAbout,
} = require("../controllers/aboutController")

router.get("/public", getPublicAbout)

router.get("/", protect, getAdminAbout)

router.post(
  "/",
  protect,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "filmStripImages", maxCount: 20 },
    { name: "selectedWorkImages", maxCount: 20 },
  ]),
  createAbout
)

router.put(
  "/",
  protect,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "filmStripImages", maxCount: 20 },
    { name: "selectedWorkImages", maxCount: 20 },
  ]),
  updateAbout
)

router.delete("/main-image", protect, deleteMainImage)

router.delete(
  "/film-strip/:id",
  protect,
  deleteFilmStripImage
)

router.delete(
  "/selected-work/:id",
  protect,
  deleteSelectedWorkImage
)

router.delete("/", protect, deleteAbout)

module.exports = router
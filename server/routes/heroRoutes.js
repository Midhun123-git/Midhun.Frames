
const express = require("express");
const multer = require("multer");

const heroController = require("../controllers/heroController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Check controller exports
const getHero = heroController.getHero;
const updateHero = heroController.updateHero;

// Configure image upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }

    return cb(new Error("Only image files are allowed"));
  },
});

// Debug handler types
console.log("Hero route handler checks:");
console.log("protect:", typeof protect);
console.log("getHero:", typeof getHero);
console.log("updateHero:", typeof updateHero);
console.log("upload:", typeof upload.single("image"));

// Stop with a clear error if any handler is missing
if (typeof protect !== "function") {
  throw new Error(
    "Hero routes: authMiddleware.js must export the protect function."
  );
}

if (typeof getHero !== "function") {
  throw new Error(
    "Hero routes: heroController.js must export getHero as a function."
  );
}

if (typeof updateHero !== "function") {
  throw new Error(
    "Hero routes: heroController.js must export updateHero as a function."
  );
}

// Public endpoint: retrieve Hero content
router.get("/", getHero);

// Protected endpoint: update Hero content and image
router.put("/", protect, upload.single("image"), updateHero);

module.exports = router;

const express = require("express")

const protect = require("../middleware/authMiddleware")

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController")

const router = express.Router()

// ==========================================
// ADMIN PROJECT ROUTES
// ==========================================
// Projects are strictly for Syntax Flow
// Web Development projects.
// All routes require admin JWT authentication.
// ==========================================

// Create project
router.post("/", protect, createProject)

// Get all projects
router.get("/", protect, getProjects)

// Get single project
router.get("/:id", protect, getProjectById)

// Update project
router.put("/:id", protect, updateProject)

// Delete project
router.delete("/:id", protect, deleteProject)

module.exports = router
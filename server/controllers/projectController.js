const Project = require("../models/Project")

// ==========================================
// CREATE PROJECT
// ADMIN ONLY
// ==========================================

const createProject = async (req, res) => {
  try {
    const {
      clientName,
      company,
      email,
      phone,
      name,
      service,
      description,
      status,
      startDate,
      deadline,
      completedDate,
      budget,
      paymentStatus,
      liveUrl,
      notes,
    } = req.body || {}

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (!clientName || !name || !service) {
      return res.status(400).json({
        success: false,
        message:
          "Client name, project name and service are required.",
      })
    }

    // ==========================================
    // DATE VALIDATION
    // ==========================================

    if (startDate && isNaN(new Date(startDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date.",
      })
    }

    if (deadline && isNaN(new Date(deadline).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid deadline.",
      })
    }

    if (
      completedDate &&
      isNaN(new Date(completedDate).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid completed date.",
      })
    }

    // ==========================================
    // BUDGET VALIDATION
    // ==========================================

    if (
      budget !== undefined &&
      (isNaN(Number(budget)) || Number(budget) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Budget must be a valid positive number.",
      })
    }

    // ==========================================
    // CREATE PROJECT
    // ==========================================

    const project = await Project.create({
      clientName: clientName.trim(),
      company: company?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      phone: phone?.trim() || "",

      name: name.trim(),
      service: service.trim(),
      description: description?.trim() || "",

      status: status || "Planning",

      startDate: startDate || null,
      deadline: deadline || null,
      completedDate: completedDate || null,

      budget:
        budget !== undefined && budget !== ""
          ? Number(budget)
          : 0,

      paymentStatus: paymentStatus || "Pending",

      liveUrl: liveUrl?.trim() || "",
      notes: notes?.trim() || "",
    })

    res.status(201).json({
      success: true,
      message: "Project created successfully.",
      project,
    })
  } catch (error) {
    console.error("Create project error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to create project.",
      error: error.message,
    })
  }
}

// ==========================================
// GET ALL PROJECTS
// ADMIN ONLY
// ==========================================

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    })
  } catch (error) {
    console.error("Get projects error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch projects.",
      error: error.message,
    })
  }
}

// ==========================================
// GET SINGLE PROJECT
// ADMIN ONLY
// ==========================================

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      })
    }

    res.status(200).json({
      success: true,
      project,
    })
  } catch (error) {
    console.error("Get project error:", error)

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch project.",
      error: error.message,
    })
  }
}

// ==========================================
// UPDATE PROJECT
// ADMIN ONLY
// ==========================================

const updateProject = async (req, res) => {
  try {
    const {
      clientName,
      company,
      email,
      phone,
      name,
      service,
      description,
      status,
      startDate,
      deadline,
      completedDate,
      budget,
      paymentStatus,
      liveUrl,
      notes,
    } = req.body || {}

    // ==========================================
    // CHECK PROJECT EXISTS
    // ==========================================

    const existingProject = await Project.findById(
      req.params.id
    )

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      })
    }

    const updateData = {}

    // ==========================================
    // CLIENT INFORMATION
    // ==========================================

    if (clientName !== undefined) {
      if (!clientName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Client name cannot be empty.",
        })
      }

      updateData.clientName = clientName.trim()
    }

    if (company !== undefined) {
      updateData.company = company.trim()
    }

    if (email !== undefined) {
      updateData.email = email.trim().toLowerCase()
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim()
    }

    // ==========================================
    // PROJECT INFORMATION
    // ==========================================

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Project name cannot be empty.",
        })
      }

      updateData.name = name.trim()
    }

    if (service !== undefined) {
      if (!service.trim()) {
        return res.status(400).json({
          success: false,
          message: "Service cannot be empty.",
        })
      }

      updateData.service = service.trim()
    }

    if (description !== undefined) {
      updateData.description = description.trim()
    }

    // ==========================================
    // STATUS
    // ==========================================

    if (status !== undefined) {
      const allowedStatuses = [
        "Planning",
        "In Progress",
        "Review",
        "Completed",
        "On Hold",
        "Cancelled",
      ]

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project status.",
        })
      }

      updateData.status = status
    }

    // ==========================================
    // DATES
    // ==========================================

    if (startDate !== undefined) {
      if (
        startDate &&
        isNaN(new Date(startDate).getTime())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date.",
        })
      }

      updateData.startDate = startDate || null
    }

    if (deadline !== undefined) {
      if (
        deadline &&
        isNaN(new Date(deadline).getTime())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid deadline.",
        })
      }

      updateData.deadline = deadline || null
    }

    if (completedDate !== undefined) {
      if (
        completedDate &&
        isNaN(new Date(completedDate).getTime())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid completed date.",
        })
      }

      updateData.completedDate = completedDate || null
    }

    // ==========================================
    // BUDGET
    // ==========================================

    if (budget !== undefined) {
      if (
        budget !== "" &&
        (isNaN(Number(budget)) || Number(budget) < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Budget must be a valid positive number.",
        })
      }

      updateData.budget =
        budget === "" ? 0 : Number(budget)
    }

    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    if (paymentStatus !== undefined) {
      const allowedPaymentStatuses = [
        "Pending",
        "Partially Paid",
        "Paid",
      ]

      if (!allowedPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status.",
        })
      }

      updateData.paymentStatus = paymentStatus
    }

    // ==========================================
    // URL
    // ==========================================

    if (liveUrl !== undefined) {
      updateData.liveUrl = liveUrl.trim()
    }

    // ==========================================
    // NOTES
    // ==========================================

    if (notes !== undefined) {
      updateData.notes = notes.trim()
    }

    // ==========================================
    // NOTHING TO UPDATE
    // ==========================================

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid project information provided to update.",
      })
    }

    // ==========================================
    // UPDATE PROJECT
    // ==========================================

    const updatedProject =
      await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )

    res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project: updatedProject,
    })
  } catch (error) {
    console.error("Update project error:", error)

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to update project.",
      error: error.message,
    })
  }
}

// ==========================================
// DELETE PROJECT
// ADMIN ONLY
// ==========================================

const deleteProject = async (req, res) => {
  try {
    const deletedProject =
      await Project.findByIdAndDelete(req.params.id)

    if (!deletedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      })
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    })
  } catch (error) {
    console.error("Delete project error:", error)

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete project.",
      error: error.message,
    })
  }
}

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
}
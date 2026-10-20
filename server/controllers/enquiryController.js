const Enquiry = require("../models/Enquiry")

const createEnquiry = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      project,
      message,
    } = req.body

    if (!firstName || !email || !project || !message) {
      return res.status(400).json({
        success: false,
        message:
          "First name, email, project type, and message are required.",
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      })
    }

    const enquiry = await Enquiry.create({
      userId: req.user?._id || null,

      firstName: firstName.trim(),

      lastName: lastName?.trim() || "",

      email: email.trim().toLowerCase(),

      phone: phone?.trim() || "",

      project: project.trim(),

      message: message.trim(),

      totalAmount: 0,

      advanceAmount: 0,

      paidAmount: 0,

      status: "New",
    })

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      enquiry,
    })
  } catch (error) {
    console.error("Create enquiry error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry.",
    })
  }
}

const getEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      enquiries,
    })
  } catch (error) {
    console.error("Get enquiries error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries.",
    })
  }
}

const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      })
    }

    return res.status(200).json({
      success: true,
      enquiry,
    })
  } catch (error) {
    console.error("Get enquiry error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry.",
    })
  }
}

const updateEnquiry = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      project,
      message,
      status,
      totalAmount,
      advanceAmount,
      paidAmount,
    } = req.body

    const enquiry = await Enquiry.findById(req.params.id)

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      })
    }

    if (firstName !== undefined) {
      enquiry.firstName = firstName.trim()
    }

    if (lastName !== undefined) {
      enquiry.lastName = lastName.trim()
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        })
      }

      enquiry.email = email.trim().toLowerCase()
    }

    if (phone !== undefined) {
      enquiry.phone = phone.trim()
    }

    if (project !== undefined) {
      enquiry.project = project.trim()
    }

    if (message !== undefined) {
      enquiry.message = message.trim()
    }

    if (status !== undefined) {
      const allowedStatuses = [
        "New",
        "Contacted",
        "In Progress",
        "Converted",
        "Closed",
      ]

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid enquiry status.",
        })
      }

      enquiry.status = status
    }

    if (totalAmount !== undefined) {
      const amount = Number(totalAmount)

      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid total amount.",
        })
      }

      enquiry.totalAmount = amount
    }

    if (advanceAmount !== undefined) {
      const amount = Number(advanceAmount)

      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid advance amount.",
        })
      }

      enquiry.advanceAmount = amount
    }

    if (paidAmount !== undefined) {
      const amount = Number(paidAmount)

      if (!Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid paid amount.",
        })
      }

      enquiry.paidAmount = amount
    }

    if (
      enquiry.advanceAmount > enquiry.totalAmount &&
      enquiry.totalAmount > 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Advance amount cannot be greater than total amount.",
      })
    }

    if (
      enquiry.paidAmount > enquiry.totalAmount &&
      enquiry.totalAmount > 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot be greater than total amount.",
      })
    }

    await enquiry.save()

    return res.status(200).json({
      success: true,
      message: "Enquiry updated successfully.",
      enquiry,
    })
  } catch (error) {
    console.error("Update enquiry error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to update enquiry.",
    })
  }
}

const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      })
    }

    await enquiry.deleteOne()

    return res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully.",
    })
  } catch (error) {
    console.error("Delete enquiry error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to delete enquiry.",
    })
  }
}

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
}
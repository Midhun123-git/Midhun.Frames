const Settings = require("../models/Settings")

// ==========================================
// DEFAULT SETTINGS
// ==========================================

const defaultSettings = {
  general: {
    studioName: "Midhun Frames",
    tagline: "Studio · Digital",
    email: "hello@midhunframes.com",
    phone: "+91 98765 43210",
    location: "Kerala, India",
  },

  website: {
    title: "Midhun Frames",
    description:
      "Photography, visual storytelling and web development.",
    instagram: "",
    whatsapp: "",
    websiteUrl: "",
  },

  notifications: {
    newBooking: true,
    newEnquiry: true,
    newReview: true,
    payment: true,
  },

  appearance: {
    theme: "dark",
  },
}

// ==========================================
// GET SETTINGS
// ==========================================

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne()

    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create(defaultSettings)
    }

    return res.status(200).json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Get settings error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings.",
    })
  }
}

// ==========================================
// UPDATE SETTINGS
// ==========================================

const updateSettings = async (req, res) => {
  try {
    const {
      general,
      website,
      notifications,
      appearance,
    } = req.body

    let settings = await Settings.findOne()

    // Create settings if they don't exist
    if (!settings) {
      settings = await Settings.create(defaultSettings)
    }

    // ------------------------------------------
    // GENERAL
    // ------------------------------------------

    if (general) {
      if (general.studioName !== undefined) {
        settings.general.studioName = String(
          general.studioName
        ).trim()
      }

      if (general.tagline !== undefined) {
        settings.general.tagline = String(
          general.tagline
        ).trim()
      }

      if (general.email !== undefined) {
        settings.general.email = String(
          general.email
        )
          .trim()
          .toLowerCase()
      }

      if (general.phone !== undefined) {
        settings.general.phone = String(
          general.phone
        ).trim()
      }

      if (general.location !== undefined) {
        settings.general.location = String(
          general.location
        ).trim()
      }
    }

    // ------------------------------------------
    // WEBSITE
    // ------------------------------------------

    if (website) {
      if (website.title !== undefined) {
        settings.website.title = String(
          website.title
        ).trim()
      }

      if (website.description !== undefined) {
        settings.website.description = String(
          website.description
        ).trim()
      }

      if (website.instagram !== undefined) {
        settings.website.instagram = String(
          website.instagram
        ).trim()
      }

      if (website.whatsapp !== undefined) {
        settings.website.whatsapp = String(
          website.whatsapp
        ).trim()
      }

      if (website.websiteUrl !== undefined) {
        settings.website.websiteUrl = String(
          website.websiteUrl
        ).trim()
      }
    }

    // ------------------------------------------
    // NOTIFICATIONS
    // ------------------------------------------

    if (notifications) {
      if (notifications.newBooking !== undefined) {
        settings.notifications.newBooking =
          Boolean(notifications.newBooking)
      }

      if (notifications.newEnquiry !== undefined) {
        settings.notifications.newEnquiry =
          Boolean(notifications.newEnquiry)
      }

      if (notifications.newReview !== undefined) {
        settings.notifications.newReview =
          Boolean(notifications.newReview)
      }

      if (notifications.payment !== undefined) {
        settings.notifications.payment =
          Boolean(notifications.payment)
      }
    }

    // ------------------------------------------
    // APPEARANCE
    // ------------------------------------------

    if (appearance) {
      if (appearance.theme !== undefined) {
        if (!["dark", "light"].includes(appearance.theme)) {
          return res.status(400).json({
            success: false,
            message: "Invalid theme.",
          })
        }

        settings.appearance.theme = appearance.theme
      }
    }

    await settings.save()

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      settings,
    })
  } catch (error) {
    console.error("Update settings error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to update settings.",
    })
  }
}

module.exports = {
  getSettings,
  updateSettings,
}
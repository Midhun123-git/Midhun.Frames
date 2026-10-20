// server/controllers/aboutController.js

const About = require("../models/About")
const cloudinary = require("../config/cloudinary")

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "midhun-frames/about",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          })
        }
      }
    )

    stream.end(file.buffer)
  })
}

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error("Cloudinary delete error:", error.message)
  }
}

const getPublicAbout = async (req, res) => {
  try {
    const about = await About.findOne({ active: true })

    res.status(200).json({
      success: true,
      about,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch About content",
      error: error.message,
    })
  }
}

const getAdminAbout = async (req, res) => {
  try {
    const about = await About.findOne()

    res.status(200).json({
      success: true,
      about,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch About content",
      error: error.message,
    })
  }
}

const createAbout = async (req, res) => {
  try {
    const existingAbout = await About.findOne()

    if (existingAbout) {
      return res.status(400).json({
        success: false,
        message: "About content already exists. Use PUT to update it.",
      })
    }

    const {
      heading,
      description,
      approachTitle,
      approachText,
      location,
      active,
    } = req.body

    if (
      !heading ||
      !description ||
      !approachTitle ||
      !approachText ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "All About text fields are required",
      })
    }

    const files = req.files || {}

    let mainImage = null
    const filmStripImages = []
    const selectedWorkImages = []

    if (files.mainImage && files.mainImage[0]) {
      mainImage = await uploadToCloudinary(files.mainImage[0])
    }

    if (files.filmStripImages) {
      for (let i = 0; i < files.filmStripImages.length; i++) {
        const uploaded = await uploadToCloudinary(files.filmStripImages[i])

        filmStripImages.push({
          ...uploaded,
          order: i,
        })
      }
    }

    if (files.selectedWorkImages) {
      for (let i = 0; i < files.selectedWorkImages.length; i++) {
        const uploaded = await uploadToCloudinary(
          files.selectedWorkImages[i]
        )

        selectedWorkImages.push({
          ...uploaded,
          order: i,
        })
      }
    }

    const about = await About.create({
      mainImage,
      filmStripImages,
      selectedWorkImages,
      heading,
      description,
      approachTitle,
      approachText,
      location,
      active: active === "false" ? false : true,
    })

    res.status(201).json({
      success: true,
      message: "About content created successfully",
      about,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create About content",
      error: error.message,
    })
  }
}

const updateAbout = async (req, res) => {
  try {
    let about = await About.findOne()

    // DB wiped or first run: create doc instead of 404
    if (!about) {
      about = new About({
        heading: req.body.heading || "About",
        description:
          req.body.description || "Photographer and filmmaker.",
        approachTitle: req.body.approachTitle || "My Approach",
        approachText:
          req.body.approachText || "Quiet light, honest frames.",
        location: req.body.location || "Kerala, India",
      })
    }

    const {
      heading,
      description,
      approachTitle,
      approachText,
      location,
      active,
    } = req.body

    if (heading !== undefined) about.heading = heading
    if (description !== undefined) about.description = description
    if (approachTitle !== undefined) about.approachTitle = approachTitle
    if (approachText !== undefined) about.approachText = approachText
    if (location !== undefined) about.location = location

    if (active !== undefined) {
      about.active =
        active === "false" ? false : active === "true" ? true : active
    }

    const files = req.files || {}

    if (files.mainImage && files.mainImage[0]) {
      if (about.mainImage?.publicId) {
        await deleteFromCloudinary(about.mainImage.publicId)
      }

      about.mainImage = await uploadToCloudinary(files.mainImage[0])
    }

    if (files.filmStripImages) {
      for (const file of files.filmStripImages) {
        const uploaded = await uploadToCloudinary(file)

        about.filmStripImages.push({
          ...uploaded,
          order: about.filmStripImages.length,
        })
      }
    }

    if (files.selectedWorkImages) {
      for (const file of files.selectedWorkImages) {
        const uploaded = await uploadToCloudinary(file)

        about.selectedWorkImages.push({
          ...uploaded,
          order: about.selectedWorkImages.length,
        })
      }
    }

    await about.save()

    res.status(200).json({
      success: true,
      message: "About content updated successfully",
      about,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update About content",
      error: error.message,
    })
  }
}

const deleteFilmStripImage = async (req, res) => {
  try {
    const about = await About.findOne()

    if (!about) {
      return res.status(404).json({
        success: false,
        message: "About content not found",
      })
    }

    const image = about.filmStripImages.id(req.params.id)

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Film strip image not found",
      })
    }

    await deleteFromCloudinary(image.publicId)

    image.deleteOne()

    about.filmStripImages.forEach((item, index) => {
      item.order = index
    })

    await about.save()

    res.status(200).json({
      success: true,
      message: "Film strip image deleted successfully",
      about,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete film strip image",
      error: error.message,
    })
  }
}

const deleteSelectedWorkImage = async (req, res) => {
  try {
    const about = await About.findOne()

    if (!about) {
      return res.status(404).json({
        success: false,
        message: "About content not found",
      })
    }

    const image = about.selectedWorkImages.id(req.params.id)

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Selected work image not found",
      })
    }

    await deleteFromCloudinary(image.publicId)

    image.deleteOne()

    about.selectedWorkImages.forEach((item, index) => {
      item.order = index
    })

    await about.save()

    res.status(200).json({
      success: true,
      message: "Selected work image deleted successfully",
      about,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete selected work image",
      error: error.message,
    })
  }
}

const deleteMainImage = async (req, res) => {
  try {
    const about = await About.findOne()

    if (!about) {
      return res.status(404).json({
        success: false,
        message: "About content not found",
      })
    }

    if (about.mainImage?.publicId) {
      await deleteFromCloudinary(about.mainImage.publicId)
    }

    about.mainImage = null

    await about.save()

    res.status(200).json({
      success: true,
      message: "Main image deleted successfully",
      about,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete main image",
      error: error.message,
    })
  }
}

const deleteAbout = async (req, res) => {
  try {
    const about = await About.findOne()

    if (!about) {
      return res.status(404).json({
        success: false,
        message: "About content not found",
      })
    }

    if (about.mainImage?.publicId) {
      await deleteFromCloudinary(about.mainImage.publicId)
    }

    for (const image of about.filmStripImages) {
      await deleteFromCloudinary(image.publicId)
    }

    for (const image of about.selectedWorkImages) {
      await deleteFromCloudinary(image.publicId)
    }

    await About.deleteOne({ _id: about._id })

    res.status(200).json({
      success: true,
      message: "About content deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete About content",
      error: error.message,
    })
  }
}

module.exports = {
  getPublicAbout,
  getAdminAbout,
  createAbout,
  updateAbout,
  deleteFilmStripImage,
  deleteSelectedWorkImage,
  deleteMainImage,
  deleteAbout,
}
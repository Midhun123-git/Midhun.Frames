
const Gallery = require("../models/Gallery")
const cloudinary = require("../config/cloudinary")

const uploadToCloudinary = (fileBuffer, mediaType) => {
  return new Promise((resolve, reject) => {
    const resourceType =
      mediaType === "video" ? "video" : "image"

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "midhun-frames/gallery",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error)
          reject(error)
          return
        }

        resolve(result)
      }
    )

    uploadStream.end(fileBuffer)
  })
}

const deleteFromCloudinary = async (publicId, mediaType = "image") => {
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type:
        mediaType === "video" ? "video" : "image",
    })
  } catch (error) {
    console.error("Cloudinary delete error:", error.message)
  }
}

const createGallery = async (req, res) => {
  try {
    const {
      title,
      client,
      category,
      date,
      featured,
      isPublic,
    } = req.body

    const normalizedCategory = category?.trim()
    const isPortrait =
      normalizedCategory?.toLowerCase() === "portrait"

    const normalizedTitle = title?.trim()
    const normalizedDate = date?.trim()
    const normalizedClient = client?.trim()

    if (!normalizedTitle || !normalizedCategory) {
      return res.status(400).json({
        success: false,
        message: "Title and category are required.",
      })
    }

    if (!isPortrait && (!normalizedDate || !normalizedClient)) {
      return res.status(400).json({
        success: false,
        message:
          "Date and client/event are required for this category.",
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image or video file is required.",
      })
    }

    const mediaType = req.file.mimetype.startsWith("video/")
      ? "video"
      : "image"

    const uploadedMedia = await uploadToCloudinary(
      req.file.buffer,
      mediaType
    )

    const gallery = await Gallery.create({
      title: normalizedTitle,
      client: normalizedClient || "",
      category: normalizedCategory,
      date: normalizedDate || undefined,
      imageUrl: uploadedMedia.secure_url,
      imagePublicId: uploadedMedia.public_id,
      mediaType,
      featured: featured === true || featured === "true",
      isPublic:
        isPublic === false || isPublic === "false"
          ? false
          : true,
    })

    return res.status(201).json({
      success: true,
      message: "Gallery item created successfully",
      gallery,
    })
  } catch (error) {
    console.error("CREATE GALLERY ERROR", error)

    return res.status(500).json({
      success: false,
      message: "Failed to create gallery item",
      error: error.message,
    })
  }
}

const getPublicGallery = async (req, res) => {
  try {
    const gallery = await Gallery.find({
      isPublic: true,
    }).sort({
      featured: -1,
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,
      count: gallery.length,
      gallery,
    })
  } catch (error) {
    console.error("Get public gallery error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch public gallery",
      error: error.message,
    })
  }
}

const getGallery = async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({
      createdAt: -1,
    })

    return res.status(200).json({
      success: true,
      count: gallery.length,
      gallery,
    })
  } catch (error) {
    console.error("Get gallery error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch gallery",
      error: error.message,
    })
  }
}

const getGalleryById = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      })
    }

    return res.status(200).json({
      success: true,
      gallery,
    })
  } catch (error) {
    console.error("Get gallery item error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Failed to fetch gallery item",
      error: error.message,
    })
  }
}

const updateGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      })
    }

    const {
      title,
      client,
      category,
      date,
      featured,
      isPublic,
    } = req.body

    if (title !== undefined) {
      gallery.title = title.trim()
    }

    if (client !== undefined) {
      gallery.client = client.trim()
    }

    if (category !== undefined) {
      gallery.category = category.trim()
    }

    const isPortrait =
      gallery.category?.toLowerCase() === "portrait"

    if (date !== undefined) {
      gallery.date = date.trim() || undefined
    }

    // Portrait does not require a date or client/event.
    if (isPortrait) {
      gallery.date = undefined
      gallery.client = gallery.client || ""
    }

    if (!isPortrait && !gallery.date) {
      return res.status(400).json({
        success: false,
        message: "Date is required for this category.",
      })
    }

    if (!isPortrait && !gallery.client) {
      return res.status(400).json({
        success: false,
        message: "Client/event is required for this category.",
      })
    }

    if (!gallery.title?.trim() || !gallery.category) {
      return res.status(400).json({
        success: false,
        message: "Title and category are required.",
      })
    }

    if (featured !== undefined) {
      gallery.featured =
        featured === true || featured === "true"
    }

    if (isPublic !== undefined) {
      gallery.isPublic =
        isPublic === true || isPublic === "true"
    }

    if (req.file) {
      const newMediaType = req.file.mimetype.startsWith("video/")
        ? "video"
        : "image"

      const uploadedMedia = await uploadToCloudinary(
        req.file.buffer,
        newMediaType
      )

      if (gallery.imagePublicId) {
        await deleteFromCloudinary(
          gallery.imagePublicId,
          gallery.mediaType || "image"
        )
      }

      gallery.imageUrl = uploadedMedia.secure_url
      gallery.imagePublicId = uploadedMedia.public_id
      gallery.mediaType = newMediaType
    }

    await gallery.save()

    return res.status(200).json({
      success: true,
      message: "Gallery item updated successfully",
      gallery,
    })
  } catch (error) {
    console.error("UPDATE GALLERY ERROR", error)

    return res.status(500).json({
      success: false,
      message: "Failed to update gallery item",
      error: error.message,
    })
  }
}

const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      })
    }

    if (gallery.imagePublicId) {
      await deleteFromCloudinary(
        gallery.imagePublicId,
        gallery.mediaType || "image"
      )
    }

    await Gallery.findByIdAndDelete(req.params.id)

    return res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully",
    })
  } catch (error) {
    console.error("DELETE GALLERY ERROR", error)

    return res.status(500).json({
      success: false,
      message: "Failed to delete gallery item",
      error: error.message,
    })
  }
}

module.exports = {
  createGallery,
  getPublicGallery,
  getGallery,
  getGalleryById,
  updateGallery,
  deleteGallery,
}

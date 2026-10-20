const Service = require("../models/Service")

const getPublicServices = async (req, res) => {
  try {
    const services = await Service.find({
      active: true,
    }).sort({
      category: 1,
      order: 1,
      createdAt: 1,
    })

    res.status(200).json({
      success: true,
      services,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message,
    })
  }
}

const getAdminServices = async (req, res) => {
  try {
    const services = await Service.find().sort({
      category: 1,
      order: 1,
      createdAt: 1,
    })

    res.status(200).json({
      success: true,
      services,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message,
    })
  }
}

const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    res.status(200).json({
      success: true,
      service,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch service",
      error: error.message,
    })
  }
}

const createService = async (req, res) => {
  try {
    const {
      category,
      name,
      price,
      unit,
      desc,
      features,
      featured,
      active,
      order,
    } = req.body

    if (!category || !name || !price || !unit || !desc) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      })
    }

    const service = await Service.create({
      category,
      name,
      price,
      unit,
      desc,
      features: Array.isArray(features) ? features : [],
      featured: featured === true || featured === "true",
      active: active !== false && active !== "false",
      order: Number(order) || 0,
    })

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create service",
      error: error.message,
    })
  }
}

const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    const {
      category,
      name,
      price,
      unit,
      desc,
      features,
      featured,
      active,
      order,
    } = req.body

    service.category = category ?? service.category
    service.name = name ?? service.name
    service.price = price ?? service.price
    service.unit = unit ?? service.unit
    service.desc = desc ?? service.desc

    if (Array.isArray(features)) {
      service.features = features
    }

    if (featured !== undefined) {
      service.featured =
        featured === true || featured === "true"
    }

    if (active !== undefined) {
      service.active =
        active === true || active === "true"
    }

    if (order !== undefined) {
      service.order = Number(order) || 0
    }

    await service.save()

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update service",
      error: error.message,
    })
  }
}

const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    await Service.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
      error: error.message,
    })
  }
}

module.exports = {
  getPublicServices,
  getAdminServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
}
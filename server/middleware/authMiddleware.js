const jwt = require("jsonwebtoken")
const Admin = require("../models/Admin")

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token required.",
      })
    }

    const token = authHeader.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    })

    if (!decoded || !decoded.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin authorization required.",
      })
    }

    const admin = await Admin.findById(decoded.id).select("-password")

    if (
      !admin ||
      !admin.isActive ||
      (admin.role !== "admin" && admin.role !== "superadmin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin authorization required.",
      })
    }

    req.admin = admin

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    })
  }
}

module.exports = protect
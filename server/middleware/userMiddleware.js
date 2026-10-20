const jwt = require("jsonwebtoken")
const User = require("../models/user.js")

const userProtect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || ""

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      })
    }

    const token = header.split(" ")[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please log in again.",
      })
    }

    req.user = user

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
    })
  }
}

module.exports = userProtect
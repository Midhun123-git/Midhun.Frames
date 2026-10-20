const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Admin = require("../models/Admin")

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    })

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      })
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      admin.password
    )

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    )

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error.message)

    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
}

module.exports = {
  loginAdmin,
}
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const Admin = require("./models/Admin")

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    console.log("MongoDB connected ✅")

    const email = "admin@midhunframes.com"
    const password = "Midhunframes@12345"

    const existingAdmin = await Admin.findOne({ email })

    if (existingAdmin) {
      console.log("Admin already exists ❗")
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await Admin.create({
      name: "Midhun Frames Admin",
      email,
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
    })

    console.log("Admin created successfully ✅")
    console.log(`Email: ${email}`)

    process.exit(0)
  } catch (error) {
    console.error("Failed to create admin ❌")
    console.error(error.message)
    process.exit(1)
  }
}

createAdmin()
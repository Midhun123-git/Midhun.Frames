require("dotenv").config()
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const Admin = require("./models/Admin")

;(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    await Admin.deleteOne({ email: "admin@midhunframes.com" })

    await Admin.create({
      name: "Admin",
      email: "admin@midhunframes.com",
      password: await bcrypt.hash("Midhunframes@12345", 10),
      role: "superadmin",
    })

    console.log("admin created")
  } catch (err) {
    console.error(err.message)
  } finally {
    await mongoose.disconnect()
  }
})()
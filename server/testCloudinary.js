require("dotenv").config()

const cloudinary = require("./config/cloudinary")

console.log("Cloud:", process.env.CLOUDINARY_CLOUD_NAME)
console.log("API Key loaded:", !!process.env.CLOUDINARY_API_KEY)
console.log("API Secret loaded:", !!process.env.CLOUDINARY_API_SECRET)

cloudinary.api.ping()
  .then((result) => {
    console.log("Cloudinary connection successful ✅")
    console.log(result)
  })
  .catch((error) => {
    console.log("Cloudinary connection failed ❌")
    console.log(error.message)
  })
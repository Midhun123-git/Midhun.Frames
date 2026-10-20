require("dotenv").config()

const fs = require("fs")
const cloudinary = require("./config/cloudinary")

const imagePath = "./test-image.jpeg"

if (!fs.existsSync(imagePath)) {
  console.log("❌ test-image.jpg not found")
  process.exit(1)
}

cloudinary.uploader.upload(
  imagePath,
  {
    folder: "midhun-frames/gallery",
    resource_type: "image",
  },
  (error, result) => {
    if (error) {
      console.log("❌ Image upload failed")
      console.log(error.message)
      return
    }

    console.log("✅ Image uploaded successfully")
    console.log("URL:", result.secure_url)
    console.log("Public ID:", result.public_id)
  }
)
const express = require("express")
const cors = require("cors")
require("dotenv").config()

const connectDB = require("./config/db")
const authRoutes = require("./routes/authRoutes")
const galleryRoutes = require("./routes/galleryRoutes")
const bookingRoutes = require("./routes/bookingRoutes")
const enquiryRoutes = require("./routes/enquiryRoutes")
const reviewRoutes = require("./routes/reviewRoutes")
const projectRoutes = require("./routes/projectRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const settingsRoutes = require("./routes/settingsRoutes")
const userRoutes = require("./routes/userRoutes")
const serviceRoutes = require("./routes/serviceRoutes")
const aboutRoutes = require("./routes/aboutRoutes")
const heroRoutes = require("./routes/heroRoutes");

const { razorpayWebhook } = require("./controllers/paymentController")

const app = express()

// Connect MongoDB
connectDB()

// Middleware
app.use(cors())

// Razorpay webhook: needs RAW body for signature check.
// Must stay ABOVE express.json().
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
)

app.use(express.json())

// Routes

app.use("/api/auth", authRoutes)
app.use("/api/gallery", galleryRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/enquiries", enquiryRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/users", userRoutes)
app.use("/api/services", serviceRoutes)
app.use("/api/about", aboutRoutes)
app.use("/api/hero", heroRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Midhun Frames API is running 🚀",
  })
})

// Server
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(
    `Midhun Frames server running on http://localhost:${PORT}`
  )
})
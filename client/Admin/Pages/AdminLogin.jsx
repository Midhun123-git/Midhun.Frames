import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const AdminLogin = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })

    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")

    if (!formData.email || !formData.password) {
      setError("Please enter email and password")
      return
    }

    try {
      setLoading(true)

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      )

      console.log("Admin login response:", response.data)

      const token =
        response.data.token ||
        response.data.accessToken ||
        response.data.data?.token

      if (!token) {
        setError("Login successful, but token was not received")
        return
      }

      // Save JWT for protected admin APIs
      localStorage.setItem("adminToken", token)

      // Optional: save admin information if backend sends it
      if (response.data.admin) {
        localStorage.setItem(
          "adminUser",
          JSON.stringify(response.data.admin)
        )
      }

      console.log("Admin token saved successfully")

      navigate("/admin")
    } catch (error) {
      console.error("Admin login error:", error)

      const message =
        error.response?.data?.message ||
        "Invalid email or password"

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-5">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >

        {/* Logo / Heading */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.35em] uppercase text-white/40 mb-4">
            Studio · Digital
          </p>

          <h1 className="text-3xl sm:text-4xl font-serif tracking-wide">
            Midhun Frames
          </h1>

          <p className="text-sm text-white/40 mt-3">
            Admin Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="border border-white/10 bg-white/[0.02] p-6 sm:p-8">

          <div className="mb-7">
            <h2 className="text-xl font-medium">
              Welcome back
            </h2>

            <p className="text-sm text-white/40 mt-2">
              Sign in to manage your studio
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@midhunframes.com"
                  className="w-full bg-white/[0.04] border border-white/10 px-11 py-3.5 text-sm outline-none focus:border-white/30 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full bg-white/[0.04] border border-white/10 px-11 pr-12 py-3.5 text-sm outline-none focus:border-white/30 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-xs text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 text-sm font-medium hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} />
                </>
              )}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Midhun Frames · Admin Access
        </p>

      </motion.div>
    </div>
  )
}

export default AdminLogin
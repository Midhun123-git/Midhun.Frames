import { useState } from "react"
import { motion } from "framer-motion"
import { X, Eye, EyeOff } from "lucide-react"
import { GoogleLogin } from "@react-oauth/google"
import api from "../../../server/Api/api.js"

function Auth({ onClose }) {
  const [mode, setMode] = useState("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resetStep, setResetStep] = useState("email")

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })

  const [resetForm, setResetForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleResetChange = (e) => {
    setResetForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Shared by email/password login and Google login.
  const saveSession = (data) => {
    if (!data?.token || !data?.user) {
      throw new Error(
        "Login response is missing the user or authentication token."
      )
    }

    localStorage.setItem("userToken", data.token)
    localStorage.setItem("userData", JSON.stringify(data.user))

    window.dispatchEvent(new Event("userAuthChanged"))
  }

  // Login and registration have separate success flows.
  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")
    setSuccess("")

    const email = form.email.trim().toLowerCase()
    const password = form.password

    if (mode === "register") {
      if (!form.name.trim()) {
        setError("Please enter your name.")
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long.")
        return
      }
    }

    setLoading(true)

    try {
      if (mode === "register") {
        // 1. Create the account only.
        // Do not save the token or automatically log the user in.
        await api.post("/users/register", {
          name: form.name.trim(),
          email,
          password,
        })

        // 2. Clear the registration form.
        setForm({
          name: "",
          email,
          password: "",
        })

        // 3. Return to login so the user must enter credentials.
        setMode("login")
        setSuccess(
          "Account created successfully! Please log in with your email and password."
        )

        return
      }

      // Login: authenticate with the registered credentials.
      const res = await api.post("/users/login", {
        email,
        password,
      })

      // Save authentication data only after successful login.
      saveSession(res.data)

      setForm({
        name: "",
        email: "",
        password: "",
      })

      onClose?.()
    } catch (err) {
      console.error("Authentication error:", err)

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  // Google sign-in: send Google ID token to backend, get back our own JWT.
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("")
    setSuccess("")

    if (!credentialResponse?.credential) {
      setError("Google sign-in failed. Please try again.")
      return
    }

    setLoading(true)

    try {
      const res = await api.post("/users/google", {
        credential: credentialResponse.credential,
      })

      saveSession(res.data)

      onClose?.()
    } catch (err) {
      console.error("Google authentication error:", err)

      setError(
        err.response?.data?.message ||
          err.message ||
          "Google sign-in failed. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError("Google sign-in failed. Please try again.")
  }

  const openForgotPassword = () => {
    setMode("forgot")
    setResetStep("email")
    setError("")
    setSuccess("")

    setResetForm({
      email: form.email || "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const backToLogin = () => {
    setMode("login")
    setResetStep("email")
    setError("")
    setSuccess("")
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()

    setError("")
    setSuccess("")

    const email = resetForm.email.trim().toLowerCase()

    if (!email) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)

    try {
      const res = await api.post("/users/forgot-password", {
        email,
      })

      setResetForm((prev) => ({
        ...prev,
        email,
      }))

      setSuccess(
        res.data?.message || "OTP sent successfully."
      )

      setResetStep("otp")
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send OTP. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()

    setError("")
    setSuccess("")

    const email = resetForm.email.trim().toLowerCase()
    const otp = resetForm.otp.trim()

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.")
      return
    }

    setLoading(true)

    try {
      const res = await api.post("/users/verify-reset-otp", {
        email,
        otp,
      })

      setSuccess(
        res.data?.message || "OTP verified successfully."
      )

      setResetStep("password")
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired OTP."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    setError("")
    setSuccess("")

    const email = resetForm.email.trim().toLowerCase()
    const newPassword = resetForm.newPassword
    const confirmPassword = resetForm.confirmPassword

    if (newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters long."
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const res = await api.post("/users/reset-password", {
        email,
        newPassword,
      })

      setMode("login")
      setResetStep("email")

      setForm({
        name: "",
        email,
        password: "",
      })

      setResetForm({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      })

      setSuccess(
        res.data?.message ||
          "Password reset successfully. Please log in."
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password."
      )
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode((prev) =>
      prev === "login" ? "register" : "login"
    )

    setError("")
    setSuccess("")
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="
        fixed inset-0 z-[100]
        flex w-full items-center justify-center
        overflow-y-auto bg-[#050505]
        px-6 py-16 text-[#e5d4cc]
      "
    >
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(circle_at_68%_45%,rgba(70,55,50,0.20),transparent_42%),linear-gradient(120deg,#050505_0%,#080808_55%,#030303_100%)]
        "
      />

      <div
        className="
          pointer-events-none absolute inset-0
          opacity-[0.05] mix-blend-overlay
          bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]
        "
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close authentication"
        className="
          fixed right-6 top-6 z-[200]
          flex h-10 w-10 items-center justify-center
          border border-[#e5d4cc]/20
          bg-[#050505]/70 text-[#e5d4cc]
          backdrop-blur-md transition-all duration-300
          hover:border-[#c9a875]/70
          hover:bg-[#c9a875] hover:text-[#050505]
          md:right-10 md:top-8
        "
      >
        <X size={19} strokeWidth={1.2} />
      </button>

      <div className="relative z-10 w-full max-w-[380px]">
        <div
          className="
            mb-4 flex items-center gap-3
            text-[10px] uppercase tracking-[3px]
            text-[#c9a875]/80
          "
        >
          <span className="h-px w-[26px] bg-[#c9a875]/60" />
          Midhun Frames
        </div>

        <div
          className="
            relative border border-[#e5d4cc]/10
            px-9 py-10
          "
        >
          <span className="absolute left-0 top-0 h-px w-10 bg-[#c9a875]" />
          <span className="absolute left-0 top-0 h-10 w-px bg-[#c9a875]" />
          <span className="absolute right-0 top-0 h-px w-10 bg-[#c9a875]" />
          <span className="absolute right-0 top-0 h-10 w-px bg-[#c9a875]" />
          <span className="absolute bottom-0 left-0 h-px w-10 bg-[#c9a875]" />
          <span className="absolute bottom-0 left-0 h-10 w-px bg-[#c9a875]" />
          <span className="absolute bottom-0 right-0 h-px w-10 bg-[#c9a875]" />
          <span className="absolute bottom-0 right-0 h-10 w-px bg-[#c9a875]" />

          {mode === "login" && (
            <>
              <h1 className="font-serif text-[38px] leading-none text-[#e3cec4]">
                Welcome back
              </h1>

              <p className="mt-4 text-[11px] leading-6 text-[#e5d4cc]/45">
                Sign in to continue to your Midhun Frames account.
              </p>

              {success && (
                <p
                  role="status"
                  className="mt-4 text-[11px] leading-5 text-[#9fc99f]"
                >
                  {success}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-8">
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                <Field
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="
                    mt-4 text-[9px] uppercase tracking-[2px]
                    text-[#c9a875] transition-opacity hover:opacity-60
                  "
                >
                  Forgot password?
                </button>

                <SubmitButton loading={loading}>
                  Login
                </SubmitButton>
              </form>

              <GoogleButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={loading}
              />

              <div className="mt-8 border-t border-[#e5d4cc]/10 pt-6 text-center">
                <p className="text-[10px] text-[#e5d4cc]/40">
                  Don't have an account?
                </p>

                <button
                  type="button"
                  onClick={switchMode}
                  className="
                    mt-2 text-[9px] uppercase tracking-[2px]
                    text-[#c9a875] transition-opacity hover:opacity-60
                  "
                >
                  Create account
                </button>
              </div>
            </>
          )}

          {mode === "register" && (
            <>
              <h1 className="font-serif text-[38px] leading-none text-[#e3cec4]">
                Join us
              </h1>

              <p className="mt-4 text-[11px] leading-6 text-[#e5d4cc]/45">
                Create your Midhun Frames account.
              </p>

              <form onSubmit={handleSubmit} className="mt-8">
                <Field
                  label="Name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />

                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                <Field
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <SubmitButton loading={loading}>
                  Create account
                </SubmitButton>
              </form>

              <GoogleButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={loading}
              />

              <div className="mt-8 border-t border-[#e5d4cc]/10 pt-6 text-center">
                <p className="text-[10px] text-[#e5d4cc]/40">
                  Already have an account?
                </p>

                <button
                  type="button"
                  onClick={switchMode}
                  className="
                    mt-2 text-[9px] uppercase tracking-[2px]
                    text-[#c9a875] transition-opacity hover:opacity-60
                  "
                >
                  Login
                </button>
              </div>
            </>
          )}

          {mode === "forgot" && (
            <>
              {resetStep === "email" && (
                <>
                  <h1 className="font-serif text-[38px] leading-none text-[#e3cec4]">
                    Reset password
                  </h1>

                  <p className="mt-4 text-[11px] leading-6 text-[#e5d4cc]/45">
                    Enter your email and we'll send you a verification code.
                  </p>

                  <form onSubmit={handleForgotPassword} className="mt-8">
                    <Field
                      label="Email"
                      name="email"
                      type="email"
                      value={resetForm.email}
                      onChange={handleResetChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />

                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <SubmitButton loading={loading}>
                      Send OTP
                    </SubmitButton>
                  </form>

                  <BackButton onClick={backToLogin}>
                    Back to login
                  </BackButton>
                </>
              )}

              {resetStep === "otp" && (
                <>
                  <h1 className="font-serif text-[38px] leading-none text-[#e3cec4]">
                    Verify OTP
                  </h1>

                  <p className="mt-4 text-[11px] leading-6 text-[#e5d4cc]/45">
                    Enter the 6-digit code sent to your email.
                  </p>

                  {success && <SuccessMessage>{success}</SuccessMessage>}

                  <form onSubmit={handleVerifyOtp} className="mt-8">
                    <Field
                      label="OTP"
                      name="otp"
                      type="text"
                      value={resetForm.otp}
                      onChange={handleResetChange}
                      placeholder="000000"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                    />

                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <SubmitButton loading={loading}>
                      Verify OTP
                    </SubmitButton>
                  </form>

                  <BackButton onClick={backToLogin}>
                    Back to login
                  </BackButton>
                </>
              )}

              {resetStep === "password" && (
                <>
                  <h1 className="font-serif text-[38px] leading-none text-[#e3cec4]">
                    New password
                  </h1>

                  <p className="mt-4 text-[11px] leading-6 text-[#e5d4cc]/45">
                    Create a new password for your account.
                  </p>

                  <form onSubmit={handleResetPassword} className="mt-8">
                    <Field
                      label="New password"
                      name="newPassword"
                      type="password"
                      value={resetForm.newPassword}
                      onChange={handleResetChange}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />

                    <Field
                      label="Confirm password"
                      name="confirmPassword"
                      type="password"
                      value={resetForm.confirmPassword}
                      onChange={handleResetChange}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />

                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    {success && <SuccessMessage>{success}</SuccessMessage>}

                    <SubmitButton loading={loading}>
                      Reset password
                    </SubmitButton>
                  </form>

                  <BackButton onClick={backToLogin}>
                    Back to login
                  </BackButton>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </motion.section>
  )
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  autoComplete,
  required = false,
  minLength,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const inputType =
    isPassword && showPassword ? "text" : type

  return (
    <div className="mb-5">
      <label
        htmlFor={name}
        className="
          mb-2 block text-[9px] uppercase tracking-[2px]
          text-[#e5d4cc]/45
        "
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={autoComplete || "off"}
          required={required}
          minLength={minLength}
          className={`
            h-[46px] w-full border-b
            border-[#e5d4cc]/15 bg-transparent
            text-[12px] text-[#e5d4cc] outline-none
            transition-colors duration-300
            placeholder:text-[#e5d4cc]/20
            focus:border-[#c9a875]
            ${isPassword ? "pr-10" : ""}
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="
              absolute right-0 top-1/2
              -translate-y-1/2 p-2
              text-[#e5d4cc]/45 transition-colors
              hover:text-[#c9a875]
            "
          >
            {showPassword ? (
              <EyeOff size={17} strokeWidth={1.5} />
            ) : (
              <Eye size={17} strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function ErrorMessage({ children }) {
  return (
    <p role="alert" className="mt-4 text-[10px] leading-5 text-red-400">
      {children}
    </p>
  )
}

function SuccessMessage({ children }) {
  return (
    <p role="status" className="mt-4 text-[10px] leading-5 text-[#9fc99f]">
      {children}
    </p>
  )
}

function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="
        mt-7 flex h-[48px] w-full items-center justify-center
        border border-[#c9a875]/60 text-[10px]
        uppercase tracking-[3px] text-[#c9a875]
        transition-all duration-300
        hover:border-[#c9a875] hover:bg-[#c9a875]
        hover:text-[#050505]
        disabled:cursor-not-allowed disabled:opacity-40
      "
    >
      {loading
        ? "Please wait..."
        : children}
    </button>
  )
}

function GoogleButton({ onSuccess, onError, disabled }) {
  return (
    <>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e5d4cc]/10" />
        <span className="text-[9px] uppercase tracking-[2px] text-[#e5d4cc]/30">
          or
        </span>
        <span className="h-px flex-1 bg-[#e5d4cc]/10" />
      </div>

      <div
        className={`flex justify-center ${
          disabled ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          theme="filled_black"
          shape="rectangular"
          text="continue_with"
          width="300"
        />
      </div>
    </>
  )
}

function BackButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        mt-7 block w-full text-center
        text-[9px] uppercase tracking-[2px]
        text-[#c9a875] transition-opacity hover:opacity-60
      "
    >
      {children}
    </button>
  )
}

export default Auth
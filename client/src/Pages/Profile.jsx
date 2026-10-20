
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Lock,
  ShieldCheck,
  CalendarDays,
} from "lucide-react"
import api from "../../../server/Api/api.js"

const outlineBtnClass = `
  flex items-center justify-center gap-2
  border border-[#e5d4cc]/15 px-5 py-3
  text-[9px] uppercase tracking-[1.8px] text-[#c9a875]
  transition-all duration-300
  hover:border-[#c9a875]/60 hover:bg-[#c9a875]/[0.05]
`

const cancelBtnClass = `
  flex items-center justify-center gap-2
  border border-[#e5d4cc]/10 px-5 py-3
  text-[9px] uppercase tracking-[1.8px] text-[#e5d4cc]/55
  transition-all hover:border-[#e5d4cc]/25 hover:text-[#e5d4cc]
  disabled:opacity-40
`

const primaryBtnClass = `
  flex items-center justify-center gap-2
  bg-[#c9a875] px-6 py-3
  text-[9px] uppercase tracking-[1.8px] text-[#050505]
  transition-all hover:bg-[#d7bd8c]
  disabled:cursor-not-allowed disabled:opacity-40
`

const successBoxClass =
  "mb-5 flex items-center gap-3 border border-emerald-400/25 bg-emerald-400/[0.04] px-4 py-3 text-[11px] leading-[1.6] text-emerald-300"

const errorBoxClass =
  "mb-5 border border-red-400/25 bg-red-400/[0.03] px-4 py-3 text-[11px] leading-[1.7] text-red-300/90"

const Profile = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    profilePicture: "",
  })

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [imageError, setImageError] = useState(false)

  const getConfig = () => {
    const token = localStorage.getItem("userToken")

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  // Close profile and return to the home page.
  const handleCloseProfile = useCallback(() => {
    if (passwordSaving) {
      setPasswordOpen(false)
    }

    navigate("/", { replace: true })
  }, [navigate, passwordSaving])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await api.get("/users/me", getConfig())

      // Support common API response structures.
      const currentUser =
        response.data?.user ||
        response.data?.data ||
        response.data

      if (currentUser && typeof currentUser === "object") {
        setUser(currentUser)

        setForm({
          name: currentUser.name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
        })

        setImageError(false)

        localStorage.setItem(
          "userData",
          JSON.stringify(currentUser)
        )
      }
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.removeItem("userToken")
        localStorage.removeItem("userData")
      }

      setError(
        err.response?.data?.message ||
          "Unable to load your profile."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // Load the current authenticated user's profile on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape closes the profile, except while the password form is open.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !passwordOpen) {
        handleCloseProfile()
      }
    }

    window.addEventListener("keydown", onKey)

    return () => {
      window.removeEventListener("keydown", onKey)
    }
  }, [passwordOpen, handleCloseProfile])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEdit = () => {
    setMessage("")
    setError("")
    setEditing(true)
  }

  const handleCancel = () => {
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    })

    setMessage("")
    setError("")
    setEditing(false)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError("Please enter your name.")
      return
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.")
      return
    }

    try {
      setSaving(true)
      setMessage("")
      setError("")

      const response = await api.put(
        "/users/me",
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        getConfig()
      )

      const updatedUser =
        response.data?.user ||
        response.data?.data ||
        response.data

      if (updatedUser && typeof updatedUser === "object") {
        // Preserve the existing picture if the update API omits it.
        const mergedUser = {
          ...user,
          ...updatedUser,
          profilePicture:
            updatedUser.profilePicture ||
            user.profilePicture ||
            updatedUser.picture ||
            user.picture ||
            "",
        }

        setUser(mergedUser)

        setForm({
          name: mergedUser.name || "",
          email: mergedUser.email || "",
          phone: mergedUser.phone || "",
        })

        localStorage.setItem(
          "userData",
          JSON.stringify(mergedUser)
        )

        window.dispatchEvent(new Event("userAuthChanged"))

        setMessage("Your profile has been updated successfully.")
        setEditing(false)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update your profile."
      )
    } finally {
      setSaving(false)
    }
  }

  const openPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })

    setPasswordMessage("")
    setPasswordError("")
    setPasswordOpen(true)
  }

  const closePasswordForm = () => {
    if (passwordSaving) return

    setPasswordOpen(false)

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })

    setPasswordMessage("")
    setPasswordError("")
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()

    setPasswordMessage("")
    setPasswordError("")

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Please fill in all password fields.")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters long."
      )
      return
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordError(
        "New password and confirmation do not match."
      )
      return
    }

    try {
      setPasswordSaving(true)

      const response = await api.put(
        "/users/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        getConfig()
      )

      setPasswordMessage(
        response.data?.message ||
          "Password changed successfully."
      )

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          "Unable to change your password."
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  const profileImage =
    user.profilePicture ||
    user.picture ||
    user.avatar ||
    user.photoURL ||
    ""

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-[#e5d4cc]">
        <div className="flex flex-col items-center">
          <div className="mb-5 h-7 w-7 animate-spin rounded-full border border-[#c9a875]/20 border-t-[#c9a875]" />

          <p className="text-[10px] uppercase tracking-[3px] text-[#e5d4cc]/40">
            Loading profile
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#050505] px-4 pb-28 pt-10 text-[#e5d4cc] sm:px-6 md:px-10 md:py-10 lg:px-16"
    >
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_75%_20%,rgba(70,55,50,0.18),transparent_38%),linear-gradient(120deg,#050505_0%,#080808_55%,#030303_100%)]" />

      {/* Profile close button */}
      <button
        type="button"
        onClick={handleCloseProfile}
        aria-label="Close profile and return home"
        className="
          fixed bottom-6 left-1/2 z-[110]
          flex h-12 -translate-x-1/2 items-center justify-center gap-2
          border border-[#c9a875]/50 bg-[#050505]/95 px-7
          text-[10px] uppercase tracking-[2px] text-[#c9a875]
          shadow-2xl backdrop-blur-md
          transition-all duration-300
          hover:bg-[#c9a875] hover:text-[#050505]
          md:bottom-auto md:left-8 md:top-7 md:h-10
          md:translate-x-0 md:px-5
        "
      >
        <X size={16} strokeWidth={1.2} />
        Close
      </button>

      <div className="relative z-10 mx-auto w-full max-w-[1120px]">
        <div className="mb-8 max-w-[650px]">
          <div className="mb-4 flex items-center gap-3 text-[9px] uppercase tracking-[3px] text-[#c9a875]/80">
            <span className="h-px w-[25px] bg-[#c9a875]/60" />
            Account
          </div>

          <h1 className="font-serif text-[clamp(38px,6vw,58px)] leading-[0.95] tracking-[-1.5px] text-[#e3cec4]">
            Profile & Settings
          </h1>

          <p className="mt-4 max-w-[520px] text-[12px] leading-[1.8] text-[#e5d4cc]/45">
            Manage your personal information, account preferences
            and security.
          </p>
        </div>

        {message && (
          <div className={successBoxClass}>
            <CheckCircle2 size={16} strokeWidth={1.2} />
            {message}
          </div>
        )}

        {error && (
          <div className={errorBoxClass}>{error}</div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <section className="border border-[#e5d4cc]/10 bg-white/[0.015]">
            <div className="flex flex-col gap-5 border-b border-[#e5d4cc]/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#c9a875]/35 bg-[#c9a875]/[0.07]">
                  {profileImage && !imageError ? (
                    <img
                      src={profileImage}
                      alt={user.name || "Profile"}
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User
                      size={22}
                      strokeWidth={1.1}
                      className="text-[#c9a875]"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-[2px] text-[#c9a875]/70">
                    Personal information
                  </p>

                  <h2 className="truncate font-serif text-[25px] text-[#e3cec4]">
                    {user.name || "Your Profile"}
                  </h2>

                  <p className="mt-1 truncate text-[10px] text-[#e5d4cc]/40">
                    {user.email}
                  </p>
                </div>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className={outlineBtnClass}
                >
                  <Edit3 size={14} strokeWidth={1.2} />
                  Edit profile
                </button>
              )}
            </div>

            <form
              onSubmit={handleSave}
              className="px-6 py-7 sm:px-8 sm:py-8"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ProfileField
                  icon={<User size={16} strokeWidth={1.2} />}
                  label="Full name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={!editing}
                />

                <ProfileField
                  icon={<Mail size={16} strokeWidth={1.2} />}
                  label="Email address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={!editing}
                />

                <ProfileField
                  icon={<Phone size={16} strokeWidth={1.2} />}
                  label="Phone number"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Add phone number"
                />
              </div>

              {editing && (
                <div className="mt-7 flex flex-col gap-3 border-t border-[#e5d4cc]/10 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={cancelBtnClass}
                  >
                    <X size={14} strokeWidth={1.2} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className={primaryBtnClass}
                  >
                    <Save size={14} strokeWidth={1.2} />
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              )}
            </form>
          </section>

          <div className="flex flex-col gap-5">
            <section className="border border-[#e5d4cc]/10 bg-white/[0.015] p-6 sm:p-7">
              <div className="mb-6 flex h-11 w-11 items-center justify-center border border-[#c9a875]/30 bg-[#c9a875]/[0.06]">
                <ShieldCheck
                  size={19}
                  strokeWidth={1.1}
                  className="text-[#c9a875]"
                />
              </div>

              <p className="text-[9px] uppercase tracking-[2.5px] text-[#c9a875]/70">
                Account security
              </p>

              <h3 className="mt-2 font-serif text-[27px] text-[#e3cec4]">
                Password & Security
              </h3>

              <p className="mt-3 text-[11px] leading-[1.8] text-[#e5d4cc]/45">
                Keep your account protected by updating your
                password regularly.
              </p>

              <button
                type="button"
                onClick={openPasswordForm}
                className={`mt-7 w-full py-3.5 ${outlineBtnClass}`}
              >
                <Lock size={14} strokeWidth={1.2} />
                Change password
              </button>
            </section>

            <section className="border border-[#e5d4cc]/10 bg-white/[0.015] p-6 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <CalendarDays
                  size={17}
                  strokeWidth={1.2}
                  className="text-[#c9a875]"
                />

                <p className="text-[9px] uppercase tracking-[2px] text-[#c9a875]/70">
                  Your account
                </p>
              </div>

              <div className="space-y-4">
                <AccountRow
                  label="Name"
                  value={user.name || "-"}
                />

                <AccountRow
                  label="Email"
                  value={user.email || "-"}
                />

                <AccountRow
                  label="Phone"
                  value={user.phone || "Not added"}
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {passwordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-[120]
              flex items-center justify-center
              bg-black/80 px-4 py-8 backdrop-blur-md
            "
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closePasswordForm()
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[480px] border border-[#e5d4cc]/10 bg-[#0b0b0b] shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4 border-b border-[#e5d4cc]/10 px-6 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-[#c9a875]/30 bg-[#c9a875]/[0.06]">
                    <Lock
                      size={17}
                      strokeWidth={1.1}
                      className="text-[#c9a875]"
                    />
                  </div>

                  <div>
                    <p className="text-[9px] uppercase tracking-[2px] text-[#c9a875]/70">
                      Security
                    </p>

                    <h3 className="mt-1 font-serif text-[22px] text-[#e3cec4]">
                      Change password
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closePasswordForm}
                  disabled={passwordSaving}
                  aria-label="Close password form"
                  className="flex h-9 w-9 items-center justify-center border border-transparent text-[#e5d4cc]/40 transition-all hover:border-[#e5d4cc]/15 hover:text-[#e5d4cc] disabled:opacity-40"
                >
                  <X size={18} strokeWidth={1.2} />
                </button>
              </div>

              <form
                onSubmit={handleChangePassword}
                className="px-6 py-6 sm:px-7 sm:py-7"
              >
                {passwordMessage && (
                  <div className={successBoxClass}>
                    <CheckCircle2 size={16} strokeWidth={1.2} />
                    {passwordMessage}
                  </div>
                )}

                {passwordError && (
                  <div className={errorBoxClass}>
                    {passwordError}
                  </div>
                )}

                <div className="space-y-5">
                  <PasswordField
                    label="Current password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                  />

                  <PasswordField
                    label="New password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                  />

                  <PasswordField
                    label="Confirm new password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                  />
                </div>

                <p className="mt-4 text-[9px] leading-[1.7] text-[#e5d4cc]/30">
                  Use at least 6 characters for your new password.
                </p>

                <div className="mt-6 flex flex-col gap-3 border-t border-[#e5d4cc]/10 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closePasswordForm}
                    disabled={passwordSaving}
                    className={cancelBtnClass}
                  >
                    <X size={14} strokeWidth={1.2} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className={primaryBtnClass}
                  >
                    <Lock size={14} strokeWidth={1.2} />
                    {passwordSaving
                      ? "Changing..."
                      : "Update password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ProfileField({
  icon,
  label,
  name,
  type = "text",
  value,
  onChange,
  disabled,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2.5 block text-[9px] uppercase tracking-[2px] text-[#e5d4cc]/35">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-[#c9a875]/60">
          {icon}
        </div>

        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="
            w-full border border-[#e5d4cc]/10 bg-white/[0.02]
            px-11 py-3.5 text-[12px] text-[#e5d4cc]
            outline-none transition-all placeholder:text-[#e5d4cc]/20
            focus:border-[#c9a875]/50
            disabled:cursor-default disabled:border-[#e5d4cc]/[0.07]
            disabled:bg-white/[0.01] disabled:text-[#e5d4cc]/55
          "
        />
      </div>
    </div>
  )
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  autoComplete,
}) {
  return (
    <div>
      <label className="mb-2.5 block text-[9px] uppercase tracking-[2px] text-[#e5d4cc]/35">
        {label}
      </label>

      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="
          w-full border border-[#e5d4cc]/10 bg-white/[0.02]
          px-4 py-3.5 text-[12px] text-[#e5d4cc]
          outline-none transition-all placeholder:text-[#e5d4cc]/20
          focus:border-[#c9a875]/50
        "
      />
    </div>
  )
}

function AccountRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e5d4cc]/[0.07] pb-4 last:border-0 last:pb-0">
      <p className="shrink-0 text-[9px] uppercase tracking-[1.7px] text-[#e5d4cc]/30">
        {label}
      </p>

      <p className="max-w-[65%] break-all text-right text-[11px] text-[#e5d4cc]/60">
        {value}
      </p>
    </div>
  )
}

export default Profile

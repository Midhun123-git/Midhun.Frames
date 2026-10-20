import React, { useEffect, useState } from "react"
import {
  Save,
  User,
  Globe,
  Bell,
  Shield,
  Palette,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import api from "../../src/api/api.js"

const getAuthConfig = () => {
  const adminToken = localStorage.getItem("adminToken")

  return {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general")

  const [general, setGeneral] = useState({
    studioName: "",
    tagline: "",
    email: "",
    phone: "",
    location: "",
  })

  const [website, setWebsite] = useState({
    title: "",
    description: "",
    instagram: "",
    whatsapp: "",
    websiteUrl: "",
  })

  const [notifications, setNotifications] = useState({
    newBooking: true,
    newEnquiry: true,
    newReview: true,
    payment: true,
  })

  const [appearance, setAppearance] = useState({
    theme: "dark",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const applyTheme = (theme) => {
    const nextTheme =
      theme === "light" ? "light" : "dark"

    localStorage.setItem(
      "adminTheme",
      nextTheme
    )

    document.documentElement.setAttribute(
      "data-admin-theme",
      nextTheme
    )

    window.dispatchEvent(
      new CustomEvent("admin-theme-change", {
        detail: {
          theme: nextTheme,
        },
      })
    )
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await api.get(
        "/settings",
        getAuthConfig()
      )

      const settings = response.data.settings

      if (settings?.general) {
        setGeneral({
          studioName:
            settings.general.studioName || "",
          tagline:
            settings.general.tagline || "",
          email:
            settings.general.email || "",
          phone:
            settings.general.phone || "",
          location:
            settings.general.location || "",
        })
      }

      if (settings?.website) {
        setWebsite({
          title:
            settings.website.title || "",
          description:
            settings.website.description || "",
          instagram:
            settings.website.instagram || "",
          whatsapp:
            settings.website.whatsapp || "",
          websiteUrl:
            settings.website.websiteUrl || "",
        })
      }

      if (settings?.notifications) {
        setNotifications({
          newBooking:
            settings.notifications.newBooking ?? true,

          newEnquiry:
            settings.notifications.newEnquiry ?? true,

          newReview:
            settings.notifications.newReview ?? true,

          payment:
            settings.notifications.payment ?? true,
        })
      }

      if (settings?.appearance) {
        const backendTheme =
          settings.appearance.theme || "dark"

        setAppearance({
          theme: backendTheme,
        })

        applyTheme(backendTheme)
      }
    } catch (err) {
      console.error(
        "Fetch settings error:",
        err
      )

      setError(
        err.response?.data?.message ||
          "Failed to load settings."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleGeneralChange = (e) => {
    const { name, value } = e.target

    setGeneral((prev) => ({
      ...prev,
      [name]: value,
    }))

    setSaved(false)
  }

  const handleWebsiteChange = (e) => {
    const { name, value } = e.target

    setWebsite((prev) => ({
      ...prev,
      [name]: value,
    }))

    setSaved(false)
  }

  const handleThemeChange = (theme) => {
    setAppearance({
      theme,
    })

    applyTheme(theme)

    setSaved(false)
    setError("")
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaved(false)
      setError("")

      const settingsData = {
        general,
        website,
        notifications,
        appearance,
      }

      const response = await api.put(
        "/settings",
        settingsData,
        getAuthConfig()
      )

      const updatedSettings =
        response.data.settings

      if (updatedSettings?.general) {
        setGeneral({
          studioName:
            updatedSettings.general.studioName || "",

          tagline:
            updatedSettings.general.tagline || "",

          email:
            updatedSettings.general.email || "",

          phone:
            updatedSettings.general.phone || "",

          location:
            updatedSettings.general.location || "",
        })
      }

      if (updatedSettings?.website) {
        setWebsite({
          title:
            updatedSettings.website.title || "",

          description:
            updatedSettings.website.description || "",

          instagram:
            updatedSettings.website.instagram || "",

          whatsapp:
            updatedSettings.website.whatsapp || "",

          websiteUrl:
            updatedSettings.website.websiteUrl || "",
        })
      }

      if (updatedSettings?.notifications) {
        setNotifications({
          newBooking:
            updatedSettings.notifications.newBooking ??
            true,

          newEnquiry:
            updatedSettings.notifications.newEnquiry ??
            true,

          newReview:
            updatedSettings.notifications.newReview ??
            true,

          payment:
            updatedSettings.notifications.payment ??
            true,
        })
      }

      if (updatedSettings?.appearance) {
        const savedTheme =
          updatedSettings.appearance.theme || "dark"

        setAppearance({
          theme: savedTheme,
        })

        applyTheme(savedTheme)
      }

      setSaved(true)

      setTimeout(() => {
        setSaved(false)
      }, 2500)
    } catch (err) {
      console.error(
        "Save settings error:",
        err
      )

      setError(
        err.response?.data?.message ||
          "Failed to save settings."
      )
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    {
      id: "general",
      label: "General",
      icon: User,
    },
    {
      id: "website",
      label: "Website",
      icon: Globe,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <Loader2
            size={18}
            className="animate-spin"
          />

          Loading settings...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#d6b36a]">
          System
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Settings
        </h1>

        <p className="mt-2 text-sm text-white/50">
          Manage your admin and Midhun Frames business
          settings.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-400/20 bg-red-400/[0.04] px-4 py-3 text-sm text-red-400">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="h-fit rounded-xl border border-white/10 bg-white/[0.02] p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${
                  activeTab === tab.id
                    ? "bg-[#d6b36a]/10 text-[#d6b36a]"
                    : "text-white/50 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02]">
          {activeTab === "general" && (
            <div>
              <div className="border-b border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white">
                  General Settings
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Basic information about your business.
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label-style">
                      Studio Name
                    </label>

                    <input
                      name="studioName"
                      value={general.studioName}
                      onChange={handleGeneralChange}
                      className="input-style"
                    />
                  </div>

                  <div>
                    <label className="label-style">
                      Tagline
                    </label>

                    <input
                      name="tagline"
                      value={general.tagline}
                      onChange={handleGeneralChange}
                      className="input-style"
                    />
                  </div>

                  <div>
                    <label className="label-style">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={general.email}
                      onChange={handleGeneralChange}
                      className="input-style"
                    />
                  </div>

                  <div>
                    <label className="label-style">
                      Phone
                    </label>

                    <input
                      name="phone"
                      value={general.phone}
                      onChange={handleGeneralChange}
                      className="input-style"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-style">
                    Location
                  </label>

                  <input
                    name="location"
                    value={general.location}
                    onChange={handleGeneralChange}
                    className="input-style"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "website" && (
            <div>
              <div className="border-b border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white">
                  Website Settings
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Manage public website information and
                  links.
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <label className="label-style">
                    Website Title
                  </label>

                  <input
                    name="title"
                    value={website.title}
                    onChange={handleWebsiteChange}
                    className="input-style"
                  />
                </div>

                <div>
                  <label className="label-style">
                    Website Description
                  </label>

                  <textarea
                    name="description"
                    value={website.description}
                    onChange={handleWebsiteChange}
                    rows={4}
                    className="input-style resize-none"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label-style">
                      Instagram
                    </label>

                    <input
                      name="instagram"
                      value={website.instagram}
                      onChange={handleWebsiteChange}
                      placeholder="@midhun.frames"
                      className="input-style"
                    />
                  </div>

                  <div>
                    <label className="label-style">
                      WhatsApp
                    </label>

                    <input
                      name="whatsapp"
                      value={website.whatsapp}
                      onChange={handleWebsiteChange}
                      placeholder="+91..."
                      className="input-style"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-style">
                    Website URL
                  </label>

                  <input
                    name="websiteUrl"
                    value={website.websiteUrl}
                    onChange={handleWebsiteChange}
                    placeholder="https://..."
                    className="input-style"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div>
              <div className="border-b border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white">
                  Notifications
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Choose which business events should
                  notify you.
                </p>
              </div>

              <div className="divide-y divide-white/10">
                {[
                  [
                    "newBooking",
                    "New Photography Booking",
                    "Receive a notification when a new booking is created.",
                  ],
                  [
                    "newEnquiry",
                    "New Web Enquiry",
                    "Receive a notification when someone requests a website.",
                  ],
                  [
                    "newReview",
                    "New Review",
                    "Receive a notification when a new client review is submitted.",
                  ],
                  [
                    "payment",
                    "Payment Updates",
                    "Receive notifications about payment activity.",
                  ],
                ].map(
                  ([key, title, description]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-5 p-6"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/40">
                          {description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setNotifications(
                            (prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            })
                          )

                          setSaved(false)
                        }}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                          notifications[key]
                            ? "bg-[#d6b36a]"
                            : "bg-white/10"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-black transition ${
                            notifications[key]
                              ? "left-6"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <div className="border-b border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white">
                  Security
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Admin authentication and security
                  settings.
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-lg border border-yellow-400/10 bg-yellow-400/[0.03] p-5">
                  <p className="text-sm font-medium text-yellow-400">
                    Authentication is connected to the
                    backend
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/40">
                    JWT authentication, protected admin
                    routes and password hashing are handled
                    by the admin authentication system.
                  </p>
                </div>

                <div>
                  <label className="label-style">
                    Current Admin Email
                  </label>

                  <input
                    value="admin@midhunframes.com"
                    disabled
                    className="input-style opacity-50"
                    readOnly
                  />
                </div>

                <button
                  type="button"
                  className="rounded-lg border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div>
              <div className="border-b border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white">
                  Appearance
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Admin dashboard visual preferences.
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <p className="text-sm font-medium text-white">
                    Dashboard Theme
                  </p>

                  <p className="mt-1 text-xs text-white/40">
                    Choose how the admin dashboard should
                    look.
                  </p>

                  <div className="mt-5 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        handleThemeChange("dark")
                      }
                      className={`rounded-xl border px-6 py-5 transition ${
                        appearance.theme === "dark"
                          ? "border-[#d6b36a] bg-[#050505]"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-[#d6b36a]" />

                      <p
                        className={`mt-3 text-xs ${
                          appearance.theme === "dark"
                            ? "text-white"
                            : "text-white/60"
                        }`}
                      >
                        Dark
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleThemeChange("light")
                      }
                      className={`rounded-xl border px-6 py-5 transition ${
                        appearance.theme === "light"
                          ? "border-[#d6b36a] bg-white"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full border border-black/10 bg-white" />

                      <p
                        className={`mt-3 text-xs ${
                          appearance.theme === "light"
                            ? "text-black"
                            : "text-white/60"
                        }`}
                      >
                        Light
                      </p>
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-[#c9a875]">
                    {appearance.theme === "light"
                      ? "Light theme is active across the admin dashboard."
                      : "Dark theme is active across the admin dashboard."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {saved && (
                <p className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 size={16} />
                  Settings saved successfully.
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#d6b36a] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e4c47d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`

        .label-style {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.45);
        }

        .input-style {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }

        .input-style:focus {
          border-color: rgba(214,179,106,0.5);
        }

        .input-style::placeholder {
          color: rgba(255,255,255,0.3);
        }

        [data-admin-theme="light"] .label-style {
          color: rgba(17,17,17,0.50);
        }

        [data-admin-theme="light"] .input-style {
          color: #111111;
          background: rgba(0,0,0,0.025);
          border-color: rgba(0,0,0,0.12);
        }

        [data-admin-theme="light"] .input-style::placeholder {
          color: rgba(17,17,17,0.35);
        }

        [data-admin-theme="light"] .input-style:focus {
          border-color: rgba(214,179,106,0.65);
        }

      `}</style>
    </div>
  )
}

export default Settings

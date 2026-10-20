
import { useEffect, useRef, useState } from "react"
import {
  Menu,
  X,
  User,
  LogOut,
  Mail,
  Phone,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import api from "../../../server/Api/api.js"

const NAV_LINKS = [
  { label: "Portfolio", href: "#portfolio", number: "01" },
  { label: "Info", href: "#info", number: "02" },
  { label: "Contact", href: "#contact", number: "03" },
]

const dropdownItemClass = `
  mb-4 flex w-full items-center gap-2 text-left
  text-[10px] uppercase tracking-[2px] text-[#c9a875]
  transition-opacity hover:opacity-60
`

const menuVariants = {
  closed: {
    opacity: 0,
    x: "-100%",
    transition: {
      duration: 0.35,
      ease: [0.76, 0, 0.24, 1],
    },
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: [0.76, 0, 0.24, 1],
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  closed: {
    opacity: 0,
    x: -18,
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
}

function Header({ onLoginClick, onBookingsClick }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [imageError, setImageError] = useState(false)

  const profileRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      const token = localStorage.getItem("userToken")

      if (!token) {
        if (active) {
          setUser(null)
          setImageError(false)
        }
        return
      }

      const cachedUser = localStorage.getItem("userData")

      if (cachedUser) {
        try {
          if (active) {
            setUser(JSON.parse(cachedUser))
            setImageError(false)
          }
        } catch {
          localStorage.removeItem("userData")
        }
      }

      try {
        const response = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Supports APIs returning either { user: {...} }
        // or the user object directly.
        const currentUser =
          response.data?.user || response.data?.data || response.data

        if (currentUser && active) {
          setUser(currentUser)
          setImageError(false)
          localStorage.setItem("userData", JSON.stringify(currentUser))
        }
      } catch (error) {
        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          localStorage.removeItem("userToken")
          localStorage.removeItem("userData")

          if (active) {
            setUser(null)
            setImageError(false)
          }
        }
      }
    }

    const handleAuthChanged = () => loadUser()

    const handleStorage = (event) => {
      if (event.key === "userToken" || event.key === "userData") {
        loadUser()
      }
    }

    loadUser()

    window.addEventListener("userAuthChanged", handleAuthChanged)
    window.addEventListener("storage", handleStorage)

    return () => {
      active = false
      window.removeEventListener("userAuthChanged", handleAuthChanged)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  useEffect(() => {
    const onClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", onClickOutside)

    return () => {
      document.removeEventListener("mousedown", onClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)

    return () => document.removeEventListener("keydown", onKeyDown)
  }, [menuOpen])

  const scrollToSection = (event, href) => {
    event.preventDefault()

    const target = document.querySelector(href)

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }

    setMenuOpen(false)
    setProfileOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("userToken")
    localStorage.removeItem("userData")

    setUser(null)
    setImageError(false)
    setProfileOpen(false)
    setMenuOpen(false)

    window.dispatchEvent(new Event("userAuthChanged"))
  }

  const handleLogin = () => {
    setMenuOpen(false)
    setProfileOpen(false)
    onLoginClick?.()
  }

  const handleBookings = () => {
    setMenuOpen(false)
    setProfileOpen(false)
    onBookingsClick?.()
  }

  const closeMenus = () => {
    setProfileOpen(false)
    setMenuOpen(false)
  }

  // Supports common field names from different API responses.
  const profileImage =
    user?.profilePicture ||
    user?.picture ||
    user?.avatar ||
    user?.photoURL ||
    ""

  return (
    <>
      {/* Main header */}
      <header
        className={`
          fixed left-0 top-0 z-[60]
          flex h-[70px] w-full items-center justify-between
          px-[6%] transition-all duration-500
          ${
            scrolled || menuOpen
              ? "border-b border-[#e5d4cc]/10 bg-[#050505]/95 backdrop-blur-xl"
              : "border-b border-transparent bg-transparent"
          }
        `}
      >
        {/* Mobile menu toggle */}
        <div className="flex w-[100px] items-center md:w-auto">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((value) => !value)
              setProfileOpen(false)
            }}
            className="
              flex h-[42px] w-[42px] items-center justify-center
              border border-[#e5d4cc]/10 text-[#e5d4cc]
              transition-all duration-300
              hover:border-[#c9a875]/50 hover:text-[#c9a875]
              md:hidden
            "
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  className="flex"
                >
                  <X size={19} strokeWidth={1.2} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                  className="flex"
                >
                  <Menu size={19} strokeWidth={1.2} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => scrollToSection(event, link.href)}
              className="
                text-[10px] font-normal uppercase tracking-[1.5px]
                text-[#e5d4cc]/75 transition-colors duration-300
                hover:text-[#c9a875]
              "
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Profile icon and dropdown */}
        <div
          ref={profileRef}
          className="relative flex items-center justify-end"
        >
          {!user ? (
            <button
              type="button"
              onClick={handleLogin}
              className="
                flex items-center gap-2 text-[10px]
                uppercase tracking-[2px] text-[#c9a875]
                transition-opacity duration-300 hover:opacity-70
              "
            >
              <User size={15} strokeWidth={1.2} />
              <span className="hidden md:inline">Login</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value)
                setMenuOpen(false)
              }}
              className="
                flex items-center gap-2 text-[#c9a875]
                transition-opacity duration-300 hover:opacity-70
              "
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              <span
                className="
                  flex h-[34px] w-[34px] items-center justify-center
                  overflow-hidden rounded-full border border-[#c9a875]/40
                  bg-[#050505]/50
                "
              >
                {profileImage && !imageError ? (
                  <img
                    src={profileImage}
                    alt={user.name || "Profile"}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User size={15} strokeWidth={1.2} />
                )}
              </span>

              <span className="hidden max-w-[100px] truncate text-[10px] uppercase tracking-[1.5px] md:block">
                {user.name || "Profile"}
              </span>
            </button>
          )}

          {/* Account dropdown */}
          <AnimatePresence>
            {user && profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="
                  absolute right-0 top-[48px] z-[70] w-[280px]
                  border border-[#e5d4cc]/15 bg-[#080808]/95
                  px-6 py-6 shadow-2xl backdrop-blur-xl
                "
              >
                <div className="mb-5 h-px w-[35px] bg-[#c9a875]" />

                <p className="mb-1 text-[9px] uppercase tracking-[2.5px] text-[#c9a875]/70">
                  Account
                </p>

                <div className="mb-6 flex items-center gap-3">
                  <span
                    className="
                      flex h-[48px] w-[48px] shrink-0 items-center
                      justify-center overflow-hidden rounded-full
                      border border-[#c9a875]/40 bg-[#050505]
                    "
                  >
                    {profileImage && !imageError ? (
                      <img
                        src={profileImage}
                        alt={user.name || "Profile"}
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} strokeWidth={1.2} />
                    )}
                  </span>

                  <h3 className="break-words font-serif text-[25px] leading-tight text-[#e3cec4]">
                    {user.name || "User"}
                  </h3>
                </div>

                {user.email && (
                  <div className="mb-4 flex items-start gap-3">
                    <Mail
                      size={14}
                      strokeWidth={1.2}
                      className="mt-[2px] shrink-0 text-[#c9a875]"
                    />

                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[1.5px] text-[#e5d4cc]/40">
                        Email
                      </p>
                      <p className="mt-1 break-all text-[11px] text-[#e5d4cc]/75">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}

                {user.phone && (
                  <div className="mb-6 flex items-start gap-3">
                    <Phone
                      size={14}
                      strokeWidth={1.2}
                      className="mt-[2px] shrink-0 text-[#c9a875]"
                    />

                    <div>
                      <p className="text-[9px] uppercase tracking-[1.5px] text-[#e5d4cc]/40">
                        Phone
                      </p>
                      <p className="mt-1 text-[11px] text-[#e5d4cc]/75">
                        {user.phone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-5 h-px w-full bg-[#e5d4cc]/10" />

                <Link
                  to="/profile"
                  onClick={closeMenus}
                  className={dropdownItemClass}
                >
                  <User size={14} strokeWidth={1.2} />
                  Profile & Settings
                </Link>

                <button
                  type="button"
                  onClick={handleBookings}
                  className={dropdownItemClass}
                >
                  <CalendarDays size={14} strokeWidth={1.2} />
                  My bookings
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={dropdownItemClass.replace("mb-4", "")}
                >
                  <LogOut size={14} strokeWidth={1.2} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.button
            type="button"
            aria-label="Close navigation menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            key="mobile-navigation"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            aria-label="Mobile navigation"
            className="
              fixed left-0 top-[70px] z-50
              flex h-[calc(100dvh-70px)] w-[min(88%,380px)]
              flex-col overflow-y-auto
              border-r border-[#c9a875]/25
              bg-[#080808] shadow-2xl
              md:hidden
            "
          >
            <motion.div
              variants={itemVariants}
              className="px-7 pb-6 pt-9"
            >
              <p className="text-[9px] uppercase tracking-[4px] text-[#c9a875]/70">
                MIDHUN FRAMES
              </p>

              <h2 className="mt-3 font-serif text-[34px] font-normal leading-tight text-[#e5d4cc]">
                Explore
                <span className="text-[#c9a875]">.</span>
              </h2>

              <p className="mt-2 text-[10px] uppercase tracking-[1.5px] text-[#e5d4cc]/40">
                Cinematic reality × personal imagination
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mx-7 h-px bg-gradient-to-r from-[#c9a875]/70 via-[#e5d4cc]/15 to-transparent"
            />

            <div className="flex flex-col px-7 pt-5">
              {NAV_LINKS.map((link) => (
                <motion.a
                  key={link.href}
                  variants={itemVariants}
                  href={link.href}
                  onClick={(event) =>
                    scrollToSection(event, link.href)
                  }
                  className="
                    group flex min-h-[67px] items-center
                    justify-between border-b border-[#e5d4cc]/10
                    transition-colors duration-300
                    hover:border-[#c9a875]/40
                  "
                >
                  <span className="flex items-center gap-5">
                    <span className="text-[9px] tracking-[1px] text-[#c9a875]/60">
                      {link.number}
                    </span>

                    <span className="text-[12px] uppercase tracking-[2.5px] text-[#e5d4cc]/85 transition-colors duration-300 group-hover:text-[#c9a875]">
                      {link.label}
                    </span>
                  </span>

                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.2}
                    className="
                      text-[#e5d4cc]/30 transition-all duration-300
                      group-hover:-translate-y-1 group-hover:translate-x-1
                      group-hover:text-[#c9a875]
                    "
                  />
                </motion.a>
              ))}
            </div>

            <motion.div
              variants={itemVariants}
              className="mx-7 mb-8 mt-auto pt-10"
            >
              <div className="mb-4 h-px bg-[#e5d4cc]/10" />

              <p className="text-[9px] uppercase tracking-[2px] text-[#e5d4cc]/30">
                Photography · Films · Stories
              </p>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header

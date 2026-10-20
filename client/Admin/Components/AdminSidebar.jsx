
import React, { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Images,
  CalendarDays,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  BriefcaseBusiness,
  MessageSquare,
  CreditCard,
  Code2,
  UserRound,
  PanelsTopLeft,
} from "lucide-react"

const AdminSidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-admin-theme") || "dark"
  )

  const navigate = useNavigate()

  const photographyNavigation = [
    { name: "Gallery", path: "/admin/gallery", icon: Images },
    { name: "Bookings", path: "/admin/bookings", icon: CalendarDays },
    { name: "Reviews", path: "/admin/reviews", icon: Star },
  ]

  const webNavigation = [
    { name: "Projects", path: "/admin/projects", icon: BriefcaseBusiness },
    { name: "Enquiries", path: "/admin/enquiries", icon: MessageSquare },
  ]

  const businessNavigation = [
    { name: "Hero Section", path: "/admin/hero", icon: PanelsTopLeft },
    { name: "About", path: "/admin/about", icon: UserRound },
    { name: "Payments", path: "/admin/payments", icon: CreditCard },
  ]

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(
        document.documentElement.getAttribute("data-admin-theme") || "dark"
      )
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-admin-theme"],
    })

    return () => observer.disconnect()
  }, [])

  const isLight = theme === "light"

  const closeMobile = () => setMobileOpen(false)

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    localStorage.removeItem("adminTheme")
    navigate("/admin/login")
  }

  const navItemClass = ({ isActive }) =>
    `group relative flex w-full items-center gap-4 px-4 py-3.5 text-left transition duration-300 ${
      isActive
        ? "bg-[#c9a875]/10 text-[#c9a875]"
        : isLight
          ? "text-black/45 hover:bg-black/[0.025] hover:text-black"
          : "text-white/45 hover:bg-white/[0.025] hover:text-white"
    }`

  const renderNavigation = (items) =>
    items.map((item) => {
      const Icon = item.icon

      return (
        <NavLink
          key={item.name}
          to={item.path}
          onClick={closeMobile}
          className={navItemClass}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute bottom-2 left-0 top-2 w-[2px] bg-[#c9a875]" />
              )}

              <Icon
                size={16}
                strokeWidth={1.3}
                className={
                  isActive
                    ? "text-[#c9a875]"
                    : isLight
                      ? "text-black/35 group-hover:text-black"
                      : "text-white/35 group-hover:text-white"
                }
              />

              <span className="text-[11px] tracking-wide">
                {item.name}
              </span>
            </>
          )}
        </NavLink>
      )
    })

  const SidebarContent = () => (
    <>
      <div
        className={`flex h-[100px] flex-col justify-center border-b px-7 ${
          isLight ? "border-black/10" : "border-white/10"
        }`}
      >
        <p className={`font-serif text-2xl tracking-tight ${
          isLight ? "text-black" : "text-white"
        }`}>
          Midhun Frames
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className="h-px w-5 bg-[#c9a875]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8">
        <p className={`mb-4 px-3 text-[8px] uppercase tracking-[0.3em] ${
          isLight ? "text-black/25" : "text-white/25"
        }`}>
          Workspace
        </p>

        <NavLink
          to="/admin"
          end
          onClick={closeMobile}
          className={navItemClass}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute bottom-2 left-0 top-2 w-[2px] bg-[#c9a875]" />
              )}

              <LayoutDashboard
                size={16}
                strokeWidth={1.3}
                className={
                  isActive
                    ? "text-[#c9a875]"
                    : isLight
                      ? "text-black/35 group-hover:text-black"
                      : "text-white/35 group-hover:text-white"
                }
              />

              <span className="text-[11px] tracking-wide">Dashboard</span>
            </>
          )}
        </NavLink>

        <div className="mt-9">
          <p className={`mb-4 px-3 text-[8px] uppercase tracking-[0.3em] ${
            isLight ? "text-black/25" : "text-white/25"
          }`}>
            Photography
          </p>

          <nav className="space-y-1">
            {renderNavigation(photographyNavigation)}
          </nav>
        </div>

        <div className="mt-9">
          <div className="mb-4 flex items-center gap-2 px-3">
            <Code2
              size={12}
              strokeWidth={1.3}
              className="text-[#c9a875]/70"
            />

            <p className={`text-[8px] uppercase tracking-[0.3em] ${
              isLight ? "text-black/25" : "text-white/25"
            }`}>
              Web Development
            </p>
          </div>

          <nav className="space-y-1">
            {renderNavigation(webNavigation)}
          </nav>
        </div>

        <div className="mt-9">
          <p className={`mb-4 px-3 text-[8px] uppercase tracking-[0.3em] ${
            isLight ? "text-black/25" : "text-white/25"
          }`}>
            Business
          </p>

          <nav className="space-y-1">
            {renderNavigation(businessNavigation)}
          </nav>
        </div>

        <div className="mt-9">
          <p className={`mb-4 px-3 text-[8px] uppercase tracking-[0.3em] ${
            isLight ? "text-black/25" : "text-white/25"
          }`}>
            System
          </p>

          <NavLink
            to="/admin/settings"
            onClick={closeMobile}
            className={navItemClass}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute bottom-2 left-0 top-2 w-[2px] bg-[#c9a875]" />
                )}

                <Settings
                  size={16}
                  strokeWidth={1.3}
                  className={
                    isActive
                      ? "text-[#c9a875]"
                      : isLight
                        ? "text-black/35 group-hover:text-black"
                        : "text-white/35 group-hover:text-white"
                  }
                />

                <span className="text-[11px] tracking-wide">Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </div>

      <div className={`border-t p-5 ${
        isLight ? "border-black/10" : "border-white/10"
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-[#c9a875]/40 font-serif text-sm text-[#c9a875]">
            M
          </div>

          <div className="min-w-0 flex-1">
            <p className={`truncate text-[11px] ${
              isLight ? "text-black/80" : "text-white/80"
            }`}>
              Midhun Frames
            </p>

            <p className={`mt-0.5 text-[8px] uppercase tracking-[0.15em] ${
              isLight ? "text-black/25" : "text-white/25"
            }`}>
              Administrator
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className={`transition hover:text-[#c9a875] ${
              isLight ? "text-black/30" : "text-white/30"
            }`}
          >
            <LogOut size={15} strokeWidth={1.3} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 flex h-[70px] items-center justify-between border-b px-5 backdrop-blur-md lg:hidden ${
          isLight
            ? "border-black/10 bg-white/95"
            : "border-white/10 bg-[#050505]/95"
        }`}
      >
        <p className={`font-serif text-xl tracking-tight ${
          isLight ? "text-black" : "text-white"
        }`}>
          Midhun Frames
        </p>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`flex h-10 w-10 items-center justify-center border transition hover:border-[#c9a875] ${
            isLight
              ? "border-black/15 text-black"
              : "border-white/15 text-white"
          }`}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {mobileOpen && (
        <div
          className={`fixed inset-0 z-40 pt-[70px] lg:hidden ${
            isLight ? "bg-[#f5f5f3]" : "bg-[#050505]"
          }`}
        >
          <div className="flex h-full flex-col">
            <SidebarContent />
          </div>
        </div>
      )}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 hidden w-[250px] border-r lg:flex lg:flex-col ${
          isLight
            ? "border-black/10 bg-white"
            : "border-white/10 bg-[#050505]"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  )
}

export default AdminSidebar

import React, { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import AdminSidebar from "../Components/AdminSidebar"
import api from "../../../server/Api/api.js"

const AdminLayout = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem("adminTheme") || "dark"
  )

  // ==========================================
  // APPLY THEME
  // ==========================================

  const applyTheme = (newTheme) => {
    const validTheme =
      newTheme === "light" ? "light" : "dark"

    setTheme(validTheme)

    localStorage.setItem(
      "adminTheme",
      validTheme
    )

    document.documentElement.setAttribute(
      "data-admin-theme",
      validTheme
    )

    document.documentElement.style.colorScheme =
      validTheme
  }

  // ==========================================
  // LOAD SAVED THEME
  // ==========================================

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const adminToken = localStorage.getItem("adminToken")

        const response = await api.get(
          "/settings",
          {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          }
        )

        const savedTheme =
          response.data?.settings?.appearance?.theme ||
          "dark"

        applyTheme(savedTheme)
      } catch (error) {
        console.error(
          "Failed to load admin theme:",
          error
        )

        const localTheme =
          localStorage.getItem("adminTheme") ||
          "dark"

        applyTheme(localTheme)
      }
    }

    loadTheme()
  }, [])

  // ==========================================
  // LISTEN FOR SETTINGS THEME CHANGE
  // ==========================================

  useEffect(() => {
    const handleThemeChange = (event) => {
      const newTheme =
        event.detail?.theme || "dark"

      applyTheme(newTheme)
    }

    window.addEventListener(
      "admin-theme-change",
      handleThemeChange
    )

    return () => {
      window.removeEventListener(
        "admin-theme-change",
        handleThemeChange
      )
    }
  }, [])

  // ==========================================
  // APPLY CURRENT THEME
  // ==========================================

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-admin-theme",
      theme
    )

    document.documentElement.style.colorScheme =
      theme === "light" ? "light" : "dark"
  }, [theme])

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "light"
          ? "bg-[#f5f5f3] text-[#111111]"
          : "bg-[#050505] text-white"
      }`}
    >
      <AdminSidebar />

      <main className="min-h-screen lg:ml-[250px]">
        <div className="w-full px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
          <Outlet />
        </div>
      </main>

      {/* ==========================================
          GLOBAL ADMIN THEME
      ========================================== */}

      <style>{`

        /* ==========================================
           DARK MODE
        ========================================== */

        html[data-admin-theme="dark"] body {
          background: #050505;
          color: white;
        }

        html[data-admin-theme="dark"] {
          --admin-bg: #050505;
          --admin-surface: #0b0b0b;
          --admin-border: rgba(255,255,255,0.10);
          --admin-text: white;
          --admin-muted: rgba(255,255,255,0.50);
        }


        /* ==========================================
           LIGHT MODE
        ========================================== */

        html[data-admin-theme="light"] body {
          background: #f5f5f3;
          color: #111111;
        }

        html[data-admin-theme="light"] {
          --admin-bg: #f5f5f3;
          --admin-surface: #ffffff;
          --admin-border: rgba(0,0,0,0.10);
          --admin-text: #111111;
          --admin-muted: rgba(0,0,0,0.50);
        }


        /* ==========================================
           TEXT
        ========================================== */

        html[data-admin-theme="light"]
        .text-white {
          color: #111111 !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/90"] {
          color: rgba(0,0,0,0.90) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/80"] {
          color: rgba(0,0,0,0.80) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/70"] {
          color: rgba(0,0,0,0.70) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/60"] {
          color: rgba(0,0,0,0.60) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/50"] {
          color: rgba(0,0,0,0.50) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/45"] {
          color: rgba(0,0,0,0.45) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/40"] {
          color: rgba(0,0,0,0.40) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/35"] {
          color: rgba(0,0,0,0.35) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/30"] {
          color: rgba(0,0,0,0.30) !important;
        }

        html[data-admin-theme="light"]
        [class~="text-white/25"] {
          color: rgba(0,0,0,0.25) !important;
        }


        /* ==========================================
           BACKGROUNDS
        ========================================== */

        html[data-admin-theme="light"]
        [class~="bg-[#050505]"] {
          background-color: #ffffff !important;
        }

        html[data-admin-theme="light"]
        [class~="bg-white/[0.02]"] {
          background-color: rgba(0,0,0,0.025) !important;
        }

        html[data-admin-theme="light"]
        [class~="bg-white/[0.03]"] {
          background-color: rgba(0,0,0,0.03) !important;
        }

        html[data-admin-theme="light"]
        [class~="bg-white/[0.04]"] {
          background-color: rgba(0,0,0,0.04) !important;
        }

        html[data-admin-theme="light"]
        [class~="bg-white/[0.05]"] {
          background-color: rgba(0,0,0,0.05) !important;
        }


        /* ==========================================
           BORDERS
        ========================================== */

        html[data-admin-theme="light"]
        [class~="border-white/10"] {
          border-color: rgba(0,0,0,0.10) !important;
        }

        html[data-admin-theme="light"]
        [class~="border-white/15"] {
          border-color: rgba(0,0,0,0.15) !important;
        }

        html[data-admin-theme="light"]
        [class~="border-white/20"] {
          border-color: rgba(0,0,0,0.20) !important;
        }


        /* ==========================================
           DIVIDERS
        ========================================== */

        html[data-admin-theme="light"]
        [class~="divide-white/10"]
        > :not([hidden]) ~ :not([hidden]) {
          border-color: rgba(0,0,0,0.10) !important;
        }


        /* ==========================================
           INPUTS
        ========================================== */

        html[data-admin-theme="light"] input,
        html[data-admin-theme="light"] textarea,
        html[data-admin-theme="light"] select {
          color: #111111;
        }

        html[data-admin-theme="light"]
        input::placeholder,
        html[data-admin-theme="light"]
        textarea::placeholder {
          color: rgba(0,0,0,0.35);
        }


        /* ==========================================
           SELECT OPTIONS
        ========================================== */

        html[data-admin-theme="light"] option {
          background: white;
          color: #111111;
        }

        html[data-admin-theme="dark"] option {
          background: #0b0b0b;
          color: white;
        }


        /* ==========================================
           SCROLLBAR
        ========================================== */

        html[data-admin-theme="light"] ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        html[data-admin-theme="light"] ::-webkit-scrollbar-track {
          background: #f5f5f3;
        }

        html[data-admin-theme="light"] ::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.18);
          border-radius: 10px;
        }

        html[data-admin-theme="dark"] ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        html[data-admin-theme="dark"] ::-webkit-scrollbar-track {
          background: #050505;
        }

        html[data-admin-theme="dark"] ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 10px;
        }

      `}</style>
    </div>
  )
}

export default AdminLayout
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Images,
  CalendarDays,
  Star,
  Plus,
  ArrowUpRight,
  Users,
  Clock3,
  Code2,
  BriefcaseBusiness,
  MessageSquare,
  RefreshCw,
} from "lucide-react"
import api from "../../../server/Api/api.js"

const Dashboard = () => {
  const navigate = useNavigate()

  const [data, setData] = useState({
    gallery: [],
    bookings: [],
    reviews: [],
    enquiries: [],
    projects: [],
    bookingStats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalAdvance: 0,
      totalBalance: 0,
    },
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getAuthConfig = () => {
    const adminToken = localStorage.getItem("adminToken")

    return {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  }

  const formatDate = (date) => {
    if (!date) return "No date"

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError("")

      const config = getAuthConfig()

      const [
        galleryResponse,
        bookingsResponse,
        bookingStatsResponse,
        reviewsResponse,
        enquiriesResponse,
        projectsResponse,
      ] = await Promise.all([
        api.get("/gallery", config),
        api.get("/bookings", config),
        api.get("/bookings/stats", config),
        api.get("/reviews", config),
        api.get("/enquiries", config),
        api.get("/projects", config),
      ])

      setData({
        gallery: galleryResponse.data?.gallery || [],
        bookings: bookingsResponse.data?.bookings || [],
        reviews: reviewsResponse.data?.reviews || [],
        enquiries: enquiriesResponse.data?.enquiries || [],
        projects: projectsResponse.data?.projects || [],
        bookingStats:
          bookingStatsResponse.data?.stats || {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            totalRevenue: 0,
            totalAdvance: 0,
            totalBalance: 0,
          },
      })
    } catch (error) {
      console.error("Dashboard loading error:", error)

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        localStorage.removeItem("adminToken")
        navigate("/admin/login")
        return
      }

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard data."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const totalWebClients = new Set(
    data.projects
      .map(
        (project) =>
          project.clientName?.trim().toLowerCase()
      )
      .filter(Boolean)
  ).size

  const newEnquiries = data.enquiries.filter(
    (enquiry) => {
      const status = String(
        enquiry.status || ""
      ).toLowerCase()

      return (
        status === "new" ||
        status === "pending"
      )
    }
  ).length

  const photographyStats = [
    {
      title: "Gallery",
      value: data.gallery.length,
      note: "Total media",
      icon: Images,
    },
    {
      title: "Bookings",
      value: data.bookingStats.total,
      note: `${data.bookingStats.confirmed} confirmed`,
      icon: CalendarDays,
    },
    {
      title: "Reviews",
      value: data.reviews.length,
      note: `${
        data.reviews.filter(
          (review) =>
            review.status === "Published"
        ).length
      } published`,
      icon: Star,
    },
    {
      title: "Pending",
      value: data.bookingStats.pending,
      note: "Requires attention",
      icon: Clock3,
    },
  ]

  const webStats = [
    {
      title: "Web Clients",
      value: totalWebClients,
      note: "Unique project clients",
      icon: Users,
    },
    {
      title: "Projects",
      value: data.projects.length,
      note: `${
        data.projects.filter(
          (project) =>
            project.status === "In Progress"
        ).length
      } active`,
      icon: BriefcaseBusiness,
    },
    {
      title: "Enquiries",
      value: data.enquiries.length,
      note: `${newEnquiries} new`,
      icon: MessageSquare,
    },
  ]

  const recentBookings = data.bookings.slice(0, 4)
  const recentEnquiries = data.enquiries.slice(0, 4)

  if (loading) {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="mb-5 h-7 w-7 animate-spin rounded-full border border-[#c9a875]/20 border-t-[#c9a875]" />

          <p className="text-[8px] uppercase tracking-[0.3em] text-white/30">
            Loading dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <section className="mb-10 lg:mb-12">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-8 bg-[#c9a875]" />

          <span className="text-[8px] uppercase tracking-[0.35em] text-[#c9a875]">
            Business Overview
          </span>
        </div>

        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <h1 className="font-serif text-5xl font-normal tracking-[-2px] sm:text-6xl lg:text-7xl">
              Dashboard
            </h1>

            <p className="mt-4 max-w-lg text-[11px] leading-6 text-white/35">
              Manage your photography studio and web
              development business from one place.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadDashboard}
              className="group flex items-center gap-3 border border-white/10 px-5 py-3 text-[9px] uppercase tracking-[0.2em] text-white/45 transition hover:border-[#c9a875]/50 hover:text-[#c9a875]"
            >
              <RefreshCw
                size={13}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/gallery")
              }
              className="group flex items-center gap-3 border border-[#c9a875]/60 bg-[#c9a875] px-5 py-3 text-[9px] uppercase tracking-[0.2em] text-black transition hover:bg-transparent hover:text-[#c9a875]"
            >
              <Plus size={14} />

              New Photo

              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-8 flex items-center justify-between gap-4 border border-red-400/20 bg-red-400/[0.03] px-5 py-4">
          <p className="text-[10px] leading-5 text-red-300/80">
            {error}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            className="shrink-0 text-[8px] uppercase tracking-[0.2em] text-[#c9a875]"
          >
            Retry
          </button>
        </div>
      )}

      <section>
        <div className="mb-5 flex items-center gap-3">
          <Images
            size={15}
            strokeWidth={1}
            className="text-[#c9a875]"
          />

          <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a875]">
            Photography
          </p>
        </div>

        <div className="grid grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2 xl:grid-cols-4">
          {photographyStats.map((stat) => {
            const Icon = stat.icon

            return (
              <div
                key={stat.title}
                className="group relative border-b border-r border-white/10 p-6 transition hover:bg-white/[0.025]"
              >
                <div className="absolute bottom-0 left-0 h-px w-0 bg-[#c9a875] transition-all duration-500 group-hover:w-full" />

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.28em] text-white/30">
                      {stat.title}
                    </p>

                    <p className="mt-6 font-serif text-5xl">
                      {stat.value}
                    </p>

                    <p className="mt-3 text-[9px] text-white/25">
                      {stat.note}
                    </p>
                  </div>

                  <Icon
                    size={17}
                    strokeWidth={1}
                    className="text-[#c9a875]/60"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center gap-3">
          <Code2
            size={15}
            strokeWidth={1}
            className="text-[#c9a875]"
          />

          <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a875]">
            Web Development
          </p>
        </div>

        <div className="grid grid-cols-1 border-l border-t border-white/10 sm:grid-cols-3">
          {webStats.map((stat) => {
            const Icon = stat.icon

            return (
              <div
                key={stat.title}
                className="group relative border-b border-r border-white/10 p-6 transition hover:bg-white/[0.025]"
              >
                <div className="absolute bottom-0 left-0 h-px w-0 bg-[#c9a875] transition-all duration-500 group-hover:w-full" />

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.28em] text-white/30">
                      {stat.title}
                    </p>

                    <p className="mt-6 font-serif text-5xl">
                      {stat.value}
                    </p>

                    <p className="mt-3 text-[9px] text-white/25">
                      {stat.note}
                    </p>
                  </div>

                  <Icon
                    size={17}
                    strokeWidth={1}
                    className="text-[#c9a875]/60"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a875]">
                Photography
              </p>

              <h2 className="mt-2 font-serif text-3xl">
                Recent Bookings
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/bookings")
              }
              className="group flex items-center gap-2 text-[8px] uppercase tracking-[0.2em] text-white/35 hover:text-[#c9a875]"
            >
              View all

              <ArrowUpRight
                size={12}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>

          <div className="border border-white/10">
            {recentBookings.length === 0 ? (
              <EmptyState text="No bookings yet" />
            ) : (
              recentBookings.map(
                (booking, index) => (
                  <div
                    key={
                      booking._id || index
                    }
                    className="grid grid-cols-1 gap-3 border-b border-white/[0.07] px-5 py-5 last:border-b-0 hover:bg-white/[0.02] md:grid-cols-[1.5fr_1fr_120px] md:items-center md:gap-0"
                  >
                    <div>
                      <p className="text-xs text-white/85">
                        {booking.clientName ||
                          "Unknown client"}
                      </p>

                      <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/20 md:hidden">
                        {booking.eventType ||
                          "Photography"}
                      </p>
                    </div>

                    <p className="hidden text-[10px] text-white/40 md:block">
                      {booking.eventType ||
                        "Photography"}
                    </p>

                    <div>
                      <p className="text-[10px] text-white/40">
                        {formatDate(
                          booking.eventDate ||
                            booking.createdAt
                        )}
                      </p>

                      <span className="mt-2 inline-flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            booking.status ===
                            "Confirmed"
                              ? "bg-[#c9a875]"
                              : "border border-[#c9a875]"
                          }`}
                        />

                        <span className="text-[8px] uppercase tracking-[0.15em] text-white/40">
                          {booking.status ||
                            "Pending"}
                        </span>
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-[#c9a875]">
                Web Development
              </p>

              <h2 className="mt-2 font-serif text-3xl">
                Recent Enquiries
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/enquiries")
              }
              className="group flex items-center gap-2 text-[8px] uppercase tracking-[0.2em] text-white/35 hover:text-[#c9a875]"
            >
              View all

              <ArrowUpRight
                size={12}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>

          <div className="border border-white/10">
            {recentEnquiries.length === 0 ? (
              <EmptyState text="No enquiries yet" />
            ) : (
              recentEnquiries.map(
                (enquiry, index) => (
                  <div
                    key={
                      enquiry._id || index
                    }
                    className="grid grid-cols-1 gap-3 border-b border-white/[0.07] px-5 py-5 last:border-b-0 hover:bg-white/[0.02] md:grid-cols-[1.4fr_1fr_100px] md:items-center"
                  >
                    <div>
                      <p className="text-xs text-white/85">
                        {enquiry.name ||
                          enquiry.clientName ||
                          enquiry.fullName ||
                          "Unknown client"}
                      </p>

                      <p className="mt-1 text-[9px] text-white/30">
                        {enquiry.project ||
                          enquiry.service ||
                          enquiry.subject ||
                          enquiry.message?.slice(
                            0,
                            45
                          ) ||
                          "Web Development"}
                      </p>
                    </div>

                    <p className="text-[10px] text-white/40">
                      {formatDate(
                        enquiry.createdAt ||
                          enquiry.date
                      )}
                    </p>

                    <span className="text-[8px] uppercase tracking-[0.15em] text-[#c9a875]/70">
                      {enquiry.status ||
                        "New"}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/projects")
          }
          className="group flex items-center justify-between border border-white/10 p-5 text-left transition hover:border-[#c9a875]/40 hover:bg-[#c9a875]/5"
        >
          <div>
            <BriefcaseBusiness
              size={18}
              strokeWidth={1}
              className="mb-4 text-[#c9a875]"
            />

            <p className="text-[9px] uppercase tracking-[0.2em] text-white/70">
              Web Projects
            </p>

            <p className="mt-2 text-[8px] text-white/25">
              Track ongoing projects
            </p>
          </div>

          <ArrowUpRight
            size={15}
            className="text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#c9a875]"
          />
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/enquiries")
          }
          className="group flex items-center justify-between border border-white/10 p-5 text-left transition hover:border-[#c9a875]/40 hover:bg-[#c9a875]/5"
        >
          <div>
            <MessageSquare
              size={18}
              strokeWidth={1}
              className="mb-4 text-[#c9a875]"
            />

            <p className="text-[9px] uppercase tracking-[0.2em] text-white/70">
              Enquiries
            </p>

            <p className="mt-2 text-[8px] text-white/25">
              Review new client enquiries
            </p>
          </div>

          <ArrowUpRight
            size={15}
            className="text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#c9a875]"
          />
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/payments")
          }
          className="group flex items-center justify-between border border-white/10 p-5 text-left transition hover:border-[#c9a875]/40 hover:bg-[#c9a875]/5"
        >
          <div>
            <CalendarDays
              size={18}
              strokeWidth={1}
              className="mb-4 text-[#c9a875]"
            />

            <p className="text-[9px] uppercase tracking-[0.2em] text-white/70">
              Payments
            </p>

            <p className="mt-2 text-[8px] text-white/25">
              View payment activity
            </p>
          </div>

          <ArrowUpRight
            size={15}
            className="text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#c9a875]"
          />
        </button>
      </section>

      <footer className="mt-14 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-[7px] uppercase tracking-[0.25em] text-white/20 sm:flex-row">
        <span>
          Midhun Frames © 2026
        </span>

        <span>
          Photography · Web Development · Visual Stories
        </span>
      </footer>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center px-5">
      <p className="text-[9px] uppercase tracking-[0.2em] text-white/20">
        {text}
      </p>
    </div>
  )
}

export default Dashboard
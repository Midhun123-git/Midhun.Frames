import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe,
  MapPin,
  MessageSquare,
  X,
} from "lucide-react"
import api from "../api/api.js"

const getUserConfig = () => {
  const userToken = localStorage.getItem("userToken")

  return {
    headers: {
      Authorization: userToken ? `Bearer ${userToken}` : "",
    },
  }
}

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"

    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)

    document.body.appendChild(script)
  })

const formatAmount = (amount) =>
  `â‚¹${Number(amount || 0).toLocaleString("en-IN")}`

const formatDate = (date) => {
  if (!date) return "-"

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const getStatusClass = (status) => {
  const value = String(status || "").toLowerCase()

  if (
    value.includes("confirm") ||
    value.includes("publish") ||
    value.includes("complete") ||
    value.includes("paid")
  ) {
    return "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-300"
  }

  if (
    value.includes("pending") ||
    value.includes("progress") ||
    value.includes("discussion")
  ) {
    return "border-[#c9a875]/30 bg-[#c9a875]/[0.05] text-[#c9a875]"
  }

  if (value.includes("cancel") || value.includes("reject")) {
    return "border-red-400/25 bg-red-400/[0.04] text-red-300"
  }

  return "border-[#e5d4cc]/10 bg-white/[0.025] text-[#e5d4cc]/55"
}

function MyBookings({ onClose }) {
  const [photographyBookings, setPhotographyBookings] = useState([])
  const [webDesignEnquiries, setWebDesignEnquiries] = useState([])
  const [activeType, setActiveType] = useState("photography")
  const [selectedId, setSelectedId] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [payingKey, setPayingKey] = useState("")

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError("")
    setNotice("")

    const userToken = localStorage.getItem("userToken")

    if (!userToken) {
      setLoading(false)
      setError("Please log in to view your bookings.")
      return
    }

    try {
      const res = await api.get("/payments/my-bookings", getUserConfig())

      const photography = Array.isArray(res.data?.photographyBookings)
        ? res.data.photographyBookings
        : []

      const webDesign = Array.isArray(res.data?.webDesignEnquiries)
        ? res.data.webDesignEnquiries
        : []

      setPhotographyBookings(photography)
      setWebDesignEnquiries(webDesign)

      setActiveType((type) => {
        if (type === "photography" && photography.length > 0) return type
        if (type === "web" && webDesign.length > 0) return type
        if (photography.length > 0) return "photography"
        if (webDesign.length > 0) return "web"
        return type
      })
    } catch (err) {
      console.error("Load bookings error:", err)

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError(
          err.response?.data?.message ||
            "Your login session is not accepted. Please log in again."
        )
      } else {
        setError(
          err.response?.data?.message || "Could not load your bookings."
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const activeItems =
    activeType === "photography" ? photographyBookings : webDesignEnquiries

  useEffect(() => {
    if (!activeItems.some((item) => item._id === selectedId)) {
      setSelectedId(activeItems[0]?._id || "")
    }
  }, [activeItems, selectedId])

  const selectedItem = useMemo(() => {
    return (
      activeItems.find((item) => item._id === selectedId) ||
      activeItems[0] ||
      null
    )
  }, [activeItems, selectedId])

  const switchType = (type) => {
    setActiveType(type)
    setNotice("")
    setError("")
  }

  const pay = async (item, option, sourceType = "Booking") => {
    const key = `${item._id}:${option}`

    setError("")
    setNotice("")
    setPayingKey(key)

    try {
      const userToken = localStorage.getItem("userToken")

      if (!userToken) {
        throw new Error("Please log in to continue.")
      }

      const loaded = await loadRazorpayScript()

      if (!loaded) {
        throw new Error("Payment window could not load. Check your internet.")
      }

      const orderRes = await api.post(
        "/payments/user/create-order",
        {
          bookingId: item._id,
          option,
          sourceType,
        },
        getUserConfig()
      )

      const {
        key: razorpayKey,
        keyId,
        order,
        customer,
        payment,
      } = orderRes.data

      const finalKey = razorpayKey || keyId

      if (!finalKey || !order) {
        throw new Error("Payment order could not be created.")
      }

      const itemName =
        `${item.firstName || ""} ${item.lastName || ""}`.trim()

      const checkout = new window.Razorpay({
        key: finalKey,
        amount: order.amount,
        currency: order.currency || "INR",
        order_id: order.id || order.order_id,
        name: "Midhun Frames",
        description:
          payment?.paymentType ||
          item.packageName ||
          item.eventType ||
          item.project ||
          "Payment",
        prefill: {
          name: customer?.clientName || item.clientName || itemName || "",
          email: customer?.email || item.email || "",
          contact: customer?.phone || item.phone || "",
        },
        theme: {
          color: "#c9a875",
        },

        handler: async (response) => {
          try {
            await api.post(
              "/payments/user/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: item._id,
                sourceType,
              },
              getUserConfig()
            )

            setNotice("Payment received. Thank you.")

            await loadBookings()
          } catch (err) {
            console.error("Verify payment error:", err)

            setError(
              `We could not confirm your payment. If money was deducted, contact us with payment ID ${response.razorpay_payment_id}.`
            )
          } finally {
            setPayingKey("")
          }
        },

        modal: {
          ondismiss: () => {
            setPayingKey("")
          },
        },
      })

      checkout.on("payment.failed", (response) => {
        setError(
          response.error?.description || "Payment failed. Please try again."
        )

        setPayingKey("")
      })

      checkout.open()
    } catch (err) {
      console.error("Start payment error:", err)

      if (err.response?.status === 401 || err.response?.status === 403) {
        setError(
          err.response?.data?.message ||
            "Your login session is not accepted. Please log in again."
        )
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not start payment."
        )
      }

      setPayingKey("")
    }
  }

  const renderPhotographyListItem = (booking) => {
    const active = selectedItem?._id === booking._id
    const due = Number(booking.due || 0)

    return (
      <button
        key={booking._id}
        type="button"
        onClick={() => setSelectedId(booking._id)}
        className={`group relative w-full overflow-hidden rounded-sm border p-5 text-left transition-all duration-300 ${
          active
            ? "border-[#c9a875]/45 bg-[#c9a875]/[0.055]"
            : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.15] hover:bg-white/[0.025]"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-0 h-full w-[2px] bg-[#c9a875]" />
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a875]" />
              <p className="text-[8px] uppercase tracking-[2.2px] text-[#c9a875]/70">
                Photography
              </p>
            </div>

            <p className="truncate font-serif text-[20px] leading-none text-[#e5d7d0]">
              {booking.packageName ||
                booking.eventType ||
                "Photography Booking"}
            </p>

            <p className="mt-2 truncate text-[10px] text-[#e5d4cc]/35">
              {booking.eventType || "Photography"}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[7px] uppercase tracking-[1.4px] ${getStatusClass(
              booking.status
            )}`}
          >
            {booking.status || "Pending"}
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-white/[0.07] pt-4">
          <div>
            <p className="text-[8px] uppercase tracking-[1.5px] text-[#e5d4cc]/25">
              Event
            </p>

            <p className="mt-1 text-[10px] text-[#e5d4cc]/50">
              {formatDate(booking.eventDate)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[8px] uppercase tracking-[1.5px] text-[#e5d4cc]/25">
              {due > 0 ? "Balance" : "Total"}
            </p>

            <p className="mt-1 font-serif text-[16px] text-[#c9a875]">
              {formatAmount(due > 0 ? due : booking.total)}
            </p>
          </div>
        </div>
      </button>
    )
  }

  const renderWebListItem = (enquiry) => {
    const active = selectedItem?._id === enquiry._id
    const hasQuote = Number(enquiry.total || 0) > 0
    const due = Number(enquiry.due || 0)

    return (
      <button
        key={enquiry._id}
        type="button"
        onClick={() => setSelectedId(enquiry._id)}
        className={`group relative w-full overflow-hidden rounded-sm border p-5 text-left transition-all duration-300 ${
          active
            ? "border-[#c9a875]/45 bg-[#c9a875]/[0.055]"
            : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.15] hover:bg-white/[0.025]"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-0 h-full w-[2px] bg-[#c9a875]" />
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a875]" />
              <p className="text-[8px] uppercase tracking-[2.2px] text-[#c9a875]/70">
                Web Development
              </p>
            </div>

            <p className="truncate font-serif text-[20px] leading-none text-[#e5d7d0]">
              {enquiry.project || "Web Design Enquiry"}
            </p>

            <p className="mt-2 truncate text-[10px] text-[#e5d4cc]/35">
              Project enquiry
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[7px] uppercase tracking-[1.4px] ${getStatusClass(
              enquiry.status
            )}`}
          >
            {enquiry.status || "New"}
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-white/[0.07] pt-4">
          <div>
            <p className="text-[8px] uppercase tracking-[1.5px] text-[#e5d4cc]/25">
              Submitted
            </p>

            <p className="mt-1 text-[10px] text-[#e5d4cc]/50">
              {formatDate(enquiry.createdAt)}
            </p>
          </div>

          {hasQuote ? (
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[1.5px] text-[#e5d4cc]/25">
                {due > 0 ? "Balance" : "Total"}
              </p>

              <p className="mt-1 font-serif text-[16px] text-[#c9a875]">
                {formatAmount(due > 0 ? due : enquiry.total)}
              </p>
            </div>
          ) : (
            <span className="text-[9px] uppercase tracking-[1.3px] text-[#e5d4cc]/25">
              Quote pending
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#050505] px-4 py-7 text-[#e5d4cc] sm:px-7 sm:py-10"
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(201,168,117,0.07),transparent_30%),radial-gradient(circle_at_10%_80%,rgba(100,80,70,0.08),transparent_35%)]" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-5 top-5 z-[120] flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-black/60 text-[#e5d4cc]/70 backdrop-blur-xl transition-all duration-300 hover:border-[#c9a875]/50 hover:bg-[#c9a875] hover:text-[#050505] sm:right-8 sm:top-7"
      >
        <X size={17} strokeWidth={1.2} />
      </button>

      <div className="relative z-10 mx-auto w-full max-w-[1240px]">
        <header className="mb-8 border-b border-white/[0.07] pb-7 sm:mb-10">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-7 bg-[#c9a875]/60" />

            <span className="text-[8px] uppercase tracking-[3.5px] text-[#c9a875]/75">
              Midhun Frames Â· Client Portal
            </span>
          </div>

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-serif text-[clamp(38px,6vw,62px)] leading-[0.9] tracking-[-2px] text-[#e5d7d0]">
                My bookings
              </h1>

              <p className="mt-5 max-w-[510px] text-[11px] leading-[1.8] text-[#e5d4cc]/40">
                Your photography bookings and web development projects,
                together in one private space.
              </p>
            </div>

            <div className="flex gap-8 border-l border-white/[0.08] pl-5 sm:pb-1">
              <PortalStat
                label="Photography"
                value={photographyBookings.length}
              />

              <PortalStat
                label="Web projects"
                value={webDesignEnquiries.length}
              />
            </div>
          </div>
        </header>

        {notice && (
          <div className="mb-5 flex items-center gap-3 rounded-sm border border-emerald-400/20 bg-emerald-400/[0.035] px-4 py-3 text-[10px] text-emerald-300/80">
            <CheckCircle2 size={15} strokeWidth={1.2} />
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-sm border border-red-400/20 bg-red-400/[0.03] px-4 py-3 text-[10px] leading-[1.7] text-red-300/80">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[500px] items-center justify-center border border-white/[0.07] bg-white/[0.01]">
            <div className="text-center">
              <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border border-[#c9a875]/15 border-t-[#c9a875]" />

              <p className="text-[8px] uppercase tracking-[3px] text-[#e5d4cc]/30">
                Loading client portal
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 border border-white/[0.07] bg-white/[0.01]">
              <PortalTab
                active={activeType === "photography"}
                icon={<CalendarDays size={15} strokeWidth={1.2} />}
                label="Photography"
                count={photographyBookings.length}
                onClick={() => switchType("photography")}
              />

              <PortalTab
                active={activeType === "web"}
                icon={<Globe size={15} strokeWidth={1.2} />}
                label="Web Development"
                count={webDesignEnquiries.length}
                onClick={() => switchType("web")}
              />
            </div>

            {activeItems.length === 0 ? (
              <EmptyState activeType={activeType} />
            ) : (
              <div className="grid min-h-[590px] grid-cols-1 gap-5 lg:grid-cols-[350px_minmax(0,1fr)]">
                <aside className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-white/[0.07] bg-white/[0.012]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                    <div>
                      <p className="text-[8px] uppercase tracking-[2.5px] text-[#e5d4cc]/30">
                        {activeType === "photography"
                          ? "Your bookings"
                          : "Your enquiries"}
                      </p>

                      <p className="mt-1 text-[10px] text-[#c9a875]/60">
                        Select an item
                      </p>
                    </div>

                    <span className="flex h-7 min-w-7 items-center justify-center rounded-full border border-white/[0.08] text-[9px] text-[#e5d4cc]/45">
                      {activeItems.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 overflow-y-auto p-2 lg:max-h-[610px]">
                    {activeType === "photography"
                      ? photographyBookings.map(renderPhotographyListItem)
                      : webDesignEnquiries.map(renderWebListItem)}
                  </div>
                </aside>

                <main className="overflow-hidden rounded-sm border border-white/[0.07] bg-white/[0.012]">
                  {selectedItem &&
                    (activeType === "photography" ? (
                      <PhotographyDetails
                        booking={selectedItem}
                        pay={pay}
                        payingKey={payingKey}
                      />
                    ) : (
                      <WebDetails
                        enquiry={selectedItem}
                        pay={pay}
                        payingKey={payingKey}
                      />
                    ))}
                </main>
              </div>
            )}
          </>
        )}
      </div>
    </motion.section>
  )
}

function PortalStat({ label, value }) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-[1.8px] text-[#e5d4cc]/25">
        {label}
      </p>

      <p className="mt-1 font-serif text-[22px] text-[#c9a875]">{value}</p>
    </div>
  )
}

function PortalTab({ active, icon, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 px-4 py-5 text-[9px] uppercase tracking-[2px] transition-all duration-300 ${
        active
          ? "bg-[#c9a875]/[0.045] text-[#c9a875]"
          : "text-[#e5d4cc]/35 hover:bg-white/[0.02] hover:text-[#e5d4cc]/65"
      }`}
    >
      {icon}

      <span>{label}</span>

      <span className="text-[8px] opacity-50">{count}</span>

      {active && (
        <span className="absolute bottom-[-1px] left-0 h-px w-full bg-[#c9a875]" />
      )}
    </button>
  )
}

function EmptyState({ activeType }) {
  const photography = activeType === "photography"

  return (
    <div className="flex min-h-[500px] items-center justify-center border border-white/[0.07] bg-white/[0.01] px-6 text-center">
      <div className="max-w-[430px]">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a875]/15 bg-[#c9a875]/[0.035] text-[#c9a875]/65">
          {photography ? (
            <CalendarDays size={22} strokeWidth={1} />
          ) : (
            <Globe size={22} strokeWidth={1} />
          )}
        </div>

        <p className="mb-3 text-[8px] uppercase tracking-[3px] text-[#c9a875]/55">
          Client portal
        </p>

        <h2 className="font-serif text-[30px] text-[#e5d7d0]">
          No {photography ? "bookings" : "projects"} yet
        </h2>

        <p className="mt-4 text-[11px] leading-[1.9] text-[#e5d4cc]/35">
          {photography
            ? "Your photography bookings will appear here once you make a booking."
            : "Your web development enquiries and projects will appear here once you contact us."}
        </p>
      </div>
    </div>
  )
}

function PhotographyDetails({ booking, pay, payingKey }) {
  const advanceAmount = Number(booking.advanceAmount || 0)
  const due = Number(booking.due || 0)
  const paid = Number(booking.paid || 0)
  const total = Number(booking.total || 0)

  const showAdvance =
    booking.canPay && paid <= 0 && advanceAmount > 0 && advanceAmount < due

  const balanceLabel = paid > 0 ? "Pay balance" : "Pay in full"

  return (
    <div className="h-full px-6 py-7 sm:px-9 sm:py-9">
      <DetailsHeader
        eyebrow="Photography booking"
        icon={<CameraIcon />}
        title={booking.packageName || booking.eventType || "Photography Booking"}
        subtitle={`Booking ID Â· ${booking._id}`}
        status={booking.status || "Pending"}
      />

      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
        <DetailItem
          icon={<CalendarDays size={15} strokeWidth={1.2} />}
          label="Event date"
          value={formatDate(booking.eventDate)}
        />

        <DetailItem
          icon={<MapPin size={15} strokeWidth={1.2} />}
          label="Location"
          value={booking.location || "-"}
        />

        <DetailItem
          icon={<CreditCard size={15} strokeWidth={1.2} />}
          label="Payment"
          value={due === 0 ? "Fully paid" : `${formatAmount(due)} due`}
        />
      </div>

      <SectionHeading title="Payment summary" />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Amount label="Total" value={total} />
        <Amount label="Paid" value={paid} />
        <Amount label="Balance" value={due} emphasis />
      </div>

      {booking.canPay ? (
        <PaymentOptions
          showAdvance={showAdvance}
          advanceAmount={advanceAmount}
          due={due}
          balanceLabel={balanceLabel}
          item={booking}
          pay={pay}
          payingKey={payingKey}
          sourceType="Booking"
        />
      ) : (
        <PaymentStatus due={due} />
      )}
    </div>
  )
}

function WebDetails({ enquiry, pay, payingKey }) {
  const total = Number(enquiry.total || 0)
  const paid = Number(enquiry.paid || 0)
  const advanceAmount = Number(enquiry.advanceAmount || 0)

  const hasQuote = total > 0

  const due =
    enquiry.due !== undefined && enquiry.due !== null
      ? Number(enquiry.due)
      : Math.max(total - paid, 0)

  const canPay = enquiry.canPay ?? (hasQuote && due > 0)

  const showAdvance =
    canPay && paid <= 0 && advanceAmount > 0 && advanceAmount < due

  const balanceLabel = paid > 0 ? "Pay balance" : "Pay in full"

  return (
    <div className="h-full px-6 py-7 sm:px-9 sm:py-9">
      <DetailsHeader
        eyebrow="Web development"
        icon={<Globe size={14} strokeWidth={1.2} />}
        title={enquiry.project || "Web Design Enquiry"}
        subtitle={`Submitted Â· ${formatDate(enquiry.createdAt)}`}
        status={enquiry.status || "New"}
      />

      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
        <DetailItem
          icon={<CalendarDays size={15} strokeWidth={1.2} />}
          label="Submitted"
          value={formatDate(enquiry.createdAt)}
        />

        <DetailItem
          icon={<MessageSquare size={15} strokeWidth={1.2} />}
          label="Status"
          value={enquiry.status || "New"}
        />

        <DetailItem
          icon={<CreditCard size={15} strokeWidth={1.2} />}
          label="Payment"
          value={
            !hasQuote
              ? "Quote pending"
              : due === 0
              ? "Fully paid"
              : `${formatAmount(due)} due`
          }
        />
      </div>

      <SectionHeading title="Project details" />

      <div className="rounded-sm border border-white/[0.07] bg-white/[0.012] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[8px] uppercase tracking-[2.5px] text-[#e5d4cc]/30">
            Your message
          </p>

          <MessageSquare
            size={14}
            strokeWidth={1.1}
            className="text-[#c9a875]/50"
          />
        </div>

        <p className="text-[12px] leading-[2] text-[#e5d4cc]/60">
          {enquiry.message || "No message provided."}
        </p>
      </div>

      {hasQuote && (
        <>
          <SectionHeading title="Payment summary" />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Amount label="Project total" value={total} />
            <Amount label="Paid" value={paid} />
            <Amount label="Balance" value={due} emphasis />
          </div>
        </>
      )}

      {!hasQuote ? (
        <div className="mt-8 rounded-sm border border-[#c9a875]/10 bg-[#c9a875]/[0.025] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c9a875]/15 text-[#c9a875]/65">
              <MessageSquare size={15} strokeWidth={1.1} />
            </div>

            <div>
              <p className="text-[8px] uppercase tracking-[2.5px] text-[#c9a875]/65">
                What happens next
              </p>

              <p className="mt-3 text-[11px] leading-[1.9] text-[#e5d4cc]/40">
              Weâ€™ll review your enquiry and contact you to discuss your project, requirements, timeline, and pricing. Once your quote is ready, youâ€™ll be able to view the project amount and make the payment here.
              </p>
            </div>
          </div>
        </div>
      ) : canPay ? (
        <PaymentOptions
          showAdvance={showAdvance}
          advanceAmount={advanceAmount}
          due={due}
          balanceLabel={balanceLabel}
          item={enquiry}
          pay={pay}
          payingKey={payingKey}
          sourceType="Enquiry"
        />
      ) : (
        <PaymentStatus due={due} />
      )}
    </div>
  )
}

function DetailsHeader({ eyebrow, icon, title, subtitle, status }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-4 flex items-center gap-2 text-[8px] uppercase tracking-[2.7px] text-[#c9a875]/65">
          {icon}
          {eyebrow}
        </div>

        <h2 className="max-w-[650px] font-serif text-[32px] leading-[1] tracking-[-0.5px] text-[#e5d7d0] sm:text-[42px]">
          {title}
        </h2>

        <p className="mt-4 text-[9px] tracking-[0.5px] text-[#e5d4cc]/30">
          {subtitle}
        </p>
      </div>

      <span
        className={`self-start rounded-full border px-3 py-1.5 text-[7px] uppercase tracking-[1.7px] ${getStatusClass(
          status
        )}`}
      >
        {status}
      </span>
    </div>
  )
}

function SectionHeading({ title }) {
  return (
    <div className="mb-5 mt-9 flex items-center gap-4">
      <h3 className="shrink-0 font-serif text-[22px] text-[#e5d7d0]">
        {title}
      </h3>

      <span className="h-px flex-1 bg-white/[0.07]" />
    </div>
  )
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="bg-[#080808] px-5 py-5">
      <div className="mb-3 flex items-center gap-2 text-[#c9a875]/70">
        {icon}

        <p className="text-[8px] uppercase tracking-[1.8px] text-[#e5d4cc]/30">
          {label}
        </p>
      </div>

      <p className="text-[11px] leading-[1.6] text-[#e5d4cc]/60">
        {value}
      </p>
    </div>
  )
}

function Amount({ label, value, emphasis = false }) {
  return (
    <div
      className={`rounded-sm border px-4 py-5 ${
        emphasis
          ? "border-[#c9a875]/20 bg-[#c9a875]/[0.035]"
          : "border-white/[0.07] bg-white/[0.012]"
      }`}
    >
      <p className="text-[8px] uppercase tracking-[2px] text-[#e5d4cc]/30">
        {label}
      </p>

      <p
        className={`mt-3 font-serif text-[22px] leading-none ${
          emphasis ? "text-[#c9a875]" : "text-[#e5d7d0]"
        }`}
      >
        {formatAmount(value)}
      </p>
    </div>
  )
}

function PaymentOptions({
  showAdvance,
  advanceAmount,
  due,
  balanceLabel,
  item,
  pay,
  payingKey,
  sourceType,
}) {
  return (
    <div className="mt-9 border-t border-white/[0.07] pt-7">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[8px] uppercase tracking-[2.7px] text-[#c9a875]/65">
            Secure payment
          </p>

          <p className="mt-2 text-[10px] text-[#e5d4cc]/30">
            Complete your payment through Razorpay
          </p>
        </div>

        <CreditCard
          size={16}
          strokeWidth={1}
          className="text-[#c9a875]/45"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {showAdvance && (
          <PayButton
            onClick={() => pay(item, "advance", sourceType)}
            disabled={Boolean(payingKey)}
            busy={payingKey === `${item._id}:advance`}
            label={`Pay advance ${formatAmount(advanceAmount)}`}
            primary
          />
        )}

        {due > 0 && (
          <PayButton
            onClick={() => pay(item, "balance", sourceType)}
            disabled={Boolean(payingKey)}
            busy={payingKey === `${item._id}:balance`}
            label={`${balanceLabel} ${formatAmount(due)}`}
            primary={!showAdvance}
          />
        )}
      </div>

      <p className="mt-4 text-[8px] leading-[1.7] text-[#e5d4cc]/20">
        Payments are securely processed through Razorpay. Do not refresh or
        close the payment window while the transaction is processing.
      </p>
    </div>
  )
}

function PaymentStatus({ due }) {
  return (
    <div className="mt-9 flex items-center gap-3 border-t border-white/[0.07] pt-7">
      {due === 0 ? (
        <>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.04]">
            <CheckCircle2
              size={15}
              strokeWidth={1.2}
              className="text-emerald-300"
            />
          </div>

          <div>
            <p className="text-[8px] uppercase tracking-[2px] text-emerald-300/70">
              Payment complete
            </p>

            <p className="mt-1 text-[10px] text-[#e5d4cc]/35">
              This booking has been fully paid.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c9a875]/15 bg-[#c9a875]/[0.03]">
            <Clock3
              size={15}
              strokeWidth={1.2}
              className="text-[#c9a875]"
            />
          </div>

          <div>
            <p className="text-[8px] uppercase tracking-[2px] text-[#c9a875]/70">
              Payment unavailable
            </p>

            <p className="mt-1 text-[10px] text-[#e5d4cc]/35">
              Payment is currently not available for this item.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function PayButton({ onClick, disabled, busy, label, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex min-h-[48px] flex-1 items-center justify-center overflow-hidden px-6 py-3 text-[9px] uppercase tracking-[1.8px] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "border border-[#c9a875]/45 bg-[#c9a875]/[0.035] text-[#c9a875] hover:border-[#c9a875]/70 hover:bg-[#c9a875]/[0.08]"
          : "border border-white/[0.12] text-[#e5d4cc]/65 hover:border-white/[0.25] hover:text-[#e5d4cc]"
      }`}
    >
      <span className="relative z-10">
        {busy ? "Opening payment..." : label}
      </span>

      {primary && !disabled && (
        <span className="absolute bottom-0 left-0 h-px w-0 bg-[#c9a875] transition-all duration-500 group-hover:w-full" />
      )}
    </button>
  )
}

function CameraIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M14.5 5h-5l-1.2 2H5.5A2.5 2.5 0 0 0 3 9.5v8A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-8A2.5 2.5 0 0 0 18.5 7h-2.8l-1.2-2Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  )
}

export default MyBookings

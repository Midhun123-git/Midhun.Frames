import React, {
  useEffect,
  useMemo,
  useState,
} from "react"

import api from "../api/api.js"

import {
  Search,
  X,
  Trash2,
  Eye,
  Wallet,
  IndianRupee,
  CalendarDays,
  User,
  Mail,
  Phone,
  Briefcase,
  CreditCard,
  ShieldCheck,
} from "lucide-react"

const getAuthConfig = () => {
  const adminToken =
    localStorage.getItem("adminToken")

  return {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
}

// ==========================================
// RAZORPAY SCRIPT
// ==========================================

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script =
      document.createElement("script")

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js"

    script.onload = () => resolve(true)

    script.onerror = () => resolve(false)

    document.body.appendChild(script)
  })
}

// ==========================================
// EMPTY FORM
// ==========================================

const emptyForm = {
  sourceType: "Booking",
  sourceId: "",
  clientName: "",
  email: "",
  phone: "",
  amount: "",
  paymentType: "Advance",
  notes: "",
}

// ==========================================
// MAIN
// ==========================================

const Payments = () => {
  const [payments, setPayments] = useState([])

  const [search, setSearch] = useState("")

  const [sourceFilter, setSourceFilter] =
    useState("All")

  const [showModal, setShowModal] =
    useState(false)

  const [showDetails, setShowDetails] =
    useState(false)

  const [selectedPayment, setSelectedPayment] =
    useState(null)

  const [formData, setFormData] =
    useState(emptyForm)

  const [loading, setLoading] =
    useState(true)

  const [processing, setProcessing] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState(null)

  // ==========================================
  // FETCH
  // ==========================================

  const fetchPayments = async () => {
    try {
      setLoading(true)

      const response =
        await api.get(
          "/payments",
          getAuthConfig()
        )

      if (response.data.success) {
        setPayments(
          response.data.payments || []
        )
      }
    } catch (error) {
      console.error(
        "Fetch payments error:",
        error
      )

      alert(
        error.response?.data?.message ||
          "Failed to fetch payments."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  // ==========================================
  // FILTER
  // ==========================================

  const filteredPayments = useMemo(() => {
    const searchText =
      search.toLowerCase().trim()

    return payments.filter((payment) => {
      const matchesSearch =
        payment.clientName
          ?.toLowerCase()
          .includes(searchText) ||
        payment.email
          ?.toLowerCase()
          .includes(searchText) ||
        payment.transactionId
          ?.toLowerCase()
          .includes(searchText) ||
        payment.razorpayPaymentId
          ?.toLowerCase()
          .includes(searchText)

      const matchesSource =
        sourceFilter === "All" ||
        (sourceFilter === "Photography" &&
          payment.sourceType === "Booking") ||
        (sourceFilter === "Web Development" &&
          payment.sourceType === "Enquiry")

      return (
        matchesSearch &&
        matchesSource
      )
    })
  }, [
    payments,
    search,
    sourceFilter,
  ])

  // ==========================================
  // STATS
  // ==========================================

  const paidPayments = payments.filter(
    (payment) =>
      payment.status === "Paid"
  )

  const pendingPayments = payments.filter(
    (payment) =>
      payment.status === "Pending" ||
      payment.status === "Created"
  )

  const totalReceived =
    paidPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    )

  const totalPending =
    pendingPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    )

  // ==========================================
  // FORM
  // ==========================================

  const resetForm = () => {
    setFormData(emptyForm)
  }

  const openPaymentModal = () => {
    resetForm()
    setShowModal(true)
  }

  const closeModal = () => {
    if (processing) return

    setShowModal(false)
    resetForm()
  }

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // ==========================================
  // START RAZORPAY PAYMENT
  // ==========================================

  const startPayment = async (e) => {
    e.preventDefault()

    if (!formData.sourceId.trim()) {
      alert(
        `Please enter the ${
          formData.sourceType ===
          "Booking"
            ? "Booking"
            : "Enquiry"
        } ID.`
      )

      return
    }

    if (!formData.clientName.trim()) {
      alert("Client name is required.")
      return
    }

    const amount =
      Number(formData.amount)

    if (!amount || amount <= 0) {
      alert(
        "Please enter a valid amount."
      )

      return
    }

    try {
      setProcessing(true)

      const loaded =
        await loadRazorpayScript()

      if (!loaded) {
        alert(
          "Razorpay could not be loaded."
        )

        return
      }

      const orderResponse =
        await api.post(
          "/payments/create-order",
          {
            sourceType:
              formData.sourceType,

            sourceId:
              formData.sourceId.trim(),

            clientName:
              formData.clientName.trim(),

            email:
              formData.email.trim(),

            phone:
              formData.phone.trim(),

            amount,

            paymentType:
              formData.paymentType,

            notes:
              formData.notes.trim(),
          },
          getAuthConfig()
        )

      if (
        !orderResponse.data.success
      ) {
        throw new Error(
          orderResponse.data.message ||
            "Failed to create payment order."
        )
      }

      const {
        keyId,
        order,
        customer,
        payment,
        mode,
      } = orderResponse.data

      const options = {
        key: keyId,

        amount: order.amount,

        currency: order.currency,

        name: "Midhun Frames",

        description:
          `${payment.sourceType} - ${payment.paymentType}`,

        order_id: order.id,

        prefill: {
          name:
            customer.clientName,

          email:
            customer.email,

          contact:
            customer.phone,
        },

        notes: {
          sourceType:
            payment.sourceType,

          sourceId:
            payment.sourceId,
        },

        theme: {
          color: "#c8a96b",
        },

        handler: async (
          razorpayResponse
        ) => {
          try {
            const verifyResponse =
              await api.post(
                "/payments/verify",
                {
                  razorpay_order_id:
                    razorpayResponse.razorpay_order_id,

                  razorpay_payment_id:
                    razorpayResponse.razorpay_payment_id,

                  razorpay_signature:
                    razorpayResponse.razorpay_signature,

                  sourceType:
                    payment.sourceType,

                  sourceId:
                    payment.sourceId,

                  clientName:
                    customer.clientName,

                  email:
                    customer.email,

                  phone:
                    customer.phone,

                  amount:
                    payment.amount,

                  paymentType:
                    payment.paymentType,

                  notes:
                    payment.notes,
                },
                getAuthConfig()
              )

            if (
              verifyResponse.data.success
            ) {
              alert(
                "Payment verified successfully."
              )

              setShowModal(false)

              resetForm()

              await fetchPayments()
            }
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            )

            alert(
              error.response?.data?.message ||
                "Payment verification failed."
            )
          }
        },

        modal: {
          ondismiss: () => {
            setProcessing(false)
          },
        },
      }

      console.log(
        `Razorpay ${mode} mode`
      )

      const razorpay =
        new window.Razorpay(options)

      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay payment failed:",
            response
          )

          alert(
            response.error?.description ||
              "Payment failed."
          )

          setProcessing(false)
        }
      )

      razorpay.open()

      setProcessing(false)
    } catch (error) {
      console.error(
        "Start payment error:",
        error
      )

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to start payment."
      )

      setProcessing(false)
    }
  }

  // ==========================================
  // DELETE
  // ==========================================

  const deletePayment = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this payment?"
      )

    if (!confirmed) return

    try {
      setDeletingId(id)

      const response =
        await api.delete(
          `/payments/${id}`,
          getAuthConfig()
        )

      if (response.data.success) {
        setPayments((prev) =>
          prev.filter(
            (payment) =>
              payment._id !== id
          )
        )

        if (
          selectedPayment?._id === id
        ) {
          setSelectedPayment(null)
          setShowDetails(false)
        }

        alert(
          "Payment deleted successfully."
        )
      }
    } catch (error) {
      console.error(
        "Delete payment error:",
        error
      )

      alert(
        error.response?.data?.message ||
          "Failed to delete payment."
      )
    } finally {
      setDeletingId(null)
    }
  }

  // ==========================================
  // DETAILS
  // ==========================================

  const openDetails = async (
    payment
  ) => {
    try {
      const response =
        await api.get(
          `/payments/${payment._id}`,
          getAuthConfig()
        )

      if (response.data.success) {
        setSelectedPayment(
          response.data.payment
        )

        setShowDetails(true)
      }
    } catch (error) {
      console.error(
        "Fetch payment details error:",
        error
      )

      alert(
        error.response?.data?.message ||
          "Failed to fetch payment details."
      )
    }
  }

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedPayment(null)
  }

  // ==========================================
  // HELPERS
  // ==========================================

  const formatAmount = (amount) => {
    return `â‚¹${Number(
      amount || 0
    ).toLocaleString("en-IN")}`
  }

  const formatDate = (date) => {
    if (!date) return "â€”"

    const parsedDate =
      new Date(date)

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "â€”"
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    )
  }

  const sourceClass = (
    sourceType
  ) => {
    if (
      sourceType === "Enquiry"
    ) {
      return "border-blue-500/20 bg-blue-500/10 text-blue-400"
    }

    return "border-[#c8a96b]/20 bg-[#c8a96b]/10 text-[#c8a96b]"
  }

  const statusClass = (
    status
  ) => {
    if (status === "Paid") {
      return "border-green-500/20 bg-green-500/10 text-green-400"
    }

    if (
      status === "Failed"
    ) {
      return "border-red-500/20 bg-red-500/10 text-red-400"
    }

    if (
      status === "Refunded"
    ) {
      return "border-purple-500/20 bg-purple-500/10 text-purple-400"
    }

    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
  }

  return (
    <div className="min-h-screen text-white">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c8a96b]">
            Business Finance
          </p>

          <h1 className="mt-2 font-serif text-3xl">
            Payments
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
            Track verified client payments
            received through Razorpay.
          </p>
        </div>

        <button
          onClick={openPaymentModal}
          className="inline-flex items-center justify-center gap-2 border border-[#c8a96b]/50 bg-[#c8a96b] px-5 py-3 text-xs font-medium text-black transition hover:bg-[#d8ba7a]"
        >
          <CreditCard size={15} />

          Collect Payment
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Payments"
          value={payments.length}
          icon={<Wallet size={17} />}
        />

        <StatCard
          label="Received"
          value={formatAmount(
            totalReceived
          )}
          icon={
            <IndianRupee size={17} />
          }
        />

        <StatCard
          label="Pending"
          value={formatAmount(
            totalPending
          )}
          icon={
            <CalendarDays size={17} />
          }
        />

        <StatCard
          label="Verified"
          value={paidPayments.length}
          icon={
            <ShieldCheck size={17} />
          }
        />
      </div>

      <div className="mt-8">
        <div className="relative max-w-xl">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search client or transaction..."
            className="w-full border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c8a96b]/40"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "All",
            "Photography",
            "Web Development",
          ].map((source) => (
            <button
              key={source}
              onClick={() =>
                setSourceFilter(source)
              }
              className={`border px-4 py-2 text-xs transition ${
                sourceFilter === source
                  ? "border-[#c8a96b] bg-[#c8a96b] text-black"
                  : "border-white/10 text-white/45 hover:border-white/25 hover:text-white"
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 border border-white/10 bg-white/[0.02] px-5 py-16 text-center text-sm text-white/30">
          Loading payments...
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden border border-white/10 bg-white/[0.02] lg:block">
            <div className="grid grid-cols-[1.2fr_0.9fr_1fr_0.8fr_0.9fr_120px] border-b border-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-white/30">
              <span>Client</span>
              <span>Source</span>
              <span>Payment</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {filteredPayments.length ===
            0 ? (
              <div className="px-5 py-16 text-center text-sm text-white/30">
                No payments found.
              </div>
            ) : (
              filteredPayments.map(
                (payment) => (
                  <div
                    key={payment._id}
                    className="grid grid-cols-[1.2fr_0.9fr_1fr_0.8fr_0.9fr_120px] items-center border-b border-white/5 px-5 py-5 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm text-white">
                        {
                          payment.clientName
                        }
                      </p>

                      {payment.email && (
                        <p className="mt-1 text-xs text-white/30">
                          {payment.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <span
                        className={`inline-flex border px-2.5 py-1 text-[9px] ${sourceClass(
                          payment.sourceType
                        )}`}
                      >
                        {payment.sourceType ===
                        "Booking"
                          ? "Photography"
                          : "Web Development"}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-white/60">
                        {
                          payment.paymentType
                        }
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {
                          payment.paymentMethod
                        }
                      </p>
                    </div>

                    <p className="text-sm text-white">
                      {formatAmount(
                        payment.amount
                      )}
                    </p>

                    <div>
                      <span
                        className={`inline-flex border px-2.5 py-1 text-[9px] ${statusClass(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          openDetails(
                            payment
                          )
                        }
                        title="View"
                        className="p-2 text-white/40 transition hover:text-white"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() =>
                          deletePayment(
                            payment._id
                          )
                        }
                        disabled={
                          deletingId ===
                          payment._id
                        }
                        title="Delete"
                        className="p-2 text-white/40 transition hover:text-red-400 disabled:opacity-30"
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </div>

          <div className="mt-6 space-y-4 lg:hidden">
            {filteredPayments.length ===
            0 ? (
              <div className="border border-white/10 px-5 py-12 text-center text-sm text-white/30">
                No payments found.
              </div>
            ) : (
              filteredPayments.map(
                (payment) => (
                  <div
                    key={payment._id}
                    className="border border-white/10 bg-white/[0.02] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-white">
                          {
                            payment.clientName
                          }
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          {
                            payment.paymentType
                          }
                        </p>
                      </div>

                      <span
                        className={`border px-2.5 py-1 text-[10px] ${statusClass(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3 text-xs text-white/50">
                      <div className="flex items-center gap-3">
                        <Briefcase
                          size={15}
                        />

                        {payment.sourceType ===
                        "Booking"
                          ? "Photography"
                          : "Web Development"}
                      </div>

                      <div className="flex items-center gap-3">
                        <IndianRupee
                          size={15}
                        />

                        {formatAmount(
                          payment.amount
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Wallet
                          size={15}
                        />

                        {
                          payment.paymentMethod
                        }
                      </div>

                      <div className="flex items-center gap-3">
                        <CalendarDays
                          size={15}
                        />

                        {formatDate(
                          payment.paymentDate
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
                      <button
                        onClick={() =>
                          openDetails(
                            payment
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 border border-white/10 py-2.5 text-xs text-white/60 hover:text-white"
                      >
                        <Eye size={14} />

                        View
                      </button>

                      <button
                        onClick={() =>
                          deletePayment(
                            payment._id
                          )
                        }
                        disabled={
                          deletingId ===
                          payment._id
                        }
                        className="flex items-center justify-center border border-white/10 px-4 text-white/40 hover:text-red-400"
                      >
                        <Trash2
                          size={14}
                        />
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#0b0b0b]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                  Razorpay Checkout
                </p>

                <h2 className="mt-1 font-serif text-xl text-white">
                  Collect Client Payment
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Payment will be verified by
                  the backend before it is
                  saved.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={processing}
                className="text-white/40 hover:text-white disabled:opacity-30"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={startPayment}
              className="p-6"
            >
              <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                Payment Source
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <Select
                  label="Business Area"
                  name="sourceType"
                  value={
                    formData.sourceType
                  }
                  onChange={handleChange}
                  options={[
                    "Booking",
                    "Enquiry",
                  ]}
                />

                <Input
                  label={
                    formData.sourceType ===
                    "Booking"
                      ? "Booking ID"
                      : "Enquiry ID"
                  }
                  name="sourceId"
                  value={
                    formData.sourceId
                  }
                  onChange={handleChange}
                  placeholder="MongoDB ObjectId"
                  required
                />
              </div>

              <p className="mb-4 mt-8 text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                Client Information
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Client Name"
                  name="clientName"
                  value={
                    formData.clientName
                  }
                  onChange={handleChange}
                  placeholder="Client name"
                  required
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="client@example.com"
                />

                <Input
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
              </div>

              <p className="mb-4 mt-8 text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                Payment Information
              </p>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  min="1"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="10000"
                  required
                />

                <Select
                  label="Payment Type"
                  name="paymentType"
                  value={
                    formData.paymentType
                  }
                  onChange={handleChange}
                  options={[
                    "Advance",
                    "Partial Payment",
                    "Final Payment",
                    "Full Payment",
                    "Other",
                  ]}
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Payment notes..."
                  className="w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#c8a96b]/40"
                />
              </div>

              <div className="mt-5 flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/5 p-4">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 text-yellow-400"
                />

                <div>
                  <p className="text-xs text-yellow-400">
                    Razorpay Test Mode
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    This uses Razorpay's test
                    environment. No real money
                    will be charged.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={processing}
                  className="border border-white/10 px-5 py-2.5 text-xs text-white/50 hover:text-white disabled:opacity-30"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center gap-2 bg-[#c8a96b] px-5 py-2.5 text-xs font-medium text-black hover:bg-[#d8ba7a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CreditCard size={14} />

                  {processing
                    ? "Processing..."
                    : "Pay with Razorpay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails &&
        selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#0b0b0b]">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                    Payment Details
                  </p>

                  <h2 className="mt-1 font-serif text-xl">
                    {
                      selectedPayment.clientName
                    }
                  </h2>
                </div>

                <button
                  onClick={closeDetails}
                  className="text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <p className="font-serif text-2xl">
                    {formatAmount(
                      selectedPayment.amount
                    )}
                  </p>

                  <span
                    className={`border px-2.5 py-1 text-[10px] ${statusClass(
                      selectedPayment.status
                    )}`}
                  >
                    {
                      selectedPayment.status
                    }
                  </span>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Detail
                    icon={
                      <User size={15} />
                    }
                    label="Client"
                    value={
                      selectedPayment.clientName ||
                      "â€”"
                    }
                  />

                  <Detail
                    icon={
                      <Mail size={15} />
                    }
                    label="Email"
                    value={
                      selectedPayment.email ||
                      "â€”"
                    }
                  />

                  <Detail
                    icon={
                      <Phone size={15} />
                    }
                    label="Phone"
                    value={
                      selectedPayment.phone ||
                      "â€”"
                    }
                  />

                  <Detail
                    icon={
                      <Briefcase size={15} />
                    }
                    label="Payment Type"
                    value={
                      selectedPayment.paymentType ||
                      "â€”"
                    }
                  />

                  <Detail
                    icon={
                      <Wallet size={15} />
                    }
                    label="Method"
                    value={
                      selectedPayment.paymentMethod ||
                      "â€”"
                    }
                  />

                  <Detail
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Payment Date"
                    value={formatDate(
                      selectedPayment.paymentDate
                    )}
                  />

                  <Detail
                    icon={
                      <IndianRupee
                        size={15}
                      />
                    }
                    label="Amount"
                    value={formatAmount(
                      selectedPayment.amount
                    )}
                  />

                  <Detail
                    icon={
                      <Briefcase size={15} />
                    }
                    label={
                      selectedPayment.sourceType ===
                      "Booking"
                        ? "Booking ID"
                        : "Enquiry ID"
                    }
                    value={
                      selectedPayment.sourceId ||
                      "â€”"
                    }
                  />
                </div>

                {selectedPayment.razorpayPaymentId && (
                  <div className="mt-6">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                      Razorpay Payment ID
                    </p>

                    <p className="break-all text-sm text-white/60">
                      {
                        selectedPayment.razorpayPaymentId
                      }
                    </p>
                  </div>
                )}

                {selectedPayment.razorpayOrderId && (
                  <div className="mt-5">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                      Razorpay Order ID
                    </p>

                    <p className="break-all text-sm text-white/60">
                      {
                        selectedPayment.razorpayOrderId
                      }
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                    Notes
                  </p>

                  <p className="text-sm leading-6 text-white/50">
                    {selectedPayment.notes ||
                      "No notes added."}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 px-6 py-4 text-right">
                <button
                  onClick={closeDetails}
                  className="border border-white/10 px-5 py-2.5 text-xs text-white/50 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

const StatCard = ({
  label,
  value,
  icon,
}) => {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
          {label}
        </p>

        <span className="text-[#c8a96b]">
          {icon}
        </span>
      </div>

      <p className="mt-4 font-serif text-2xl text-white">
        {value}
      </p>
    </div>
  )
}

const Input = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  min,
}) => {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#c8a96b]/40"
      />
    </div>
  )
}

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
}) => {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-white outline-none focus:border-[#c8a96b]/40"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

const Detail = ({
  icon,
  label,
  value,
}) => {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
        {icon}
        {label}
      </div>

      <p className="break-words text-sm text-white/70">
        {value}
      </p>
    </div>
  )
}

export default Payments

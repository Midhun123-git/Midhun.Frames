const mongoose = require("mongoose")
const crypto = require("crypto")
const Razorpay = require("razorpay")

const Payment = require("../models/Payment")
const Booking = require("../models/Booking")
const Enquiry = require("../models/Enquiry")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ==========================================
// HELPERS
// ==========================================

const fail = (status, message) => {
  const error = new Error(message)
  error.status = status
  return error
}

const handleError = (res, error, fallbackMessage) => {
  console.error(error)

  return res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  })
}

const isCancelled = (booking) => booking?.status === "Cancelled"

const normalize = (value) => String(value || "").trim().toLowerCase()

// Constant-time string compare (stops timing attacks on signature)
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))

  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

const hmac = (secret, data) =>
  crypto.createHmac("sha256", secret).update(data).digest("hex")

const verifySignature = (orderId, paymentId, signature) => {
  const expected = hmac(
    process.env.RAZORPAY_KEY_SECRET,
    `${orderId}|${paymentId}`
  )

  return safeEqual(expected, signature || "")
}

// Razorpay receipt max length is 40 chars.
const makeReceipt = (booking) =>
  `bk_${booking._id}_${Date.now().toString(36)}`

const userOwnsBooking = (user, booking) => {
  const userId = String(user._id)
  const bookingUserId = booking.userId ? String(booking.userId) : ""

  const userEmail = normalize(user.email)
  const bookingEmail = normalize(booking.email)

  const userPhone = String(user.phone || "").trim()
  const bookingPhone = String(booking.phone || "").trim()

  return (
    bookingUserId === userId ||
    Boolean(bookingEmail && userEmail && bookingEmail === userEmail) ||
    Boolean(bookingPhone && userPhone && bookingPhone === userPhone)
  )
}

const getPaidTotal = async (sourceType, sourceId) => {
  const paidPayments = await Payment.find({
    sourceType,
    sourceId,
    status: "Paid",
  })

  return paidPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  )
}

const summarizeBooking = async (booking) => {
  const total = Math.max(
    Number(booking.totalAmount ?? booking.amount ?? 0),
    0
  )

  const recordedAdvance = Math.max(
    Number(booking.advanceAmount ?? booking.advance ?? 0),
    0
  )

  const paymentRecordsPaid = Math.max(
    Number(await getPaidTotal("Booking", booking._id)),
    0
  )

  const existingPaidFromBooking = Math.max(
    Number(booking.paidAmount || 0),
    0
  )

  // Money recorded on the booking by admin (advance / paidAmount).
  // Treated as already received offline.
  const offlinePaid = Math.max(recordedAdvance, existingPaidFromBooking)

  // Offline money + online Razorpay payments. Capped at total.
  const paid = Math.min(Math.max(offlinePaid + paymentRecordsPaid, 0), total)

  const due = Math.max(total - paid, 0)
  const advanceAmount = Math.min(recordedAdvance, paid)

  return { total, paid, due, advanceAmount }
}

// Recompute totals after a payment turns Paid.
// Works for Booking and for web-dev Enquiry (same id lookup).
const refreshBooking = async (bookingId) => {
  const booking = await Booking.findById(bookingId)

  if (!booking) {
    const enquiry = await Enquiry.findById(bookingId)

    if (!enquiry) return null

    // Enquiry totals are computed on read. Nothing to save.
    const enquirySummary = await summarizeEnquiry(enquiry)

    return { booking: enquiry, summary: enquirySummary }
  }

  const summary = await summarizeBooking(booking)

  booking.balanceAmount = summary.due

  if (summary.due <= 0) {
    booking.status = "Confirmed"
  }

  await booking.save()

  return { booking, summary }
}

// Atomic: only the FIRST caller (verify OR webhook) flips Created -> Paid.
// Second caller gets null, so money never counted twice.
const markPaid = async ({ orderId, paymentId, signature }) => {
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: orderId, status: { $ne: "Paid" } },
    {
      status: "Paid",
      razorpayPaymentId: paymentId,
      razorpaySignature: signature || "",
      transactionId: paymentId,
      paymentDate: new Date(),
    },
    { new: true }
  )

  if (!payment) return null

  await refreshBooking(payment.sourceId)

  return payment
}

// Shared by admin + user order creation.
// Amount is decided HERE on server. Browser never picks it.
// "booking" param = the source document (Booking or Enquiry).
const createOrderForBooking = async ({
  booking,
  payableAmount,
  paymentType,
  user,
  notes,
  sourceType = "Booking",
  clientName,
}) => {
  const order = await razorpay.orders.create({
    amount: Math.round(payableAmount * 100),
    currency: "INR",
    receipt: makeReceipt(booking),
    notes: {
      bookingId: String(booking._id),
      sourceType,
      ...notes,
    },
  })

  await Payment.create({
    sourceType,
    sourceId: booking._id,
    user: user?._id || null,
    clientName: clientName || booking.clientName || "Client",
    email: booking.email || "",
    phone: booking.phone || "",
    amount: payableAmount,
    currency: "INR",
    paymentType,
    paymentMethod: "Razorpay",
    status: "Created",
    razorpayOrderId: order.id,
  })

  return order
}

const pickPaymentType = (option, summary) => {
  if (option === "advance" && summary.paid <= 0) return "Advance"
  if (summary.paid > 0) return "Final Payment"
  return "Full Payment"
}

// ==========================================
// ADMIN: LIST / GET / DELETE
// ==========================================

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    })
  } catch (error) {
    return handleError(res, error, "Failed to load payments.")
  }
}

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)

    if (!payment) throw fail(404, "Payment not found.")

    return res.status(200).json({ success: true, payment })
  } catch (error) {
    return handleError(res, error, "Failed to load payment.")
  }
}

const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id)

    if (!payment) throw fail(404, "Payment not found.")

    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully.",
    })
  } catch (error) {
    return handleError(res, error, "Failed to delete payment.")
  }
}

// ==========================================
// ADMIN: CREATE ORDER / VERIFY
// ==========================================

const createOrder = async (req, res) => {
  try {
    const { bookingId, amount } = req.body

    if (!bookingId) throw fail(400, "Booking ID is required.")

    const booking = await Booking.findById(bookingId)

    if (!booking) throw fail(404, "Booking not found.")

    if (isCancelled(booking)) {
      throw fail(400, "Cancelled bookings cannot be paid.")
    }

    const summary = await summarizeBooking(booking)

    let payableAmount = Number(amount || 0)

    if (payableAmount <= 0) payableAmount = summary.due

    if (payableAmount <= 0) {
      throw fail(400, "No amount is due for this booking.")
    }

    if (payableAmount > summary.due) payableAmount = summary.due

    const order = await createOrderForBooking({
      booking,
      payableAmount,
      paymentType: pickPaymentType(null, summary),
      user: null,
      notes: { createdBy: "admin" },
    })

    return res.status(200).json({
      success: true,
      order,
      amount: payableAmount,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    return handleError(res, error, "Failed to create payment order.")
  }
}

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw fail(400, "Payment verification details are incomplete.")
    }

    if (
      !verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )
    ) {
      throw fail(400, "Invalid payment signature.")
    }

    const existing = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    })

    if (!existing) throw fail(404, "Payment order not found.")

    if (bookingId && String(existing.sourceId) !== String(bookingId)) {
      throw fail(400, "Order does not match booking.")
    }

    const payment = await markPaid({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })

    if (!payment) {
      return res.status(200).json({
        success: true,
        message: "Payment has already been verified.",
      })
    }

    const result = await refreshBooking(payment.sourceId)

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      payment,
      booking: result && {
        _id: result.booking._id,
        total: result.summary.total,
        paid: result.summary.paid,
        due: result.summary.due,
        status: result.booking.status,
      },
    })
  } catch (error) {
    return handleError(res, error, "Payment verification failed.")
  }
}

// ==========================================
// USER: MY BOOKINGS
// ==========================================

const getMyBookings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      throw fail(401, "User authentication is required.")
    }

    const userId = new mongoose.Types.ObjectId(String(req.user._id))
    const userEmail = normalize(req.user.email)
    const userPhone = String(req.user.phone || "").trim()

    const bookingConditions = [{ userId }]

    if (userEmail) {
      bookingConditions.push({
        email: new RegExp(
          `^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      })
    }

    if (userPhone) bookingConditions.push({ phone: userPhone })

    const bookings = await Booking.find({ $or: bookingConditions }).sort({
      eventDate: -1,
    })

    const uniqueBookings = Array.from(
      new Map(bookings.map((b) => [String(b._id), b])).values()
    )

    for (const booking of uniqueBookings) {
      if (
        !booking.userId &&
        ((userEmail && normalize(booking.email) === userEmail) ||
          (userPhone && String(booking.phone || "").trim() === userPhone))
      ) {
        booking.userId = userId
        await booking.save()
      }
    }

    const photographyBookings = await Promise.all(
      uniqueBookings.map(async (booking) => {
        const summary = await summarizeBooking(booking)

        return {
          _id: booking._id,
          clientName: booking.clientName || "",
          phone: booking.phone || "",
          email: booking.email || "",
          eventType: booking.eventType || "",
          eventDate: booking.eventDate || null,
          location: booking.location || "",
          packageName: booking.package || booking.packageName || "",
          status: booking.status || "Pending",
          total: summary.total,
          paid: summary.paid,
          due: summary.due,
          advanceAmount: summary.advanceAmount,
          canPay: summary.due > 0 && !isCancelled(booking),
        }
      })
    )

    const enquiryConditions = [{ userId }]

    if (userEmail) enquiryConditions.push({ email: userEmail })
    if (userPhone) enquiryConditions.push({ phone: userPhone })

    const enquiries = await Enquiry.find({ $or: enquiryConditions }).sort({
      createdAt: -1,
    })

    const uniqueEnquiries = Array.from(
      new Map(enquiries.map((e) => [String(e._id), e])).values()
    )

    for (const enquiry of uniqueEnquiries) {
      if (
        !enquiry.userId &&
        ((userEmail && normalize(enquiry.email) === userEmail) ||
          (userPhone && String(enquiry.phone || "").trim() === userPhone))
      ) {
        enquiry.userId = userId
        await enquiry.save()
      }
    }

    const webDesignEnquiries = await Promise.all(
      uniqueEnquiries.map(async (enquiry) => {
        const summary = await summarizeEnquiry(enquiry)

        return {
          _id: enquiry._id,
          userId: enquiry.userId || null,
          firstName: enquiry.firstName || "",
          lastName: enquiry.lastName || "",
          email: enquiry.email || "",
          phone: enquiry.phone || "",
          project: enquiry.project || "",
          message: enquiry.message || "",
          status: enquiry.status || "New",
          createdAt: enquiry.createdAt || null,
          updatedAt: enquiry.updatedAt || null,
          total: summary.total,
          paid: summary.paid,
          due: summary.due,
          advanceAmount: summary.advanceAmount,
          canPay:
            summary.total > 0 &&
            summary.due > 0 &&
            !isEnquiryClosed(enquiry),
        }
      })
    )

    return res.status(200).json({
      success: true,
      count: photographyBookings.length + webDesignEnquiries.length,
      photographyCount: photographyBookings.length,
      webDesignCount: webDesignEnquiries.length,
      photographyBookings,
      webDesignEnquiries,
    })
  } catch (error) {
    return handleError(res, error, "Failed to load your bookings.")
  }
}

// ==========================================
// USER: CREATE ORDER / VERIFY
// ==========================================

// ----- Web development enquiry payments -----

const isEnquiryClosed = (enquiry) =>
  /cancel|reject|declin|lost|closed/i.test(String(enquiry?.status || ""))

// Enquiry fields (set by admin):
//   totalAmount   = quoted project price
//   advanceAmount = advance customer should pay first
//   paidAmount    = money already received offline (optional)
const summarizeEnquiry = async (enquiry) => {
  const total = Math.max(Number(enquiry.totalAmount || 0), 0)
  const offlinePaid = Math.max(Number(enquiry.paidAmount || 0), 0)
  const onlinePaid = Math.max(
    Number(await getPaidTotal("Enquiry", enquiry._id)),
    0
  )

  const paid = Math.min(offlinePaid + onlinePaid, total)
  const due = Math.max(total - paid, 0)
  const advanceAmount = Math.max(Number(enquiry.advanceAmount || 0), 0)

  return { total, paid, due, advanceAmount }
}

const createEnquiryOrder = async (req, res) => {
  try {
    const { bookingId, option } = req.body

    if (!bookingId) throw fail(400, "Enquiry ID is required.")

    const enquiry = await Enquiry.findById(bookingId)

    if (!enquiry) throw fail(404, "Enquiry not found.")

    // Enquiry has userId / email / phone, same as booking.
    if (!userOwnsBooking(req.user, enquiry)) {
      throw fail(403, "You are not allowed to pay for this project.")
    }

    if (isEnquiryClosed(enquiry)) {
      throw fail(400, "This project cannot be paid.")
    }

    const summary = await summarizeEnquiry(enquiry)

    if (summary.total <= 0) {
      throw fail(400, "Project quote is not ready yet.")
    }

    const useAdvance =
      option === "advance" && summary.paid <= 0 && summary.advanceAmount > 0

    let payableAmount = useAdvance ? summary.advanceAmount : summary.due

    if (payableAmount <= 0) throw fail(400, "No payment is currently due.")

    if (payableAmount > summary.due) payableAmount = summary.due

    const paymentType = useAdvance
      ? "Advance"
      : summary.paid > 0
      ? "Final Payment"
      : "Full Payment"

    const clientName =
      `${enquiry.firstName || ""} ${enquiry.lastName || ""}`.trim() ||
      "Client"

    const order = await createOrderForBooking({
      booking: enquiry,
      sourceType: "Enquiry",
      clientName,
      payableAmount,
      paymentType,
      user: req.user,
      notes: { userId: String(req.user._id), option: option || "balance" },
    })

    return res.status(200).json({
      success: true,
      order,
      amount: payableAmount,
      key: process.env.RAZORPAY_KEY_ID,
      customer: {
        clientName,
        email: enquiry.email || "",
        phone: enquiry.phone || "",
      },
      payment: { paymentType },
    })
  } catch (error) {
    return handleError(res, error, "Failed to create payment order.")
  }
}

const createUserOrder = async (req, res) => {
  if (req.body?.sourceType === "Enquiry") {
    if (!req.user || !req.user._id) {
      return handleError(
        res,
        fail(401, "User authentication is required."),
        "Failed to create payment order."
      )
    }

    return createEnquiryOrder(req, res)
  }

  try {
    if (!req.user || !req.user._id) {
      throw fail(401, "User authentication is required.")
    }

    const { bookingId, option } = req.body

    if (!bookingId) throw fail(400, "Booking ID is required.")

    const booking = await Booking.findById(bookingId)

    if (!booking) throw fail(404, "Booking not found.")

    if (!userOwnsBooking(req.user, booking)) {
      throw fail(403, "You are not allowed to pay for this booking.")
    }

    if (isCancelled(booking)) {
      throw fail(400, "Cancelled bookings cannot be paid.")
    }

    const summary = await summarizeBooking(booking)

    let payableAmount = summary.due

    if (option === "advance" && summary.paid <= 0) {
      payableAmount =
        summary.advanceAmount > 0
          ? summary.advanceAmount
          : Math.min(summary.total, 5000)
    }

    if (option === "balance") payableAmount = summary.due

    if (payableAmount <= 0) throw fail(400, "No payment is currently due.")

    if (payableAmount > summary.due) payableAmount = summary.due

    const order = await createOrderForBooking({
      booking,
      payableAmount,
      paymentType: pickPaymentType(option, summary),
      user: req.user,
      notes: { userId: String(req.user._id), option: option || "balance" },
    })

    return res.status(200).json({
      success: true,
      order,
      amount: payableAmount,
      key: process.env.RAZORPAY_KEY_ID,
      customer: {
        clientName: booking.clientName || "",
        email: booking.email || "",
        phone: booking.phone || "",
      },
      payment: {
        paymentType: pickPaymentType(option, summary),
      },
    })
  } catch (error) {
    return handleError(res, error, "Failed to create payment order.")
  }
}

const verifyUserPayment = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      throw fail(401, "User authentication is required.")
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !bookingId
    ) {
      throw fail(400, "Payment verification details are incomplete.")
    }

    if (
      !verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )
    ) {
      throw fail(400, "Invalid payment signature.")
    }

    // Amount + owner come from DB row made at order time, NOT from browser.
    const existing = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    })

    if (!existing) throw fail(404, "Payment order not found.")

    if (String(existing.sourceId) !== String(bookingId)) {
      throw fail(400, "Order does not match booking.")
    }

    if (!existing.user || String(existing.user) !== String(req.user._id)) {
      throw fail(403, "You are not allowed to verify this payment.")
    }

    const payment = await markPaid({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })

    // null = webhook (or earlier call) already counted it. Still success.
    if (!payment) {
      return res.status(200).json({
        success: true,
        message: "Payment has already been verified.",
      })
    }

    const result = await refreshBooking(payment.sourceId)

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      payment,
      booking: result && {
        _id: result.booking._id,
        total: result.summary.total,
        paid: result.summary.paid,
        due: result.summary.due,
        status: result.booking.status,
      },
    })
  } catch (error) {
    return handleError(res, error, "Payment verification failed.")
  }
}

// ==========================================
// WEBHOOK (Razorpay -> your server)
// Mount in server.js BEFORE express.json():
//   app.post("/api/payments/webhook",
//     express.raw({ type: "application/json" }),
//     razorpayWebhook)
// ==========================================

const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"]

    if (!signature || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ success: false })
    }

    const expected = hmac(process.env.RAZORPAY_WEBHOOK_SECRET, req.body)

    if (!safeEqual(expected, signature)) {
      return res.status(400).json({ success: false })
    }

    const event = JSON.parse(req.body.toString())
    const entity = event?.payload?.payment?.entity

    if (event.event === "payment.captured" && entity) {
      await markPaid({
        orderId: entity.order_id,
        paymentId: entity.id,
        signature: "",
      })
    }

    if (event.event === "payment.failed" && entity) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id, status: { $ne: "Paid" } },
        { status: "Failed" }
      )
    }

    // Always 200 for valid signature so Razorpay stops retrying.
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return res.status(500).json({ success: false })
  }
}

module.exports = {
  getPayments,
  getPaymentById,
  deletePayment,
  createOrder,
  verifyPayment,
  getMyBookings,
  createUserOrder,
  verifyUserPayment,
  razorpayWebhook,
}
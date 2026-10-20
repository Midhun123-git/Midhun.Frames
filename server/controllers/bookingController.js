const Booking = require("../models/Booking")




const createBooking = async (req, res) => {
  try {
    const {
      clientName,
      phone,
      email,
      eventType,
      eventDate,
      location,
      package: bookingPackage,
      notes,
    } = req.body

    // Validate customer booking details.
    // Price and advance are set later by Admin.
    if (
      !clientName?.trim() ||
      !phone?.trim() ||
      !eventType?.trim() ||
      !eventDate ||
      !location?.trim() ||
      !bookingPackage?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details",
      })
    }

    const normalizedEmail = email
      ? email.toLowerCase().trim()
      : ""

    // Customer requests must not set prices or booking status.
    const booking = await Booking.create({
      userId: req.user?._id || null,
      clientName: clientName.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      eventType: eventType.trim(),
      eventDate,
      location: location.trim(),
      package: bookingPackage.trim(),
      totalAmount: 0,
      advanceAmount: 0,
      status: "Pending",
      notes: notes?.trim() || "",
    })

    return res.status(201).json({
      success: true,
      message: "Photography booking request submitted successfully. Your quote will be provided after review.",
      booking,
    })
  } catch (error) {
    console.error("Create booking error:", error)

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    })
  }
}


const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({
      createdAt: -1,
    })

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    })
  } catch (error) {
    console.error("Get bookings error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    })
  }
}

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    res.status(200).json({
      success: true,
      booking,
    })
  } catch (error) {
    console.error("Get booking error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    })
  }
}

const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    const {
      clientName,
      phone,
      email,
      eventType,
      eventDate,
      location,
      package: bookingPackage,
      totalAmount,
      advanceAmount,
      status,
      notes,
    } = req.body

    const finalTotal =
      totalAmount !== undefined
        ? Number(totalAmount)
        : Number(booking.totalAmount)

    const finalAdvance =
      advanceAmount !== undefined
        ? Number(advanceAmount)
        : Number(booking.advanceAmount)

    if (finalTotal < 0 || finalAdvance < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount cannot be negative",
      })
    }

    if (finalAdvance > finalTotal) {
      return res.status(400).json({
        success: false,
        message: "Advance amount cannot be greater than total amount",
      })
    }

    if (clientName !== undefined) {
      booking.clientName = clientName.trim()
    }

    if (phone !== undefined) {
      booking.phone = phone.trim()
    }

    if (email !== undefined) {
      booking.email = email.toLowerCase().trim()
    }

    if (eventType !== undefined) {
      booking.eventType = eventType.trim()
    }

    if (eventDate !== undefined) {
      booking.eventDate = eventDate
    }

    if (location !== undefined) {
      booking.location = location.trim()
    }

    if (bookingPackage !== undefined) {
      booking.package = bookingPackage.trim()
    }

    booking.totalAmount = finalTotal
    booking.advanceAmount = finalAdvance

    if (status !== undefined) {
      booking.status = status
    }

    if (notes !== undefined) {
      booking.notes = notes.trim()
    }

    const updatedBooking = await booking.save()

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      booking: updatedBooking,
    })
  } catch (error) {
    console.error("Update booking error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    })
  }
}

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    await Booking.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    })
  } catch (error) {
    console.error("Delete booking error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: error.message,
    })
  }
}

const getBookingStats = async (req, res) => {
  try {
    const total = await Booking.countDocuments()

    const pending = await Booking.countDocuments({
      status: "Pending",
    })

    const confirmed = await Booking.countDocuments({
      status: "Confirmed",
    })

    const completed = await Booking.countDocuments({
      status: "Completed",
    })

    const cancelled = await Booking.countDocuments({
      status: "Cancelled",
    })

    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: {
            $ne: "Cancelled",
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
          totalAdvance: {
            $sum: "$advanceAmount",
          },
          totalBalance: {
            $sum: "$balanceAmount",
          },
        },
      },
    ])

    const revenue = revenueResult[0] || {
      totalRevenue: 0,
      totalAdvance: 0,
      totalBalance: 0,
    }

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
        totalRevenue: revenue.totalRevenue,
        totalAdvance: revenue.totalAdvance,
        totalBalance: revenue.totalBalance,
      },
    })
  } catch (error) {
    console.error("Booking stats error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch booking statistics",
      error: error.message,
    })
  }
}

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingStats,
}
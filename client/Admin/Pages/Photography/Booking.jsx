import React, { useEffect, useState } from "react"
import api from "../../../src/api/api.js"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Loader2,
} from "lucide-react"

const getAuthConfig = () => {
  const adminToken = localStorage.getItem("adminToken")

  return {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
}

const initialForm = {
  clientName: "",
  phone: "",
  email: "",
  eventType: "Wedding",
  eventDate: "",
  location: "",
  package: "",
  totalAmount: "",
  advanceAmount: "",
  balanceAmount: "",
  status: "Pending",
  notes: "",
}

const eventTypes = [
  "Wedding",
  "Engagement",
  "Birthday",
  "Portrait",
  "Pre-Wedding",
  "Baby Shoot",
  "Event",
  "Other",
]

const statuses = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
]

const Bookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add")
  const [selectedBooking, setSelectedBooking] = useState(null)

  const [formData, setFormData] = useState(initialForm)

  const fetchBookings = async () => {
    try {
      setLoading(true)

      const response = await api.get("/bookings", getAuthConfig())

      setBookings(response.data.bookings || [])
    } catch (error) {
      console.error("Fetch bookings error:", error)
      alert(
        error.response?.data?.message ||
          "Failed to fetch bookings"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      }

      if (
        name === "totalAmount" ||
        name === "advanceAmount"
      ) {
        const total = Number(
          name === "totalAmount"
            ? value
            : prev.totalAmount || 0
        )

        const advance = Number(
          name === "advanceAmount"
            ? value
            : prev.advanceAmount || 0
        )

        updated.balanceAmount = Math.max(
          0,
          total - advance
        )
      }

      return updated
    })
  }

  const openAddModal = () => {
    setModalMode("add")
    setSelectedBooking(null)
    setFormData(initialForm)
    setShowModal(true)
  }

  const openEditModal = (booking) => {
    setModalMode("edit")
    setSelectedBooking(booking)

    setFormData({
      clientName: booking.clientName || "",
      phone: booking.phone || "",
      email: booking.email || "",
      eventType: booking.eventType || "Wedding",
      eventDate: booking.eventDate
        ? booking.eventDate.split("T")[0]
        : "",
      location: booking.location || "",
      package: booking.package || "",
      totalAmount: booking.totalAmount || "",
      advanceAmount: booking.advanceAmount || "",
      balanceAmount: booking.balanceAmount || "",
      status: booking.status || "Pending",
      notes: booking.notes || "",
    })

    setShowModal(true)
  }

  const openViewModal = (booking) => {
    setModalMode("view")
    setSelectedBooking(booking)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      const payload = {
        clientName: formData.clientName,
        phone: formData.phone,
        email: formData.email,
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        location: formData.location,
        package: formData.package,
        totalAmount: Number(formData.totalAmount || 0),
        advanceAmount: Number(formData.advanceAmount || 0),
        status: formData.status,
        notes: formData.notes,
      }

      const response =
        modalMode === "add"
          ? await api.post(
              "/bookings",
              payload,
              getAuthConfig()
            )
          : await api.put(
              `/bookings/${selectedBooking._id}`,
              payload,
              getAuthConfig()
            )

      alert(
        modalMode === "add"
          ? "Booking created successfully."
          : "Booking updated successfully."
      )

      setShowModal(false)
      setSelectedBooking(null)
      setFormData(initialForm)

      fetchBookings()
    } catch (error) {
      console.error("Save booking error:", error)
      alert(
        error.response?.data?.message ||
          "Failed to save booking"
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this booking?"
    )

    if (!confirmed) return

    try {
      await api.delete(
        `/bookings/${id}`,
        getAuthConfig()
      )

      setBookings((prev) =>
        prev.filter((booking) => booking._id !== id)
      )

      alert("Booking deleted successfully.")
    } catch (error) {
      console.error("Delete booking error:", error)
      alert(
        error.response?.data?.message ||
          "Failed to delete booking"
      )
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      booking.clientName
        ?.toLowerCase()
        .includes(searchText) ||
      booking.phone
        ?.toLowerCase()
        .includes(searchText) ||
      booking.email
        ?.toLowerCase()
        .includes(searchText) ||
      booking.eventType
        ?.toLowerCase()
        .includes(searchText) ||
      booking.location
        ?.toLowerCase()
        .includes(searchText) ||
      booking.package
        ?.toLowerCase()
        .includes(searchText)

    const matchesStatus =
      statusFilter === "All" ||
      booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const total = bookings.length

  const pendingCount = bookings.filter(
    (item) => item.status === "Pending"
  ).length

  const confirmedCount = bookings.filter(
    (item) => item.status === "Confirmed"
  ).length

  const completedCount = bookings.filter(
    (item) => item.status === "Completed"
  ).length

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"

      case "Confirmed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"

      case "Completed":
        return "bg-green-500/10 text-green-400 border-green-500/20"

      case "Cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20"

      default:
        return "bg-white/5 text-white/60 border-white/10"
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
            Photography
          </p>

          <h1 className="text-3xl font-serif">
            Bookings
          </h1>

          <p className="text-sm text-white/40 mt-2">
            Manage photography bookings and client events.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-black text-sm font-medium hover:bg-white/90 transition"
        >
          <Plus size={17} />
          Add Booking
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ["Total", total],
          ["Pending", pendingCount],
          ["Confirmed", confirmedCount],
          ["Completed", completedCount],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border border-white/10 bg-white/[0.02] p-5"
          >
            <p className="text-xs uppercase tracking-wider text-white/40">
              {label}
            </p>

            <p className="text-2xl font-medium mt-2">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="w-full bg-white/[0.03] border border-white/10 px-11 py-3 text-sm outline-none focus:border-white/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111] border border-white/10 px-4 py-3 text-sm outline-none"
        >
          <option value="All">All Status</option>

          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/40">
            <Loader2 className="animate-spin mr-2" size={18} />
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            No bookings found.
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-4">
                      Client
                    </th>

                    <th className="text-left px-5 py-4">
                      Event
                    </th>

                    <th className="text-left px-5 py-4">
                      Date
                    </th>

                    <th className="text-left px-5 py-4">
                      Package
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                    <th className="text-right px-5 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5">
                        <p className="font-medium">
                          {booking.clientName}
                        </p>

                        <p className="text-xs text-white/30 mt-1">
                          {booking.phone}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span className="text-white/70">
                          {booking.eventType}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-white/60">
                        {booking.eventDate
                          ? new Date(
                              booking.eventDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-5 py-5 text-white/60">
                        {booking.package}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex px-3 py-1.5 border text-xs ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openViewModal(booking)
                            }
                            className="p-2 border border-white/10 hover:bg-white/10"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() =>
                              openEditModal(booking)
                            }
                            className="p-2 border border-white/10 hover:bg-white/10"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(booking._id)
                            }
                            className="p-2 border border-red-500/20 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-white/5">
              {filteredBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="p-5"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {booking.clientName}
                      </p>

                      <p className="text-xs text-white/40 mt-1">
                        {booking.eventType}
                      </p>
                    </div>

                    <span
                      className={`h-fit inline-flex px-2 py-1 border text-[10px] ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-white/50 space-y-1">
                    <p>
                      Date:{" "}
                      {booking.eventDate
                        ? new Date(
                            booking.eventDate
                          ).toLocaleDateString()
                        : "-"}
                    </p>

                    <p>
                      Package: {booking.package}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() =>
                        openViewModal(booking)
                      }
                      className="flex-1 py-2 border border-white/10 text-xs"
                    >
                      View
                    </button>

                    <button
                      onClick={() =>
                        openEditModal(booking)
                      }
                      className="flex-1 py-2 border border-white/10 text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(booking._id)
                      }
                      className="px-3 py-2 border border-red-500/20 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#101010] border border-white/10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Photography
                </p>

                <h2 className="text-xl font-serif mt-1">
                  {modalMode === "add"
                    ? "Add Booking"
                    : modalMode === "edit"
                    ? "Edit Booking"
                    : "Booking Details"}
                </h2>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {modalMode === "view" && selectedBooking ? (
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs text-white/30 uppercase">
                    Client
                  </p>

                  <p className="text-lg mt-2">
                    {selectedBooking.clientName}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Email
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <Mail size={15} />
                      {selectedBooking.email || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Phone
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <Phone size={15} />
                      {selectedBooking.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Event
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <Camera size={15} />
                      {selectedBooking.eventType}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Event Date
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <Calendar size={15} />
                      {selectedBooking.eventDate
                        ? new Date(
                            selectedBooking.eventDate
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Location
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <MapPin size={15} />
                      {selectedBooking.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Package
                    </p>

                    <p className="mt-2 text-sm text-white/70">
                      {selectedBooking.package}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-white/10 p-4">
                    <p className="text-xs text-white/30">
                      Total
                    </p>

                    <p className="mt-2">
                      â‚¹{selectedBooking.totalAmount || 0}
                    </p>
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="text-xs text-white/30">
                      Advance
                    </p>

                    <p className="mt-2">
                      â‚¹{selectedBooking.advanceAmount || 0}
                    </p>
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="text-xs text-white/30">
                      Balance
                    </p>

                    <p className="mt-2">
                      â‚¹{selectedBooking.balanceAmount || 0}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/30 uppercase">
                    Status
                  </p>

                  <span
                    className={`inline-flex mt-2 px-3 py-1.5 border text-xs ${getStatusClass(
                      selectedBooking.status
                    )}`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Notes
                    </p>

                    <div className="mt-2 p-4 border border-white/10 text-sm text-white/70 leading-7 whitespace-pre-wrap">
                      {selectedBooking.notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 space-y-5"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40">
                      Client Name *
                    </label>

                    <input
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      required
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40">
                      Phone *
                    </label>

                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40">
                      Event Type *
                    </label>

                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      required
                      className="w-full mt-2 bg-[#111] border border-white/10 px-4 py-3 text-sm outline-none"
                    >
                      {eventTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40">
                      Event Date *
                    </label>

                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleChange}
                      required
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40">
                      Location *
                    </label>

                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40">
                    Package *
                  </label>

                  <input
                    name="package"
                    value={formData.package}
                    onChange={handleChange}
                    required
                    placeholder="Example: Premium Wedding Package"
                    className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/40">
                      Total Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40">
                      Advance Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      name="advanceAmount"
                      value={formData.advanceAmount}
                      onChange={handleChange}
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40">
                      Balance
                    </label>

                    <input
                      type="number"
                      value={formData.balanceAmount}
                      readOnly
                      className="w-full mt-2 bg-white/[0.02] border border-white/10 px-4 py-3 text-sm text-white/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full mt-2 bg-[#111] border border-white/10 px-4 py-3 text-sm outline-none"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Additional booking notes..."
                    className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-3 border border-white/10 text-sm hover:bg-white/5"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-3 bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-50"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                        Saving...
                      </span>
                    ) : modalMode === "add" ? (
                      "Create Booking"
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Bookings

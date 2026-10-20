
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
  Briefcase,
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
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  project: "Business Website",
  message: "",
  status: "New",
  totalAmount: "",
  advanceAmount: "",
}

const projectTypes = [
  "Business Website",
  "E-commerce Website",
  "Portfolio Website",
  "Web Application",
  "Landing Page",
  "Other",
]

const statuses = [
  "New",
  "Contacted",
  "In Progress",
  "Converted",
  "Closed",
]

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState("add")
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)

  const [formData, setFormData] = useState(initialForm)

  const fetchEnquiries = async () => {
    try {
      setLoading(true)

      const response = await api.get(
        "/enquiries",
        getAuthConfig()
      )

      setEnquiries(response.data.enquiries || [])
    } catch (error) {
      console.error("Fetch enquiries error:", error)
      alert(
        error.response?.data?.message ||
          "Failed to fetch enquiries"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const openAddModal = () => {
    setModalMode("add")
    setSelectedEnquiry(null)
    setFormData(initialForm)
    setShowModal(true)
  }

  const openEditModal = (enquiry) => {
    setModalMode("edit")
    setSelectedEnquiry(enquiry)

    setFormData({
      firstName: enquiry.firstName || "",
      lastName: enquiry.lastName || "",
      email: enquiry.email || "",
      phone: enquiry.phone || "",
      project: enquiry.project || "Business Website",
      message: enquiry.message || "",
      status: enquiry.status || "New",
      totalAmount: enquiry.totalAmount ?? "",
      advanceAmount: enquiry.advanceAmount ?? "",
    })

    setShowModal(true)
  }

  const openViewModal = (enquiry) => {
    setModalMode("view")
    setSelectedEnquiry(enquiry)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      const totalAmount =
        formData.totalAmount === ""
          ? 0
          : Number(formData.totalAmount)

      const advanceAmount =
        formData.advanceAmount === ""
          ? 0
          : Number(formData.advanceAmount)

      if (!Number.isFinite(totalAmount) || totalAmount < 0) {
        alert("Please enter a valid total amount.")
        return
      }

      if (!Number.isFinite(advanceAmount) || advanceAmount < 0) {
        alert("Please enter a valid advance amount.")
        return
      }

      if (
        totalAmount > 0 &&
        advanceAmount > totalAmount
      ) {
        alert(
          "Advance amount cannot be greater than total amount."
        )
        return
      }

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        project: formData.project,
        message: formData.message,
        status: formData.status,
        totalAmount,
        advanceAmount,
      }

      let response

      if (modalMode === "add") {
        response = await api.post(
          "/enquiries",
          payload,
          getAuthConfig()
        )
      } else {
        response = await api.put(
          `/enquiries/${selectedEnquiry._id}`,
          payload,
          getAuthConfig()
        )
      }

      alert(
        modalMode === "add"
          ? "Enquiry created successfully."
          : "Enquiry updated successfully."
      )

      setShowModal(false)
      setSelectedEnquiry(null)
      setFormData(initialForm)

      fetchEnquiries()
    } catch (error) {
      console.error("Save enquiry error:", error)
      alert(
        error.response?.data?.message ||
          "Failed to save enquiry"
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this enquiry?"
    )

    if (!confirmed) return

    try {
      await api.delete(
        `/enquiries/${id}`,
        getAuthConfig()
      )

      setEnquiries((prev) =>
        prev.filter((enquiry) => enquiry._id !== id)
      )

      alert("Enquiry deleted successfully.")
    } catch (error) {
      console.error("Delete enquiry error:", error)
      alert(
        error.response?.data?.message ||
          "Failed to delete enquiry"
      )
    }
  }

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      enquiry.firstName?.toLowerCase().includes(searchText) ||
      enquiry.lastName?.toLowerCase().includes(searchText) ||
      enquiry.email?.toLowerCase().includes(searchText) ||
      enquiry.phone?.toLowerCase().includes(searchText) ||
      enquiry.project?.toLowerCase().includes(searchText)

    const matchesStatus =
      statusFilter === "All" ||
      enquiry.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const total = enquiries.length

  const newCount = enquiries.filter(
    (item) => item.status === "New"
  ).length

  const contactedCount = enquiries.filter(
    (item) => item.status === "Contacted"
  ).length

  const convertedCount = enquiries.filter(
    (item) => item.status === "Converted"
  ).length

  const getStatusClass = (status) => {
    switch (status) {
      case "New":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"

      case "Contacted":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"

      case "In Progress":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"

      case "Converted":
        return "bg-green-500/10 text-green-400 border-green-500/20"

      case "Closed":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"

      default:
        return "bg-white/5 text-white/60 border-white/10"
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 lg:p-8">

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
            Web Development
          </p>

          <h1 className="text-3xl font-serif">
            Enquiries
          </h1>

          <p className="text-sm text-white/40 mt-2">
            Manage website and web-development enquiries.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-black text-sm font-medium hover:bg-white/90 transition"
        >
          <Plus size={17} />
          Add Enquiry
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ["Total", total],
          ["New", newCount],
          ["Contacted", contactedCount],
          ["Converted", convertedCount],
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
            placeholder="Search enquiries..."
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
            Loading enquiries...
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            No enquiries found.
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
                      Project
                    </th>

                    <th className="text-left px-5 py-4">
                      Contact
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
                  {filteredEnquiries.map((enquiry) => (
                    <tr
                      key={enquiry._id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5">
                        <p className="font-medium">
                          {enquiry.firstName} {enquiry.lastName}
                        </p>

                        <p className="text-xs text-white/30 mt-1">
                          {new Date(
                            enquiry.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span className="text-white/70">
                          {enquiry.project}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <p className="text-white/70">
                          {enquiry.email}
                        </p>

                        <p className="text-xs text-white/30 mt-1">
                          {enquiry.phone || "No phone"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex px-3 py-1.5 border text-xs ${getStatusClass(
                            enquiry.status
                          )}`}
                        >
                          {enquiry.status}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              openViewModal(enquiry)
                            }
                            className="p-2 border border-white/10 hover:bg-white/10"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() =>
                              openEditModal(enquiry)
                            }
                            className="p-2 border border-white/10 hover:bg-white/10"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(enquiry._id)
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
              {filteredEnquiries.map((enquiry) => (
                <div
                  key={enquiry._id}
                  className="p-5"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {enquiry.firstName} {enquiry.lastName}
                      </p>

                      <p className="text-xs text-white/40 mt-1">
                        {enquiry.project}
                      </p>
                    </div>

                    <span
                      className={`h-fit inline-flex px-2 py-1 border text-[10px] ${getStatusClass(
                        enquiry.status
                      )}`}
                    >
                      {enquiry.status}
                    </span>
                  </div>

                  <p className="text-sm text-white/50 mt-4">
                    {enquiry.email}
                  </p>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() =>
                        openViewModal(enquiry)
                      }
                      className="flex-1 py-2 border border-white/10 text-xs"
                    >
                      View
                    </button>

                    <button
                      onClick={() =>
                        openEditModal(enquiry)
                      }
                      className="flex-1 py-2 border border-white/10 text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(enquiry._id)
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
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#101010] border border-white/10">

            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Web Development
                </p>

                <h2 className="text-xl font-serif mt-1">
                  {modalMode === "add"
                    ? "Add Enquiry"
                    : modalMode === "edit"
                    ? "Edit Enquiry"
                    : "Enquiry Details"}
                </h2>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {modalMode === "view" && selectedEnquiry ? (
              <div className="p-6 space-y-6">

                <div>
                  <p className="text-xs text-white/30 uppercase">
                    Client
                  </p>

                  <p className="mt-2 text-lg">
                    {selectedEnquiry.firstName}{" "}
                    {selectedEnquiry.lastName}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Email
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <Mail size={15} />
                      {selectedEnquiry.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Phone
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <Phone size={15} />
                      {selectedEnquiry.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Project
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <Briefcase size={15} />
                      {selectedEnquiry.project}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/30 uppercase">
                      Received
                    </p>

                    <p className="mt-2 text-sm text-white/70 flex items-center gap-2">
                      <Calendar size={15} />
                      {new Date(
                        selectedEnquiry.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/30 uppercase">
                    Status
                  </p>

                  <span
                    className={`inline-flex mt-2 px-3 py-1.5 border text-xs ${getStatusClass(
                      selectedEnquiry.status
                    )}`}
                  >
                    {selectedEnquiry.status}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-white/10 p-4">
                    <p className="text-xs text-white/30 uppercase">
                      Total
                    </p>

                    <p className="mt-2 text-lg">
                      â‚¹{Number(
                        selectedEnquiry.totalAmount || 0
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="text-xs text-white/30 uppercase">
                      Advance
                    </p>

                    <p className="mt-2 text-lg">
                      â‚¹{Number(
                        selectedEnquiry.advanceAmount || 0
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="border border-white/10 p-4">
                    <p className="text-xs text-white/30 uppercase">
                      Paid
                    </p>

                    <p className="mt-2 text-lg">
                      â‚¹{Number(
                        selectedEnquiry.paidAmount || 0
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-white/30 uppercase">
                    Message
                  </p>

                  <div className="mt-2 p-4 border border-white/10 text-sm text-white/70 leading-7 whitespace-pre-wrap">
                    {selectedEnquiry.message}
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 space-y-5"
              >

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40">
                      First Name *
                    </label>

                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40">
                      Last Name
                    </label>

                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40">
                      Email *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40">
                      Phone
                    </label>

                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40">
                      Project Type *
                    </label>

                    <select
                      name="project"
                      value={formData.project}
                      onChange={handleChange}
                      required
                      className="w-full mt-2 bg-[#111] border border-white/10 px-4 py-3 text-sm outline-none"
                    >
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
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
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40">
                      Total Project Amount
                    </label>

                    <input
                      type="number"
                      name="totalAmount"
                      value={formData.totalAmount}
                      onChange={handleChange}
                      min="0"
                      placeholder="50000"
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/40">
                      Advance Amount
                    </label>

                    <input
                      type="number"
                      name="advanceAmount"
                      value={formData.advanceAmount}
                      onChange={handleChange}
                      min="0"
                      placeholder="20000"
                      className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40">
                    Message *
                  </label>

                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full mt-2 bg-white/[0.03] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30 resize-none"
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
                      "Create Enquiry"
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

export default Enquiries



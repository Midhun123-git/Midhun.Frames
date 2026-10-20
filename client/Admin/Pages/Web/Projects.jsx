import React, { useEffect, useMemo, useState } from "react"
import api from "../../../../server/Api/api.js"
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Eye,
  Briefcase,
  CalendarDays,
  IndianRupee,
  User,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react"

// ==========================================
// AUTH CONFIG
// ==========================================

const getAuthConfig = () => {
  const adminToken = localStorage.getItem("adminToken")

  return {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  }
}

// ==========================================
// EMPTY FORM
// ==========================================

const emptyForm = {
  clientName: "",
  company: "",
  email: "",
  phone: "",
  name: "",
  service: "Business Website Development",
  description: "",
  status: "Planning",
  startDate: "",
  deadline: "",
  completedDate: "",
  budget: "",
  paymentStatus: "Pending",
  liveUrl: "",
  notes: "",
}

const Projects = () => {
  const [projects, setProjects] = useState([])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const [showModal, setShowModal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const [selectedProject, setSelectedProject] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState(emptyForm)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // ==========================================
  // FETCH PROJECTS
  // ==========================================

  const fetchProjects = async () => {
    try {
      setLoading(true)

      const response = await api.get(
        "/projects",
        getAuthConfig()
      )

      if (response.data.success) {
        setProjects(response.data.projects || [])
      }
    } catch (error) {
      console.error("Fetch projects error:", error)

      alert(
        error.response?.data?.message ||
          "Failed to fetch projects."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // ==========================================
  // FILTER PROJECTS
  // ==========================================

  const filteredProjects = useMemo(() => {
    const searchText = search.toLowerCase().trim()

    return projects.filter((project) => {
      const matchesSearch =
        project.name?.toLowerCase().includes(searchText) ||
        project.clientName
          ?.toLowerCase()
          .includes(searchText) ||
        project.company
          ?.toLowerCase()
          .includes(searchText) ||
        project.service
          ?.toLowerCase()
          .includes(searchText)

      const matchesStatus =
        statusFilter === "All" ||
        project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  // ==========================================
  // STATS
  // ==========================================

  const totalProjects = projects.length

  const activeProjects = projects.filter(
    (project) =>
      project.status === "Planning" ||
      project.status === "In Progress" ||
      project.status === "Review"
  ).length

  const completedProjects = projects.filter(
    (project) => project.status === "Completed"
  ).length

  const totalValue = projects.reduce(
    (total, project) =>
      total + Number(project.budget || 0),
    0
  )

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
  }

  // ==========================================
  // OPEN ADD
  // ==========================================

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  // ==========================================
  // FORMAT DATE FOR INPUT
  // ==========================================

  const formatDateForInput = (date) => {
    if (!date) return ""

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return ""
    }

    return parsedDate.toISOString().split("T")[0]
  }

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const openEditModal = (project) => {
    setEditingId(project._id)

    setFormData({
      clientName: project.clientName || "",
      company: project.company || "",
      email: project.email || "",
      phone: project.phone || "",

      name: project.name || "",
      service:
        project.service ||
        "Business Website Development",

      description: project.description || "",
      status: project.status || "Planning",

      startDate: formatDateForInput(
        project.startDate
      ),

      deadline: formatDateForInput(
        project.deadline
      ),

      completedDate: formatDateForInput(
        project.completedDate
      ),

      budget:
        project.budget !== undefined
          ? project.budget
          : "",

      paymentStatus:
        project.paymentStatus || "Pending",

      liveUrl: project.liveUrl || "",
      notes: project.notes || "",
    })

    setShowModal(true)
  }

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (saving) return

    setShowModal(false)
    resetForm()
  }

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // ==========================================
  // CREATE / UPDATE PROJECT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (
      !formData.clientName.trim() ||
      !formData.name.trim() ||
      !formData.service.trim()
    ) {
      alert(
        "Client name, project name and service are required."
      )

      return
    }

    try {
      setSaving(true)

      const projectData = {
        clientName: formData.clientName.trim(),
        company: formData.company.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),

        name: formData.name.trim(),
        service: formData.service.trim(),
        description: formData.description.trim(),

        status: formData.status,

        startDate:
          formData.startDate || null,

        deadline:
          formData.deadline || null,

        completedDate:
          formData.completedDate || null,

        budget:
          formData.budget === ""
            ? 0
            : Number(formData.budget),

        paymentStatus:
          formData.paymentStatus,

        liveUrl: formData.liveUrl.trim(),
        notes: formData.notes.trim(),
      }

      if (editingId) {
        const response = await api.put(
          `/projects/${editingId}`,
          projectData,
          getAuthConfig()
        )

        if (response.data.success) {
          setProjects((prev) =>
            prev.map((project) =>
              project._id === editingId
                ? response.data.project
                : project
            )
          )

          alert("Project updated successfully.")
        }
      } else {
        const response = await api.post(
          "/projects",
          projectData,
          getAuthConfig()
        )

        if (response.data.success) {
          setProjects((prev) => [
            response.data.project,
            ...prev,
          ])

          alert("Project created successfully.")
        }
      }

      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error(
        "Save project error:",
        error
      )

      alert(
        error.response?.data?.message ||
          "Failed to save project."
      )
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // DELETE PROJECT
  // ==========================================

  const deleteProject = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    )

    if (!confirmed) return

    try {
      setDeletingId(id)

      const response = await api.delete(
        `/projects/${id}`,
        getAuthConfig()
      )

      if (response.data.success) {
        setProjects((prev) =>
          prev.filter(
            (project) => project._id !== id
          )
        )

        if (
          selectedProject?._id === id
        ) {
          setSelectedProject(null)
          setShowDetails(false)
        }

        alert("Project deleted successfully.")
      }
    } catch (error) {
      console.error(
        "Delete project error:",
        error
      )

      alert(
        error.response?.data?.message ||
          "Failed to delete project."
      )
    } finally {
      setDeletingId(null)
    }
  }

  // ==========================================
  // OPEN DETAILS
  // ==========================================

  const openDetails = async (project) => {
    try {
      const response = await api.get(
        `/projects/${project._id}`,
        getAuthConfig()
      )

      if (response.data.success) {
        setSelectedProject(
          response.data.project
        )

        setShowDetails(true)
      }
    } catch (error) {
      console.error(
        "Fetch project details error:",
        error
      )

      alert(
        error.response?.data?.message ||
          "Failed to fetch project details."
      )
    }
  }

  // ==========================================
  // CLOSE DETAILS
  // ==========================================

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedProject(null)
  }

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const statusClass = (status) => {
    if (status === "Completed") {
      return "bg-green-500/10 text-green-400 border-green-500/20"
    }

    if (status === "In Progress") {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }

    if (status === "Review") {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20"
    }

    if (status === "On Hold") {
      return "bg-red-500/10 text-red-400 border-red-500/20"
    }

    if (status === "Cancelled") {
      return "bg-red-500/10 text-red-400 border-red-500/20"
    }

    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
  }

  // ==========================================
  // PAYMENT STATUS CLASS
  // ==========================================

  const paymentStatusClass = (status) => {
    if (status === "Paid") {
      return "text-green-400"
    }

    if (status === "Partially Paid") {
      return "text-blue-400"
    }

    return "text-yellow-400"
  }

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "—"

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return "—"
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

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="w-full">

      {/* HEADER */}

      <div className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#c8a96b]">
            Web Development
          </p>

          <h1 className="font-serif text-3xl text-white">
            Projects
          </h1>

          <p className="mt-2 text-sm text-white/45">
            Manage development projects, progress and delivery.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 border border-[#c8a96b]/50 bg-[#c8a96b]/10 px-5 py-3 text-sm text-[#c8a96b] transition hover:bg-[#c8a96b] hover:text-black"
        >
          <Plus size={17} />
          New Project
        </button>

      </div>

      {/* STATS */}

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">

        <StatCard
          label="Total Projects"
          value={totalProjects}
          icon={<Briefcase size={18} />}
        />

        <StatCard
          label="Active"
          value={activeProjects}
          icon={<Briefcase size={18} />}
        />

        <StatCard
          label="Completed"
          value={completedProjects}
          icon={<CalendarDays size={18} />}
        />

        <StatCard
          label="Project Value"
          value={`₹${totalValue.toLocaleString("en-IN")}`}
          icon={<IndianRupee size={18} />}
        />

      </div>

      {/* FILTERS */}

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="relative w-full lg:max-w-md">

          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            type="text"
            placeholder="Search project, client or service..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c8a96b]/40"
          />

        </div>

        <div className="flex flex-wrap gap-2">

          {[
            "All",
            "Planning",
            "In Progress",
            "Review",
            "Completed",
            "On Hold",
            "Cancelled",
          ].map((status) => (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(status)
              }
              className={`border px-4 py-2 text-xs transition ${
                statusFilter === status
                  ? "border-[#c8a96b] bg-[#c8a96b] text-black"
                  : "border-white/10 text-white/45 hover:border-white/25 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}

        </div>

      </div>

      {/* LOADING */}

      {loading ? (
        <div className="mt-6 border border-white/10 bg-white/[0.02] px-5 py-16 text-center text-sm text-white/30">
          Loading projects...
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}

          <div className="mt-6 hidden overflow-hidden border border-white/10 bg-white/[0.02] lg:block">

            <div className="grid grid-cols-[1.5fr_1.1fr_1.2fr_0.9fr_1.1fr_120px] border-b border-white/10 px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-white/30">

              <span>Project</span>
              <span>Client</span>
              <span>Service</span>
              <span>Budget</span>
              <span>Payment</span>
              <span>Actions</span>

            </div>

            {filteredProjects.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-white/30">
                No projects found.
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project._id}
                  className="grid grid-cols-[1.5fr_1.1fr_1.2fr_0.9fr_1.1fr_120px] items-center border-b border-white/5 px-5 py-5 last:border-b-0"
                >

                  <div>
                    <p className="text-sm text-white">
                      {project.name}
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      Deadline:{" "}
                      {formatDate(
                        project.deadline
                      )}
                    </p>

                    <span
                      className={`mt-2 inline-flex border px-2 py-0.5 text-[9px] ${statusClass(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">
                      {project.clientName}
                    </p>

                    {project.company && (
                      <p className="mt-1 text-xs text-white/30">
                        {project.company}
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-white/60">
                    {project.service}
                  </p>

                  <p className="text-sm text-white/60">
                    ₹
                    {Number(
                      project.budget || 0
                    ).toLocaleString("en-IN")}
                  </p>

                  <p
                    className={`text-xs ${paymentStatusClass(
                      project.paymentStatus
                    )}`}
                  >
                    {project.paymentStatus}
                  </p>

                  <div className="flex items-center gap-1">

                    <button
                      onClick={() =>
                        openDetails(project)
                      }
                      title="View"
                      className="p-2 text-white/40 transition hover:text-[#c8a96b]"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() =>
                        openEditModal(project)
                      }
                      title="Edit"
                      className="p-2 text-white/40 transition hover:text-[#c8a96b]"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() =>
                        deleteProject(project._id)
                      }
                      disabled={
                        deletingId ===
                        project._id
                      }
                      title="Delete"
                      className="p-2 text-white/40 transition hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </div>
              ))
            )}

          </div>

          {/* MOBILE CARDS */}

          <div className="mt-6 space-y-4 lg:hidden">

            {filteredProjects.length === 0 ? (
              <div className="border border-white/10 px-5 py-12 text-center text-sm text-white/30">
                No projects found.
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project._id}
                  className="border border-white/10 bg-white/[0.02] p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-sm text-white">
                        {project.name}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {project.clientName}
                      </p>

                      {project.company && (
                        <p className="mt-1 text-xs text-white/25">
                          {project.company}
                        </p>
                      )}
                    </div>

                    <span
                      className={`border px-2.5 py-1 text-[10px] ${statusClass(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>

                  </div>

                  <div className="mt-5 space-y-3 text-xs text-white/50">

                    <div className="flex items-center gap-3">
                      <Briefcase size={15} />
                      {project.service}
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays size={15} />
                      Deadline:{" "}
                      {formatDate(
                        project.deadline
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <IndianRupee size={15} />
                      ₹
                      {Number(
                        project.budget || 0
                      ).toLocaleString("en-IN")}
                    </div>

                    <div className="flex items-center gap-3">
                      <IndianRupee size={15} />
                      Payment:{" "}
                      <span
                        className={paymentStatusClass(
                          project.paymentStatus
                        )}
                      >
                        {project.paymentStatus}
                      </span>
                    </div>

                  </div>

                  <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">

                    <button
                      onClick={() =>
                        openDetails(project)
                      }
                      className="flex flex-1 items-center justify-center gap-2 border border-white/10 py-2.5 text-xs text-white/60 hover:text-white"
                    >
                      <Eye size={14} />
                      View
                    </button>

                    <button
                      onClick={() =>
                        openEditModal(project)
                      }
                      className="flex flex-1 items-center justify-center gap-2 border border-white/10 py-2.5 text-xs text-white/60 hover:text-[#c8a96b]"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteProject(project._id)
                      }
                      disabled={
                        deletingId ===
                        project._id
                      }
                      className="border border-white/10 px-4 py-2.5 text-white/40 hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>

                  </div>

                </div>
              ))
            )}

          </div>
        </>
      )}

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-white/10 bg-[#090909]">

            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#090909] px-6 py-5">

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                  Web Development
                </p>

                <h2 className="mt-1 font-serif text-xl text-white">
                  {editingId
                    ? "Edit Project"
                    : "New Project"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="text-white/40 hover:text-white disabled:opacity-30"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {/* CLIENT */}

              <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                Client Information
              </p>

              <div className="grid gap-5 md:grid-cols-2">

                <Input
                  label="Client Name"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  placeholder="Rahul Nair"
                  required
                />

                <Input
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nair Digital Solutions"
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

              {/* PROJECT */}

              <p className="mb-4 mt-8 text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                Project Information
              </p>

              <div className="grid gap-5 md:grid-cols-2">

                <Input
                  label="Project Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Business Website"
                  required
                />

                <Select
                  label="Service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  options={[
                    "Business Website Development",
                    "Portfolio Website",
                    "E-Commerce Website",
                    "Personal Website",
                    "Web Application",
                    "Custom Software",
                    "Website Maintenance",
                    "Landing Page",
                    "Other",
                  ]}
                />

                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    "Planning",
                    "In Progress",
                    "Review",
                    "Completed",
                    "On Hold",
                    "Cancelled",
                  ]}
                />

                <Select
                  label="Payment Status"
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  options={[
                    "Pending",
                    "Partially Paid",
                    "Paid",
                  ]}
                />

                <Input
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />

                <Input
                  label="Deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                />

                <Input
                  label="Completed Date"
                  name="completedDate"
                  type="date"
                  value={formData.completedDate}
                  onChange={handleChange}
                />

                <Input
                  label="Project Budget"
                  name="budget"
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="50000"
                />

                <Input
                  label="Live Website URL"
                  name="liveUrl"
                  type="url"
                  value={formData.liveUrl}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />

              </div>

              {/* DESCRIPTION */}

              <div className="mt-5">

                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  Project Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="What is being built for the client?"
                  className="w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#c8a96b]/40"
                />

              </div>

              {/* NOTES */}

              <div className="mt-5">

                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  Internal Notes
                </label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional project notes..."
                  className="w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#c8a96b]/40"
                />

              </div>

              {/* ACTIONS */}

              <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="border border-white/10 px-5 py-3 text-xs text-white/50 hover:text-white disabled:opacity-30"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#c8a96b] px-6 py-3 text-xs font-medium text-black transition hover:bg-[#d8bc83] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Project"
                    : "Create Project"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* DETAILS MODAL */}

      {showDetails && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-white/10 bg-[#090909]">

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#c8a96b]">
                  Project Details
                </p>

                <h2 className="mt-1 font-serif text-xl text-white">
                  {selectedProject.name}
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

              {/* CLIENT DETAILS */}

              <div className="grid gap-5 sm:grid-cols-2">

                <Detail
                  icon={<User size={15} />}
                  label="Client"
                  value={
                    selectedProject.clientName ||
                    "—"
                  }
                />

                <Detail
                  icon={<Briefcase size={15} />}
                  label="Company"
                  value={
                    selectedProject.company ||
                    "—"
                  }
                />

                <Detail
                  icon={<Mail size={15} />}
                  label="Email"
                  value={
                    selectedProject.email ||
                    "—"
                  }
                />

                <Detail
                  icon={<Phone size={15} />}
                  label="Phone"
                  value={
                    selectedProject.phone ||
                    "—"
                  }
                />

                <Detail
                  icon={<Briefcase size={15} />}
                  label="Service"
                  value={
                    selectedProject.service ||
                    "—"
                  }
                />

                <Detail
                  icon={<CalendarDays size={15} />}
                  label="Start Date"
                  value={formatDate(
                    selectedProject.startDate
                  )}
                />

                <Detail
                  icon={<CalendarDays size={15} />}
                  label="Deadline"
                  value={formatDate(
                    selectedProject.deadline
                  )}
                />

                <Detail
                  icon={<IndianRupee size={15} />}
                  label="Budget"
                  value={`₹${Number(
                    selectedProject.budget || 0
                  ).toLocaleString("en-IN")}`}
                />

              </div>

              {/* STATUS */}

              <div className="mt-6">

                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                  Status
                </p>

                <span
                  className={`inline-flex border px-3 py-1.5 text-xs ${statusClass(
                    selectedProject.status
                  )}`}
                >
                  {selectedProject.status}
                </span>

              </div>

              {/* PAYMENT */}

              <div className="mt-6">

                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                  Payment Status
                </p>

                <p
                  className={`text-sm ${paymentStatusClass(
                    selectedProject.paymentStatus
                  )}`}
                >
                  {selectedProject.paymentStatus}
                </p>

              </div>

              {/* DESCRIPTION */}

              <div className="mt-6">

                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                  Description
                </p>

                <p className="text-sm leading-6 text-white/50">
                  {selectedProject.description ||
                    "No description added."}
                </p>

              </div>

              {/* NOTES */}

              <div className="mt-6">

                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                  Internal Notes
                </p>

                <p className="text-sm leading-6 text-white/50">
                  {selectedProject.notes ||
                    "No notes added."}
                </p>

              </div>

              {/* LIVE URL */}

              {selectedProject.liveUrl && (
                <a
                  href={selectedProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 border border-[#c8a96b]/30 bg-[#c8a96b]/5 py-3 text-xs text-[#c8a96b] transition hover:bg-[#c8a96b] hover:text-black"
                >
                  <ExternalLink size={14} />
                  Open Live Website
                </a>
              )}

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

// ==========================================
// STAT CARD
// ==========================================

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

// ==========================================
// INPUT
// ==========================================

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

// ==========================================
// SELECT
// ==========================================

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

// ==========================================
// DETAIL
// ==========================================

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

export default Projects

import React, { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Camera,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Film,
  ImagePlus,
  LoaderCircle,
  Plus,
  Star,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react"
import DeleteConfirmModal from "../../../src/Components/DeleteConfirmModel.jsx"
import api from "../../../src/api/api.js"

const CATEGORIES = [
  "Wedding",
  "Portrait",
  "Pre Wedding",
  "Engagement",
  "Events",
]

const emptyForm = {
  title: "",
  client: "",
  category: "Wedding",
  date: "",
  featured: false,
  isPublic: true,
}

function Gallery() {
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [notice, setNotice] = useState({
    type: "",
    message: "",
  })

  const [uploadStatus, setUploadStatus] = useState({
    visible: false,
    status: "uploading",
    message: "",
  })

  const [photoToDelete, setPhotoToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isPortrait =
    form.category.trim().toLowerCase() === "portrait"

  const getHeaders = () => {
    const token = localStorage.getItem("adminToken")

    return token
      ? { Authorization: `Bearer ${token}` }
      : {}
  }

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true)

      const response = await api.get("/gallery", {
        headers: getHeaders(),
      })

      const items =
        response.data?.gallery ??
        response.data?.data?.gallery ??
        response.data?.data ??
        []

      setGallery(Array.isArray(items) ? items : [])
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load gallery items.",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGallery()
  }, [loadGallery])

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const updateField = (event) => {
    const { name, value, type, checked } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const closeForm = () => {
    if (saving) return

    setShowForm(false)
    setEditingPhoto(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setPreview("")
  }

  const openAddForm = () => {
    setEditingPhoto(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setPreview("")
    setShowForm(true)
    setNotice({ type: "", message: "" })
  }

  const openEditForm = (photo) => {
    setEditingPhoto(photo)
    setForm({
      title: photo.title || "",
      client: photo.client || "",
      category: photo.category || "Wedding",
      date: photo.date
        ? String(photo.date).slice(0, 10)
        : "",
      featured: Boolean(photo.featured),
      isPublic: photo.isPublic !== false,
    })
    setSelectedFile(null)
    setPreview(photo.imageUrl || "")
    setShowForm(true)
    setNotice({ type: "", message: "" })
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      setNotice({
        type: "error",
        message: "Please select a valid image or video.",
      })
      event.target.value = ""
      return
    }

    const maxSize = isVideo
      ? 100 * 1024 * 1024
      : 10 * 1024 * 1024

    if (file.size > maxSize) {
      setNotice({
        type: "error",
        message: isVideo
          ? "Video must be smaller than 100 MB."
          : "Image must be smaller than 10 MB.",
      })
      event.target.value = ""
      return
    }

    setSelectedFile(file)

    setPreview((previous) => {
      if (previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous)
      }

      return URL.createObjectURL(file)
    })

    setNotice({ type: "", message: "" })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const title = form.title.trim()
    const client = form.client.trim()
    const date = form.date.trim()
    const portrait =
      form.category.trim().toLowerCase() === "portrait"

    if (!title || !form.category) {
      setNotice({
        type: "error",
        message: "Title and category are required.",
      })
      return
    }

    if (!portrait && (!date || !client)) {
      setNotice({
        type: "error",
        message:
          "Date and Client/Event are required for this category.",
      })
      return
    }

    if (!editingPhoto && !selectedFile) {
      setNotice({
        type: "error",
        message: "Please select an image or video.",
      })
      return
    }

    const data = new FormData()
    data.append("title", title)
    data.append("category", form.category)
    data.append("client", client)
    data.append("date", portrait ? "" : date)
    data.append("featured", String(form.featured))
    data.append("isPublic", String(form.isPublic))

    if (selectedFile) {
      data.append("image", selectedFile)
    }

    setSaving(true)
    setNotice({ type: "", message: "" })
    setUploadStatus({
      visible: true,
      status: "uploading",
      message: editingPhoto
        ? "Updating your gallery media. Please wait."
        : "Your photos and videos are being uploaded securely.",
    })

    try {
      if (editingPhoto) {
        await api.put(
          `/gallery/${editingPhoto._id || editingPhoto.id}`,
          data,
          { headers: getHeaders() }
        )
      } else {
        await api.post("/gallery", data, {
          headers: getHeaders(),
        })
      }

      setUploadStatus({
        visible: true,
        status: "success",
        message: editingPhoto
          ? "Your gallery item has been updated successfully."
          : "Your media has been added to the gallery.",
      })

      setShowForm(false)
      setEditingPhoto(null)
      setForm(emptyForm)
      setSelectedFile(null)
      setPreview("")

      await loadGallery()
    } catch (error) {
      setUploadStatus({
        visible: true,
        status: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Upload failed. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!photoToDelete || deleteLoading) return

    const photoId = photoToDelete._id || photoToDelete.id

    if (!photoId) {
      setNotice({
        type: "error",
        message: "Unable to identify this gallery item.",
      })
      setPhotoToDelete(null)
      return
    }

    setDeleteLoading(true)

    try {
      await api.delete(`/gallery/${photoId}`, {
        headers: getHeaders(),
      })

      setGallery((previous) =>
        previous.filter(
          (item) =>
            String(item._id || item.id) !== String(photoId)
        )
      )

      setPhotoToDelete(null)

      setNotice({
        type: "success",
        message: "Gallery item deleted successfully.",
      })
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete this gallery item.",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const updatePhoto = async (photo, field, value) => {
    const id = photo._id || photo.id

    setGallery((previous) =>
      previous.map((item) =>
        String(item._id || item.id) === String(id)
          ? { ...item, [field]: value }
          : item
      )
    )

    const data = new FormData()
    data.append("title", photo.title || "")
    data.append("category", photo.category || "Wedding")
    data.append("client", photo.client || "")
    data.append("date", photo.date || "")
    data.append(
      "featured",
      String(field === "featured" ? value : photo.featured)
    )
    data.append(
      "isPublic",
      String(field === "isPublic" ? value : photo.isPublic)
    )

    try {
      await api.put(`/gallery/${id}`, data, {
        headers: getHeaders(),
      })

      setNotice({
        type: "success",
        message:
          field === "featured"
            ? "Featured status updated."
            : "Visibility updated.",
      })
    } catch (error) {
      setGallery((previous) =>
        previous.map((item) =>
          String(item._id || item.id) === String(id)
            ? { ...item, [field]: !value }
            : item
        )
      )

      setNotice({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to update gallery item.",
      })
    }
  }

  const filteredGallery = gallery.filter((photo) => {
    const matchesSearch = [
      photo.title,
      photo.client,
      photo.category,
    ]
      .filter(Boolean)
      .some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      )

    const matchesCategory =
      categoryFilter === "All" ||
      photo.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const isVideo = (photo) =>
    photo.mediaType === "video" ||
    /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(
      photo.imageUrl || ""
    )

  return (
    <div className="min-h-screen bg-[#090a0c] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              MIDHUN FRAMES / CONTENT STUDIO
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Gallery
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Manage your photographs, films and featured work.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
          >
            <Plus size={18} />
            Add Media
          </button>
        </div>

        {notice.message && (
          <div
            className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              notice.type === "error"
                ? "border-red-400/20 bg-red-400/10 text-red-300"
                : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            }`}
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice({ type: "", message: "" })}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[
            {
              label: "Total Media",
              value: gallery.length,
              icon: Camera,
            },
            {
              label: "Featured",
              value: gallery.filter((item) => item.featured).length,
              icon: Star,
            },
            {
              label: "Videos",
              value: gallery.filter((item) => isVideo(item)).length,
              icon: Film,
            },
          ].map((stat) => {
            const Icon = stat.icon

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs text-white/45">
                    {stat.label}
                  </span>
                  <Icon size={17} className="text-slate-400" />
                </div>

                <p className="text-3xl font-semibold">
                  {stat.value}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, client or category..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-white/30"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#111214] px-4 py-3 text-sm outline-none focus:border-white/30"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-white/45">
            <LoaderCircle size={30} className="animate-spin" />
            <p className="text-sm">Loading your gallery...</p>
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 text-center">
            <ImagePlus size={36} className="mb-4 text-white/30" />
            <h2 className="text-lg font-medium">No media found</h2>
            <p className="mt-2 text-sm text-white/40">
              Add your first photograph or video to get started.
            </p>
            <button
              type="button"
              onClick={openAddForm}
              className="mt-5 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/5"
            >
              Add media
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredGallery.map((photo) => (
              <motion.article
                layout
                key={photo._id || photo.id}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111214]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  {isVideo(photo) ? (
                    <video
                      src={photo.imageUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  )}

                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded-md border border-white/10 bg-black/65 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/80 backdrop-blur">
                      {photo.category}
                    </span>

                    {photo.featured && (
                      <span className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-black">
                        <Star size={11} />
                        Featured
                      </span>
                    )}
                  </div>

                  {photo.isPublic === false && (
                    <span className="absolute bottom-3 left-3 rounded-md bg-black/75 px-2.5 py-1 text-[10px] text-white/80">
                      Hidden from public
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="truncate font-medium">
                      {photo.title}
                    </h3>

                    <p className="mt-1 truncate text-xs text-white/40">
                      {[photo.client, photo.date]
                        .filter(Boolean)
                        .join(" Â· ") || "Portrait / Personal work"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        updatePhoto(photo, "featured", !photo.featured)
                      }
                      title={
                        photo.featured
                          ? "Remove featured status"
                          : "Mark as featured"
                      }
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
                        photo.featured
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-white/10 text-white/55 hover:bg-white/5"
                      }`}
                    >
                      <Star size={14} />
                      Featured
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updatePhoto(
                          photo,
                          "isPublic",
                          photo.isPublic === false
                        )
                      }
                      title={
                        photo.isPublic === false
                          ? "Publish media"
                          : "Hide media"
                      }
                      className="rounded-lg border border-white/10 p-2 text-white/55 transition hover:bg-white/5 hover:text-white"
                    >
                      {photo.isPublic === false ? (
                        <EyeOff size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditForm(photo)}
                      title="Edit media"
                      className="rounded-lg border border-white/10 p-2 text-white/55 transition hover:bg-white/5 hover:text-white"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPhotoToDelete(photo)}
                      title="Delete media"
                      className="ml-auto rounded-lg border border-red-400/15 p-2 text-red-300/70 transition hover:bg-red-400/10 hover:text-red-300"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeForm()
            }}
          >
            <motion.div
              className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#101114] shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-7">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                    MIDHUN FRAMES
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {editingPhoto ? "Edit Media" : "Add to Gallery"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close form"
                  className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
                <div>
                  <label className="mb-2 block text-xs text-white/65">
                    Title <span className="text-red-300">*</span>
                  </label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    required
                    maxLength={150}
                    placeholder="Enter a gallery title"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/65">
                    Category <span className="text-red-300">*</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#151619] px-4 py-3 text-sm outline-none focus:border-white/30"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs text-white/65">
                      Date {!isPortrait && (
                        <span className="text-red-300">*</span>
                      )}
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={updateField}
                      required={!isPortrait}
                      disabled={isPortrait}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-35"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-white/65">
                      Client / Event {!isPortrait && (
                        <span className="text-red-300">*</span>
                      )}
                    </label>
                    <input
                      name="client"
                      value={form.client}
                      onChange={updateField}
                      required={!isPortrait}
                      disabled={isPortrait}
                      placeholder="Client or event name"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-35"
                    />
                  </div>
                </div>

                {isPortrait && (
                  <p className="text-xs leading-5 text-slate-400">
                    Date and Client/Event are optional for Portrait media.
                  </p>
                )}

                <div>
                  <label className="mb-2 block text-xs text-white/65">
                    Image / Video {!editingPhoto && (
                      <span className="text-red-300">*</span>
                    )}
                  </label>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-5 text-center transition hover:border-white/40 hover:bg-white/[0.04]">
                    {preview ? (
                      /\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(preview) ||
                      selectedFile?.type.startsWith("video/") ? (
                        <video
                          src={preview}
                          controls
                          playsInline
                          className="mb-3 max-h-64 w-full rounded-lg object-contain"
                        />
                      ) : (
                        <img
                          src={preview}
                          alt="Selected media preview"
                          className="mb-3 max-h-64 rounded-lg object-contain"
                        />
                      )
                    ) : (
                      <UploadCloud
                        size={30}
                        className="mb-3 text-white/40"
                      />
                    )}

                    <span className="text-sm text-white/80">
                      {selectedFile
                        ? selectedFile.name
                        : editingPhoto
                          ? "Choose replacement media"
                          : "Choose an image or video"}
                    </span>

                    <span className="mt-2 text-xs text-white/35">
                      Images: max 10 MB Â· Videos: max 100 MB
                    </span>

                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-5">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={form.featured}
                      onChange={updateField}
                      className="accent-white"
                    />
                    Featured media
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={form.isPublic}
                      onChange={updateField}
                      className="accent-white"
                    />
                    Visible on website
                  </label>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/65 transition hover:bg-white/5 disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving && (
                      <LoaderCircle size={16} className="animate-spin" />
                    )}
                    {editingPhoto ? "Save Changes" : "Upload Media"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploadStatus.visible && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-5 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#101114] p-8 text-center shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/70 to-transparent" />

              <div className="mb-6 flex justify-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  {uploadStatus.status === "success" ? (
                    <CheckCircle2
                      size={38}
                      className="text-emerald-400"
                    />
                  ) : uploadStatus.status === "error" ? (
                    <XCircle size={38} className="text-red-400" />
                  ) : (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-200"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Camera size={34} className="text-white" />
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
                MIDHUN FRAMES
              </p>

              <h2 className="text-2xl font-semibold">
                {uploadStatus.status === "success"
                  ? "Upload Complete"
                  : uploadStatus.status === "error"
                    ? "Upload Failed"
                    : "Creating Your Gallery"}
              </h2>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/55">
                {uploadStatus.message}
              </p>

              {uploadStatus.status === "uploading" && (
                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-center gap-2 text-xs text-white/55">
                    <UploadCloud size={15} />
                    Uploading your media securely
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full w-1/3 rounded-full bg-slate-200"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>

                  <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/30">
                    Please keep this window open
                  </p>
                </div>
              )}

              {uploadStatus.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() =>
                    setUploadStatus({
                      visible: false,
                      status: "uploading",
                      message: "",
                    })
                  }
                  className="mt-7 w-full rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  Continue
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {photoToDelete && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => {
            if (!deleteLoading) setPhotoToDelete(null)
          }}
          onConfirm={handleDelete}
          loading={deleteLoading}
          title="Delete Gallery Media"
          message={`Are you sure you want to permanently delete "${
            photoToDelete.title || "this gallery item"
          }"? This action cannot be undone.`}
        />
      )}
    </div>
  )
}

export default Gallery


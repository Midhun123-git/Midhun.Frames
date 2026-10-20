// src/Admin/Pages/About.jsx

import { useEffect, useRef, useState } from "react"
import api from "../../../src/api/api.js"
import {
  Upload,
  Trash2,
  Save,
  ImagePlus,
  X,
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

export default function About() {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const mainInputRef = useRef(null)
  const filmInputRef = useRef(null)
  const selectedInputRef = useRef(null)

  const [mainImage, setMainImage] = useState(null)
  const [filmImages, setFilmImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])

  const [form, setForm] = useState({
    heading: "",
    description: "",
    approachTitle: "",
    approachText: "",
    location: "",
    active: true,
  })

  useEffect(() => {
    fetchAbout()
  }, [])

  const fetchAbout = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await api.get(
        "/about",
        getAuthConfig()
      )

      const data = response.data.about

      if (data) {
        setAbout(data)

        setForm({
          heading: data.heading || "",
          description: data.description || "",
          approachTitle: data.approachTitle || "",
          approachText: data.approachText || "",
          location: data.location || "",
          active: data.active ?? true,
        })
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load About content"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleMainImage = (e) => {
    const file = e.target.files?.[0]

    if (file) {
      setMainImage(file)
    }

    e.target.value = ""
  }

  const handleFilmImages = (e) => {
    const files = Array.from(e.target.files || [])

    if (files.length) {
      setFilmImages((prev) => [...prev, ...files])
    }

    e.target.value = ""
  }

  const handleSelectedImages = (e) => {
    const files = Array.from(e.target.files || [])

    if (files.length) {
      setSelectedImages((prev) => [...prev, ...files])
    }

    e.target.value = ""
  }

  const removeNewFilmImage = (index) => {
    setFilmImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewSelectedImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const saveAbout = async () => {
    try {
      setSaving(true)
      setMessage("")
      setError("")

      const formData = new FormData()

      formData.append("heading", form.heading)
      formData.append("description", form.description)
      formData.append("approachTitle", form.approachTitle)
      formData.append("approachText", form.approachText)
      formData.append("location", form.location)
      formData.append("active", String(form.active))

      if (mainImage) {
        formData.append("mainImage", mainImage)
      }

      filmImages.forEach((file) => {
        formData.append("filmStripImages", file)
      })

      selectedImages.forEach((file) => {
        formData.append("selectedWorkImages", file)
      })

      const response = await api.put(
        "/about",
        formData,
        getAuthConfig()
      )

      setAbout(response.data.about)
      setMainImage(null)
      setFilmImages([])
      setSelectedImages([])

      setMessage("About content updated successfully")

      setTimeout(() => {
        setMessage("")
      }, 3000)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update About content"
      )
    } finally {
      setSaving(false)
    }
  }

  const deleteMainImage = async () => {
    if (!about?.mainImage?._id) return

    try {
      setError("")

      const response = await api.delete(
        "/about/main-image",
        getAuthConfig()
      )

      setAbout(response.data.about)
      setMessage("Main image deleted successfully")

      setTimeout(() => {
        setMessage("")
      }, 3000)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete main image"
      )
    }
  }

  const deleteFilmImage = async (id) => {
    try {
      setError("")

      const response = await api.delete(
        `/about/film-strip/${id}`,
        getAuthConfig()
      )

      setAbout(response.data.about)
      setMessage("Film strip image deleted successfully")

      setTimeout(() => {
        setMessage("")
      }, 3000)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete film strip image"
      )
    }
  }

  const deleteSelectedImage = async (id) => {
    try {
      setError("")

      const response = await api.delete(
        `/about/selected-work/${id}`,
        getAuthConfig()
      )

      setAbout(response.data.about)
      setMessage("Selected work image deleted successfully")

      setTimeout(() => {
        setMessage("")
      }, 3000)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete selected work image"
      )
    }
  }

  const getPreview = (file) => URL.createObjectURL(file)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            Midhun Frames
          </p>

          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight">
            About
          </h1>

          <p className="text-sm text-neutral-500 max-w-2xl">
            Manage the About section content and its three independent
            image collections.
          </p>
        </div>

        {message && (
          <div className="mb-6 border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-neutral-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <section className="border border-white/10 bg-white/[0.02]">
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                Content
              </p>

              <h2 className="mt-2 text-xl font-serif">
                About Information
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Heading
                </label>

                <input
                  type="text"
                  name="heading"
                  value={form.heading}
                  onChange={handleChange}
                  className="w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none transition focus:border-white/30"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Approach Title
                </label>

                <input
                  type="text"
                  name="approachTitle"
                  value={form.approachTitle}
                  onChange={handleChange}
                  className="w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full border border-white/10 bg-black px-4 py-3 text-sm outline-none transition focus:border-white/30"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Approach Text
                </label>

                <textarea
                  name="approachText"
                  value={form.approachText}
                  onChange={handleChange}
                  rows={3}
                  className="w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 outline-none transition focus:border-white/30"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  className="h-4 w-4 accent-white"
                />
                Show About section publicly
              </label>
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.02]">
            <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Image 01
                </p>

                <h2 className="mt-2 text-xl font-serif">
                  Main Portrait
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  One image used on the left side of the About section.
                </p>
              </div>

              <button
                type="button"
                onClick={() => mainInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 border border-white/15 px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition hover:bg-white hover:text-black"
              >
                <Upload size={15} />
                {about?.mainImage ? "Replace Image" : "Upload Image"}
              </button>

              <input
                ref={mainInputRef}
                type="file"
                accept="image/*"
                onChange={handleMainImage}
                className="hidden"
              />
            </div>

            <div className="p-5 sm:p-6">
              {mainImage ? (
                <div className="relative max-w-sm overflow-hidden border border-white/10">
                  <img
                    src={getPreview(mainImage)}
                    alt="New main preview"
                    className="aspect-[4/5] w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => setMainImage(null)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-black/80 transition hover:bg-white hover:text-black"
                  >
                    <X size={15} />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/75 px-3 py-2 text-xs">
                    New image ready to upload
                  </div>
                </div>
              ) : about?.mainImage?.url ? (
                <div className="relative max-w-sm overflow-hidden border border-white/10">
                  <img
                    src={about.mainImage.url}
                    alt="Main portrait"
                    className="aspect-[4/5] w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={deleteMainImage}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-black/80 transition hover:bg-white hover:text-black"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mainInputRef.current?.click()}
                  className="flex min-h-64 w-full max-w-sm flex-col items-center justify-center border border-dashed border-white/15 text-neutral-500 transition hover:border-white/30 hover:text-white"
                >
                  <ImagePlus size={28} strokeWidth={1.2} />
                  <span className="mt-3 text-xs uppercase tracking-[0.2em]">
                    Add Main Portrait
                  </span>
                </button>
              )}
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.02]">
            <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Image 02
                </p>

                <h2 className="mt-2 text-xl font-serif">
                  Film Strip
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  Multiple images used in the scrolling film strip.
                </p>
              </div>

              <button
                type="button"
                onClick={() => filmInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 border border-white/15 px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition hover:bg-white hover:text-black"
              >
                <Upload size={15} />
                Add Images
              </button>

              <input
                ref={filmInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilmImages}
                className="hidden"
              />
            </div>

            <div className="p-5 sm:p-6">
              {about?.filmStripImages?.length > 0 && (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {about.filmStripImages
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((image, index) => (
                      <div
                        key={image._id}
                        className="group relative overflow-hidden border border-white/10"
                      >
                        <img
                          src={image.url}
                          alt={`Film strip ${index + 1}`}
                          className="aspect-[3/4] w-full object-cover"
                        />

                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/75 px-2 py-2">
                          <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <button
                            type="button"
                            onClick={() => deleteFilmImage(image._id)}
                            className="text-neutral-400 transition hover:text-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {filmImages.length > 0 && (
                <div className="border-t border-white/10 pt-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                        New Images
                      </p>

                      <p className="mt-1 text-xs text-neutral-600">
                        These will be uploaded when you save.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFilmImages([])}
                      className="text-xs text-neutral-500 transition hover:text-white"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filmImages.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative overflow-hidden border border-white/10"
                      >
                        <img
                          src={getPreview(file)}
                          alt={file.name}
                          className="aspect-[3/4] w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeNewFilmImage(index)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-black/80 transition hover:bg-white hover:text-black"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!about?.filmStripImages?.length && !filmImages.length && (
                <button
                  type="button"
                  onClick={() => filmInputRef.current?.click()}
                  className="flex min-h-48 w-full flex-col items-center justify-center border border-dashed border-white/15 text-neutral-500 transition hover:border-white/30 hover:text-white"
                >
                  <ImagePlus size={28} strokeWidth={1.2} />
                  <span className="mt-3 text-xs uppercase tracking-[0.2em]">
                    Add Film Strip Images
                  </span>
                </button>
              )}
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.02]">
            <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Image 03
                </p>

                <h2 className="mt-2 text-xl font-serif">
                  Selected Work
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  Multiple images used in the bottom animated gallery.
                </p>
              </div>

              <button
                type="button"
                onClick={() => selectedInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 border border-white/15 px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition hover:bg-white hover:text-black"
              >
                <Upload size={15} />
                Add Images
              </button>

              <input
                ref={selectedInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleSelectedImages}
                className="hidden"
              />
            </div>

            <div className="p-5 sm:p-6">
              {about?.selectedWorkImages?.length > 0 && (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {about.selectedWorkImages
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((image, index) => (
                      <div
                        key={image._id}
                        className="group relative overflow-hidden border border-white/10"
                      >
                        <img
                          src={image.url}
                          alt={`Selected work ${index + 1}`}
                          className="aspect-[4/3] w-full object-cover"
                        />

                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/75 px-2 py-2">
                          <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              deleteSelectedImage(image._id)
                            }
                            className="text-neutral-400 transition hover:text-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {selectedImages.length > 0 && (
                <div className="border-t border-white/10 pt-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                        New Images
                      </p>

                      <p className="mt-1 text-xs text-neutral-600">
                        These will be uploaded when you save.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedImages([])}
                      className="text-xs text-neutral-500 transition hover:text-white"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {selectedImages.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="relative overflow-hidden border border-white/10"
                      >
                        <img
                          src={getPreview(file)}
                          alt={file.name}
                          className="aspect-[4/3] w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeNewSelectedImage(index)
                          }
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-black/80 transition hover:bg-white hover:text-black"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!about?.selectedWorkImages?.length &&
                !selectedImages.length && (
                  <button
                    type="button"
                    onClick={() =>
                      selectedInputRef.current?.click()
                    }
                    className="flex min-h-48 w-full flex-col items-center justify-center border border-dashed border-white/15 text-neutral-500 transition hover:border-white/30 hover:text-white"
                  >
                    <ImagePlus size={28} strokeWidth={1.2} />
                    <span className="mt-3 text-xs uppercase tracking-[0.2em]">
                      Add Selected Work Images
                    </span>
                  </button>
                )}
            </div>
          </section>

          <div className="flex justify-end border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={saveAbout}
              disabled={saving}
              className="inline-flex min-w-44 items-center justify-center gap-2 bg-white px-6 py-3 text-xs uppercase tracking-[0.18em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

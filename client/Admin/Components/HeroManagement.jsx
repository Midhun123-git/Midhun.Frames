
import { useEffect, useState } from "react";
import {
  ImagePlus,
  Save,
  RefreshCw,
  Eye,
  Upload,
  Type,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import api from "../../src/api/api.js";

const initialForm = {
  eyebrow: "PHOTOGRAPHY & FILM",
  heading: "Midhun\nFrames",
  subheading: "Cinematic Reality Ã— Personal Imagination",
  description:
    "Stories captured with creativity, emotion, and a cinematic eye.",
};

export default function HeroManagement() {
  const [form, setForm] = useState(initialForm);
  const [heroData, setHeroData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const fetchHero = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.get("/hero");
      const data = response.data?.data;

      if (data) {
        setHeroData(data);

        setForm({
          eyebrow: data.eyebrow ?? initialForm.eyebrow,
          heading: data.heading ?? initialForm.heading,
          subheading: data.subheading ?? initialForm.subheading,
          description:
            data.description ?? initialForm.description,
        });

        setImagePreview(data.imageUrl || "");
        setSelectedImage(null);
      }
    } catch (error) {
      console.error("Failed to load Hero content:", error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to load Hero content.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHero();
  }, []);

  useEffect(() => {
    if (!selectedImage) return;

    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please select a valid image file.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Image size must not exceed 20 MB.",
      });
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setMessage({ type: "", text: "" });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setMessage({
          type: "error",
          text: "Admin token not found. Please log in again.",
        });
        return;
      }

      const formData = new FormData();

      // Only the editable Hero content is managed here.
      formData.append("eyebrow", form.eyebrow);
      formData.append("heading", form.heading);
      formData.append("subheading", form.subheading);
      formData.append("description", form.description);

      // Preserve fixed frontend button values for backend compatibility.
      formData.append(
        "buttonText",
        heroData?.buttonText || "Explore My Work"
      );
      formData.append(
        "buttonLink",
        heroData?.buttonLink || "/portfolio"
      );

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await api.put("/hero", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedData = response.data?.data;

      if (updatedData) {
        setHeroData(updatedData);

        setForm({
          eyebrow: updatedData.eyebrow ?? form.eyebrow,
          heading: updatedData.heading ?? form.heading,
          subheading: updatedData.subheading ?? form.subheading,
          description:
            updatedData.description ?? form.description,
        });

        setImagePreview(updatedData.imageUrl || imagePreview);
      }

      setSelectedImage(null);

      setMessage({
        type: "success",
        text:
          response.data?.message ||
          "Hero section updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save Hero content:", error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save Hero content. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#101116] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/10";

  const labelClass =
    "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-400";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#08090d] text-slate-300">
        <div className="flex items-center gap-3">
          <LoaderCircle size={20} className="animate-spin" />
          <span className="text-sm">Loading Hero Management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090d] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">
              <Sparkles size={13} />
              Website Content
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Hero Management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Manage the hero text and background image displayed
              on your public photography portfolio.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHero}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={15} />
            Reload Content
          </button>
        </div>

        {/* Status message */}
        {message.text && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300"
                : "border-red-500/20 bg-red-500/[0.07] text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}

            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-[1fr_0.9fr]">
            {/* Left: Editable content */}
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f14]">
                <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-400/10 text-slate-300">
                    <Type size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold">
                      Hero Content
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Text fields editable from the admin panel
                    </p>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <div>
                    <label htmlFor="eyebrow" className={labelClass}>
                      Eyebrow
                    </label>

                    <input
                      id="eyebrow"
                      name="eyebrow"
                      value={form.eyebrow}
                      onChange={handleChange}
                      placeholder="PHOTOGRAPHY & FILM"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="heading" className={labelClass}>
                      Main Heading
                    </label>

                    <textarea
                      id="heading"
                      name="heading"
                      value={form.heading}
                      onChange={handleChange}
                      placeholder={"Midhun\nFrames"}
                      rows={3}
                      className={`${inputClass} resize-y text-base font-medium leading-relaxed sm:text-lg`}
                    />

                    <p className="mt-2 text-[11px] text-slate-500">
                      Use a new line to split the heading across lines.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="subheading" className={labelClass}>
                      Subheading
                    </label>

                    <input
                      id="subheading"
                      name="subheading"
                      value={form.subheading}
                      onChange={handleChange}
                      placeholder="Cinematic Reality Ã— Personal Imagination"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className={labelClass}>
                      Description
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Enter your Hero description"
                      rows={4}
                      className={`${inputClass} resize-y leading-7`}
                    />
                  </div>
                </div>
              </section>

              {/* Fixed button information */}
              <section className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-400/10 text-slate-300">
                    <Eye size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold">
                      Fixed Frontend Buttons
                    </h2>

                    <p className="mt-2 text-xs leading-6 text-slate-400">
                      Button labels and destinations are not editable
                      here. They remain fixed in the public Hero component.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
                        <p className="text-xs font-medium text-white">
                          Explore My Work
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          /portfolio
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
                        <p className="text-xs font-medium text-white">
                          Discover more
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          #about
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right: Background image */}
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f14]">
                <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-400/10 text-slate-300">
                    <ImagePlus size={17} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold">
                      Background Image
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Change the public Hero background
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#07080b]">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Hero background preview"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                        <ImagePlus size={32} strokeWidth={1.2} />
                        <p className="text-xs">
                          No background image available
                        </p>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                    <div className="absolute bottom-4 left-4">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-white/70">
                        MIDHUN FRAMES
                      </p>
                      <p className="mt-1 text-xs text-white/90">
                        Hero Image Preview
                      </p>
                    </div>
                  </div>

                  <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-7 text-center transition hover:border-slate-400/50 hover:bg-white/[0.04]">
                    <Upload
                      size={21}
                      className="mb-3 text-slate-300"
                    />

                    <span className="text-sm font-medium text-white">
                      {selectedImage
                        ? "Choose another image"
                        : "Upload a new image"}
                    </span>

                    <span className="mt-2 text-xs text-slate-500">
                      Image files only Â· Maximum 20 MB
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>

                  {selectedImage && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-slate-200">
                          {selectedImage.name}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {(
                            selectedImage.size /
                            (1024 * 1024)
                          ).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="shrink-0 text-xs text-slate-400 transition hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Save action */}
              <section className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-5 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <FileText
                    size={18}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <div>
                    <h2 className="text-sm font-semibold">
                      Publish Hero Changes
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Save your text and image updates to the existing
                      Hero API.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-3.5 text-sm font-semibold text-[#080b10] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Hero Changes
                    </>
                  )}
                </button>
              </section>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


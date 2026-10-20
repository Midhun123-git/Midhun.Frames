
import React, { useEffect, useMemo, useState } from "react"
import api from "../../../src/api/api.js"
import DeleteConfirmModal from "../../../src/Components/DeleteConfirmModel.jsx"
import {
  Search,
  Star,
  Trash2,
  Eye,
  X,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react"

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)

  const [reply, setReply] = useState("")
  const [replyLoading, setReplyLoading] = useState(false)

  const [loading, setLoading] = useState(true)

  // DELETE CONFIRMATION
  const [reviewToDelete, setReviewToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "â€”"

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // ==========================================
  // FETCH REVIEWS
  // ==========================================

  const fetchReviews = async () => {
    try {
      setLoading(true)

      const response = await api.get(
        "/reviews",
        getAuthConfig()
      )

      const formattedReviews = response.data.reviews.map((review) => ({
        ...review,
        id: review._id,
      }))

      setReviews(formattedReviews)
    } catch (error) {
      console.error("Fetch reviews error:", error)

      alert(
        error.response?.data?.message ||
          "Failed to fetch reviews."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  // ==========================================
  // FILTER REVIEWS
  // ==========================================

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const searchValue = search.toLowerCase()

      const matchesSearch =
        review.client?.toLowerCase().includes(searchValue) ||
        review.service?.toLowerCase().includes(searchValue) ||
        review.review?.toLowerCase().includes(searchValue) ||
        review.email?.toLowerCase().includes(searchValue)

      const matchesStatus =
        statusFilter === "All" ||
        review.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [reviews, search, statusFilter])

  // ==========================================
  // STATS
  // ==========================================

  const published = reviews.filter(
    (review) => review.status === "Published"
  ).length

  const pending = reviews.filter(
    (review) => review.status === "Pending"
  ).length

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0"

  // ==========================================
  // OPEN DETAILS
  // ==========================================

  const openDetails = (review) => {
    setSelectedReview(review)
    setReply(review.adminReply || "")
    setDetailsOpen(true)
  }

  // ==========================================
  // UPDATE REVIEW LOCALLY
  // ==========================================

  const updateReviewInState = (updatedReview) => {
    const formattedReview = {
      ...updatedReview,
      id: updatedReview._id,
    }

    setReviews((prev) =>
      prev.map((review) =>
        review.id === formattedReview.id
          ? formattedReview
          : review
      )
    )

    if (selectedReview?.id === formattedReview.id) {
      setSelectedReview(formattedReview)
    }
  }

  // ==========================================
  // TOGGLE FEATURED
  // ==========================================

  const toggleFeatured = async (review) => {
    try {
      const response = await api.put(
        `/reviews/${review.id}`,
        {
          featured: !review.featured,
        },
        getAuthConfig()
      )

      updateReviewInState(response.data.review)
    } catch (error) {
      console.error("Toggle featured error:", error)

      alert(
        error.response?.data?.message ||
          "Failed to update featured status."
      )
    }
  }

  // ==========================================
  // TOGGLE STATUS
  // ==========================================

  const toggleStatus = async (review) => {
    const newStatus =
      review.status === "Published"
        ? "Pending"
        : "Published"

    try {
      const response = await api.put(
        `/reviews/${review.id}`,
        {
          status: newStatus,
        },
        getAuthConfig()
      )

      updateReviewInState(response.data.review)
    } catch (error) {
      console.error("Toggle status error:", error)

      alert(
        error.response?.data?.message ||
          "Failed to update review status."
      )
    }
  }

  // ==========================================
  // SEND ADMIN REPLY
  // ==========================================

  const sendReply = async () => {
    if (!selectedReview) return

    if (!reply.trim()) {
      alert("Please enter a reply.")
      return
    }

    try {
      setReplyLoading(true)

      const response = await api.put(
        `/reviews/${selectedReview.id}`,
        {
          adminReply: reply.trim(),
        },
        getAuthConfig()
      )

      updateReviewInState(response.data.review)

      setReply(response.data.review.adminReply || "")

      alert("Reply saved successfully.")
    } catch (error) {
      console.error("Send reply error:", error)

      alert(
        error.response?.data?.message ||
          "Failed to send reply."
      )
    } finally {
      setReplyLoading(false)
    }
  }

  // ==========================================
  // OPEN DELETE CONFIRMATION
  // ==========================================

  const confirmDeleteReview = (review) => {
    if (!review || deleteLoading) return
    setReviewToDelete(review)
  }

  // ==========================================
  // DELETE REVIEW
  // ==========================================

  const deleteReview = async () => {
    if (!reviewToDelete || deleteLoading) return

    const deletingId = reviewToDelete.id

    try {
      setDeleteLoading(true)

      await api.delete(
        `/reviews/${deletingId}`,
        getAuthConfig()
      )

      setReviews((prev) =>
        prev.filter((review) => review.id !== deletingId)
      )

      if (selectedReview?.id === deletingId) {
        setSelectedReview(null)
        setDetailsOpen(false)
      }

      setReviewToDelete(null)
    } catch (error) {
      console.error("Delete review error:", error)

      alert(
        error.response?.data?.message ||
          "Failed to delete review."
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  // ==========================================
  // RENDER STARS
  // ==========================================

  const renderStars = (rating, size = 15) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={
              star <= Number(rating)
                ? "fill-[#d6b36a] text-[#d6b36a]"
                : "text-white/20"
            }
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#d6b36a]">
          Photography
        </p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Client Reviews
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Review customer feedback, manage
          publication status, feature selected
          testimonials, and respond to clients.
        </p>
      </div>

      {/* INFO NOTICE */}

      <div className="flex items-start gap-3 rounded-xl border border-[#d6b36a]/15 bg-[#d6b36a]/[0.04] p-4">
        <MessageSquare
          size={18}
          className="mt-0.5 shrink-0 text-[#d6b36a]"
        />

        <div>
          <p className="text-sm font-medium text-white/80">
            Customer reviews are protected
          </p>

          <p className="mt-1 text-xs leading-5 text-white/40">
            Original customer ratings and review
            content cannot be edited by admin.
            You can moderate, feature, reply to,
            or remove reviews.
          </p>
        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">
            Total Reviews
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {reviews.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">
            Published
          </p>
          <p className="mt-3 text-2xl font-semibold text-green-400">
            {published}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">
            Pending
          </p>
          <p className="mt-3 text-2xl font-semibold text-yellow-400">
            {pending}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-widest text-white/40">
            Average Rating
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl font-semibold">
              {averageRating}
            </span>

            <Star
              size={18}
              className="fill-[#d6b36a] text-[#d6b36a]"
            />
          </div>
        </div>
      </div>

      {/* FILTERS */}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            type="text"
            placeholder="Search client, service, email or review..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d6b36a]/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#0b0b0b] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="All">All Status</option>
          <option value="Published">Published</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* LOADING */}

      {loading && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
          Loading reviews...
        </div>
      )}

      {/* DESKTOP TABLE */}

      {!loading && (
        <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-white/10 bg-white/[0.03]">
                <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-5 py-4">Client</th>
                  <th className="px-5 py-4">Service</th>
                  <th className="px-5 py-4">Rating</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Featured</th>
                  <th className="px-5 py-4">Reply</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-5 py-5">
                      <p className="font-medium">{review.client}</p>
                      <p className="mt-1 text-xs text-white/40">
                        {formatDate(review.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-5 text-sm text-white/60">
                      {review.service || "Not specified"}
                    </td>

                    <td className="px-5 py-5">
                      {renderStars(review.rating)}
                    </td>

                    <td className="px-5 py-5">
                      <button
                        onClick={() => toggleStatus(review)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
                          review.status === "Published"
                            ? "bg-green-400/10 text-green-400"
                            : "bg-yellow-400/10 text-yellow-400"
                        }`}
                      >
                        {review.status === "Published" ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <Clock3 size={13} />
                        )}
                        {review.status}
                      </button>
                    </td>

                    <td className="px-5 py-5">
                      <button
                        onClick={() => toggleFeatured(review)}
                        className={`inline-flex items-center gap-1.5 text-xs transition ${
                          review.featured
                            ? "text-[#d6b36a]"
                            : "text-white/30 hover:text-white/60"
                        }`}
                      >
                        <Sparkles size={14} />
                        {review.featured ? "Featured" : "Normal"}
                      </button>
                    </td>

                    <td className="px-5 py-5">
                      {review.adminReply?.trim() ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                          <CheckCircle2 size={13} />
                          Replied
                        </span>
                      ) : (
                        <span className="text-xs text-white/30">
                          No reply
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDetails(review)}
                          title="View & Reply"
                          className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => confirmDeleteReview(review)}
                          title="Delete Review"
                          className="rounded-lg border border-red-400/10 p-2 text-red-400/60 transition hover:bg-red-400/10 hover:text-red-400"
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

          {filteredReviews.length === 0 && (
            <div className="p-10 text-center text-sm text-white/40">
              No reviews found.
            </div>
          )}
        </div>
      )}

      {/* MOBILE CARDS */}

      {!loading && (
        <div className="space-y-4 md:hidden">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{review.client}</h3>
                  <p className="mt-1 text-xs text-white/40">
                    {review.service || "Not specified"}
                  </p>
                </div>

                {renderStars(review.rating, 14)}
              </div>

              <p className="mt-4 text-sm leading-6 text-white/60">
                "{review.review}"
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => toggleStatus(review)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    review.status === "Published"
                      ? "bg-green-400/10 text-green-400"
                      : "bg-yellow-400/10 text-yellow-400"
                  }`}
                >
                  {review.status}
                </button>

                <button
                  onClick={() => toggleFeatured(review)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    review.featured
                      ? "bg-[#d6b36a]/10 text-[#d6b36a]"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {review.featured ? "Featured" : "Normal"}
                </button>
              </div>

              <div className="mt-4 text-xs text-white/30">
                Submitted {formatDate(review.createdAt)}
              </div>

              <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
                <button
                  onClick={() => openDetails(review)}
                  className="flex-1 rounded-lg border border-white/10 py-2.5 text-xs text-white/60 transition hover:border-[#d6b36a]/40 hover:text-[#d6b36a]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Eye size={15} />
                    View & Reply
                  </span>
                </button>

                <button
                  onClick={() => confirmDeleteReview(review)}
                  title="Delete Review"
                  className="rounded-lg border border-red-400/10 px-3 text-red-400/60 transition hover:bg-red-400/10 hover:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="rounded-xl border border-white/10 p-10 text-center text-sm text-white/40">
              No reviews found.
            </div>
          )}
        </div>
      )}

      {/* REVIEW DETAILS + REPLY MODAL */}

      {detailsOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0b0b]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#d6b36a]/10 p-2 text-[#d6b36a]">
                  <MessageSquare size={18} />
                </div>

                <div>
                  <h2 className="font-semibold">Review Details</h2>
                  <p className="text-xs text-white/40">
                    View customer feedback & reply
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailsOpen(false)}
                className="text-white/40 transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/30">
                      Customer
                    </p>
                    <p className="mt-2 text-lg font-medium">
                      {selectedReview.client}
                    </p>

                    {selectedReview.email && (
                      <p className="mt-1 text-sm text-white/40">
                        {selectedReview.email}
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xs uppercase tracking-widest text-white/30">
                      Submitted
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {formatDate(selectedReview.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-xs uppercase tracking-widest text-white/30">
                    Service
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    {selectedReview.service || "Not specified"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-xs uppercase tracking-widest text-white/30">
                    Customer Rating
                  </p>
                  <div className="mt-2">
                    {renderStars(selectedReview.rating, 18)}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-white/30">
                    Customer Review
                  </p>
                  <span className="text-[10px] uppercase tracking-widest text-white/20">
                    Read Only
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-sm leading-7 text-white/70">
                    "{selectedReview.review}"
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-widest text-white/30">
                    Publication
                  </p>

                  <button
                    onClick={() => toggleStatus(selectedReview)}
                    className={`mt-3 rounded-full px-3 py-1.5 text-xs ${
                      selectedReview.status === "Published"
                        ? "bg-green-400/10 text-green-400"
                        : "bg-yellow-400/10 text-yellow-400"
                    }`}
                  >
                    {selectedReview.status}
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-widest text-white/30">
                    Featured
                  </p>

                  <button
                    onClick={() => toggleFeatured(selectedReview)}
                    className={`mt-3 inline-flex items-center gap-2 text-xs ${
                      selectedReview.featured
                        ? "text-[#d6b36a]"
                        : "text-white/40"
                    }`}
                  >
                    <Sparkles size={14} />
                    {selectedReview.featured
                      ? "Featured on website"
                      : "Normal review"}
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/30">
                      Admin Reply
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Respond professionally to the customer.
                    </p>
                  </div>

                  {selectedReview.adminReply?.trim() && (
                    <span className="text-xs text-green-400">
                      Replied
                    </span>
                  )}
                </div>

                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={5}
                  placeholder="Write a professional reply to the customer..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#d6b36a]/50"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={sendReply}
                    disabled={replyLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#d6b36a] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e4c47d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={15} />
                    {replyLoading
                      ? "Saving..."
                      : selectedReview.adminReply?.trim()
                      ? "Update Reply"
                      : "Send Reply"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 p-5">
              <button
                onClick={() => confirmDeleteReview(selectedReview)}
                className="inline-flex items-center gap-2 text-xs text-red-400/60 transition hover:text-red-400"
              >
                <Trash2 size={14} />
                Delete Review
              </button>

              <button
                onClick={() => setDetailsOpen(false)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL â€” ADMIN ONLY */}

      {reviewToDelete && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => {
            if (!deleteLoading) {
              setReviewToDelete(null)
            }
          }}
          onConfirm={deleteReview}
          loading={deleteLoading}
          title="Delete Review"
          message={`Are you sure you want to permanently delete the review from ${
            reviewToDelete.client || "this customer"
          }? This action cannot be undone.`}
        />
      )}

      {/* STYLES */}

      <style>{`
        select option {
          background: #0b0b0b;
          color: white;
        }
      `}</style>
    </div>
  )
}

export default Reviews


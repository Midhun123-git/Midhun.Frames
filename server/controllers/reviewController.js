
const Review = require("../models/Review");
const protectUser = require("../middleware/userMiddleware");


const createReview = async (req, res) => {
  try {
    const { service, rating, review } = req.body || {};

    // Service is optional; rating and review are required.
    if (
      rating === undefined ||
      rating === null ||
      typeof review !== "string" ||
      !review.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating and review are required.",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number between 1 and 5.",
      });
    }

    if (
      service !== undefined &&
      service !== null &&
      typeof service !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid service.",
      });
    }

    // The authenticated user supplies their own identity.
    const user = req.user;

    const profilePicture =
      user.profilePicture ||
      user.picture ||
      user.avatar ||
      user.photoURL ||
      "";

    const newReview = await Review.create({
      client: user.name,
      email: user.email,
      profilePicture,
      service: typeof service === "string" ? service.trim() : "",
      rating: numericRating,
      review: review.trim(),
      status: "Pending",
      featured: false,
      adminReply: "",
    });

    return res.status(201).json({
      success: true,
      message:
        "Review submitted successfully. It will be reviewed before publishing.",
      review: newReview,
    });
  } catch (error) {
    console.error("Create review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit review.",
    });
  }
};


const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews.",
    });
  }
};

const getPublicReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      status: "Published",
    })
      .sort({
        featured: -1,
        createdAt: -1,
      })
      .select(
        "client service rating review profilePicture adminReply repliedAt featured createdAt"
      )
      .lean();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get public reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch public reviews.",
    });
  }
};

const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Get review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch review.",
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const {
      status,
      featured,
      adminReply,
      client,
      email,
      service,
      rating,
      review,
      profilePicture,
    } = req.body || {};

    if (
      client !== undefined ||
      email !== undefined ||
      service !== undefined ||
      rating !== undefined ||
      review !== undefined ||
      profilePicture !== undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer review details, including the profile picture, cannot be modified.",
      });
    }

    const updateData = {};

    if (status !== undefined) {
      if (!["Pending", "Published"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review status.",
        });
      }

      updateData.status = status;
    }

    if (featured !== undefined) {
      if (typeof featured !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Featured must be true or false.",
        });
      }

      updateData.featured = featured;
    }

    if (adminReply !== undefined) {
      if (typeof adminReply !== "string") {
        return res.status(400).json({
          success: false,
          message: "Admin reply must be text.",
        });
      }

      updateData.adminReply = adminReply.trim();
      updateData.repliedAt = updateData.adminReply
        ? new Date()
        : null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Only status, featured and admin reply can be updated.",
      });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Update review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update review.",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(
      req.params.id
    );

    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete review.",
    });
  }
};

module.exports = {
  createReview,
  getReviews,
  getPublicReviews,
  getReviewById,
  updateReview,
  deleteReview,
};

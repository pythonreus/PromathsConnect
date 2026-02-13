import Feedback from "../models/Feedback.js";
import User from "../models/users.js";
import crypto from 'crypto';

/**
 * POST /api/feedback
 * Submit feedback (authenticated users only)
 * This is the ONLY way to create feedback - no public submissions
 */
export const submitFeedback = async (req, res, next) => {
  console.log("i am hit submitFeedback");
  try {
    const { type, category, content, title, rating } = req.body;

    // Validate required fields
    if (!type || !content) {
      return res.status(400).json({
        success: false,
        error: "MISSING_FIELDS",
        message: "Feedback type and content are required"
      });
    }

    // Validate content length
    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "CONTENT_TOO_LONG",
        message: "Feedback cannot exceed 2000 characters"
      });
    }

    // Get the MongoDB user
    const user = await getMongoUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User not found in database"
      });
    }

    // Create feedback - submittedBy is stored but NEVER returned
    const feedback = new Feedback({
      type,
      category: category || "other",
      content,
      title: title || null,
      rating: type === "review" ? rating : undefined,
      submittedBy: user._id,
      userRole: user.role,
      status: "pending",
      anonymousId: generateAnonymousId(user._id.toString())
    });

    await feedback.save();

    // Return success WITHOUT exposing who submitted it
    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully. Thank you for your input!",
      data: {
        id: feedback._id,
        displayId: feedback.displayId,
        type: feedback.type,
        category: feedback.category,
        title: feedback.title,
        content: feedback.content,
        rating: feedback.rating,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    });

  } catch (error) {
    console.error("❌ submitFeedback:", error);
    return res.status(500).json({
      success: false,
      error: "FEEDBACK_SUBMIT_FAILED",
      message: error.message || "Failed to submit feedback"
    });
  }
};

/**
 * GET /api/feedback/admin
 * Get all feedback for admin dashboard (ANONYMIZED)
 * Admin only - no user info returned
 */
export const getAdminFeedback = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    
    const { type, status, category, search } = req.query;

    // Build query - NEVER return submittedBy
    let query = {};

    // Filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;

    // Search in content and title
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } }
      ];
    }

    // Get total count
    const total = await Feedback.countDocuments(query);

    // Get feedback - explicitly exclude submittedBy and metadata
    const feedback = await Feedback.find(query)
      .select("-submittedBy -anonymousId -userRole -resolvedBy") // NEVER expose user info
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add anonymous display IDs
    const anonymizedFeedback = feedback.map(item => ({
      ...item,
      displayId: `FB-${item._id.toString().slice(-6).toUpperCase()}`,
      submittedBy: undefined, // Extra safety
      anonymousId: undefined,
      userRole: undefined,
      metadata: undefined
    }));

    // Get statistics
    const stats = await fetchFeedbackStats();

    return res.status(200).json({
      success: true,
      data: anonymizedFeedback,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      filters: {
        type: type || null,
        status: status || null,
        category: category || null,
        search: search || null
      },
      stats
    });

  } catch (error) {
    console.error("❌ getAdminFeedback:", error);
    return res.status(500).json({
      success: false,
      error: "FEEDBACK_FETCH_FAILED",
      message: error.message || "Failed to fetch feedback"
    });
  }
};

/**
 * GET /api/feedback/admin/:id
 * Get single feedback by ID (anonymized)
 * Admin only
 */
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id)
      .select("-submittedBy -anonymousId -userRole -resolvedBy")
      .lean();

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Feedback not found"
      });
    }

    // Add anonymous display ID
    feedback.displayId = `FB-${feedback._id.toString().slice(-6).toUpperCase()}`;

    return res.status(200).json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error("❌ getFeedbackById:", error);
    return res.status(500).json({
      success: false,
      error: "FEEDBACK_FETCH_FAILED",
      message: error.message || "Failed to fetch feedback"
    });
  }
};

/**
 * PUT /api/feedback/admin/:id/status
 * Update feedback status (admin only)
 */
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Get admin user
    const admin = await getMongoUserFromRequest(req);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User not found in database"
      });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Feedback not found"
      });
    }

    // Update status and add timestamps
    feedback.status = status;
    
    if (status === "acknowledged") {
      feedback.acknowledgedAt = new Date();
    } else if (status === "resolved") {
      feedback.resolvedAt = new Date();
      feedback.resolvedBy = admin._id;
    } else if (status === "reviewed") {
      feedback.reviewedAt = new Date();
    }

    // Add admin notes if provided
    if (adminNotes) {
      feedback.adminNotes = adminNotes;
    }

    await feedback.save();

    return res.status(200).json({
      success: true,
      message: `Feedback marked as ${status}`,
      data: {
        _id: feedback._id,
        status: feedback.status,
        adminNotes: feedback.adminNotes,
        acknowledgedAt: feedback.acknowledgedAt,
        resolvedAt: feedback.resolvedAt,
        reviewedAt: feedback.reviewedAt
      }
    });

  } catch (error) {
    console.error("❌ updateFeedbackStatus:", error);
    return res.status(500).json({
      success: false,
      error: "FEEDBACK_UPDATE_FAILED",
      message: error.message || "Failed to update feedback status"
    });
  }
};

/**
 * GET /api/feedback/admin/stats
 * Get feedback statistics (admin only)
 */
export const getFeedbackStats = async (req, res) => {
  try {
    const stats = await fetchFeedbackStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("❌ getFeedbackStats:", error);
    return res.status(500).json({
      success: false,
      error: "STATS_FETCH_FAILED",
      message: error.message || "Failed to fetch feedback statistics"
    });
  }
};

/**
 * GET /api/feedback/user/my-feedback
 * Get user's own feedback (shows what they submitted)
 */
export const getMyFeedback = async (req, res) => {
  try {
    const user = await getMongoUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "User not found in database"
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const query = { submittedBy: user._id };
    const total = await Feedback.countDocuments(query);
    
    const feedback = await Feedback.find(query)
      .select("-submittedBy -anonymousId -userRole -resolvedBy")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const anonymized = feedback.map(item => ({
      ...item,
      displayId: `FB-${item._id.toString().slice(-6).toUpperCase()}`
    }));

    return res.status(200).json({
      success: true,
      data: anonymized,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        perPage: limit
      }
    });

  } catch (error) {
    console.error("❌ getMyFeedback:", error);
    return res.status(500).json({
      success: false,
      error: "FEEDBACK_FETCH_FAILED",
      message: error.message || "Failed to fetch your feedback"
    });
  }
};

// ============ HELPER FUNCTIONS ============

/**
 * Helper function to get MongoDB user from request
 */
async function getMongoUserFromRequest(req) {
  if (req.user && req.user._id) {
    return req.user;
  }
  
  if (req.firebaseUser?.uid) {
    const user = await User.findOne({ firebaseId: req.firebaseUser.uid });
    if (user) return user;
  }
  
  if (req.firebaseUser?.email) {
    const user = await User.findOne({ email: req.firebaseUser.email });
    if (user) return user;
  }
  
  return null;
}

/**
 * Generate anonymous ID from user ID
 */
function generateAnonymousId(userId) {
  return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
}

/**
 * Get feedback statistics
 */
async function fetchFeedbackStats() {
  const [
    total,
    pending,
    reviewed,
    acknowledged,
    resolved,
    byType,
    byCategory,
    averageRating
  ] = await Promise.all([
    Feedback.countDocuments(),
    Feedback.countDocuments({ status: "pending" }),
    Feedback.countDocuments({ status: "reviewed" }),
    Feedback.countDocuments({ status: "acknowledged" }),
    Feedback.countDocuments({ status: "resolved" }),
    Feedback.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]),
    Feedback.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]),
    Feedback.aggregate([
      { $match: { type: "review", rating: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ])
  ]);

  return {
    total,
    byStatus: {
      pending,
      reviewed,
      acknowledged,
      resolved,
      archived: total - (pending + reviewed + acknowledged + resolved)
    },
    byType: byType.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    byCategory: byCategory.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    averageRating: averageRating[0]?.avg?.toFixed(1) || 0,
    responseRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
  };
}
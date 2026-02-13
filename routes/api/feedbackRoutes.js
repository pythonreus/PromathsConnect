import express from "express";
import {
  submitFeedback,
  getAdminFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getFeedbackStats,
  getMyFeedback
} from "../../controllers/feedbackController.js";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";

const router = express.Router();

/**
 * ============ PUBLIC ROUTES (Authenticated Users Only) ============
 */

// Submit feedback - ANY authenticated user
router.post(
  "/",
  verifyAuthToken,
  submitFeedback
);

// Get user's own feedback
router.get(
  "/my-feedback",
  verifyAuthToken,
  getMyFeedback
);

/**
 * ============ ADMIN ONLY ROUTES ============
 * All these routes are ANONYMIZED - no user info is returned
 */

// Get all feedback for admin dashboard (anonymized)
router.get(
  "/admin",
  verifyAuthToken,
  requireAdmin,
  getAdminFeedback
);

// Get feedback statistics
router.get(
  "/admin/stats",
  verifyAuthToken,
  requireAdmin,
  getFeedbackStats
);

// Get single feedback by ID (anonymized)
router.get(
  "/admin/:id",
  verifyAuthToken,
  requireAdmin,
  getFeedbackById
);

// Update feedback status
router.put(
  "/admin/:id/status",
  verifyAuthToken,
  requireAdmin,
  updateFeedbackStatus
);

export default router;
import express from "express";
import { getUsersPaginated } from "../../controllers/systemController.js";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";

const router = express.Router();

/**
 * GET /api/system/users
 * Admin only
 */
router.get(
  "/users",
  verifyAuthToken,
  requireAdmin,
  getUsersPaginated
);

export default router;

// routes/api/matchingRoutes.js
import express from "express";
import { matchMentorsAndMentees, getMatchingStats } from "../../controllers/matchingController.js";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";

const router = express.Router();

// Admin only routes
router.post("/run", verifyAuthToken,  matchMentorsAndMentees);
router.get("/stats", verifyAuthToken,  getMatchingStats);

export default router;
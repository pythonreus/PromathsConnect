import express from "express";
import { getUsersPaginated, adminLogin } from "../../controllers/systemController.js";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";
import { requirePreloadedUser } from "../../middleware/requirePreloadedUser.js";

const router = express.Router();

/**
 * GET /api/system/users
 * Admin only
 */
router.get("/users", verifyAuthToken,requireAdmin,getUsersPaginated);

router.post("/admin-login",verifyAuthToken, requirePreloadedUser, adminLogin);

export default router;

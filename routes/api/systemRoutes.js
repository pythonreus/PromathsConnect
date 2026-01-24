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

router.get("/me", verifyAuthToken, (req, res) => {
    // req.firebaseUser is populated by the verifyAuthToken middleware
    if (!req.firebaseUser) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    return res.status(200).json({
        user: req.firebaseUser
    });
});

router.get("/users", verifyAuthToken,requireAdmin,getUsersPaginated);

router.post("/admin-login", requirePreloadedUser, adminLogin);

router.post("/logout", (req, res) => {
    res.clearCookie("session");
    res.status(200).json({ message: "Logged out successfully" });
});

export default router;

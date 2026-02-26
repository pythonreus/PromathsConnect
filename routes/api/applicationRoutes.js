import express from "express";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";
import { createApplication, getApplicationsPaginated, getApplicationById, updateApplicationStatus } from "../../controllers/applicationsController.js";


const router = express.Router();

// POST /api/client/application
router.post("/", createApplication);
router.get("/",verifyAuthToken,requireAdmin, getApplicationsPaginated);
router.get("/:id",verifyAuthToken,requireAdmin, getApplicationById);
// Add to routes
router.patch("/:id/status", verifyAuthToken, requireAdmin, updateApplicationStatus);



export default router;



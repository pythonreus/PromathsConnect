import express from "express";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";
import { createApplication, getApplicationsPaginated, getApplicationById } from "../../controllers/applicationsController.js";


const router = express.Router();

// POST /api/client/application
router.post("/client/application",verifyAuthToken, createApplication);
router.get("/",verifyAuthToken,requireAdmin, getApplicationsPaginated);
router.get("/:id",verifyAuthToken,requireAdmin, getApplicationById);

export default router;



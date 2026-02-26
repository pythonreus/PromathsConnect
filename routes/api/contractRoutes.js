import express from "express";
import {
  getMyContract,
  agreeToContract,
  getAgreementStatus,
  getAllContracts,
  getAgreementsByRole,
  createOrUpdateContract,
  deactivateContract
} from "../../controllers/contractController.js";
import { verifyAuthToken } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";

const router = express.Router();

// ============ CLIENT ROUTES ============
router.get("/my-contract", verifyAuthToken, getMyContract);
router.post("/agree", verifyAuthToken, agreeToContract);
router.get("/status", verifyAuthToken, getAgreementStatus);

// ============ ADMIN ROUTES ============
router.get("/admin/all", verifyAuthToken, requireAdmin, getAllContracts);
router.get("/admin/agreements/:role", verifyAuthToken, requireAdmin, getAgreementsByRole);
router.post("/admin/create", verifyAuthToken, requireAdmin, createOrUpdateContract);
router.delete("/admin/:role", verifyAuthToken, requireAdmin, deactivateContract);

export default router;
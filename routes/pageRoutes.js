import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { verifyAuthToken } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Client home page
router.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "pages", "client", "index.html")
  );
});

// Admin login page
router.get("/login", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "pages", "admin", "admin-login.html")
  );
});

// client login page
router.get("/client-login", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "pages", "client", "client-login.html")
  );
});

// client login page
router.get("/client-dashboard",verifyAuthToken, (req, res) => {
  console.log("I got hit");
  res.sendFile(
    path.join(__dirname, "..", "public", "pages", "client", "client-dashboard.html")
  );
});

// Admin dashboard shell
router.get("/admin",verifyAuthToken,requireAdmin, (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "pages", "admin", "admin-dashboard.html")
  );
});

// Admin tabs (dashboard, applications, system, users, settings)
router.get("/admin/:tab",verifyAuthToken, requireAdmin, (req, res) => {
  const tab = req.params.tab;

  const tabPath = path.join(
    __dirname,
    "..",
    "public",
    "pages",
    "admin",
    "tabs",
    `${tab}-tab.html`
  );

  res.sendFile(tabPath, err => {
    if (err) {
      res.status(404).send("Tab not found");
    }
  });
});

export default router;

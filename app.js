import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import applicationRoutes from "./routes/api/applicationRoutes.js";
import systemRoutes from "./routes/api/systemRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/applications", applicationRoutes);
app.use("/api/system", systemRoutes);


// Page routes (HTML)
app.use("/", pageRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;

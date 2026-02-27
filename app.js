import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import cookieParser from "cookie-parser";
import cors from "cors";

import applicationRoutes from "./routes/api/applicationRoutes.js";
import systemRoutes from "./routes/api/systemRoutes.js";
import communicationRoutes from "./routes/api/communicationRoutes.js";
import feedbackRoutes from "./routes/api/feedbackRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import contractRoutes from "./routes/api/contractRoutes.js";
// In your app.js
import matchingRoutes from "./routes/api/matchingRoutes.js";

// Add this line



const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security middleware
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true                
}));
app.use(cookieParser());  

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/applications", applicationRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/communications",communicationRoutes);
app.use("/api/feedback",feedbackRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/matching", matchingRoutes);


// Page routes (HTML)
app.use("/", pageRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware for JSON and serving static assets (JS/CSS/images)
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public","pages","client", "index.html"));
});

// Serve login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public","pages","admin", "admin-login.html"));
});



// Serve admin main page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public","pages","admin", "admin-dashboard.html"));
});

// Serve individual admin tabs (dashboard, applications, system, users, settings)
app.get("/admin/:tab", (req, res) => {
  const tab = req.params.tab;
  

  // Build path to tab HTML file
  const tabPath = path.join(__dirname, "public","pages","admin", "tabs", `${tab}-tab.html`);
  
  // Send the file
  res.sendFile(tabPath, err => {
    if (err) {
      res.status(404).send("Tab not found");
    }
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;

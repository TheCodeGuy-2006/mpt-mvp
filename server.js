import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";

const app = express();

// Constants
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set this in your environment
const REPO_OWNER = "TheCodeGuy-2006";
const REPO_NAME = "mpt-mvp";

// Enhanced CORS configuration for GitHub Pages
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    `https://${REPO_OWNER.toLowerCase()}.github.io`,
    `https://${REPO_OWNER.toLowerCase()}.github.io/${REPO_NAME}`,
    // Add your custom domain if you have one
    // 'https://your-custom-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
  });
});

// Root endpoint for basic testing
app.get('/', (req, res) => {
  res.json({
    message: 'MPT MVP Backend API',
    status: 'running',
    endpoints: ['/health', '/save-planning', '/save-budgets', '/save-calendar'],
    timestamp: new Date().toISOString()
  });
});

app.post("/save-programme", async (req, res) => {
  const { filename, content, message } = req.body;
  const path = `data/${filename}`;

  // Get the current file SHA (required by GitHub API for updates)
  let sha = null;
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } },
    );
    sha = data.sha;
  } catch (e) {
    // File may not exist yet (creating new)
  }

  // Prepare content (must be base64)
  const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString(
    "base64",
  );

  // Save to GitHub
  try {
    await axios.put(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        message: message || `Update ${filename}`,
        content: base64Content,
        sha: sha || undefined,
      },
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/save-planning", (req, res) => {
  const planningData = req.body.content;
  const filePath = path.join(process.cwd(), "data", "planning.json");
  
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFile(filePath, JSON.stringify(planningData, null, 2), (err) => {
    if (err) {
      console.error("Failed to write planning.json:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

app.post("/save-budgets", (req, res) => {
  const budgetsData = req.body.content;
  const filePath = path.join(process.cwd(), "data", "budgets.json");
  
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFile(filePath, JSON.stringify(budgetsData, null, 2), (err) => {
    if (err) {
      console.error("Failed to write budgets.json:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

app.post("/save-calendar", (req, res) => {
  const calendarData = req.body.content;
  const filePath = path.join(process.cwd(), "data", "calendar.json");
  
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFile(filePath, JSON.stringify(calendarData, null, 2), (err) => {
    if (err) {
      console.error("Failed to write calendar.json:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3000;

// Add graceful error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});

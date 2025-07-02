import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import { Buffer } from "buffer";
import fs from "fs";
import path from "path";

const app = express();

app.use(cors());
app.use(bodyParser.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Set this in your environment
const REPO_OWNER = "TheCodeGuy-2006";
const REPO_NAME = "mpt-mvp";

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
  fs.writeFile(filePath, JSON.stringify(calendarData, null, 2), (err) => {
    if (err) {
      console.error("Failed to write calendar.json:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));

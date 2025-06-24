import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import { Buffer } from "buffer";

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

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));

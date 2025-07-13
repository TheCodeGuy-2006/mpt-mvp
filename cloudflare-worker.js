/**
 * Cloudflare Worker for MPT MVP GitHub Integration
 * Handles secure GitHub API calls to save data to repository
 *
 * Uses the new ES Module format for Cloudflare Workers
 * Compatible with Cloudflare Workers runtime
 */

// Configuration - UPDATE THESE VALUES
const REPO_OWNER = "TheCodeGuy-2006"; // ← Your GitHub username
const REPO_NAME = "mpt-mvp"; // ← Your repository name
const BRANCH = "main"; // ← Target branch

// File paths mapping
const FILE_PATHS = {
  planning: "data/planning.json",
  budgets: "data/budgets.json",
  calendar: "data/calendar.json",
};

/**
 * Main request handler
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Enable CORS for all requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Data-Type",
    "Access-Control-Max-Age": "86400",
  };

  // Handle preflight requests
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Route requests
    if (path === "/health" && method === "GET") {
      return handleHealthCheck(corsHeaders);
    } else if (path === "/save" && method === "POST") {
      return handleSave(request, corsHeaders);
    } else if (path.startsWith("/data/") && method === "GET") {
      return handleGetData(request, corsHeaders);
    } else {
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders,
      });
    }
  } catch (error) {
    console.error("Request handling error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(corsHeaders) {
  return new Response(
    JSON.stringify({
      status: "healthy",
      message: "MPT MVP Cloudflare Worker is running",
      timestamp: new Date().toISOString(),
      config: {
        repo: `${REPO_OWNER}/${REPO_NAME}`,
        branch: BRANCH,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    },
  );
}

/**
 * Handle save operations
 */
async function handleSave(request, corsHeaders) {
  try {
    const githubToken = await getGitHubToken();
    if (!githubToken) {
      return new Response(
        JSON.stringify({
          error: "GitHub token not configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const body = await request.json();
    const { dataType, data, timestamp, source } = body;

    // Validate request
    if (!dataType || !data) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: dataType, data",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Get file path
    const filePath = FILE_PATHS[dataType];
    if (!filePath) {
      return new Response(
        JSON.stringify({
          error: `Unknown data type: ${dataType}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Save to GitHub
    const result = await saveToGitHub(githubToken, filePath, data, {
      dataType,
      timestamp,
      source,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data saved successfully",
        dataType,
        filePath,
        timestamp,
        commit: result,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error("Save operation failed:", error);
    return new Response(
      JSON.stringify({
        error: "Save operation failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
}

/**
 * Handle GET requests for data files via GitHub API
 */
async function handleGetData(request, corsHeaders) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");

    // Extract data type from path: /data/{type}
    if (pathParts.length !== 3 || pathParts[1] !== "data") {
      return new Response(
        JSON.stringify({
          error: "Invalid path format. Use: /data/{planning|budgets|calendar}",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const dataType = pathParts[2];

    // Validate data type
    const filePath = FILE_PATHS[dataType];
    if (!filePath) {
      return new Response(
        JSON.stringify({
          error: `Unknown data type: ${dataType}. Supported: ${Object.keys(FILE_PATHS).join(", ")}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const githubToken = await getGitHubToken();
    if (!githubToken) {
      return new Response(
        JSON.stringify({
          error: "GitHub token not configured",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // Fetch data from GitHub API (bypasses raw file caching)
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

    console.log(`Fetching data via GitHub API: ${apiUrl}`);

    const apiResponse = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "MPT-MVP-Worker",
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(
        `GitHub API error: ${apiResponse.status} ${apiResponse.statusText}`,
        errorText,
      );

      return new Response(
        JSON.stringify({
          error: "Failed to fetch data from GitHub",
          status: apiResponse.status,
          message: errorText,
        }),
        {
          status: apiResponse.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    const fileData = await apiResponse.json();

    // Decode base64 content
    const content = atob(fileData.content);
    const data = JSON.parse(content);

    console.log(
      `Successfully fetched ${dataType} data via API:`,
      data.length || Object.keys(data).length,
      "items",
    );

    return new Response(
      JSON.stringify({
        success: true,
        dataType,
        data,
        source: "github-api",
        timestamp: new Date().toISOString(),
        sha: fileData.sha,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error("Get data operation failed:", error);
    return new Response(
      JSON.stringify({
        error: "Get data operation failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
}

/**
 * Get GitHub token from environment
 */
async function getGitHubToken() {
  return globalThis.GITHUB_TOKEN || null;
}

/**
 * Save data to GitHub repository
 */
async function saveToGitHub(token, filePath, data, metadata) {
  const content = JSON.stringify(data, null, 2);
  const encodedContent = btoa(content);

  // Get current file SHA (required for updates)
  let currentSha = null;
  try {
    const getCurrentResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "MPT-MVP-Worker",
        },
      },
    );

    if (getCurrentResponse.ok) {
      const currentFile = await getCurrentResponse.json();
      currentSha = currentFile.sha;
    }
  } catch (error) {
    console.log("File does not exist yet, will create new file");
  }

  // Create or update file
  const commitMessage = `Update ${metadata.dataType} data (${metadata.source || "auto-save"})`;

  const updatePayload = {
    message: commitMessage,
    content: encodedContent,
    branch: BRANCH,
  };

  if (currentSha) {
    updatePayload.sha = currentSha;
  }

  const updateResponse = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "MPT-MVP-Worker",
      },
      body: JSON.stringify(updatePayload),
    },
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(
      `GitHub API error: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`,
    );
  }

  const result = await updateResponse.json();
  console.log("Successfully saved to GitHub:", result.commit.sha);

  return {
    sha: result.commit.sha,
    url: result.commit.html_url,
    message: commitMessage,
  };
}

/**
 * Main entry point - Handle all requests
 */
export default {
  async fetch(request, env, ctx) {
    // Set GITHUB_TOKEN from environment
    const GITHUB_TOKEN = env.GITHUB_TOKEN;

    // Make token available to other functions
    globalThis.GITHUB_TOKEN = GITHUB_TOKEN;

    return handleRequest(request);
  },
};

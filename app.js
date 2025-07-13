import { kpis } from "./src/calc.js";
import "./src/cloudflare-sync.js";

console.log("app.js loaded");

// These constants will be available from the planning module once it loads
let programTypes = [];
let strategicPillars = [];
let names = [];
let revenuePlays = [];
let fyOptions = [];
let quarterOptions = [];
let monthOptions = [];
let regionOptions = [];
let statusOptions = [];
let yesNo = [];

// Initialize constants from planning module
function initializeConstants() {
  if (window.planningModule && window.planningModule.constants) {
    const { constants } = window.planningModule;
    programTypes = constants.programTypes;
    strategicPillars = constants.strategicPillars;
    names = constants.names;
    revenuePlays = constants.revenuePlays;
    fyOptions = constants.fyOptions;
    quarterOptions = constants.quarterOptions;
    monthOptions = constants.monthOptions;
    regionOptions = constants.regionOptions;
    statusOptions = constants.statusOptions;
    yesNo = constants.yesNo;
  }
}

// GITHUB SYNC CONFIGURATION
function initGithubSync() {
  document.getElementById("githubSync").innerHTML = `
    <div style="max-width: 800px;">
      <h3>🔗 GitHub Sync Configuration</h3>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4>🚀 Cloudflare Worker Integration</h4>
        <p>✅ Pre-configured for all users! Auto-save is enabled by default.</p>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Worker Endpoint URL:</label>
          <input type="text" id="workerEndpoint" placeholder="https://your-worker.your-subdomain.workers.dev" 
                 style="width: 100%; max-width: 500px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
                 value="https://mpt-mvp-sync.jordanradford.workers.dev" readonly />
          <small style="display: block; color: #666; margin-top: 5px;">
            ✅ Pre-configured Worker endpoint - ready to use!
          </small>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: flex; align-items: center; margin-bottom: 10px;">
            <input type="checkbox" id="autoSaveEnabled" style="margin-right: 8px; transform: scale(1.2);" checked />
            <span style="font-weight: bold;">Enable Auto-Save</span>
          </label>
          <small style="display: block; color: #666; margin-bottom: 10px;">
            ✅ Auto-save is enabled by default for all users
          </small>
          <label style="display: block; margin-bottom: 5px;">Auto-save delay (seconds):</label>
          <input type="number" id="autoSaveDelay" min="1" max="30" value="3" 
                 style="width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" />
          <small style="display: block; color: #666; margin-top: 5px;">
            Time to wait after changes before auto-saving (1-30 seconds)
          </small>
        </div>

        <div style="margin-bottom: 20px;">
          <button type="button" id="saveConfigBtn" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            💾 Save Configuration
          </button>
          <button type="button" id="testConnectionBtn" style="padding: 8px 16px; background: #388e3c; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
            🔍 Test Connection
          </button>
          <button type="button" id="forceSyncBtn" style="padding: 8px 16px; background: #f57c00; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
            ⚡ Force Sync All Data
          </button>
          <button type="button" id="refreshDataBtn" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
            🔄 Refresh Data
          </button>
        </div>

        <div id="syncStatus" style="display: none; padding: 10px; border-radius: 4px; margin-top: 10px;"></div>
      </div>
      
      <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
        <h4>✅ Ready to Use!</h4>
        <p style="margin: 10px 0; font-size: 0.9em; color: #155724;">
          <strong>This site is pre-configured for collaboration!</strong> Anyone can use this site to contribute data, and all changes will be automatically saved to GitHub. No additional setup required for users.
        </p>
        <ul style="margin: 10px 0; padding-left: 20px; color: #155724;">
          <li>✅ Worker endpoint is pre-configured</li>
          <li>✅ Auto-save is enabled by default</li>
          <li>✅ All data changes are automatically synced to GitHub</li>
          <li>✅ No configuration needed for collaborators</li>
        </ul>
      </div>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2;">
        <h4>📋 For Administrators Only</h4>
        <p style="margin: 10px 0; font-size: 0.9em; color: #666;">
          The site is already configured and ready to use. The setup instructions below are for reference only.
        </p>
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; font-weight: bold;">Show Setup Instructions</summary>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Create a Cloudflare Worker using the provided <code>cloudflare-worker.js</code> file</li>
            <li>Set your GitHub token as the <code>GITHUB_TOKEN</code> environment variable in Cloudflare</li>
            <li>Update the worker code with your GitHub username and repository name</li>
            <li>The Worker URL is pre-configured in the code</li>
            <li>Auto-save is enabled by default for all users</li>
          </ol>
        </details>
      </div>
    </div>
  `;

  // Load saved configuration
  loadGitHubSyncConfig();

  // Wire up event handlers
  document
    .getElementById("saveConfigBtn")
    .addEventListener("click", saveGitHubSyncConfig);
  document
    .getElementById("testConnectionBtn")
    .addEventListener("click", testWorkerConnection);
  document
    .getElementById("forceSyncBtn")
    .addEventListener("click", forceSyncAllData);
  document
    .getElementById("refreshDataBtn")
    .addEventListener("click", refreshAllData);
}

function loadGitHubSyncConfig() {
  try {
    const savedConfig = localStorage.getItem("githubSyncConfig");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      document.getElementById("workerEndpoint").value =
        config.workerEndpoint || "";
      document.getElementById("autoSaveEnabled").checked =
        config.autoSaveEnabled || false;
      document.getElementById("autoSaveDelay").value =
        config.autoSaveDelay || 3;

      // Apply configuration to the sync module
      if (config.workerEndpoint && window.cloudflareSyncModule) {
        window.cloudflareSyncModule.configureWorkerEndpoint(
          config.workerEndpoint,
        );
        window.cloudflareSyncModule.configureAutoSave({
          enabled: config.autoSaveEnabled,
          debounceMs: (config.autoSaveDelay || 3) * 1000,
        });
      }
    }
  } catch (error) {
    console.error("Error loading GitHub sync config:", error);
  }
}

function saveGitHubSyncConfig() {
  const rawEndpoint = document.getElementById("workerEndpoint").value;
  const config = {
    workerEndpoint: rawEndpoint ? rawEndpoint.replace(/\/$/, "") : "", // Remove trailing slash
    autoSaveEnabled: document.getElementById("autoSaveEnabled").checked,
    autoSaveDelay: parseInt(document.getElementById("autoSaveDelay").value),
  };

  // Validate configuration
  if (config.workerEndpoint && !config.workerEndpoint.startsWith("https://")) {
    showSyncStatus("❌ Worker endpoint must start with https://", "error");
    return;
  }

  if (config.autoSaveDelay < 1 || config.autoSaveDelay > 30) {
    showSyncStatus(
      "❌ Auto-save delay must be between 1 and 30 seconds",
      "error",
    );
    return;
  }

  // Save to localStorage
  localStorage.setItem("githubSyncConfig", JSON.stringify(config));

  // Apply configuration
  if (config.workerEndpoint) {
    if (window.cloudflareSyncModule) {
      window.cloudflareSyncModule.configureWorkerEndpoint(
        config.workerEndpoint,
      );
      window.cloudflareSyncModule.configureAutoSave({
        enabled: config.autoSaveEnabled,
        debounceMs: config.autoSaveDelay * 1000,
      });
    }
  }

  showSyncStatus("✅ Configuration saved successfully!", "success");
}

async function testWorkerConnection() {
  const endpoint = document.getElementById("workerEndpoint").value.trim();

  if (!endpoint) {
    showSyncStatus("❌ Please enter a Worker endpoint URL", "error");
    return;
  }

  if (!endpoint.startsWith("https://")) {
    showSyncStatus("❌ Worker endpoint must start with https://", "error");
    return;
  }

  showSyncStatus("🔄 Testing connection...", "info");

  try {
    // Remove trailing slash from endpoint to prevent double slashes
    const cleanEndpoint = endpoint.replace(/\/$/, "");

    // Test 1: Health check
    const healthResponse = await fetch(cleanEndpoint + "/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!healthResponse.ok) {
      throw new Error(
        `Health check failed: HTTP ${healthResponse.status}: ${healthResponse.statusText}`,
      );
    }

    const healthResult = await healthResponse.json();
    console.log("Worker health check result:", healthResult);

    // Test 2: Data API endpoints
    showSyncStatus("🔄 Testing data API endpoints...", "info");

    const dataEndpoints = ["planning", "budgets"];
    const endpointResults = [];

    for (const dataType of dataEndpoints) {
      try {
        const dataResponse = await fetch(`${cleanEndpoint}/data/${dataType}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (dataResponse.ok) {
          endpointResults.push(`✅ ${dataType} data API`);
        } else {
          endpointResults.push(
            `❌ ${dataType} data API (${dataResponse.status})`,
          );
        }
      } catch (error) {
        endpointResults.push(`❌ ${dataType} data API (error)`);
      }
    }

    const successCount = endpointResults.filter((r) => r.includes("✅")).length;
    const totalCount = endpointResults.length;

    if (successCount === totalCount) {
      showSyncStatus(
        `✅ All tests passed! Worker is healthy and all data APIs are working. ${endpointResults.join(", ")}`,
        "success",
      );
    } else if (successCount > 0) {
      showSyncStatus(
        `⚠️ Partial success: Worker is healthy but some data APIs failed. ${endpointResults.join(", ")}. Real-time data loading may not work properly.`,
        "warning",
      );
    } else {
      showSyncStatus(
        `⚠️ Worker is healthy but data APIs are not available. ${endpointResults.join(", ")}. Real-time data loading is disabled.`,
        "warning",
      );
    }
  } catch (error) {
    console.error("Worker connection test failed:", error);
    showSyncStatus(`❌ Connection failed: ${error.message}`, "error");
  }
}

async function forceSyncAllData() {
  const endpoint = document.getElementById("workerEndpoint").value.trim();

  if (!endpoint) {
    showSyncStatus(
      "❌ Please configure and save the Worker endpoint first",
      "error",
    );
    return;
  }

  showSyncStatus("⚡ Force syncing all data...", "info");

  try {
    await forceSaveAll();
    showSyncStatus("✅ Force sync completed successfully!", "success");
  } catch (error) {
    showSyncStatus(`❌ Force sync failed: ${error.message}`, "error");
  }
}

function showSyncStatus(message, type) {
  const statusDiv = document.getElementById("syncStatus");
  statusDiv.style.display = "block";
  statusDiv.textContent = message;

  // Set styles based on type
  if (type === "success") {
    statusDiv.style.background = "#d4edda";
    statusDiv.style.color = "#155724";
    statusDiv.style.border = "1px solid #c3e6cb";
  } else if (type === "error") {
    statusDiv.style.background = "#f8d7da";
    statusDiv.style.color = "#721c24";
    statusDiv.style.border = "1px solid #f5c6cb";
  } else if (type === "warning") {
    statusDiv.style.background = "#fff3cd";
    statusDiv.style.color = "#856404";
    statusDiv.style.border = "1px solid #ffeaa7";
  } else {
    statusDiv.style.background = "#d1ecf1";
    statusDiv.style.color = "#0c5460";
    statusDiv.style.border = "1px solid #bee5eb";
  }

  // Auto-hide success and info messages after 5 seconds
  if (type === "success" || type === "info") {
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 5000);
  }
}

// Force save all data to Worker
async function forceSaveAll() {
  if (!window.cloudflareSyncModule) {
    throw new Error("Cloudflare sync module not loaded");
  }

  const promises = [];

  // Save planning data
  if (window.planningModule && window.planningModule.tableInstance) {
    const planningData = window.planningModule.tableInstance.getData();
    promises.push(
      window.cloudflareSyncModule.saveToWorker("planning", planningData, {
        source: "force-sync",
      }),
    );
  }

  // Save budgets data
  if (window.budgetsModule && window.budgetsModule.tableInstance) {
    const budgetsData = window.budgetsModule.tableInstance.getData();
    promises.push(
      window.cloudflareSyncModule.saveToWorker("budgets", budgetsData, {
        source: "force-sync",
      }),
    );
  }

  // Save calendar data if available
  if (
    window.calendarModule &&
    typeof window.calendarModule.getData === "function"
  ) {
    const calendarData = window.calendarModule.getData();
    promises.push(
      window.cloudflareSyncModule.saveToWorker("calendar", calendarData, {
        source: "force-sync",
      }),
    );
  }

  if (promises.length === 0) {
    throw new Error("No data available to sync");
  }

  const results = await Promise.all(promises);
  console.log("Force save all completed:", results);
  return results;
}

// Refresh all data from GitHub repository
async function refreshAllData() {
  try {
    showSyncStatus("🔄 Refreshing all data from GitHub...", "info");

    const promises = [];

    // Refresh planning data
    if (window.loadPlanning) {
      promises.push(
        window
          .loadPlanning()
          .then((rows) => {
            if (window.planningTableInstance && rows && rows.length > 0) {
              window.planningTableInstance.setData(rows);
              console.log("✅ Planning data refreshed");
              return { type: "planning", success: true, count: rows.length };
            }
            return {
              type: "planning",
              success: false,
              error: "No data or table not available",
            };
          })
          .catch((error) => {
            console.error("Planning refresh failed:", error);
            return { type: "planning", success: false, error: error.message };
          }),
      );
    }

    // Refresh budgets data
    if (window.loadBudgets) {
      promises.push(
        window
          .loadBudgets()
          .then((budgets) => {
            if (budgets && Object.keys(budgets).length > 0) {
              // Update global budgets object for chart access
              window.budgetsObj = budgets;

              if (window.budgetsTableInstance) {
                // Convert object to array format for the table
                const budgetsArray = Object.entries(budgets).map(
                  ([region, data]) => ({
                    region,
                    ...data,
                  }),
                );
                window.budgetsTableInstance.setData(budgetsArray);
                console.log("✅ Budgets data refreshed");
                return {
                  type: "budgets",
                  success: true,
                  count: Object.keys(budgets).length,
                };
              }
            }
            return {
              type: "budgets",
              success: false,
              error: "No data or table not available",
            };
          })
          .catch((error) => {
            console.error("Budgets refresh failed:", error);
            return { type: "budgets", success: false, error: error.message };
          }),
      );
    }

    if (promises.length === 0) {
      throw new Error("No data refresh functions available");
    }

    const results = await Promise.all(promises);

    // Check results and show appropriate message
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (successful.length > 0 && failed.length === 0) {
      const successMessage = successful
        .map((r) => `${r.type} (${r.count} items)`)
        .join(", ");
      showSyncStatus(`✅ Successfully refreshed: ${successMessage}`, "success");
    } else if (successful.length > 0 && failed.length > 0) {
      const successMessage = successful.map((r) => `${r.type}`).join(", ");
      const failMessage = failed.map((r) => `${r.type}: ${r.error}`).join(", ");
      showSyncStatus(
        `⚠️ Partial success: ${successMessage} refreshed. Failed: ${failMessage}`,
        "warning",
      );
    } else {
      const failMessage = failed.map((r) => `${r.type}: ${r.error}`).join(", ");
      showSyncStatus(`❌ Refresh failed: ${failMessage}`, "error");
    }

    console.log("Data refresh completed:", results);
    return results;
  } catch (error) {
    console.error("Error refreshing data:", error);
    showSyncStatus("❌ Data refresh failed: " + error.message, "error");
    throw error;
  }
}

// Utility: Dynamically load all JSON files in /data (except budgets)
async function loadProgrammeData() {
  let fileList = [];
  try {
    const listURL =
      "https://api.github.com/repos/TheCodeGuy-2006/mpt-mvp/contents/data";
    const list = await fetch(listURL).then((r) => r.json());
    if (Array.isArray(list)) {
      fileList = list
        .map((item) => item.name)
        .filter((name) => name.endsWith(".json") && !name.includes("budgets"));
    }
  } catch (e) {
    // fallback: try to use a static list if API fails
    fileList = [
      "prog1.json",
      "prog2.json",
      "program-1750045569180.json",
      "data_program-1750391562323.json",
      "data_program-1750407243280.json",
    ].filter((name) => !name.includes("budgets"));
  }
  // Fetch all present files in parallel, handle missing files gracefully
  const rows = await Promise.all(
    fileList.map(async (f) => {
      try {
        const r = await fetch(`data/${f}`);
        if (!r.ok) return null; // skip missing files
        return await r.json();
      } catch {
        return null;
      }
    }),
  );
  // Filter out failed/missing files
  const validRows = rows.filter(Boolean);
  // Always recalculate and fill in calculated fields for every row
  validRows.forEach((row) => {
    if (typeof row.expectedLeads === "number") {
      const kpiVals = kpis(row.expectedLeads);
      row.mqlForecast = kpiVals.mql;
      row.sqlForecast = kpiVals.sql;
      row.oppsForecast = kpiVals.opps;
      row.pipelineForecast = kpiVals.pipeline;
    }
  });
  return validRows;
}

// Patch: Update annual budget plan save logic to POST to /save-budgets for backend integration. Also ensure budgets dashboard and execution/planning grids use backend save endpoints.
// Annual budget functionality moved to budgets module

// --- LIVE SYNC LOGIC ---
// Sync function is now in execution module

// run once the page loads
// Removed call to loadProgrammes() as it is not defined and not needed
// if (location.hash === "#grid" || location.hash === "") loadProgrammes();

// Ensure grid and button handlers are set up every time user navigates to Programme Grid
window.addEventListener("hashchange", () => {
  if (location.hash === "#grid") loadProgrammes();
});

// Show the section whose ID matches the current hash
function route() {
  const hash = location.hash || "#planning";
  // Print all section IDs for debugging
  const allSections = Array.from(document.querySelectorAll("section")).map(
    (sec) => sec.id,
  );
  console.log("[route] All section IDs:", allSections);
  // Hide all sections first
  document.querySelectorAll("section").forEach((sec) => {
    sec.style.display = "none";
  });
  // Show correct section(s) for the active tab
  if (hash === "#budgets") {
    const budgetsSection = document.getElementById("view-budgets");
    const budgetSetupSection = document.getElementById("view-budget-setup");
    if (budgetsSection) budgetsSection.style.display = "block";
    if (budgetSetupSection) budgetSetupSection.style.display = "block";
    if (window.budgetsTableInstance) {
      setTimeout(() => {
        window.budgetsTableInstance.redraw(true);
        window.budgetsTableInstance.setData(
          window.budgetsTableInstance.getData(),
        );
        console.log("[route] Redrew budgets table");
        // Ensure both charts render after table redraw
        setTimeout(() => {
          if (typeof window.renderBudgetsBarChart === "function") {
            window.renderBudgetsBarChart();
            console.log("[route] Triggered budgets bar chart render");
          }
          if (typeof window.renderBudgetsRegionCharts === "function") {
            window.renderBudgetsRegionCharts();
            console.log("[route] Triggered budgets region charts render");
          }
        }, 100);
      }, 0);
    }
    // --- Ensure Annual Budget Plan unlock logic is initialized every time tab is shown ---
    if (
      window.budgetsModule &&
      typeof window.budgetsModule.initializeAnnualBudgetPlan === "function"
    ) {
      // Use the latest budgets data if available, otherwise pass an empty array
      let budgetsData = [];
      try {
        budgetsData = window.budgetsTableInstance
          ? window.budgetsTableInstance.getData()
          : [];
      } catch (e) {}
      window.budgetsModule.initializeAnnualBudgetPlan(budgetsData);
    }
  } else {
    // Show only the section matching the tab
    const section = document.querySelector(
      `section#view-${hash.replace("#", "")}`,
    );
    console.log(`[route] hash:`, hash, "section:", section);
    if (section) section.style.display = "block";
    if (
      hash === "#planning" &&
      window.planningModule &&
      window.planningModule.tableInstance
    ) {
      setTimeout(() => {
        window.planningModule.tableInstance.redraw(true);
        console.log("[route] Redrew planning grid");
        // Initialize filters when planning tab is shown
        if (
          typeof window.planningModule.populatePlanningFilters === "function"
        ) {
          window.planningModule.populatePlanningFilters();
        }
      }, 0);
    }
    if (hash === "#execution" && window.executionModule.tableInstance) {
      setTimeout(() => {
        window.executionModule.tableInstance.redraw(true);
        window.executionModule.tableInstance.setData(
          window.executionModule.tableInstance.getData(),
        );
        console.log("[route] Redrew execution grid");
        // Sync digital motions data from planning tab
        if (
          typeof window.executionModule.syncDigitalMotionsFromPlanning ===
          "function"
        ) {
          window.executionModule.syncDigitalMotionsFromPlanning();
        }
        // Initialize filters when execution tab is shown
        if (
          typeof window.executionModule.setupExecutionFilters === "function"
        ) {
          window.executionModule.setupExecutionFilters();
        }
      }, 0);
    }
    if (
      hash === "#roi" &&
      typeof window.roiModule.updateRoiTotalSpend === "function"
    ) {
      setTimeout(() => {
        window.roiModule.populateRoiFilters();
        window.roiModule.updateRoiTotalSpend();
      }, 0);
      setTimeout(initRoiTabSwitching, 100); // Initialize tab switching when ROI tab is viewed
      console.log("[route] Updated ROI total spend");
    }
    if (hash === "#report" && window.reportTableInstance) {
      setTimeout(() => {
        window.reportTableInstance.redraw(true);
        window.reportTableInstance.setData(
          window.reportTableInstance.getData(),
        );
        console.log("[route] Redrew report grid");
      }, 0);
    }
    if (
      hash === "#report" &&
      typeof window.roiModule.updateReportTotalSpend === "function"
    ) {
      setTimeout(window.roiModule.updateReportTotalSpend, 0);
      console.log("[route] Updated report total spend");
    }
    if (
      hash === "#calendar" &&
      typeof window.calendarModule?.handleCalendarRouting === "function"
    ) {
      window.calendarModule.handleCalendarRouting();
      console.log("[route] Handled calendar routing");
    }
  }
}

// Ensure route() is called on every hash change for tab navigation
window.addEventListener("hashchange", route);

// Utility: Download JSON as file
function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded event fired");

  // Initialize constants from planning module
  initializeConstants();

  // Auto-configure Worker for all users
  if (window.cloudflareSyncModule) {
    console.log("Auto-configuring Cloudflare Worker for all users...");

    // Set up the Worker endpoint for everyone
    window.cloudflareSyncModule.configureWorkerEndpoint(
      "https://mpt-mvp-sync.jordanradford.workers.dev",
    );

    // Enable auto-save by default
    window.cloudflareSyncModule.configureAutoSave({
      enabled: true,
      debounceMs: 3000,
    });

    // Save this configuration to localStorage so it persists
    const config = {
      workerEndpoint: "https://mpt-mvp-sync.jordanradford.workers.dev",
      autoSave: {
        enabled: true,
        debounceMs: 3000,
      },
    };
    localStorage.setItem("githubSyncConfig", JSON.stringify(config));

    console.log("✅ Auto-save configured for all users!");

    // Check Worker API status and show notice if data API is unavailable
    setTimeout(checkWorkerApiStatus, 2000); // Delay to allow page to load
  }

  // Show loading indicator
  const mainSection = document.querySelector("section#view-planning");
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "loadingIndicator";
  loadingDiv.textContent = "Loading...";
  loadingDiv.style.fontSize = "2rem";
  loadingDiv.style.textAlign = "center";
  mainSection && mainSection.prepend(loadingDiv);

  // Load all data in parallel (now only from planning.json and budgets.json)
  let rows = [];
  let budgetsObj = {};
  try {
    // Ensure modules are loaded before proceeding
    if (!window.planningModule) {
      console.warn("Planning module not loaded yet, waiting...");
      // Wait up to 5 seconds for modules to load
      let attempts = 0;
      while (!window.planningModule && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      if (!window.planningModule) {
        throw new Error("Planning module failed to load");
      }
    }

    if (!window.budgetsModule) {
      console.warn("Budgets module not loaded yet, waiting...");
      // Wait up to 5 seconds for modules to load
      let attempts = 0;
      while (!window.budgetsModule && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      if (!window.budgetsModule) {
        throw new Error("Budgets module failed to load");
      }
    }

    // Use planning module functions
    [rows, budgetsObj] = await Promise.all([
      window.planningModule.loadPlanning(),
      window.budgetsModule.loadBudgets(),
    ]);
  } catch (e) {
    console.error("Error loading data:", e);
    rows = [];
    budgetsObj = {};
  }
  loadingDiv && loadingDiv.remove();

  // Store budgets object globally for chart access
  window.budgetsObj = budgetsObj;

  // Convert budgets object to array for Tabulator
  const budgets = Object.entries(budgetsObj).map(([region, data]) => ({
    region,
    ...data,
  }));

  // Initialize all grids/tables only once
  let planningTable = null;
  let executionTable = null;
  let budgetsTable = null;

  if (
    window.planningModule &&
    typeof window.planningModule.initPlanningGrid === "function"
  ) {
    planningTable = window.planningModule.initPlanningGrid(rows);
    window.planningTableInstance = planningTable;
  } else {
    console.error("Planning module or initPlanningGrid function not available");
  }

  if (
    window.executionModule &&
    typeof window.executionModule.initExecutionGrid === "function"
  ) {
    executionTable = window.executionModule.initExecutionGrid(rows);
    window.executionTableInstance = executionTable;
  } else {
    console.error(
      "Execution module or initExecutionGrid function not available",
    );
  }

  if (
    window.budgetsModule &&
    typeof window.budgetsModule.initBudgetsTable === "function"
  ) {
    budgetsTable = window.budgetsModule.initBudgetsTable(budgets, rows); // pass rows to budgets table
    window.budgetsTableInstance = budgetsTable;
  } else {
    console.error("Budgets module or initBudgetsTable function not available");
  }

  initGithubSync();

  // Setup save and download functions with safety checks
  if (planningTable && window.planningModule) {
    if (typeof window.planningModule.setupPlanningSave === "function") {
      window.planningModule.setupPlanningSave(planningTable, rows);
    }
    if (typeof window.planningModule.setupPlanningDownload === "function") {
      window.planningModule.setupPlanningDownload(planningTable);
    }
  }

  if (budgetsTable && window.budgetsModule) {
    if (typeof window.budgetsModule.setupBudgetsSave === "function") {
      window.budgetsModule.setupBudgetsSave(budgetsTable);
    }
    if (typeof window.budgetsModule.setupBudgetsDownload === "function") {
      window.budgetsModule.setupBudgetsDownload(budgetsTable);
    }
  }

  // Initialize reporting total spend using ROI module
  if (
    window.roiModule &&
    typeof window.roiModule.updateReportTotalSpend === "function"
  ) {
    window.roiModule.updateReportTotalSpend();
  }

  // Initialize ROI functionality (charts, filters, data table)
  if (
    window.roiModule &&
    typeof window.roiModule.initializeRoiFunctionality === "function"
  ) {
    window.roiModule.initializeRoiFunctionality();
  }

  // Initialize Planning filters
  if (
    window.planningModule &&
    typeof window.planningModule.initializePlanningFilters === "function"
  ) {
    window.planningModule.initializePlanningFilters();
  }

  // Initialize Execution filters
  if (
    window.executionModule &&
    typeof window.executionModule.initializeExecutionFilters === "function"
  ) {
    window.executionModule.initializeExecutionFilters();
  }

  // Initialize Annual Budget Plan using budgets module
  if (
    window.budgetsModule &&
    typeof window.budgetsModule.initializeAnnualBudgetPlan === "function"
  ) {
    window.budgetsModule.initializeAnnualBudgetPlan(budgets);
  }

  // Ensure hash is set to a valid tab on load (after all sections are initialized)
  const validTabs = [
    "#planning",
    "#execution",
    "#budgets",
    "#calendar",
    "#report",
    "#roi",
    "#github-sync",
    "#budget-setup",
  ];
  if (!validTabs.includes(location.hash)) {
    location.hash = "#planning";
  }
  // Always call route() after everything is ready
  setTimeout(route, 0);

  // After both tables are initialized:
  if (
    planningTable &&
    executionTable &&
    window.executionModule &&
    typeof window.executionModule.syncGridsOnEdit === "function"
  ) {
    window.executionModule.syncGridsOnEdit(planningTable, executionTable);
    window.executionModule.syncGridsOnEdit(executionTable, planningTable);
  }

  // Setup ROI chart event handlers
  if (
    window.roiModule &&
    typeof window.roiModule.setupRoiChartEventHandlers === "function"
  ) {
    window.roiModule.setupRoiChartEventHandlers();
  }

  // Initialize calendar module
  if (
    window.calendarModule &&
    typeof window.calendarModule.initializeCalendar === "function"
  ) {
    window.calendarModule.initializeCalendar();
  }
});

// Initialize Chart.js and render charts
if (typeof initializeChartJS === "function") {
  initializeChartJS();
}

// After budgets table is initialized, render both charts
if (window.budgetsModule && window.budgetsModule.initBudgetsTable) {
  const origInitBudgetsTable = window.budgetsModule.initBudgetsTable;
  window.budgetsModule.initBudgetsTable = function (budgets, rows) {
    const table = origInitBudgetsTable(budgets, rows);
    window.budgetsTableInstance = table;

    // Render both the bar chart and region charts
    setTimeout(() => {
      if (typeof renderBudgetsBarChart === "function") {
        renderBudgetsBarChart();
      }
      if (typeof renderBudgetsRegionCharts === "function") {
        renderBudgetsRegionCharts();
      }
    }, 200);

    // Set up event listeners for both charts
    table.on("dataChanged", () => {
      if (typeof renderBudgetsBarChart === "function") {
        renderBudgetsBarChart();
      }
      if (typeof renderBudgetsRegionCharts === "function") {
        renderBudgetsRegionCharts();
      }
    });

    return table;
  };
}
// Also render on planning table data change
if (window.planningModule && window.planningModule.initPlanningGrid) {
  const origInitPlanningGrid2 = window.planningModule.initPlanningGrid;
  window.planningModule.initPlanningGrid = function (rows) {
    const table = origInitPlanningGrid2(rows);
    window.planningRows = rows;
    table.on("dataChanged", renderBudgetsRegionCharts);
    setTimeout(renderBudgetsRegionCharts, 200);
    return table;
  };
}

// Check Worker API status and show notice if unavailable
async function checkWorkerApiStatus() {
  try {
    const endpoint = "https://mpt-mvp-sync.jordanradford.workers.dev";
    console.log("🔄 Checking Worker API status...");

    // Test data API endpoint
    const response = await fetch(`${endpoint}/data/planning`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log(
        "✅ Worker API data endpoints are available - real-time sync enabled",
      );
    } else {
      console.warn(
        "⚠️ Worker API data endpoints unavailable - using local data fallback",
      );
      // Show notice to user about limited functionality
      if (document.getElementById("syncStatus")) {
        showSyncStatus(
          "⚠️ Real-time data sync is currently unavailable. Using local data files. Save operations will still work, but you may not see other users' changes immediately.",
          "warning",
        );
      }
    }
  } catch (error) {
    console.warn("⚠️ Worker API check failed:", error);
    // Show notice to user about limited functionality
    if (document.getElementById("syncStatus")) {
      showSyncStatus(
        "⚠️ Real-time data sync is currently unavailable. Using local data files. Save operations will still work, but you may not see other users' changes immediately.",
        "warning",
      );
    }
  }
}

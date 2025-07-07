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
        <p>Configure your Cloudflare Worker endpoint for secure auto-save to GitHub.</p>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Worker Endpoint URL:</label>
          <input type="text" id="workerEndpoint" placeholder="https://your-worker.your-subdomain.workers.dev" 
                 style="width: 100%; max-width: 500px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
          <small style="display: block; color: #666; margin-top: 5px;">
            Enter your Cloudflare Worker URL (without trailing slash)
          </small>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: flex; align-items: center; margin-bottom: 10px;">
            <input type="checkbox" id="autoSaveEnabled" style="margin-right: 8px; transform: scale(1.2);" />
            <span style="font-weight: bold;">Enable Auto-Save</span>
          </label>
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
        </div>

        <div id="syncStatus" style="display: none; padding: 10px; border-radius: 4px; margin-top: 10px;"></div>
      </div>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2;">
        <h4>📋 Setup Instructions</h4>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>Create a Cloudflare Worker using the provided <code>cloudflare-worker.js</code> file</li>
          <li>Set your GitHub token as the <code>GITHUB_TOKEN</code> environment variable in Cloudflare</li>
          <li>Update the worker code with your GitHub username and repository name</li>
          <li>Enter your Worker URL above and test the connection</li>
          <li>Enable auto-save to automatically sync your changes to GitHub</li>
        </ol>
        <p style="margin: 10px 0; font-size: 0.9em; color: #666;">
          See the setup documentation files for detailed instructions.
        </p>
      </div>
    </div>
  `;

  // Load saved configuration
  loadGitHubSyncConfig();

  // Wire up event handlers
  document.getElementById("saveConfigBtn").addEventListener("click", saveGitHubSyncConfig);
  document.getElementById("testConnectionBtn").addEventListener("click", testWorkerConnection);
  document.getElementById("forceSyncBtn").addEventListener("click", forceSyncAllData);
}

function loadGitHubSyncConfig() {
  try {
    const savedConfig = localStorage.getItem('githubSyncConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      document.getElementById("workerEndpoint").value = config.workerEndpoint || '';
      document.getElementById("autoSaveEnabled").checked = config.autoSaveEnabled || false;
      document.getElementById("autoSaveDelay").value = config.autoSaveDelay || 3;

      // Apply configuration to the sync module
      if (config.workerEndpoint && window.cloudflareSyncModule) {
        window.cloudflareSyncModule.configureWorkerEndpoint(config.workerEndpoint);
        window.cloudflareSyncModule.configureAutoSave({
          enabled: config.autoSaveEnabled,
          debounceMs: (config.autoSaveDelay || 3) * 1000
        });
      }
    }
  } catch (error) {
    console.error('Error loading GitHub sync config:', error);
  }
}

function saveGitHubSyncConfig() {
  const rawEndpoint = document.getElementById("workerEndpoint").value;
  const config = {
    workerEndpoint: rawEndpoint ? rawEndpoint.replace(/\/$/, '') : '', // Remove trailing slash
    autoSaveEnabled: document.getElementById("autoSaveEnabled").checked,
    autoSaveDelay: parseInt(document.getElementById("autoSaveDelay").value)
  };

  // Validate configuration
  if (config.workerEndpoint && !config.workerEndpoint.startsWith('https://')) {
    showSyncStatus("❌ Worker endpoint must start with https://", "error");
    return;
  }

  if (config.autoSaveDelay < 1 || config.autoSaveDelay > 30) {
    showSyncStatus("❌ Auto-save delay must be between 1 and 30 seconds", "error");
    return;
  }

  // Save to localStorage
  localStorage.setItem('githubSyncConfig', JSON.stringify(config));

  // Apply configuration
  if (config.workerEndpoint) {
    if (window.cloudflareSyncModule) {
      window.cloudflareSyncModule.configureWorkerEndpoint(config.workerEndpoint);
      window.cloudflareSyncModule.configureAutoSave({
        enabled: config.autoSaveEnabled,
        debounceMs: config.autoSaveDelay * 1000
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

  if (!endpoint.startsWith('https://')) {
    showSyncStatus("❌ Worker endpoint must start with https://", "error");
    return;
  }

  showSyncStatus("🔄 Testing connection...", "info");

  try {
    // Remove trailing slash from endpoint to prevent double slashes
    const cleanEndpoint = endpoint.replace(/\/$/, '');
    const response = await fetch(cleanEndpoint + '/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    showSyncStatus("✅ Connection successful! Worker is healthy and ready.", "success");
    console.log('Worker health check result:', result);
  } catch (error) {
    console.error('Worker connection test failed:', error);
    showSyncStatus(`❌ Connection failed: ${error.message}`, "error");
  }
}

async function forceSyncAllData() {
  const endpoint = document.getElementById("workerEndpoint").value.trim();
  
  if (!endpoint) {
    showSyncStatus("❌ Please configure and save the Worker endpoint first", "error");
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
    throw new Error('Cloudflare sync module not loaded');
  }

  const promises = [];
  
  // Save planning data
  if (window.planningModule && window.planningModule.tableInstance) {
    const planningData = window.planningModule.tableInstance.getData();
    promises.push(
      window.cloudflareSyncModule.saveToWorker('planning', planningData, { 
        source: 'force-sync' 
      })
    );
  }
  
  // Save budgets data
  if (window.budgetsModule && window.budgetsModule.tableInstance) {
    const budgetsData = window.budgetsModule.tableInstance.getData();
    promises.push(
      window.cloudflareSyncModule.saveToWorker('budgets', budgetsData, { 
        source: 'force-sync' 
      })
    );
  }

  // Save calendar data if available
  if (window.calendarModule && typeof window.calendarModule.getData === 'function') {
    const calendarData = window.calendarModule.getData();
    promises.push(
      window.cloudflareSyncModule.saveToWorker('calendar', calendarData, { 
        source: 'force-sync' 
      })
    );
  }

  if (promises.length === 0) {
    throw new Error('No data available to sync');
  }

  const results = await Promise.all(promises);
  console.log('Force save all completed:', results);
  return results;
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
      }, 0);
    }
    // --- Ensure Annual Budget Plan unlock logic is initialized every time tab is shown ---
    if (window.budgetsModule && typeof window.budgetsModule.initializeAnnualBudgetPlan === 'function') {
      // Use the latest budgets data if available, otherwise pass an empty array
      let budgetsData = [];
      try {
        budgetsData = window.budgetsTableInstance ? window.budgetsTableInstance.getData() : [];
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
    if (hash === "#planning" && window.planningModule.tableInstance) {
      setTimeout(() => {
        window.planningModule.tableInstance.redraw(true);
        window.planningModule.tableInstance.setData(
          window.planningModule.tableInstance.getData(),
        );
        console.log("[route] Redrew planning grid");
      }, 0);
    }
    if (hash === "#execution" && window.executionModule.tableInstance) {
      setTimeout(() => {
        window.executionModule.tableInstance.redraw(true);
        window.executionModule.tableInstance.setData(
          window.executionModule.tableInstance.getData(),
        );
        console.log("[route] Redrew execution grid");
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
    // Use planning module functions
    [rows, budgetsObj] = await Promise.all([
      window.planningModule.loadPlanning(),
      window.budgetsModule.loadBudgets(),
    ]);
  } catch (e) {
    rows = [];
    budgetsObj = {};
  }
  loadingDiv && loadingDiv.remove();

  // Convert budgets object to array for Tabulator
  const budgets = Object.entries(budgetsObj).map(([region, data]) => ({
    region,
    ...data,
  }));

  // Initialize all grids/tables only once
  const planningTable = window.planningModule.initPlanningGrid(rows);
  window.planningTableInstance = planningTable;
  const executionTable = window.executionModule.initExecutionGrid(rows);
  window.executionTableInstance = executionTable;
  const budgetsTable = window.budgetsModule.initBudgetsTable(budgets, rows); // pass rows to budgets table
  window.budgetsTableInstance = budgetsTable;
  initGithubSync();
  window.planningModule.setupPlanningSave(planningTable, rows);
  window.budgetsModule.setupBudgetsSave(budgetsTable);
  window.budgetsModule.setupBudgetsDownload(budgetsTable);
  window.planningModule.setupPlanningDownload(planningTable);

  // Initialize reporting total spend using ROI module
  window.roiModule.updateReportTotalSpend();

  // Initialize ROI functionality (charts, filters, data table)
  window.roiModule.initializeRoiFunctionality();

  // Initialize Annual Budget Plan using budgets module
  window.budgetsModule.initializeAnnualBudgetPlan(budgets);

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
  window.executionModule.syncGridsOnEdit(planningTable, executionTable);
  window.executionModule.syncGridsOnEdit(executionTable, planningTable);

  // Setup ROI chart event handlers
  window.roiModule.setupRoiChartEventHandlers();

  // Initialize calendar module
  window.calendarModule.initializeCalendar();
});

// Initialize Chart.js and render charts
initializeChartJS();

// After budgets table is initialized, render the chart
const origInitBudgetsTable = window.budgetsModule.initBudgetsTable;
window.budgetsModule.initBudgetsTable = function (budgets, rows) {
  const table = origInitBudgetsTable(budgets, rows);
  window.budgetsTableInstance = table;
  setTimeout(renderBudgetsBarChart, 200);
  table.on("dataChanged", renderBudgetsBarChart);
  return table;
};

// After budgets table is initialized, render the region charts
const origInitBudgetsTable2 = window.budgetsModule.initBudgetsTable;
window.budgetsModule.initBudgetsTable = function (budgets, rows) {
  const table = origInitBudgetsTable2(budgets, rows);
  window.budgetsTableInstance = table;
  setTimeout(renderBudgetsRegionCharts, 200);
  table.on("dataChanged", renderBudgetsRegionCharts);
  return table;
};
// Also render on planning table data change
const origInitPlanningGrid2 = window.planningModule.initPlanningGrid;
window.planningModule.initPlanningGrid = function (rows) {
  const table = origInitPlanningGrid2(rows);
  window.planningRows = rows;
  table.on("dataChanged", renderBudgetsRegionCharts);
  setTimeout(renderBudgetsRegionCharts, 200);
  return table;
};

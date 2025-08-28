
import { kpis } from "./src/calc.js";
import "./src/cloudflare-sync.js";
import { initRoiTabSwitching, renderBudgetsRegionCharts } from "./charts.js";

// console.log("app.js loaded"); // Redundant log removed

// Debug flags for performance monitoring
window.DEBUG_MODE = false; // Master debug flag - set to true to enable all debug logging
window.DEBUG_FILTERS = false; // Set to true to enable filter debug logging
window.DEBUG_PERFORMANCE = false; // Set to true to enable detailed performance logging

// Initialize TabManager with better timing
function initializeTabManager() {
  if (typeof TabManager !== 'undefined' && window.tabManager) {
  // TabManager already initialized
    registerAllTabs();
    return;
  }
  
  if (typeof TabManager !== 'undefined') {
    window.tabManager = new TabManager();
    if (window.DEBUG_MODE) {
      console.log("🎯 TabManager initialized and available globally");
    }
    registerAllTabs();
  } else {
    console.warn("🎯 TabManager class not found, retrying...");
    // Retry after a short delay
    setTimeout(initializeTabManager, 100);
  }
}

function registerAllTabs() {
  if (!window.tabManager) {
    console.error("❌ Cannot register tabs: TabManager not available");
    return;
  }
  
  try {
    // Register all tabs with their initialization functions
    window.tabManager.registerTab('planning', 
      () => {
        // Loading planning tab
        route();
      }, 
      () => console.log('Planning tab cleanup')
    );
    
    window.tabManager.registerTab('execution', 
      () => {
        // Loading execution tab
        route();
      }, 
      () => console.log('Execution tab cleanup')
    );
    
    window.tabManager.registerTab('budgets', 
      () => {
        // Loading budgets tab
        route();
      }, 
      () => console.log('Budgets tab cleanup')
    );
    
    window.tabManager.registerTab('roi', 
      () => {
        // Loading ROI tab
        route();
      }, 
      () => console.log('ROI tab cleanup')
    );
    
    window.tabManager.registerTab('calendar', 
      () => {
        // Loading calendar tab
        route();
      }, 
      () => console.log('Calendar tab cleanup')
    );
    
    window.tabManager.registerTab('github-sync', 
      () => {
        // Loading GitHub sync tab
        route();
      }, 
      () => console.log('GitHub Sync tab cleanup')
    );
    
    // All tabs registered successfully
  } catch (error) {
    console.error("❌ Error registering tabs:", error);
  }
}

// Initialize on DOMContentLoaded
window.addEventListener('DOMContentLoaded', initializeTabManager);

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  // Wait for DOMContentLoaded
} else {
  // DOM already loaded, initialize immediately
  initializeTabManager();
}

// TABULATOR ERROR SUPPRESSION - Must be early in the load process
// Suppress Tabulator scroll errors globally by overriding Promise rejection handling
if (typeof window !== 'undefined') {
  // Store original Promise constructor
  const OriginalPromise = window.Promise;
  
  // Override Promise.reject to catch Tabulator scroll errors
  window.Promise.reject = function(reason) {
    if (reason && typeof reason === 'string' && 
        reason.includes('Scroll Error - No matching row found')) {
      console.warn('Suppressed Tabulator scroll error:', reason);
      return OriginalPromise.resolve(); // Convert rejection to resolution
    }
    return OriginalPromise.reject(reason);
  };
  
  // Also override Promise constructor to catch errors in then/catch chains
  window.Promise = function(executor) {
    return new OriginalPromise((resolve, reject) => {
      const wrappedReject = (reason) => {
        if (reason && typeof reason === 'string' && 
            reason.includes('Scroll Error - No matching row found')) {
          console.warn('Suppressed Tabulator scroll error in Promise:', reason);
          resolve(); // Convert rejection to resolution
          return;
        }
        reject(reason);
      };
      
      try {
        executor(resolve, wrappedReject);
      } catch (error) {
        if (error && error.message && 
            error.message.includes('Scroll Error - No matching row found')) {
          console.warn('Suppressed Tabulator scroll error in executor:', error.message);
          resolve();
          return;
        }
        wrappedReject(error);
      }
    });
  };
  
  // Copy static methods
  Object.setPrototypeOf(window.Promise, OriginalPromise);
  Object.setPrototypeOf(window.Promise.prototype, OriginalPromise.prototype);
  
  // Override addEventListener to make wheel events passive by default for better scroll performance
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'wheel' || type === 'mousewheel' || type === 'DOMMouseScroll') {
      // Force passive for wheel events to improve scroll performance
      if (typeof options === 'boolean') {
        options = { capture: options, passive: true };
      } else if (typeof options === 'object' && options !== null) {
        options = { ...options, passive: true };
      } else {
        options = { passive: true };
      }
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}

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
          <button type="button" id="saveConfigBtn" class="btn-primary" style="margin-right: 8px;">
            💾 Save Configuration
          </button>
          <button type="button" id="testConnectionBtn" class="btn-success" style="margin-right: 8px;">
            🔍 Test Connection
          </button>
          <button type="button" id="forceSyncBtn" class="btn-secondary" style="margin-right: 8px; background: #f57c00; border-color: #f57c00;">
            ⚡ Force Sync All Data
          </button>
          <button type="button" id="refreshDataBtn" class="btn-secondary">
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
    // console.log("Worker health check result:", healthResult); // Redundant log removed

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
  // console.log("Force save all completed:", results); // Redundant log removed
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
              // ...existing code...
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
                // ...existing code...
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

    // ...existing code...
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
  // Process in larger batches and yield less frequently to optimize performance
  const batchSize = 5; // Smaller batch for less blocking
  const yieldEvery = 1; // Yield every batch
  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize);
    batch.forEach((row) => {
      if (typeof row.expectedLeads === "number") {
        const kpiVals = kpis(row.expectedLeads);
        row.mqlForecast = kpiVals.mql;
        row.sqlForecast = kpiVals.sql;
        row.oppsForecast = kpiVals.opps;
        row.pipelineForecast = kpiVals.pipeline;
      }
    });
    // Yield control every batch to prevent long tasks
    if ((i / batchSize) % yieldEvery === yieldEvery - 1 && i + batchSize < validRows.length) {
      await new Promise(resolve => {
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
          window.requestIdleCallback(resolve, { timeout: 50 });
        } else {
          setTimeout(resolve, 0);
        }
      });
    }
  }
  return validRows;
}

// Patch: Update annual budget plan save logic to POST to /save-budgets for backend integration. Also ensure budgets dashboard and execution/planning grids use backend save endpoints.
// Annual budget functionality moved to budgets module

// --- LIVE SYNC LOGIC ---
// Sync function is now in execution module

// Performance monitoring and optimization utilities
const AppPerformance = {
  startTime: performance.now(),
  metrics: new Map(),
  
  // Track performance metrics
  mark(label) {
    this.metrics.set(label, performance.now());
  },
  
  // Measure time between marks
  measure(startLabel, endLabel = null) {
    const start = this.metrics.get(startLabel);
    const end = endLabel ? this.metrics.get(endLabel) : performance.now();
    return end - start;
  },
  
  // Monitor long tasks that might block the main thread
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((entries) => {
          entries.getEntries().forEach((entry) => {
            // Increased threshold to 150ms to reduce noise from normal operations
            if (entry.duration > 150) { 
              if (window.DEBUG_MODE) {
                console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
              }
              
              // Provide actionable advice for long tasks
              if (entry.duration > 500 && window.DEBUG_MODE) {
                console.warn(`⚠️ Very long task detected! Consider breaking this operation into smaller chunks.`);
              }
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Silently fail if not supported
      }
    }
  },
  
  // Clean up old metrics to prevent memory leaks
  cleanup() {
    if (this.metrics.size > 20) {
      const keys = Array.from(this.metrics.keys());
      const oldKeys = keys.slice(0, -10); // Keep last 10
      oldKeys.forEach(key => this.metrics.delete(key));
    }
  }
};

// Initialize performance monitoring
AppPerformance.observeLongTasks();

// Add global error handler for Tabulator scroll errors
window.addEventListener('error', function(event) {
  if (event.error && event.error.message && 
      event.error.message.includes('Scroll Error - No matching row found')) {
    console.warn('Tabulator scroll error caught and suppressed:', event.error.message);
    event.preventDefault();
    return false;
  }
});

// Add unhandled promise rejection handler for async scroll errors
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message && 
      event.reason.message.includes('Scroll Error - No matching row found')) {
    console.warn('Tabulator scroll promise rejection caught and suppressed:', event.reason.message);
    event.preventDefault();
    return false;
  }
  
  // Also catch any other Tabulator-related promise rejections
  if (event.reason && typeof event.reason === 'string' && 
      event.reason.includes('Scroll Error')) {
    console.warn('Tabulator scroll-related promise rejection caught:', event.reason);
    event.preventDefault();
    return false;
  }
});

// Additional Tabulator-specific error suppression
if (typeof window.Tabulator !== 'undefined') {
  // Override console.error temporarily to catch and filter Tabulator scroll errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('Scroll Error - No matching row found') || 
        message.includes('No matching row found')) {
      console.warn('Tabulator scroll error suppressed:', message);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

// Tab routing and management with performance optimization
let currentTab = "";
let isTabSwitching = false;
let tabSwitchCache = new Map();

// Performance-optimized debounced route function
let routeTimeout;
let lastRouteTime = 0;
const ROUTE_DEBOUNCE_MS = 150;
const MIN_ROUTE_INTERVAL = 100;

function debouncedRoute() {
  const now = performance.now();
  const timeSinceLastRoute = now - lastRouteTime;
  
  clearTimeout(routeTimeout);
  
  if (timeSinceLastRoute < MIN_ROUTE_INTERVAL) {
    routeTimeout = setTimeout(route, MIN_ROUTE_INTERVAL - timeSinceLastRoute);
  } else {
    routeTimeout = setTimeout(route, ROUTE_DEBOUNCE_MS);
  }
}

// Optimized hash change handling with RAF
let rafId;
function handleHashChange() {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(() => {
    if (location.hash === "#grid") loadProgrammes();
    
    // Use TabManager if available, otherwise fall back to old routing
    if (window.tabManager && typeof window.tabManager.switchToTab === 'function') {
      const hash = location.hash || "#planning";
      const tabId = hash.replace('#', '');
      window.tabManager.switchToTab(tabId);
    } else {
      debouncedRoute();
    }
    
    rafId = null;
  });
}

// Listen for hash changes and route accordingly
window.addEventListener("hashchange", handleHashChange);

// Initialize routing when page loads
window.addEventListener("DOMContentLoaded", () => {
  // Set default hash if none exists
  if (!location.hash || location.hash === "#") {
    location.hash = "#planning";
  }
  
  // Early initialization for faster loading
  setTimeout(() => {
    // Initialize calendar early for better perceived performance
    if (typeof window.calendarModule?.initializeCalendarEarly === "function") {
      window.calendarModule.initializeCalendarEarly();
    }
  }, 50);
  
  // Trigger initial routing
  setTimeout(() => {
    handleHashChange();
  }, 100);
});

// run once the page loads
// Removed call to loadProgrammes() as it is not defined and not needed
// if (location.hash === "#grid" || location.hash === "") loadProgrammes();

// Show the section whose ID matches the current hash
// Optimized section display with DOM fragment caching
let sectionDisplayCache = new Map();

function showSection(hash) {
  // Hide all sections first - cached operation
  if (!sectionDisplayCache.has('hiddenSections')) {
    const sections = document.querySelectorAll("section");
    sectionDisplayCache.set('hiddenSections', sections);
  }
  
  const sections = sectionDisplayCache.get('hiddenSections');
  sections.forEach((section) => {
    section.style.display = "none";
  });

  // Map hash to section ID - cached mapping
  const hashToSectionId = {
    "#planning": "view-planning",
    "#execution": "view-execution", 
    "#report": "view-report",
    "#roi": "view-roi",
    "#calendar": "view-calendar",
    "#github-sync": "view-github-sync",
    "#budgets": "view-budgets",
    "#budget-setup": "view-budget-setup",
  };

  const sectionId = hashToSectionId[hash] || "view-planning";
  
  // Cache section elements for faster access
  if (!sectionDisplayCache.has(sectionId)) {
    const targetSection = document.getElementById(sectionId);
    sectionDisplayCache.set(sectionId, targetSection);
  }
  
  const targetSection = sectionDisplayCache.get(sectionId);
  if (targetSection) {
    targetSection.style.display = "block";
    
    // Special handling for ROI tab - show the chart tabs container
    if (sectionId === "view-roi") {
      const roiChartTabsContainer = document.getElementById('roiChartTabsContainer');
      if (roiChartTabsContainer) {
        roiChartTabsContainer.style.display = 'block';
        roiChartTabsContainer.style.visibility = 'visible';
      }
    }
  }
}

// Optimized route function with intelligent caching and reduced operations
function route() {
  const currentHash = location.hash;
  
  // Hide ROI chart tabs container by default for ALL tabs except ROI
  const roiChartTabsContainer = document.getElementById('roiChartTabsContainer');
  if (roiChartTabsContainer) {
    if (currentHash === "#roi") {
      roiChartTabsContainer.style.display = 'block';
      roiChartTabsContainer.style.visibility = 'visible';
    } else {
      roiChartTabsContainer.style.display = 'none';
    }
  }
  
  // Hide all ROI-specific content by default
  const roiSpecificElements = [
    'roiGaugeChart', 
    'roiTotalSpendValue', 
    'roiTotalPipelineValue',
    'roiTotalLeadsValue',
    'roiTotalMqlValue'
  ];
  roiSpecificElements.forEach(id => {
    const element = document.getElementById(id);
    if (element && element.closest('#view-roi')) {
      // Only hide if it's inside the ROI section
      const roiSection = document.getElementById('view-roi');
      if (roiSection) {
        roiSection.style.display = 'none';
      }
    }
  });
  
  const hash = location.hash || "#planning";
  lastRouteTime = performance.now();
  
  // Skip if already on this tab and not first load
  if (currentTab === hash && isTabSwitching) {
    return;
  }
  
  // Check cache for recently processed tabs
  const cacheKey = hash;
  const cachedTime = tabSwitchCache.get(cacheKey);
  const now = Date.now();
  
  // Use cached result if within 2 seconds (prevents redundant operations)
  if (cachedTime && (now - cachedTime) < 2000) {
    // Only update visual state, skip heavy operations
    updateActiveTab(hash);
    showSection(hash);
    currentTab = hash;
    return;
  }
  
  isTabSwitching = true;
  
  // Cache this tab switch
  tabSwitchCache.set(cacheKey, now);
  
  // Clean old cache entries (keep last 5)
  if (tabSwitchCache.size > 5) {
    const oldestKey = tabSwitchCache.keys().next().value;
    tabSwitchCache.delete(oldestKey);
  }
  
  // Update visual state immediately for responsive feel
  updateActiveTab(hash);
  showSection(hash);
  
  // Hide all sections first
  document.querySelectorAll("section").forEach((sec) => {
    sec.style.display = "none";
  });
  // Show correct section(s) for the active tab
  if (hash === "#budgets") {
    console.log('🏦 [ROUTE] Showing budgets sections');
    const budgetsSection = document.getElementById("view-budgets");
    const budgetSetupSection = document.getElementById("view-budget-setup");
    console.log('🏦 [ROUTE] budgetsSection exists:', !!budgetsSection);
    console.log('🏦 [ROUTE] budgetSetupSection exists:', !!budgetSetupSection);
    if (budgetsSection) budgetsSection.style.display = "block";
    if (budgetSetupSection) budgetSetupSection.style.display = "block";
    if (window.budgetsTableInstance) {
      setTimeout(() => {
        window.budgetsTableInstance.redraw(true);
        // If the table library supports chunked setData, use it here for large data sets
        // Example: window.budgetsTableInstance.setDataInChunks(...)
        window.budgetsTableInstance.setData(
          window.budgetsTableInstance.getData(),
        );
        // Defer chart rendering to idle time for smoother UI
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            if (typeof window.renderBudgetsBarChart === "function") {
              window.renderBudgetsBarChart();
            }
            if (typeof window.renderBudgetsRegionCharts === "function") {
              window.renderBudgetsRegionCharts();
            }
          }, { timeout: 100 });
        } else {
          setTimeout(() => {
            if (typeof window.renderBudgetsBarChart === "function") {
              window.renderBudgetsBarChart();
            }
            if (typeof window.renderBudgetsRegionCharts === "function") {
              window.renderBudgetsRegionCharts();
            }
          }, 100);
        }
      }, 0);
    }
    // --- Ensure Annual Budget Plan unlock logic is initialized every time tab is shown ---
    if (
      window.budgetsModule &&
      typeof window.budgetsModule.initializeAnnualBudgetPlan === "function"
    ) {
      console.log('🏦 [ANNUAL BUDGET] Initializing during tab switch to budgets');
      // Use the latest budgets data if available, otherwise pass an empty array
      let budgetsData = [];
      try {
        budgetsData = window.budgetsTableInstance
          ? window.budgetsTableInstance.getData()
          : [];
        console.log('🏦 [ANNUAL BUDGET] Using table data for tab switch:', budgetsData);
      } catch (e) {
        console.log('🏦 [ANNUAL BUDGET] Error getting table data during tab switch:', e);
      }
      window.budgetsModule.initializeAnnualBudgetPlan(budgetsData);
    } else {
      console.log('🏦 [ANNUAL BUDGET] Module or function not available during tab switch');
      console.log('🏦 [ANNUAL BUDGET] budgetsModule:', !!window.budgetsModule);
      console.log('🏦 [ANNUAL BUDGET] initializeAnnualBudgetPlan:', !!window.budgetsModule?.initializeAnnualBudgetPlan);
    }
  } else {
    // Show only the section matching the tab
    const section = document.querySelector(
      `section#view-${hash.replace("#", "")}`,
    );
    // ...existing code...
    if (section) section.style.display = "block";
    if (
      hash === "#planning" &&
      window.planningModule &&
      window.planningModule.tableInstance
    ) {
      // Pre-populate filters immediately for better UX (no loading delay)
      if (typeof window.planningModule.prePopulatePlanningFilters === "function") {
        window.planningModule.prePopulatePlanningFilters();
      }
      
      setTimeout(() => {
        // Use the enhanced grid visibility function
        if (typeof window.planningModule.ensurePlanningGridVisible === "function") {
          window.planningModule.ensurePlanningGridVisible();
        } else {
          // Fallback to standard redraw
          window.planningModule.tableInstance.redraw(true);
        }
        // Do not apply any default sort when switching to planning tab
        // This ensures the table order matches the data array and the '#' column is sequential 1-N.
        // Initialize filters when planning tab is shown (this will update with dynamic data)
        if (typeof window.planningModule.populatePlanningFilters === "function") {
          window.planningModule.populatePlanningFilters();
        }
        // Initialize universal search for planning if not already done
        if (typeof window.planningModule.initializePlanningUniversalSearch === "function") {
          window.planningModule.initializePlanningUniversalSearch();
        }
      }, 0);
    }
    if (hash === "#execution") {
      // Pre-populate filters immediately for better UX (no loading delay)
      if (typeof window.executionModule?.prePopulateExecutionFilters === "function") {
        window.executionModule.prePopulateExecutionFilters();
      }
      
      // Initialize universal search immediately when execution tab is shown
      if (typeof window.executionModule?.initializeExecutionUniversalSearch === "function") {
        if (!window.executionUniversalSearch || 
            window.executionUniversalSearch instanceof HTMLElement ||
            typeof window.executionUniversalSearch.updateData !== 'function') {
          console.log("🔄 APP: Initializing execution universal search on tab switch");
          window.executionModule.initializeExecutionUniversalSearch();
          
          // Update search data after a longer delay to ensure table is ready
          setTimeout(() => {
            if (typeof window.executionModule.updateExecutionSearchData === 'function') {
              window.executionModule.updateExecutionSearchData();
            }
          }, 300);
        }
      }
      
      // Use requestIdleCallback for non-critical operations to avoid blocking
      if (typeof window !== 'undefined' && window.requestIdleCallback) {
        // First idle callback - just table redraw (lightweight)
        window.requestIdleCallback(() => {
          const startTime = performance.now();
          if (window.executionModule && window.executionModule.tableInstance) {
            const tableInstance = window.executionModule.tableInstance;
            // Use RAF for DOM updates to sync with browser paint
            requestAnimationFrame(() => {
              tableInstance.redraw(true);
            });
          }
          if (window.DEBUG_PERFORMANCE) {
            console.log(`Table redraw idle callback: ${(performance.now() - startTime).toFixed(2)}ms`);
          }
        }, { timeout: 100 });
        
        // Second idle callback - table data update
        window.requestIdleCallback(() => {
          const startTime = performance.now();
          if (window.executionModule && window.executionModule.tableInstance) {
            const tableInstance = window.executionModule.tableInstance;
            requestAnimationFrame(() => {
              tableInstance.setData(tableInstance.getData());
            });
          }
          if (window.DEBUG_PERFORMANCE) {
            console.log(`Table setData idle callback: ${(performance.now() - startTime).toFixed(2)}ms`);
          }
        }, { timeout: 200 });
        
        // Third idle callback - sync operations (potentially heavy)
        window.requestIdleCallback(() => {
          const startTime = performance.now();
          if (window.executionModule && typeof window.executionModule.syncDigitalMotionsFromPlanning === "function") {
            window.executionModule.syncDigitalMotionsFromPlanning();
          }
          if (window.DEBUG_PERFORMANCE) {
            console.log(`Sync digital motions idle callback: ${(performance.now() - startTime).toFixed(2)}ms`);
          }
        }, { timeout: 300 });
        
        // Fourth idle callback - filter setup (potentially heavy)
        window.requestIdleCallback(() => {
          const startTime = performance.now();
          if (window.executionModule && typeof window.executionModule.setupExecutionFilters === "function") {
            window.executionModule.setupExecutionFilters();
          }
          if (window.DEBUG_PERFORMANCE) {
            console.log(`Filter setup idle callback: ${(performance.now() - startTime).toFixed(2)}ms`);
          }
        }, { timeout: 400 });
        
        // Fifth idle callback - search data update (least critical)
        window.requestIdleCallback(() => {
          const startTime = performance.now();
          if (window.executionUniversalSearch && 
              typeof window.executionUniversalSearch.updateData === 'function' &&
              typeof window.executionModule.updateExecutionSearchData === 'function') {
            window.executionModule.updateExecutionSearchData();
          }
          if (window.DEBUG_PERFORMANCE) {
            console.log(`Search data update idle callback: ${(performance.now() - startTime).toFixed(2)}ms`);
          }
        }, { timeout: 500 });
      } else {
        // Lightweight fallback for browsers without requestIdleCallback
        setTimeout(() => {
          if (window.executionModule && window.executionModule.tableInstance) {
            window.executionModule.tableInstance.redraw(true);
          }
        }, 50);
        
        setTimeout(() => {
          if (window.executionModule) {
            // Pre-populate filters immediately
            if (typeof window.executionModule.prePopulateExecutionFilters === "function") {
              window.executionModule.prePopulateExecutionFilters();
            }
            
            if (typeof window.executionModule.syncDigitalMotionsFromPlanning === "function") {
              window.executionModule.syncDigitalMotionsFromPlanning();
            }
            if (typeof window.executionModule.setupExecutionFilters === "function") {
              window.executionModule.setupExecutionFilters();
            }
            
            // Update universal search data if it's already initialized
            if (window.executionUniversalSearch && 
                typeof window.executionUniversalSearch.updateData === 'function' &&
                typeof window.executionModule.updateExecutionSearchData === 'function') {
              window.executionModule.updateExecutionSearchData();
            }
          }
        }, 100);
      }
    }
    if (
      hash === "#roi" &&
      window.roiModule &&
      typeof window.roiModule.updateRoiTotalSpend === "function"
    ) {
      // Ensure ROI section is visible first
      const roiSection = document.getElementById('view-roi');
      if (roiSection) {
        roiSection.style.display = 'block';
      }
      
      // Show ROI chart tabs container immediately
      if (roiChartTabsContainer) {
        roiChartTabsContainer.style.display = 'block';
        roiChartTabsContainer.style.visibility = 'visible';
      }
      
      // Mark ROI tab as active for performance optimization
      if (typeof window.roiModule.setRoiTabActive === "function") {
        window.roiModule.setRoiTabActive(true);
      }
      
      // Initialize ROI functionality immediately - no delay
      if (typeof window.roiModule.initializeRoiFunctionality === "function") {
        window.roiModule.initializeRoiFunctionality();
      }
      
      setTimeout(() => {
        window.roiModule.populateRoiFilters();
        window.roiModule.updateRoiTotalSpend();
        
        // Ensure ROI data table is initialized when tab is viewed
        if (typeof window.roiModule.ensureRoiDataTableInitialized === "function") {
          window.roiModule.ensureRoiDataTableInitialized();
        }
        
        // Initialize universal search for ROI if not already done
        if (typeof window.roiModule.initializeRoiUniversalSearch === "function") {
          window.roiModule.initializeRoiUniversalSearch();
        }
        
        // Force chart updates to ensure they're visible
        if (typeof window.roiModule.updateRoiCharts === "function") {
          window.roiModule.updateRoiCharts();
        }
        
        // As a final safety measure, force refresh all components after a short delay
        setTimeout(() => {
          if (typeof window.roiModule.forceRefreshRoiComponents === "function") {
            window.roiModule.forceRefreshRoiComponents();
          }
        }, 300);
      }, 50); // Reduced delay
      
      setTimeout(initRoiTabSwitching, 200); // Initialize tab switching when ROI tab is viewed
      // ...existing code...
    } else {
      // Mark ROI tab as inactive when switching to other tabs
      if (typeof window.roiModule?.setRoiTabActive === "function") {
        window.roiModule.setRoiTabActive(false);
      }
    }
    if (hash === "#report" && window.reportTableInstance) {
      setTimeout(() => {
        window.reportTableInstance.redraw(true);
        window.reportTableInstance.setData(
          window.reportTableInstance.getData(),
        );
        // ...existing code...
      }, 0);
    }
    if (
      hash === "#report" &&
      typeof window.roiModule.updateReportTotalSpend === "function"
    ) {
      setTimeout(window.roiModule.updateReportTotalSpend, 0);
      // ...existing code...
    }
    if (
      hash === "#calendar" &&
      typeof window.calendarModule?.handleCalendarRouting === "function"
    ) {
      // Pre-populate calendar immediately for better UX
      if (typeof window.calendarModule?.prePopulateCalendar === "function") {
        window.calendarModule.prePopulateCalendar();
      }
      
      window.calendarModule.handleCalendarRouting();
      // Initialize universal search for calendar if not already done
      if (typeof window.calendarModule?.initializeCalendarUniversalSearch === "function") {
        window.calendarModule.initializeCalendarUniversalSearch();
      }
      // ...existing code...
    }
  }
  
  // Handle GitHub Sync password protection separately
  if (hash === "#github-sync") {
    if (!githubSyncUnlocked) {
      showGithubSyncPasswordModal((success) => {
        if (success) {
          // ...existing code...
          // Re-route to show the actual content
          route();
        } else {
          // ...existing code...
          location.hash = "#planning";
        }
      });
      return; // Don't show content until password is verified
    } else {
      // Already unlocked, show unlocked content
      const lockedDiv = document.getElementById("githubSyncLocked");
      const unlockedDiv = document.getElementById("githubSyncUnlocked");
      if (lockedDiv) lockedDiv.style.display = "none";
      if (unlockedDiv) unlockedDiv.style.display = "block";
      // ...existing code...
    }
  }
}

// Optimized active tab highlighting with DOM caching
let navLinksCache = null;

function updateActiveTab(hash) {
  // Cache navigation links for better performance
  if (!navLinksCache) {
    navLinksCache = document.querySelectorAll('nav a:not(.github-link)');
  }
  
  // Use cached elements for faster access
  navLinksCache.forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to current tab with cached lookup
  const currentTab = document.querySelector(`nav a[href="${hash}"]`);
  if (currentTab) {
    currentTab.classList.add('active');
  }
}

// --- GitHub Sync Permission Lock ---
let githubSyncUnlocked = false;

function showGithubSyncPasswordModal(callback) {
  const modal = document.getElementById("githubSyncPasswordModal");
  const form = document.getElementById("githubSyncPasswordForm");
  const input = document.getElementById("githubSyncPasswordInput");
  const error = document.getElementById("githubSyncPasswordError");
  const submit = document.getElementById("githubSyncPasswordSubmit");
  const cancel = document.getElementById("githubSyncPasswordCancel");
  if (!modal || !form || !input || !submit || !cancel) return;
  
  error.textContent = "";
  input.value = "";
  modal.style.display = "flex";
  input.focus();
  
  function closeModal() {
    modal.style.display = "none";
    form.onsubmit = null;
    cancel.onclick = null;
    input.onkeydown = null;
  }
  
  form.onsubmit = function (e) {
    e.preventDefault(); // Prevent actual form submission
    if (input.value === "git") {
      githubSyncUnlocked = true;
      closeModal();
      // Show unlocked content
      const lockedDiv = document.getElementById("githubSyncLocked");
      const unlockedDiv = document.getElementById("githubSyncUnlocked");
      if (lockedDiv) lockedDiv.style.display = "none";
      if (unlockedDiv) unlockedDiv.style.display = "block";
      callback(true);
    } else {
      error.textContent = "Incorrect password.";
      input.value = "";
      input.focus();
    }
  };
  
  cancel.onclick = function () {
    closeModal();
    callback(false);
  };
  
  input.onkeydown = function (e) {
    if (e.key === "Escape") cancel.onclick();
  };
}

// GitHub Sync functionality placeholders
function syncToGithub() {
  alert("Sync to GitHub functionality - This would sync your data to a GitHub repository.");
  // ...existing code...
}

function exportData() {
  alert("Export Data functionality - This would export all your planning and execution data.");
  // ...existing code...
}

function downloadReports() {
  alert("Download Reports functionality - This would generate and download ROI and budget reports.");
  // ...existing code...
}

window.addEventListener("DOMContentLoaded", async () => {
  // Performance-optimized initialization with reduced logging

  // Initialize constants from planning module
  initializeConstants();

  // Auto-configure Worker for all users with performance optimization
  if (window.cloudflareSyncModule) {
    // Set up the Worker endpoint for everyone
    window.cloudflareSyncModule.configureWorkerEndpoint(
      "https://mpt-mvp-sync.jordanradford.workers.dev",
    );

    // Enable auto-save by default with optimized debouncing
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

    // Check Worker API status with performance-optimized timing
    setTimeout(checkWorkerApiStatus, 2000); // Delay to allow page to load
  }

  // Show optimized loading indicator with immediate feedback
  const mainSection = document.querySelector("section#view-planning");
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "loadingIndicator";
  loadingDiv.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      font-family: 'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      <div style="
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #1976d2;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      "></div>
      <div style="font-size: 1.2rem; color: #666; margin-bottom: 8px;">Loading Planning Data...</div>
      <div id="loadingStatus" style="font-size: 0.9rem; color: #888;">Initializing filters...</div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  mainSection && mainSection.prepend(loadingDiv);

  // Update loading status to show progress
  const updateLoadingStatus = (message) => {
    const statusEl = document.getElementById("loadingStatus");
    if (statusEl) {
      statusEl.textContent = message;
    }
  };

  // Pre-populate filters immediately for better perceived performance
  if (window.planningModule?.prePopulatePlanningFilters) {
    updateLoadingStatus("Setting up filters...");
    window.planningModule.prePopulatePlanningFilters();
    updateLoadingStatus("Loading data...");
  }

  // Optimized data loading with intelligent module waiting
  let rows = [];
  let budgetsObj = {};
  try {
    // Optimized module loading with parallel checks
    const moduleChecks = [
      () => window.planningModule,
      () => window.budgetsModule
    ];
    
    // Wait for modules with performance tracking
    const startTime = performance.now();
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    while (moduleChecks.some(check => !check()) && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (moduleChecks.some(check => !check())) {
      throw new Error("Required modules failed to load within timeout");
    }

    // Parallel data loading for better performance
    [rows, budgetsObj] = await Promise.all([
      window.planningModule.loadPlanning(),
      window.budgetsModule.loadBudgets(),
    ]);
    
    // Handle empty data gracefully
    if (!rows || !Array.isArray(rows)) {
      console.warn("No planning data available, initializing with empty array");
      rows = [];
    }
    
    if (!budgetsObj || typeof budgetsObj !== 'object') {
      console.warn("No budgets data available, initializing with empty object");
      budgetsObj = {};
    }
    
  } catch (e) {
    console.error("Error loading data:", e);
    rows = [];
    budgetsObj = {};
  }
  
  // Always remove loading indicator regardless of data state
  loadingDiv && loadingDiv.remove();

  // Store budgets object globally for chart access
  window.budgetsObj = budgetsObj;

  // Convert budgets object to array for Tabulator
  const budgets = Object.entries(budgetsObj).map(([region, data]) => ({
    region,
    ...data,
  }));

  // Performance-optimized table initialization with chunking
  let planningTable = null;
  let executionTable = null;
  let budgetsTable = null;

  // Helper function to update loading progress
  const updateLoadingProgress = (message) => {
    // ...existing code...
    // Could add visual progress indicator here if needed
  };

  // Utility: Chunked/yielded processing for any data array
  async function processInChunks(data, chunkSize, processFn, yieldTimeout = 10) {
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      for (const row of chunk) {
        await processFn(row);
      }
      await new Promise(resolve => {
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
          window.requestIdleCallback(resolve, { timeout: yieldTimeout });
        } else {
          setTimeout(resolve, 0);
        }
      });
    }
  }

  // Initialize tables with error boundaries and performance monitoring in chunks
  // Store original planning rows for reset functionality
  window.originalPlanningRows = null;
  const initTables = async () => {
    const yieldControl = () => new Promise(resolve => setTimeout(resolve, 16)); // One frame yield

    // Chunk 1: Planning table
    try {
      updateLoadingStatus && updateLoadingStatus("Preparing planning table...");
      
      if (window.planningModule?.initPlanningGrid) {
        if (window.planningModule.PLANNING_COLUMNS) {
          window.planningModule.PLANNING_COLUMNS = window.planningModule.PLANNING_COLUMNS.filter(
            col => col.field !== 'opps' && col.field !== 'sql'
          );
          if (!window.planningModule.PLANNING_COLUMNS.some(col => col.field === 'issueLink')) {
            window.planningModule.PLANNING_COLUMNS.push({
              title: 'Issue Link',
              field: 'issueLink',
              formatter: function(cell) {
                const val = cell.getValue();
                if (!val) return '';
                // Always show 'Issue Link' for any valid URL, regardless of original anchor text
                if (/^https?:\/\//.test(val)) {
                  return `<a href="${val}" target="_blank" rel="noopener" style="font-family: 'Mona Sans', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif; font-weight: 600; font-size: 1em; color: #1976d2; text-decoration: underline;">Issue Link</a>`;
                }
                return `<span style="font-family: 'Mona Sans', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif; font-weight: 600; font-size: 1em; color: #1976d2;">${val}</span>`;
              },
              editor: 'input',
              headerTooltip: 'Paste a GitHub or Jira issue link for this row',
              width: 140
            });
          }
        }
        
        // Handle empty data gracefully
        if (!rows || rows.length === 0) {
          console.log("No planning data available - creating empty table");
          updateLoadingStatus && updateLoadingStatus("Creating table interface...");
          // Initialize with empty data but still create the table
          planningTable = await window.planningModule.initPlanningGrid([]);
          window.planningTableInstance = planningTable;
        } else {
          updateLoadingStatus && updateLoadingStatus(`Processing ${rows.length} planning items...`);
          // Sort rows by 'quarter' (and optionally by another field for tie-breaker) before grid init
          rows.sort((a, b) => {
            // If quarter is a string like 'Q1', 'Q2', etc., sort numerically
            const getQuarterNum = q => {
              if (!q) return 99;
              const m = q.match(/Q(\d+)/i);
              return m ? parseInt(m[1], 10) : 99;
            };
            const qA = getQuarterNum(a.quarter);
            const qB = getQuarterNum(b.quarter);
            if (qA !== qB) return qA - qB;
            // Tie-breaker: sort by campaign name or id if available
            if (a.name && b.name) return a.name.localeCompare(b.name);
            if (a.id && b.id) return a.id - b.id;
            return 0;
          });
          // Use chunked utility for planning
          let processedRows = [];
          await processInChunks(
            rows,
            1,
            async (row) => {
              // Step 1: Calculate metrics
              if (typeof window.planningModule.calculatePlanningMetrics === 'function') {
                row.metrics = window.planningModule.calculatePlanningMetrics(row);
                // Yield after metrics calculation
                await new Promise(resolve => setTimeout(resolve, 0));
              }
              // Step 2: Auto-tick digital motions if owner is Giorgia Parham
              if (
                row.owner &&
                typeof row.owner === 'string' &&
                row.owner.trim().toLowerCase() === 'giorgia parham'
              ) {
                row.digitalMotions = true;
              }
              // Step 3: (Optional) Any other heavy per-row logic can go here
              // If you have more heavy logic, yield again after it
            },
            5 // Lower yieldTimeout for more frequent yielding
          );
          processedRows = rows;
          // Store a deep copy of the original order for reset
          window.originalPlanningRows = JSON.parse(JSON.stringify(processedRows));
          planningTable = await window.planningModule.initPlanningGrid(processedRows);
          window.planningTableInstance = planningTable;
          // Apply default sort immediately after table initialization
          if (typeof planningTable.setSort === 'function') {
            planningTable.setSort([
              { column: 'quarter', dir: 'asc' }
            ]);
          }
        }
// Global function to reset planning table to original order and reapply default sort
window.resetPlanningTableOrder = function() {
  if (window.originalPlanningRows && window.planningTableInstance) {
    // Deep copy to avoid mutation
    const resetRows = JSON.parse(JSON.stringify(window.originalPlanningRows));
    window.planningTableInstance.setData(resetRows);
    // Optionally, reapply default sort (e.g., by 'quarter' or your preferred field)
    if (typeof window.planningTableInstance.setSort === 'function') {
      window.planningTableInstance.setSort([
        { column: 'quarter', dir: 'asc' }
      ]);
    }
  }
};
        // --- DEBUG: Print searchData after planning table and universal search are initialized ---
        if (
          window.planningModule &&
          typeof window.planningModule.updatePlanningSearchData === 'function' &&
          typeof window.planningModule.initializePlanningUniversalSearch === 'function'
        ) {
          // Initialize universal search if not already done
          window.planningModule.initializePlanningUniversalSearch();
          // Give time for search data to be set up
          setTimeout(() => {
            const searchData = window.planningModule.updatePlanningSearchData();
            console.log('[DEBUG] Planning searchData after universal search init:', searchData);
          }, 500);
        }
      }
    } catch (e) {
      console.error("Planning grid initialization failed:", e);
    }

    await yieldControl();
    updateLoadingProgress("Initializing execution grid...");

    // Chunk 2: Execution table
    try {
      if (window.executionModule?.initExecutionGrid) {
        // Handle empty data gracefully for execution grid too
        const executionRows = rows && rows.length > 0 ? rows : [];
        executionTable = await window.executionModule.initExecutionGrid(executionRows);
        window.executionTableInstance = executionTable;
      }
    } catch (e) {
      console.error("Execution grid initialization failed:", e);
    }

    await yieldControl();
    updateLoadingProgress("Initializing budgets table...");

    // Chunk 3: Budgets table
    try {
      if (window.budgetsModule?.initBudgetsTable) {
        await processInChunks(
          budgets,
          10,
          async (row) => {
            if (typeof window.budgetsModule.calculateUtilization === 'function') {
              row.utilization = window.budgetsModule.calculateUtilization(row);
            }
          },
          50
        );
        budgetsTable = window.budgetsModule.initBudgetsTable(budgets, rows);
        window.budgetsTableInstance = budgetsTable;
        setTimeout(() => {
          if (window.chartsModule?.renderBudgetsBarChart) {
            window.chartsModule.renderBudgetsBarChart();
          }
          if (window.chartsModule?.renderBudgetsRegionCharts) {
            window.chartsModule.renderBudgetsRegionCharts();
          }
        }, 100);
      }
    } catch (e) {
      console.error("Budgets table initialization failed:", e);
    }

    await yieldControl();
    updateLoadingProgress("Initializing calendar...");

    // Chunk 4: Calendar table/grid
    try {
      if (window.calendarModule?.initCalendarGrid && typeof window.calendarModule.loadCalendarData === 'function') {
        let calendarData = await window.calendarModule.loadCalendarData();
        await processInChunks(
          calendarData,
          10,
          async (row) => {
            if (typeof window.calendarModule.calculateCalendarMetrics === 'function') {
              row.metrics = window.calendarModule.calculateCalendarMetrics(row);
            }
          },
          50
        );
        if (typeof window.calendarModule.initCalendarGrid === 'function') {
          window.calendarTableInstance = await window.calendarModule.initCalendarGrid(calendarData);
        }
      }
    } catch (e) {
      console.error("Calendar table initialization failed:", e);
    }

    await yieldControl();
    updateLoadingProgress("Initializing ROI table...");

    // Chunk 5: ROI table/grid
    try {
      if (window.roiModule?.initRoiGrid && typeof window.roiModule.loadRoiData === 'function') {
        let roiData = await window.roiModule.loadRoiData();
        await processInChunks(
          roiData,
          10,
          async (row) => {
            if (typeof window.roiModule.calculateRoiMetrics === 'function') {
              row.metrics = window.roiModule.calculateRoiMetrics(row);
            }
          },
          50
        );
        if (typeof window.roiModule.initRoiGrid === 'function') {
          window.roiTableInstance = await window.roiModule.initRoiGrid(roiData);
        }
      }
    } catch (e) {
      console.error("ROI table initialization failed:", e);
    }

    await yieldControl();
    updateLoadingProgress("Tables initialized successfully");
  };

  await initTables();

  // Remove loading indicator and show completion
  if (loadingDiv) {
    updateLoadingStatus && updateLoadingStatus("Ready!");
    setTimeout(() => {
      loadingDiv.remove();
    }, 300); // Brief delay to show completion
  }
  const initializeModules = async () => {
    // Chunk 1: ROI functionality
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        // Initialize ROI functionality with pre-caching
        if (window.roiModule?.initializeRoiFunctionality) {
          window.roiModule.initializeRoiFunctionality();
        }

        // Initialize reporting with reduced console output
        if (window.roiModule?.updateReportTotalSpend) {
          window.roiModule.updateReportTotalSpend();
        }
        
        resolve();
      });
    });

    // Yield control between chunks
    await new Promise(resolve => setTimeout(resolve, 0));

    // Chunk 2: Setup save functionality and filters
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        // Setup save functionality with safety checks
        if (planningTable && window.planningModule) {
          if (window.planningModule.setupPlanningSave) {
            window.planningModule.setupPlanningSave(planningTable, rows);
          }
          if (window.planningModule.setupPlanningDownload) {
            window.planningModule.setupPlanningDownload(planningTable);
          }
        }

        // Initialize filter systems
        if (window.planningModule?.initializePlanningFilters) {
          window.planningModule.initializePlanningFilters();
        }
        
        if (window.executionModule?.initializeExecutionFilters) {
          window.executionModule.initializeExecutionFilters();
        }
        
        resolve();
      });
    });

    // Yield control between chunks
    await new Promise(resolve => setTimeout(resolve, 0));

    // Chunk 3: Budgets, calendar, and remaining setup
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        // Initialize Annual Budget Plan
        if (window.budgetsModule?.initializeAnnualBudgetPlan) {
          console.log('🏦 [ANNUAL BUDGET] Initializing during page load with budgets data:', budgets);
          console.log('🏦 [ANNUAL BUDGET] Current location.hash:', location.hash);
          console.log('🏦 [ANNUAL BUDGET] budgetsModule available:', !!window.budgetsModule);
          window.budgetsModule.initializeAnnualBudgetPlan(budgets);
        } else {
          console.log('🏦 [ANNUAL BUDGET] Module or function not available during page load');
          console.log('🏦 [ANNUAL BUDGET] budgetsModule:', !!window.budgetsModule);
          console.log('🏦 [ANNUAL BUDGET] initializeAnnualBudgetPlan:', !!window.budgetsModule?.initializeAnnualBudgetPlan);
        }

        // Initialize calendar module
        if (window.calendarModule?.initializeCalendar) {
          window.calendarModule.initializeCalendar();
        }
        
        // Setup ROI chart event handlers
        if (window.roiModule?.setupRoiChartEventHandlers) {
          window.roiModule.setupRoiChartEventHandlers();
        }
        
        resolve();
      });
    });

    // Yield control between chunks
    await new Promise(resolve => setTimeout(resolve, 0));

    // Chunk 4: Pre-cache planning data (separate chunk to prevent blocking)
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        // Pre-cache planning data for faster filter performance (delayed)
        if (window.roiModule?.preCachePlanningData) {
          setTimeout(() => {
            window.roiModule.preCachePlanningData();
          }, 1000);
        }
        
        resolve();
      });
    });
  };

  await initializeModules();

  // Initialize GitHub Sync with performance optimization
  initGithubSync();

  // Optimized final initialization sequence
  requestAnimationFrame(() => {
    // Ensure hash is set to a valid tab on load
    const validTabs = [
      "#planning", "#execution", "#budgets", "#calendar",
      "#report", "#roi", "#github-sync", "#budget-setup",
    ];
    if (!validTabs.includes(location.hash)) {
      location.hash = "#planning";
    }
    
    // Call route after everything is ready
    setTimeout(() => {
      console.log('🚀 [ROUTE] Calling debouncedRoute(), current hash:', location.hash);
      debouncedRoute();
      
      // Ensure annual budget plan is initialized if page loads on budgets tab
      if (location.hash === "#budgets" && 
          window.budgetsModule && 
          typeof window.budgetsModule.initializeAnnualBudgetPlan === "function") {
        console.log('🏦 [ANNUAL BUDGET] Page loaded on budgets tab, re-initializing...');
        // Get the latest budgets data for initialization
        let budgetsData = [];
        try {
          budgetsData = window.budgetsTableInstance ? window.budgetsTableInstance.getData() : budgets;
          console.log('🏦 [ANNUAL BUDGET] Using budgets data:', budgetsData);
        } catch (e) {
          console.log('🏦 [ANNUAL BUDGET] Error getting table data, using original budgets:', e);
          budgetsData = budgets;
        }
        // Initialize annual budget plan after route is complete
        setTimeout(() => {
          console.log('🏦 [ANNUAL BUDGET] Re-initializing with data:', budgetsData);
          console.log('🏦 [ANNUAL BUDGET] Sections visible check:');
          const budgetsSection = document.getElementById("view-budgets");
          const budgetSetupSection = document.getElementById("view-budget-setup");
          console.log('🏦 [ANNUAL BUDGET] view-budgets display:', budgetsSection?.style.display);
          console.log('🏦 [ANNUAL BUDGET] view-budget-setup display:', budgetSetupSection?.style.display);
          
          // Ensure both budgets sections are visible
          if (budgetsSection) budgetsSection.style.display = "block";
          if (budgetSetupSection) budgetSetupSection.style.display = "block";
          console.log('🏦 [ANNUAL BUDGET] Forced both sections to be visible');
          
          // Double-check after a short delay to ensure they stay visible
          setTimeout(() => {
            if (budgetsSection) budgetsSection.style.display = "block";
            if (budgetSetupSection) budgetSetupSection.style.display = "block";
            console.log('🏦 [ANNUAL BUDGET] Double-checked sections are still visible');
          }, 50);
          
          window.budgetsModule.initializeAnnualBudgetPlan(budgetsData);
        }, 200); // Increased delay to ensure sections are visible
      } else {
        console.log('🏦 [ANNUAL BUDGET] Not budgets tab or module not ready');
        console.log('🏦 [ANNUAL BUDGET] hash:', location.hash);
        console.log('🏦 [ANNUAL BUDGET] budgetsModule:', !!window.budgetsModule);
        console.log('🏦 [ANNUAL BUDGET] initializeAnnualBudgetPlan:', !!window.budgetsModule?.initializeAnnualBudgetPlan);
      }
    }, 0);

    // Setup grid synchronization
    if (planningTable && executionTable && window.executionModule?.syncGridsOnEdit) {
      window.executionModule.syncGridsOnEdit(planningTable, executionTable);
      window.executionModule.syncGridsOnEdit(executionTable, planningTable);
    }
  });
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
  window.planningModule.initPlanningGrid = async function (rows) {
    const table = await origInitPlanningGrid2(rows);
    window.planningRows = rows;
    if (table && typeof table.on === 'function') {
      table.on("dataChanged", renderBudgetsRegionCharts);
    }
    setTimeout(renderBudgetsRegionCharts, 200);
    return table;
  };
}

// Performance-optimized Worker API status check with intelligent caching
let workerStatusCache = { status: null, timestamp: 0 };
const WORKER_STATUS_CACHE_MS = 30000; // 30 second cache

async function checkWorkerApiStatus() {
  const now = Date.now();
  
  // Use cached result if available and fresh
  if (workerStatusCache.status && (now - workerStatusCache.timestamp) < WORKER_STATUS_CACHE_MS) {
    return workerStatusCache.status;
  }
  
  try {
    const endpoint = "https://mpt-mvp-sync.jordanradford.workers.dev";

    // Optimized fetch with timeout and abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${endpoint}/data/planning`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const isAvailable = response.ok;
    workerStatusCache = { status: isAvailable, timestamp: now };

    if (!isAvailable && document.getElementById("syncStatus")) {
      showSyncStatus(
        "⚠️ Real-time data sync is currently unavailable. Using local data files. Save operations will still work, but you may not see other users' changes immediately.",
        "warning",
      );
    }
    
    return isAvailable;
  } catch (error) {
    workerStatusCache = { status: false, timestamp: now };
    
    if (document.getElementById("syncStatus")) {
      showSyncStatus(
        "⚠️ Real-time data sync is currently unavailable. Using local data files. Save operations will still work, but you may not see other users' changes immediately.",
        "warning",
      );
    }
    
    return false;
  }
}

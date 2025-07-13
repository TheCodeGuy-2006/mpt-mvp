/**
 * Cloudflare Worker Sync Module
 * Handles autosave and manual save operations to Cloudflare Worker
 */

// Configuration - Pre-configured for all users
let WORKER_ENDPOINT = "https://mpt-mvp-sync.jordanradford.workers.dev";
let AUTO_SAVE_CONFIG = {
  enabled: true, // Auto-save enabled by default
  debounceMs: 3000, // 3 seconds default delay
};

// Internal state
const saveQueue = new Map();
const saveTimeouts = new Map();
const statusCallbacks = new Set();

// Status indicator management
export function addStatusCallback(callback) {
  statusCallbacks.add(callback);
}

export function removeStatusCallback(callback) {
  statusCallbacks.delete(callback);
}

function updateStatus(message, type = "info") {
  statusCallbacks.forEach((callback) => {
    try {
      callback(message, type);
    } catch (error) {
      console.warn("Status callback error:", error);
    }
  });
}

/**
 * Auto-save manager class
 */
class AutoSaveManager {
  constructor() {
    this.saveTimeouts = new Map();
    this.saveQueue = new Map();
  }

  /**
   * Schedule a save operation with debouncing
   * @param {string} dataType - Type of data (planning, budgets, calendar)
   * @param {Object} data - Data to save
   * @param {Object} options - Save options
   */
  scheduleSave(dataType, data, options = {}) {
    if (!AUTO_SAVE_CONFIG.enabled) return;

    // Clear existing timeout for this data type
    if (this.saveTimeouts.has(dataType)) {
      clearTimeout(this.saveTimeouts.get(dataType));
    }

    // Queue the data for saving
    this.saveQueue.set(dataType, { data, options });

    // Set new timeout
    const timeoutId = setTimeout(() => {
      this.executeSave(dataType);
    }, AUTO_SAVE_CONFIG.debounceMs);

    this.saveTimeouts.set(dataType, timeoutId);

    updateStatus("💾 Saving...", "info");
  }

  /**
   * Execute the actual save operation
   * @param {string} dataType - Type of data to save
   */
  async executeSave(dataType) {
    if (!this.saveQueue.has(dataType)) return;

    const { data, options } = this.saveQueue.get(dataType);
    this.saveQueue.delete(dataType);
    this.saveTimeouts.delete(dataType);

    try {
      await this.saveToWorker(dataType, data, options);
      updateStatus("✅ Saved", "success");

      // Refresh data after successful auto-save
      if (
        typeof window.cloudflareSyncModule?.refreshDataAfterSave === "function"
      ) {
        window.cloudflareSyncModule.refreshDataAfterSave(dataType);
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        updateStatus("", "clear");
      }, 2000);
    } catch (error) {
      console.error("Auto-save failed:", error);
      updateStatus("❌ Save failed", "error");

      // Clear error message after 5 seconds
      setTimeout(() => {
        updateStatus("", "clear");
      }, 5000);
    }
  }

  /**
   * Save data to Cloudflare Worker
   * @param {string} dataType - Type of data (planning, budgets, calendar)
   * @param {Object} data - Data to save
   * @param {Object} options - Save options
   */
  async saveToWorker(dataType, data, options = {}) {
    if (!WORKER_ENDPOINT || WORKER_ENDPOINT.includes("your-worker-name")) {
      throw new Error("Worker endpoint not configured");
    }

    const payload = {
      dataType,
      data,
      timestamp: new Date().toISOString(),
      source: "github-pages-frontend",
      ...options,
    };

    // Remove trailing slash from endpoint to prevent double slashes
    const cleanEndpoint = WORKER_ENDPOINT.replace(/\/$/, "");
    const response = await fetch(`${cleanEndpoint}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Data-Type": dataType,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Worker save failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log(`Auto-save to Worker successful for ${dataType}:`, result);
    return result;
  }

  /**
   * Force save all pending changes immediately
   */
  async forceSaveAll() {
    const promises = [];

    for (const [dataType, { data, options }] of this.saveQueue) {
      promises.push(this.saveToWorker(dataType, data, options));
    }

    // Clear all pending timeouts and queue
    this.saveTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.saveTimeouts.clear();
    this.saveQueue.clear();

    if (promises.length === 0) {
      throw new Error("No pending changes to save");
    }

    const results = await Promise.all(promises);
    return results;
  }

  /**
   * Clear all pending saves
   */
  clearPending() {
    this.saveTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.saveTimeouts.clear();
    this.saveQueue.clear();
    updateStatus("", "clear");
  }
}

// Create singleton instance
const autoSaveManager = new AutoSaveManager();

/**
 * Public API functions
 */

/**
 * Schedule an auto-save operation
 * @param {string} dataType - Type of data (planning, budgets, calendar)
 * @param {Object} data - Data to save
 * @param {Object} options - Save options
 */
export function scheduleSave(dataType, data, options = {}) {
  autoSaveManager.scheduleSave(dataType, data, options);
}

/**
 * Manually save data to Worker immediately
 * @param {string} dataType - Type of data (planning, budgets, calendar)
 * @param {Object} data - Data to save
 * @param {Object} options - Save options
 */
export async function saveToWorker(dataType, data, options = {}) {
  updateStatus("💾 Saving...", "info");

  try {
    const result = await autoSaveManager.saveToWorker(dataType, data, options);
    updateStatus("✅ Saved to Worker", "success");

    // Clear success message after 2 seconds
    setTimeout(() => {
      updateStatus("", "clear");
    }, 2000);

    return result;
  } catch (error) {
    console.error("Manual save to Worker failed:", error);
    updateStatus("❌ Worker save failed", "error");

    // Clear error message after 5 seconds
    setTimeout(() => {
      updateStatus("", "clear");
    }, 5000);

    throw error;
  }
}

/**
 * Test connection to Worker
 */
export async function testWorkerConnection() {
  if (!WORKER_ENDPOINT || WORKER_ENDPOINT.includes("your-worker-name")) {
    throw new Error("Worker endpoint not configured");
  }

  // Remove trailing slash from endpoint to prevent double slashes
  const cleanEndpoint = WORKER_ENDPOINT.replace(/\/$/, "");
  const response = await fetch(`${cleanEndpoint}/health`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Health check failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const result = await response.json();
  return result;
}

/**
 * Force save all pending changes
 */
export async function forceSaveAll() {
  updateStatus("⚡ Force saving...", "info");

  try {
    const results = await autoSaveManager.forceSaveAll();
    updateStatus("✅ Force save completed", "success");

    // Clear success message after 2 seconds
    setTimeout(() => {
      updateStatus("", "clear");
    }, 2000);

    return results;
  } catch (error) {
    console.error("Force save failed:", error);
    updateStatus("❌ Force save failed", "error");

    // Clear error message after 5 seconds
    setTimeout(() => {
      updateStatus("", "clear");
    }, 5000);

    throw error;
  }
}

/**
 * Configure Worker endpoint
 * @param {string} endpoint - Worker endpoint URL
 */
export function configureWorkerEndpoint(endpoint) {
  WORKER_ENDPOINT = endpoint ? endpoint.replace(/\/$/, "") : endpoint; // Remove trailing slash
}

/**
 * Configure auto-save settings
 * @param {Object} config - Configuration object
 */
export function configureAutoSave(config) {
  Object.assign(AUTO_SAVE_CONFIG, config);
}

/**
 * Force save all pending changes
 */
export async function forceSaveAllData() {
  return await forceSaveAll();
}

/**
 * Get current auto-save configuration
 */
export function getAutoSaveConfig() {
  return { ...AUTO_SAVE_CONFIG };
}

/**
 * Get Worker endpoint
 */
export function getWorkerEndpoint() {
  return WORKER_ENDPOINT;
}

/**
 * Clear all pending saves
 */
export function clearPendingSaves() {
  autoSaveManager.clearPending();
}

/**
 * Refresh data after successful save
 * @param {string} dataType - Type of data that was saved
 */
export function refreshDataAfterSave(dataType) {
  // Add a delay to account for GitHub's caching and processing time
  const refreshDelay = 2000; // 2 seconds delay

  console.log(`Refreshing ${dataType} data in ${refreshDelay}ms...`);

  setTimeout(() => {
    // Trigger a refresh of the relevant data view
    if (dataType === "planning" && typeof window.loadPlanning === "function") {
      console.log("Refreshing planning data after save...");
      window
        .loadPlanning()
        .then((rows) => {
          if (window.planningTableInstance && rows && rows.length > 0) {
            window.planningTableInstance.setData(rows);
            console.log("✅ Planning data refreshed successfully");

            // Show user feedback
            updateStatus("🔄 Data refreshed from GitHub", "success");
            setTimeout(() => updateStatus("", "clear"), 3000);
          } else {
            console.warn(
              "⚠️ Planning data refresh returned empty data - GitHub might still be updating",
            );

            // Try again after longer delay
            setTimeout(() => {
              console.log("Retrying planning data refresh...");
              window
                .loadPlanning()
                .then((retryRows) => {
                  if (
                    window.planningTableInstance &&
                    retryRows &&
                    retryRows.length > 0
                  ) {
                    window.planningTableInstance.setData(retryRows);
                    console.log("✅ Planning data refreshed on retry");
                    updateStatus(
                      "🔄 Data refreshed from GitHub (retry)",
                      "success",
                    );
                    setTimeout(() => updateStatus("", "clear"), 3000);
                  }
                })
                .catch((error) => {
                  console.warn(
                    "Failed to refresh planning data on retry:",
                    error,
                  );
                });
            }, 5000); // 5 second retry
          }
        })
        .catch((error) => {
          console.warn("Failed to refresh planning data:", error);
          updateStatus(
            "⚠️ Data refresh failed - GitHub may be updating",
            "warning",
          );
          setTimeout(() => updateStatus("", "clear"), 5000);
        });
    } else if (
      dataType === "budgets" &&
      typeof window.loadBudgets === "function"
    ) {
      console.log("Refreshing budgets data after save...");
      window
        .loadBudgets()
        .then((budgets) => {
          if (
            window.budgetsTableInstance &&
            budgets &&
            Object.keys(budgets).length > 0
          ) {
            // Convert object back to array format for the table
            const budgetsArray = Object.entries(budgets).map(
              ([region, data]) => ({
                region,
                ...data,
              }),
            );
            window.budgetsTableInstance.setData(budgetsArray);
            console.log("✅ Budgets data refreshed successfully");

            // Show user feedback
            updateStatus("🔄 Budgets refreshed from GitHub", "success");
            setTimeout(() => updateStatus("", "clear"), 3000);
          } else {
            console.warn(
              "⚠️ Budgets data refresh returned empty data - GitHub might still be updating",
            );

            // Try again after longer delay
            setTimeout(() => {
              console.log("Retrying budgets data refresh...");
              window
                .loadBudgets()
                .then((retryBudgets) => {
                  if (
                    window.budgetsTableInstance &&
                    retryBudgets &&
                    Object.keys(retryBudgets).length > 0
                  ) {
                    const retryBudgetsArray = Object.entries(retryBudgets).map(
                      ([region, data]) => ({
                        region,
                        ...data,
                      }),
                    );
                    window.budgetsTableInstance.setData(retryBudgetsArray);
                    console.log("✅ Budgets data refreshed on retry");
                    updateStatus(
                      "🔄 Budgets refreshed from GitHub (retry)",
                      "success",
                    );
                    setTimeout(() => updateStatus("", "clear"), 3000);
                  }
                })
                .catch((error) => {
                  console.warn(
                    "Failed to refresh budgets data on retry:",
                    error,
                  );
                });
            }, 5000); // 5 second retry
          }
        })
        .catch((error) => {
          console.warn("Failed to refresh budgets data:", error);
          updateStatus(
            "⚠️ Budgets refresh failed - GitHub may be updating",
            "warning",
          );
          setTimeout(() => updateStatus("", "clear"), 5000);
        });
    }
  }, refreshDelay);
}

// Initialize status management
console.log("Cloudflare sync module loaded");

// Export for global access
window.cloudflareSyncModule = {
  scheduleSave,
  saveToWorker,
  testWorkerConnection,
  forceSaveAll,
  configureWorkerEndpoint,
  configureAutoSave,
  getAutoSaveConfig,
  getWorkerEndpoint,
  clearPendingSaves,
  addStatusCallback,
  removeStatusCallback,
  refreshDataAfterSave,
};

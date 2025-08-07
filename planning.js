// --- Highlight Unsaved Rows in Planning Grid ---
function highlightUnsavedRows() {
  if (!window.planningTableInstance) return;
  window.planningTableInstance.getRows().forEach(row => {
    const data = row.getData();
    if (data.__modified === true) {
      row.getElement().classList.add('unsaved-row-highlight');
    } else {
      row.getElement().classList.remove('unsaved-row-highlight');
    }
  });
}

// Add CSS for subtle green highlight
if (!document.getElementById('unsaved-row-highlight-style')) {
  const style = document.createElement('style');
  style.id = 'unsaved-row-highlight-style';
  style.textContent = `
    .unsaved-row-highlight {
      background: linear-gradient(90deg, #e6f9ed 80%, #d0f5e3 100%) !important;
      transition: background 0.3s;
    }
  `;
  document.head.appendChild(style);
}
window.highlightUnsavedRows = highlightUnsavedRows;
// --- Unsaved Changes Flag for Planning Tab ---
window.hasUnsavedPlanningChanges = false;
// --- Warn on Tab Close/Reload if Unsaved Changes in Planning Tab ---
window.addEventListener('beforeunload', function (e) {
  if (window.hasUnsavedPlanningChanges) {
    // Standard message is ignored by most browsers, but setting returnValue triggers the dialog
    const msg = 'You have unsaved changes in the Planning tab. Are you sure you want to leave?';
    e.preventDefault();
    e.returnValue = msg;
    return msg;
  }
});
// --- Description Cell Hover Enlargement CSS (smaller, smarter, avoids cutoff) ---
function injectDescriptionHoverCSS() {
  if (document.getElementById('desc-hover-style')) return;
  const style = document.createElement('style');
  style.id = 'desc-hover-style';
  style.textContent = `
    .tabulator-cell.description-hover {
      transition: z-index 0s, box-shadow 0.18s, transform 0.18s, background 0.18s;
      position: relative;
      z-index: 1;
      background: inherit;
    }
    .tabulator-cell.description-hover:hover {
      z-index: 1000 !important;
      background: #fff !important;
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.13), 0 1px 3px 0 rgba(0,0,0,0.08);
      /* No absolute/fixed positioning here, revert to normal */
      white-space: pre-line !important;
      overflow: visible !important;
      word-break: break-word;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}
injectDescriptionHoverCSS();
import { kpis } from "./src/calc.js";

// Utility function for safe table scrolling
function safeScrollToRow(table, rowIdentifier, position = "top", ifVisible = false) {
  if (!table || typeof table.scrollToRow !== 'function') {
    console.warn("Invalid table instance for scrolling");
    return false;
  }
  
  try {
    // Check if table is properly initialized
    if (!table.element || !table.element.offsetParent) {
      console.warn("Table not yet visible, skipping scroll");
      return false;
    }
    
// ...existing code...
    if (!data || data.length === 0) {
      console.warn("No data available for scrolling");
      return false;
    }
    
    // More robust row identification
    let targetRow = rowIdentifier;
    if (typeof rowIdentifier === 'number') {
      // Validate the index is within bounds
      if (rowIdentifier <= data.length && rowIdentifier > 0) {
        targetRow = data[rowIdentifier - 1]; // Convert to 0-based index
      } else {
        // Fallback to first row if index is out of bounds
        targetRow = data[0];
      }
    }
    
    // Verify the target row still exists
    if (!targetRow || typeof targetRow !== 'object') {
      console.warn("Invalid target row, using first available row");
      targetRow = data[0];
    }
    
    // Check if the row actually exists in the current table state
    const tableRows = table.getRows();
    const rowExists = tableRows.some(row => {
      try {
        const rowData = row.getData();
        return rowData === targetRow;
      } catch (e) {
        return false;
      }
    });
    
    if (!rowExists) {
      console.warn("Target row no longer exists in table, scrolling to top");
      if (typeof table.scrollToPosition === 'function') {
        table.scrollToPosition(0, 0, false);
        return true;
      }
      return false;
    }
    
    // Perform the scroll operation
    table.scrollToRow(targetRow, position, ifVisible);
    return true;
    
  } catch (scrollError) {
    console.warn("Scroll operation failed:", scrollError.message);
    
    // Fallback to position-based scrolling
    try {
      if (typeof table.scrollToPosition === 'function') {


// --- DM Badge for Digital Motions Campaigns in Execution Details ---
function injectDMBadgeCSS() {
  if (document.getElementById('dm-badge-style')) return;
  const style = document.createElement('style');
  style.id = 'dm-badge-style';
  style.textContent = `
    .dm-badge {
      position: absolute;
      top: 10px;
      right: 12px;
      background: #1976d2;
      color: #fff;
      font-weight: bold;
      font-size: 0.95em;
      padding: 2px 8px 2px 8px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(25,118,210,0.08);
      z-index: 10;
      letter-spacing: 0.04em;
      user-select: none;
      pointer-events: none;
      display: inline-block;
    }
    .details-box-dm {
      position: relative !important;
    }
  `;
  document.head.appendChild(style);
}
injectDMBadgeCSS();

// Call this after rendering the campaign details box in the Execution tab
function addDMBadgeToDetailsBox(detailsBoxElem, campaignData) {
  if (!detailsBoxElem || !campaignData) return;
  // Only add if digitalMotions is true (boolean or string 'true')
  if (campaignData.digitalMotions === true || campaignData.digitalMotions === 'true') {
    detailsBoxElem.classList.add('details-box-dm');
    // Prevent duplicate badge
    if (!detailsBoxElem.querySelector('.dm-badge')) {
      const badge = document.createElement('span');
      badge.className = 'dm-badge';
      badge.textContent = 'DM';
      detailsBoxElem.appendChild(badge);
    }
  } else {
    // Remove badge if present
    const badge = detailsBoxElem.querySelector('.dm-badge');
    if (badge) badge.remove();
    detailsBoxElem.classList.remove('details-box-dm');
  }
}

// Example usage (to be called wherever the details box is rendered/refreshed):
//   addDMBadgeToDetailsBox(detailsBoxElem, campaignData);
// Where detailsBoxElem is the DOM node for the details box, and campaignData is the campaign's data object.


// --- Auto-inject DM badge for all digital motions campaigns in Execution tab ---
function autoInjectDMBadgesOnExecutionTab() {
  // Helper: get all visible campaign details boxes
  function getDetailsBoxes() {
    // Try common selectors; adjust as needed for your app
    return Array.from(document.querySelectorAll('.campaign-details-box, .details-box, .execution-details, .execution-campaign-details'));
  }

  // Helper: get campaign data from DOM node (assumes data is attached or accessible)
  function getCampaignDataFromBox(box) {
    // Try to get data from a property or dataset; adjust as needed for your app
    if (box.campaignData) return box.campaignData;
    if (box.dataset && box.dataset.campaigndata) {
      try { return JSON.parse(box.dataset.campaigndata); } catch (e) { return null; }
    }
    // Fallback: try to find a global or parent data object
    return null;
  }

  // Main logic: add badge to all boxes with digitalMotions true
  function updateAllBadges() {
    getDetailsBoxes().forEach(box => {
      const data = getCampaignDataFromBox(box);
      if (data && (data.digitalMotions === true || data.digitalMotions === 'true')) {
        addDMBadgeToDetailsBox(box, data);
      } else {
        // Remove badge if present
        const badge = box.querySelector && box.querySelector('.dm-badge');
        if (badge) badge.remove();
        box.classList && box.classList.remove('details-box-dm');
      }
    });
  }

  // Observe DOM changes to auto-update badges
  const observer = new MutationObserver(() => {
    if (window.location.hash.includes('#execution')) {
      updateAllBadges();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also update on hash change (tab switch)
  window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('#execution')) {
      setTimeout(updateAllBadges, 100);
    }
  });

  // Initial run if already on execution tab
  if (window.location.hash.includes('#execution')) {
    setTimeout(updateAllBadges, 100);
  }
}
autoInjectDMBadgesOnExecutionTab();
        table.scrollToPosition(0, 0, false);
        return true;
      }
    } catch (fallbackError) {
      console.warn("Fallback scroll also failed:", fallbackError.message);
    }
    
    return false;
  }
}

// PLANNING TAB CONSTANTS AND DATA
// Quarter normalization function to handle format differences ("Q1 July" vs "Q1 - July")
function normalizeQuarter(quarter) {
  if (!quarter || typeof quarter !== 'string') return quarter;
  return quarter.replace(/\s*-\s*/, ' ');
}

// Simplified performance monitoring
const planningPerformance = {
  startTime: null,
  endTime: null,
  
  start(operation) {
    this.startTime = performance.now();
  },
  
  end(operation) {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    
    // Only warn for very slow operations
    if (duration > 5000) {
      console.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
};

const programTypes = [
  "User Groups",
  "Targeted paid ads & content sydication",
  "Flagship Events (Galaxy, Universe Recaps) 1:Many",
  "3P Sponsored Events",
  "Webinars",
  "Microsoft",
  "Lunch & Learns and Workshops (1:few)",
  "Localized Programs",
  "CxO events (1:few)",
  "Exec engagement programs",
  "In-Account Events (1:1)",
  "Contractor/Infrastructure",
  "Paid ads",
  "Operational/Infrastructure/Swag",
];

const strategicPillars = [
  "Account Growth and Product Adoption",
  "Pipeline Acceleration & Executive Engagement",
  "Brand Awareness & Top of Funnel Demand Generation",
  "New Logo Acquisition",
];

const names = [
  "Shruti Narang",
  "Beverly Leung",
  "Giorgia Parham",
  "Tomoko Tanaka",
];

const revenuePlays = ["New Business", "Expansion", "Retention"];
const fyOptions = ["FY25", "FY24", "FY23"];

const quarterOptions = [
  "Q1 July",
  "Q1 August",
  "Q1 September",
  "Q2 October",
  "Q2 November",
  "Q2 December",
  "Q3 January",
  "Q3 February",
  "Q3 March",
  "Q4 April",
  "Q4 May",
  "Q4 June",
];

const monthOptions = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const regionOptions = ["JP & Korea", "South APAC", "SAARC", "X APAC Non English", "X APAC English"];

const statusOptions = ["Planning", "On Track", "Shipped", "Cancelled"];
const yesNo = ["(Clear)", "Yes", "No"];

// Country options by region (partial mapping)
const countryOptionsByRegion = {
  ASEAN: [
    "Brunei Darussalam",
    "Cambodia",
    "Indonesia",
    "Lao People's Democratic Republic",
    "Malaysia",
    "Myanmar",
    "Philippines",
    "Singapore",
    "Thailand",
    "Vietnam",
  ],
  ANZ: ["Australia", "New Zealand"],
  GCR: ["China", "Hong Kong", "Taiwan"],
  "South APAC": [
    "Brunei Darussalam",
    "Cambodia",
    "Indonesia",
    "Lao People's Democratic Republic",
    "Malaysia",
    "Myanmar",
    "Philippines",
    "Singapore",
    "Thailand",
    "Vietnam",
    "Australia",
    "New Zealand",
    "China",
    "Hong Kong",
    "Taiwan",
  ],
  "North APAC": ["Japan", "South Korea"],
  SAARC: [
    "Afghanistan",
    "Bangladesh",
    "Bhutan",
    "India",
    "Maldives",
    "Nepal",
    "Pakistan",
    "Sri Lanka",
  ],
  // ...other regions to be filled in as provided...
};

// Ensure all country dropdowns have at least an empty option if no region is selected
Object.keys(countryOptionsByRegion).forEach((region) => {
  if (
    !Array.isArray(countryOptionsByRegion[region]) ||
    countryOptionsByRegion[region].length === 0
  ) {
    countryOptionsByRegion[region] = [""];
  }
});

// Utility: Get all unique countries from all regions (cached for performance)
let allCountriesCache = null;
function getAllCountries() {
  if (allCountriesCache) {
    return allCountriesCache;
  }
  
  const all = [];
  Object.values(countryOptionsByRegion).forEach((arr) => {
    if (Array.isArray(arr)) all.push(...arr);
  });
  // Remove duplicates and cache result
  allCountriesCache = Array.from(new Set(all));
  return allCountriesCache;
}

// Patch: For now, allow all countries for any region
function getCountryOptionsForRegion(region) {
  const allCountries = getAllCountries();
  return allCountries.length > 0 ? allCountries : ["(No countries available)"];
}

// PLANNING DATA LOADING
// Web Worker for heavy data processing
let planningWorker = null;

function initPlanningWorker() {
  if (!planningWorker) {
    try {
      planningWorker = new Worker('workers/planning-worker.js');
      
      planningWorker.onmessage = function(e) {
        const { type, data, progress, error } = e.data;
        
        switch (type) {
          case 'PROGRESS':
            showLoadingIndicator(`Processing... ${progress}%`);
            break;
          case 'PROCESS_PLANNING_DATA_COMPLETE':
            planningDataCache = data;
            isDataLoading = false;
            hideLoadingIndicator();
            break;
          case 'APPLY_FILTERS_COMPLETE':
            if (planningTableInstance) {
              planningTableInstance.setData(data);
            }
            hideLoadingIndicator();
            break;
          case 'ERROR':
            console.error("Worker error:", error);
            isDataLoading = false;
            hideLoadingIndicator();
            break;
        }
      };
      
      planningWorker.onerror = function(error) {
        console.error("Worker error:", error);
        planningWorker = null;
      };
      
    } catch (error) {
      planningWorker = null;
    }
  }
  
  return planningWorker;
}

function cleanupPlanningWorker() {
  if (planningWorker) {
    planningWorker.terminate();
    planningWorker = null;
  }
}

// Debounce utility for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
      // Highlight unsaved rows after any debounced update
      if (window.highlightUnsavedRows) setTimeout(window.highlightUnsavedRows, 100);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Batch processing utility for large datasets
function processRowsInBatches(rows, batchSize = 15, callback) {
  // Reduce batch size for more frequent yielding
  batchSize = 5;
  return new Promise((resolve) => {
    let index = 0;
    async function processBatch() {
      const batch = rows.slice(index, index + batchSize);
      if (batch.length === 0) {
        resolve();
        return;
      }
      // Process batch with micro-yields for very small batches
      for (let i = 0; i < batch.length; i++) {
        callback(batch[i], index + i);
        // Yield control every 2 items within the batch
        if (i > 0 && i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      index += batchSize;
      // Yield control between batches
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            processBatch().then(resolve);
          }, 0);
        });
      });
    }
    processBatch();
  });
}

// Load planning data via Worker API for real-time updates
async function loadPlanning(retryCount = 0, useCache = true) {
  // Return cached data if available
  if (useCache && planningDataCache && planningDataCache.length > 0) {
    return planningDataCache;
  }

  // Prevent multiple simultaneous loads
  if (isDataLoading) {
    while (isDataLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return planningDataCache || [];
  }

  isDataLoading = true;
  planningPerformance.start('data loading');
  
  try {
    let rows;

    try {
      // Use Worker API endpoint
      const workerEndpoint =
        window.cloudflareSyncModule?.getWorkerEndpoint() ||
        "https://mpt-mvp-sync.jordanradford.workers.dev";
      const workerUrl = `${workerEndpoint}/data/planning`;

      const response = await fetch(workerUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        rows = result.data;

        if (!rows || rows.length === 0) {
          if (retryCount < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, (retryCount + 1) * 2000),
            );
            return loadPlanning(retryCount + 1);
          }
        }
      } else {
        throw new Error(`Worker API failed: ${response.status} ${response.statusText}`);
      }
    } catch (workerError) {
      // Fallback: Try local file
      try {
        const r = await fetch("data/planning.json");
        if (!r.ok) throw new Error("Failed to fetch planning.json");
        rows = await r.json();
      } catch (localError) {
        throw new Error("Failed to load planning data from both Worker API and local file");
      }
    }
    
    // Show loading indicator for medium to large datasets
    if (rows.length > 100) {
      showLoadingIndicator("Processing " + rows.length + " campaigns...");
    }
    
    // Use Web Worker for heavy processing if available for almost any dataset size
    if (rows.length > 15 && initPlanningWorker()) {
      return new Promise((resolve) => {
        const handleWorkerMessage = (e) => {
          if (e.data.type === 'PROCESS_PLANNING_DATA_COMPLETE') {
            planningWorker.removeEventListener('message', handleWorkerMessage);
            planningDataCache = e.data.data;
            isDataLoading = false;
            planningPerformance.end('data processing');
            resolve(e.data.data);
          }
        };
        planningWorker.addEventListener('message', handleWorkerMessage);
        planningWorker.postMessage({
          type: 'PROCESS_PLANNING_DATA',
          data: rows,
          options: { batchSize: 10 } // Reduce batch size for worker as well
        });
      });
    } else {
      // Fallback to main thread processing for smaller datasets
      await processRowsInBatches(rows, 5, (row, i) => {
        if (typeof row.expectedLeads === "number") {
          Object.assign(row, kpis(row.expectedLeads));
        }
        if (!row.id) {
          row.id = `row_${i}_${Date.now()}`;
        }
      });
    }
    
    hideLoadingIndicator();
    planningPerformance.end('data processing');
    
    planningDataCache = rows;
    isDataLoading = false;
    
    return rows;
  } catch (e) {
    console.error("Error loading planning.json:", e);
    isDataLoading = false;
    alert("Failed to fetch planning.json");
    return planningDataCache || [];
  }
}

// Make globally accessible for data refreshing
window.planningTableInstance = null;
window.loadPlanning = loadPlanning;
let planningDataCache = null;
let isGridInitialized = false;
let isDataLoading = false;

// Lightweight data store for faster operations
class PlanningDataStore {
  constructor() {
    this.data = [];
    this.filteredData = [];
    this.pendingUpdates = new Map();
    this.updateQueue = [];
  }
  
  setData(data) {
    // Clear __modified on all rows when loading new data
    if (Array.isArray(data)) {
      data.forEach(row => { if (row && typeof row === 'object') row.__modified = false; });
    }
    this.data = data;
    this.filteredData = [...data];
  }
  
  getData() {
    return this.data;
  }
  
  getFilteredData() {
    return this.filteredData;
  }
  
  // Queue updates to reduce immediate DOM operations
  queueUpdate(rowId, updates) {
    this.pendingUpdates.set(rowId, { ...this.pendingUpdates.get(rowId), ...updates });
    
    // Process queue after short delay
    clearTimeout(this.queueTimer);
    this.queueTimer = setTimeout(() => this.processUpdateQueue(), 100);
  }
  
  processUpdateQueue() {
    if (this.pendingUpdates.size === 0) return;
    
    // Apply all pending updates at once
    this.pendingUpdates.forEach((updates, rowId) => {
      const row = this.data.find(r => r.id === rowId);
      if (row) {
        Object.assign(row, updates);
      }
    });
    
    this.pendingUpdates.clear();
    
    // Update table if it exists
    if (planningTableInstance && this.data.length > 0) {
      // Clear __modified on all rows when replacing data
      this.data.forEach(row => { if (row && typeof row === 'object') row.__modified = false; });
      planningTableInstance.replaceData(this.data);
    }
  }
  
  applyFilters(filters) {
    const startTime = performance.now();
    
    // Pre-compute normalized quarter filter values for performance
    const normalizedQuarterFilters = filters.quarter && Array.isArray(filters.quarter) 
      ? filters.quarter.map(normalizeQuarter) 
      : null;
    
    this.filteredData = this.data.filter(row => {
      // Digital Motions filter (robust: accept boolean true or string 'true')
      if (filters.digitalMotions && !(row.digitalMotions === true || row.digitalMotions === 'true')) {
        return false;
      }

      // Description keyword filter (case-insensitive, matches ALL keywords)
      if (Array.isArray(filters.descriptionKeyword) && filters.descriptionKeyword.length > 0) {
        const desc = (row.description || '').toLowerCase();
        const allMatch = filters.descriptionKeyword.every(kw => desc.includes(kw.toLowerCase()));
        if (!allMatch) return false;
      }

      // Multiselect filters - check if row value is in the selected array
      const multiselectFields = ['region', 'quarter', 'status', 'programType', 'strategicPillars', 'owner'];
      for (const field of multiselectFields) {
        const filterValues = filters[field];
        if (filterValues && Array.isArray(filterValues) && filterValues.length > 0) {
          // For strategicPillars field, check against 'strategicPillars' in row data
          let rowValue = field === 'strategicPillar' ? row.strategicPillars : row[field];

          // Apply quarter normalization for quarter field comparison (optimized)
          if (field === 'quarter') {
            rowValue = normalizeQuarter(rowValue);
            if (!normalizedQuarterFilters.includes(rowValue)) {
              return false;
            }
          } else {
            if (!filterValues.includes(rowValue)) {
              return false;
            }
          }
        }
      }

      return true;
    });
    
    const duration = performance.now() - startTime;
    console.log(`🔍 Filter applied: ${this.filteredData.length}/${this.data.length} rows (${duration.toFixed(2)}ms)`);
    
    return this.filteredData;
  }
}

const planningDataStore = new PlanningDataStore();

// Loading indicator functions for large dataset processing
function showLoadingIndicator(message = "Loading...") {
  const existing = document.getElementById("planningLoadingIndicator");
  if (existing) existing.remove();
  
  const indicator = document.createElement("div");
  indicator.id = "planningLoadingIndicator";
  indicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px 30px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  indicator.innerHTML = `
    <div style="
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff40;
      border-top: 2px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
    ${message}
  `;
  
  // Add CSS animation if not already present
  if (!document.querySelector("#loadingSpinnerCSS")) {
    const style = document.createElement("style");
    style.id = "loadingSpinnerCSS";
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(indicator);
}

function hideLoadingIndicator() {
  const indicator = document.getElementById("planningLoadingIndicator");
  if (indicator) indicator.remove();
}

// Lazy initialization function for planning grid
async function initPlanningGridLazy() {
  if (isGridInitialized && planningTableInstance) {
    return planningTableInstance;
  }
  
  const perfTracker = window.performanceMonitor?.startTracking('planning-grid-init');
  
  try {
    // Load data first
    const rows = await loadPlanning();
    
    // Initialize grid with data (now returns a Promise)
    const table = await initPlanningGrid(rows);
    isGridInitialized = true;
    
    return table;
  } catch (error) {
    console.error("Failed to initialize planning grid:", error);
    throw error;
  } finally {
    perfTracker?.end();
  }
}

function initPlanningGrid(rows) {
  planningPerformance.start('grid initialization');
  
  // Initialize data store
  planningDataStore.setData(rows);
  
  return new Promise((resolve) => {
    // Break up the initialization into smaller chunks to prevent long tasks
    const initializeInChunks = async () => {
      
      // More aggressive yielding function for better responsiveness
      const yieldToMain = () => new Promise(resolve => {
        // Use requestIdleCallback if available, otherwise setTimeout
        if (window.requestIdleCallback) {
          requestIdleCallback(resolve, { timeout: 5 }); // Much shorter timeout
        } else {
          setTimeout(resolve, 5); // Much shorter timeout for immediate yielding
        }
      });
      
      // Chunk 1: Performance config (small task)
      const performanceConfig = {
        // Use pagination for better performance (conflicts resolved)
        pagination: "local",
        paginationSize: 50,
        paginationSizeSelector: [25, 50, 100],
        paginationCounter: "rows",
        
        // Disable conflicting features - cannot use virtualDom AND pagination AND progressiveLoad together
        virtualDom: false,
        progressiveLoad: false,
        
        // Use basic rendering to avoid scroll violations and improve performance
        renderHorizontal: "basic",
        renderVertical: "basic",
        
        // Performance optimizations
        autoResize: true, // Re-enable for proper sizing
        responsiveLayout: false, // Keep disabled to allow horizontal scrolling
        invalidOptionWarnings: false,
        
        // Fix scroll performance issues - disable problematic scroll features
        scrollToRowPosition: "top",
        scrollToColumnPosition: "left", 
        scrollToRowIfVisible: false,
        
        // Disable wheel event handling that causes passive listener warnings
        wheelScrollSpeed: 0, // Disable wheel scrolling in tabulator
        
        // Enable proper data loading indicators
        dataLoaderLoading: "<div style='padding:20px; text-align:center;'>Loading...</div>",
        dataLoaderError: "<div style='padding:20px; text-align:center; color:red;'>Error loading data</div>",
        
        // Reduce column calculations only if not needed
        columnCalcs: false,
        
        // Optimized scroll handling - single configuration
        scrollToRowPosition: "top",
        scrollToColumnPosition: "left",
        scrollToRowIfVisible: false,
        
        // Debounced data updates with reasonable delay
        dataChanged: debounce(() => {
          console.log("Planning data changed");
          window.hasUnsavedPlanningChanges = true;
          console.log("[Planning] Unsaved changes set to true (dataChanged)");
        }, 500), // Shorter debounce for better responsiveness
        
        // Add pagination callback to prevent scroll errors
        pageLoaded: function(pageno) {
          // Ensure we don't try to scroll to invalid positions after page changes
          console.log(`Planning grid page ${pageno} loaded`);
        },
      };
      
      // Yield control back to the browser with new aggressive yielding
      await yieldToMain();
      
      // Chunk 2: Create table with basic config (medium task)
      planningTableInstance = new Tabulator("#planningGrid", {
        data: rows,
        reactiveData: true,
        selectableRows: true, // Allow multi-row selection
        layout: "fitData", // Back to basic fitData for natural column sizing
        // No initialSort: preserve data order for sequential numbering
        ...performanceConfig,
        scrollToRowPosition: "top",
        scrollToColumnPosition: "left",
        scrollToRowIfVisible: false,
        tableBuilt: function() {
          // Use requestIdleCallback for non-blocking redraw
          const scheduleRedraw = () => {
            if (window.requestIdleCallback) {
              requestIdleCallback(() => {
                try {
                  this.redraw(false); // Use false for non-blocking redraw
                  requestIdleCallback(() => {
                    if (this.getData().length > 0 && this.element && this.element.offsetParent) {
                      safeScrollToRow(this, 1, "top", false);
                    }
                  }, { timeout: 100 });
                } catch (e) {
                  console.warn("Error in tableBuilt callback:", e.message);
                }
              }, { timeout: 50 });
            } else {
              setTimeout(() => {
                try {
                  this.redraw(false);
                  setTimeout(() => {
                    if (this.getData().length > 0 && this.element && this.element.offsetParent) {
                      safeScrollToRow(this, 1, "top", false);
                    }
                  }, 25);
                } catch (e) {
                  console.warn("Error in tableBuilt callback:", e.message);
                }
              }, 25);
            }
          };
          scheduleRedraw();
        },
        dataLoaded: function(data) {
          console.log(`Planning grid loaded with ${data.length} rows`);
          if (window.requestIdleCallback) {
            requestIdleCallback(() => {
              this.redraw(false);
            }, { timeout: 50 });
          } else {
            setTimeout(() => {
              this.redraw(false);
            }, 25);
          }
        },
        columns: []
      });
      
      // Yield control back to the browser with new aggressive yielding
      await yieldToMain();
      
      // Chunk 3: Add columns in smaller batches to prevent blocking
      const addColumnsInBatches = async () => {
        const allColumns = [
          // Hidden column for unsaved row priority
          {
            title: '',
            field: "__unsavedPriority",
            visible: false,
            headerSort: false,
            width: 1,
            cssClass: 'hidden-col',
            mutator: function(value, data) {
              // Always return 1 for unsaved, 0 otherwise
              return data.__unsavedPriority || 0;
            },
          },
          // Sequential number column
          {
            title: "#",
            field: "rowNumber",
            formatter: function (cell) {
              const row = cell.getRow();
              const table = row.getTable();
              const allRows = table.getRows();
              const index = allRows.indexOf(row);
              return index + 1;
            },
            width: 50,
            hozAlign: "center",
            headerSort: false,
            frozen: true,
          },
          // Select row button (circle)
          {
            title: "",
            field: "select",
            formatter: function (cell) {
              const row = cell.getRow();
              const selected = row.getElement().classList.contains("row-selected");
              return `<span class="select-circle" style="display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid #888;background:${selected ? "#0969da" : "transparent"};cursor:pointer;"></span>`;
            },
            width: 40,
            hozAlign: "center",
            cellClick: function (e, cell) {
              const row = cell.getRow();
              row.getElement().classList.toggle("row-selected");
              // Use non-blocking redraw
              if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                  cell.getTable().redraw(false);
                }, { timeout: 50 });
              } else {
                setTimeout(() => {
                  cell.getTable().redraw(false);
                }, 10);
              }
            },
            headerSort: false,
          },
          {
            title: "Program Type",
            field: "programType",
            editor: "list",
            editorParams: { values: programTypes },
            width: 200,
            cellEdited: debounce((cell) => {
              const r = cell.getRow();
              const rowData = r.getData();

              if (cell.getValue() === "In-Account Events (1:1)") {
                r.update({
                  expectedLeads: 0,
                  mqlForecast: 0,
                  sqlForecast: 0,
                  oppsForecast: 0,
                  pipelineForecast: rowData.forecastedCost ? Number(rowData.forecastedCost) * 20 : 0,
                });
              } else {
                if (typeof rowData.expectedLeads === "number" && rowData.expectedLeads > 0) {
                  const kpiVals = kpis(rowData.expectedLeads);
                  r.update({
                    mqlForecast: kpiVals.mql,
                    sqlForecast: kpiVals.sql,
                    oppsForecast: kpiVals.opps,
                    pipelineForecast: kpiVals.pipeline,
                  });
                }
              }
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Program Type)");
              debouncedAutosave();
            }, 1000),
          },
          {
            title: "Strategic Pillar",
            field: "strategicPillars",
            editor: "list",
            editorParams: { values: strategicPillars },
            width: 220,
          },
          {
            title: "Description",
            field: "description",
            editor: "input",
            width: 180,
            formatter: function(cell) {
              // Always wrap in a span for hover effect
              const val = cell.getValue() || '';
              return `<span class="desc-hover-span">${val.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            },
            cellClick: function (e, cell) {
              if (cell.getValue() && cell.getValue().length > 20) {
                const tooltip = prompt("Description:", cell.getValue());
                if (tooltip !== null && tooltip !== cell.getValue()) {
                  cell.setValue(tooltip);
                }
              }
            },
            cellMouseOver: function(e, cell) {
              const el = cell.getElement();
              el.classList.add('description-hover');
              // Create floating tooltip
              let tooltip = document.createElement('div');
              tooltip.className = 'desc-hover-tooltip';
              tooltip.textContent = cell.getValue() || '';
              document.body.appendChild(tooltip);
              // Style the tooltip (larger text and box)
              Object.assign(tooltip.style, {
                position: 'fixed',
                zIndex: 99999,
                background: '#fff',
                color: '#222',
                boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18), 0 1px 6px 0 rgba(0,0,0,0.10)',
                borderRadius: '10px',
                padding: '18px 28px',
                maxWidth: '70vw',
                minWidth: '220px',
                fontSize: '1.25em',
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
                pointerEvents: 'none',
                top: '0',
                left: '0',
                transition: 'opacity 0.12s',
                opacity: '0',
              });
              // Position near mouse
              function moveTooltip(ev) {
                const margin = 18;
                let x = ev.clientX + margin;
                let y = ev.clientY + margin;
                // Prevent overflow
                const rect = tooltip.getBoundingClientRect();
                if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - margin;
                if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - margin;
                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
                tooltip.style.opacity = '1';
              }
              moveTooltip(e);
              el._descTooltipMove = moveTooltip;
              el._descTooltipDiv = tooltip;
              el.addEventListener('mousemove', moveTooltip);
            },
            cellMouseOut: function(e, cell) {
              const el = cell.getElement();
              el.classList.remove('description-hover');
              if (el._descTooltipDiv) {
                el._descTooltipDiv.remove();
                el._descTooltipDiv = null;
              }
              if (el._descTooltipMove) {
                el.removeEventListener('mousemove', el._descTooltipMove);
                el._descTooltipMove = null;
              }
            },
          },
          {
            title: "Owner",
            field: "owner",
            editor: "list",
            editorParams: { values: names },
            width: 140,
          },
          {
            title: "Quarter",
            field: "quarter",
            editor: "list",
            editorParams: { values: quarterOptions },
            width: 120,
          },
          {
            title: "Region",
            field: "region",
            editor: "list",
            editorParams: { values: regionOptions },
            width: 120,
          },
          {
            title: "Fiscal Year",
            field: "fiscalYear",
            editor: "list",
            editorParams: { values: ["FY25", "FY26", "FY27"] },
            width: 100,
          },
          {
            title: "Country",
            field: "country",
            editor: "list",
            editorParams: {
              values: getAllCountries(),
            },
            width: 130,
          },
          {
            title: "Forecasted Cost",
            field: "forecastedCost",
            editor: "number",
            width: 200,
            formatter: function (cell) {
              const v = cell.getValue();
              if (v === null || v === undefined || v === "") return "";
              return "$" + Number(v).toLocaleString();
            },
            cellEdited: debounce((cell) => {
              const r = cell.getRow();
              const rowData = r.getData();

              if (rowData.programType === "In-Account Events (1:1)") {
                r.update({
                  expectedLeads: 0,
                  mqlForecast: 0,
                  sqlForecast: 0,
                  oppsForecast: 0,
                  pipelineForecast: cell.getValue() ? Number(cell.getValue()) * 20 : 0,
                });
              }
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Forecasted Cost)");
              debouncedAutosave();
            }, 1000),
          },
          {
            title: "Expected Leads",
            field: "expectedLeads",
            editor: "number",
            width: 150,
            cellEdited: debounce((cell) => {
              const r = cell.getRow();
              const rowData = r.getData();

              if (rowData.programType === "In-Account Events (1:1)") {
                r.update({
                  expectedLeads: 0,
                  mqlForecast: 0,
                  sqlForecast: 0,
                  oppsForecast: 0,
                  pipelineForecast: rowData.forecastedCost ? Number(rowData.forecastedCost) * 20 : 0,
                });
              } else {
                const kpiVals = kpis(cell.getValue());
                r.update({
                  mqlForecast: kpiVals.mql,
                  sqlForecast: kpiVals.sql,
                  oppsForecast: kpiVals.opps,
                  pipelineForecast: kpiVals.pipeline,
                });
              }
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Expected Leads)");
              debouncedAutosave();
            }, 1000),
          },
          { title: "Forecasted MQL", field: "mqlForecast", editable: false, width: 150, headerSort: true, headerVertical: false, headerWordWrap: false },
          // Removed SQL and Opps columns
          {
            title: "Forecasted Pipeline",
            field: "pipelineForecast",
            editable: false,
            width: 170,
            headerSort: true,
            headerVertical: false,
            headerWordWrap: false,
            formatter: function (cell) {
              const v = cell.getValue();
              if (v === null || v === undefined || v === "") return "";
              return "$" + Number(v).toLocaleString();
            },
          },
          // Added Issue Link column
          {
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
          },
          {
            title: "Revenue Play",
            field: "revenuePlay",
            editor: "list",
            editorParams: { values: revenuePlays },
            width: 140,
          },
          {
            title: "Status",
            field: "status",
            editor: "list",
            editorParams: { values: statusOptions },
            width: 130,
            cellEdited: debounce((cell) => {
              const rowData = cell.getRow().getData();
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Status)");
              debouncedAutosave();
            }, 1000),
          },
          {
            title: "PO Raised",
            field: "poRaised",
            editor: "list",
            editorParams: { values: yesNo },
            width: 110,
            cellEdited: function(cell) {
              if (cell.getValue() === "(Clear)") {
                cell.setValue("");
              }
            },
            formatter: function(cell) {
              const value = cell.getValue();
              return value === "" || value === null || value === undefined ? "(Clear)" : value;
            },
          },
          // Digital Motions toggle - moved to second-to-last position
          {
            title: "Digital Motions",
            field: "digitalMotions",
            formatter: function (cell) {
              const value = cell.getValue();
              return `<input type='checkbox' ${value ? "checked" : ""} style='transform:scale(1.3); cursor:pointer;' />`;
            },
            width: 120,
            hozAlign: "center",
            cellClick: function (e, cell) {
              const current = !!cell.getValue();
              cell.setValue(!current);

              setTimeout(() => {
                if (
                  window.executionModule &&
                  typeof window.executionModule.syncDigitalMotionsFromPlanning ===
                    "function"
                ) {
                  window.executionModule.syncDigitalMotionsFromPlanning();
                  console.log(
                    "[Planning] Synced Digital Motions change to execution table",
                  );
                }
              }, 50);

              setTimeout(() => {
                if (
                  window.roiModule &&
                  typeof window.roiModule.updateRemainingBudget === "function"
                ) {
                  const regionFilter =
                    document.getElementById("roiRegionFilter")?.value || "";
                  window.roiModule.updateRemainingBudget(regionFilter);
                  window.roiModule.updateForecastedBudgetUsage(regionFilter);
                  console.log(
                    "[Planning] Triggered ROI budget updates after Digital Motions toggle",
                  );
                }
              }, 100);
            },
            headerSort: false,
          },
          // Bin icon (delete) - kept as last column
          {
            title: "",
            field: "delete",
            formatter: function () {
              return '<button class="delete-row-btn" title="Delete Row" style="color: #d1242f; font-size: 16px; display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H13v8.25A1.75 1.75 0 0 1 11.25 14H4.75A1.75 1.75 0 0 1 3 12.75V4.5h-.25a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.5 4.5v8a.25.25 0 0 0 .25.25h6.5a.25.25 0 0 0 .25-.25v-8H4.5z"/></svg></button>';
            },
            width: 50,
            hozAlign: "center",
            cellClick: function (e, cell) {
              cell.getRow().delete();
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (row delete)");
            },
            headerSort: false,
          },
        ];
        
        // Add columns in even smaller batches to prevent long tasks
        const batchSize = 1; // Reduce to 1 for maximum responsiveness
        for (let i = 0; i < allColumns.length; i += batchSize) {
          const batch = allColumns.slice(i, i + batchSize);
          // Add this batch of columns
          batch.forEach(column => {
            planningTableInstance.addColumn(column);
          });
          // Yield after each column
          await new Promise(resolve => {
            if (window.requestIdleCallback) {
              requestIdleCallback(resolve, { timeout: 5 });
            } else {
              setTimeout(resolve, 2);
            }
          });
        }
      };
      
      await addColumnsInBatches();
      
      // Chunk 4: Setup remaining functionality with yielding
      await yieldToMain();
      
      // Create debounced autosave function
      const debouncedAutosave = debounce(() => {
        triggerPlanningAutosave(planningTableInstance);
      }, 3000);

      await yieldToMain(); // Yield before setting up buttons

      // Wire up buttons
      const addBtn = document.getElementById("addPlanningRow");
      if (addBtn) {
        addBtn.onclick = () => showAddRowModal();
      }

      await yieldToMain(); // Yield between button setups

      const delBtn = document.getElementById("deletePlanningRow");
      if (delBtn) {
        delBtn.textContent = "Delete Highlighted Rows";
        delBtn.onclick = () => {
          const selectedRows = planningTableInstance.getSelectedRows();
          if (selectedRows.length === 0) {
            alert("No rows selected for deletion.");
            return;
          }
          if (!confirm(`Are you sure you want to delete ${selectedRows.length} selected row(s)?`)) return;
          selectedRows.forEach(row => row.delete());
          window.hasUnsavedPlanningChanges = true;
          console.log(`[Planning] Unsaved changes set to true (mass delete: ${selectedRows.length} rows)`);
        };
      }

      setupPlanningSave(planningTableInstance, rows);

      // Update global reference
      window.planningTableInstance = planningTableInstance;

      // Add event handlers
      const resizeHandler = debounce(() => {
        if (planningTableInstance) {
          // Use non-blocking redraw for resize events
          if (window.requestIdleCallback) {
            requestIdleCallback(() => {
              planningTableInstance.redraw(false);
            }, { timeout: 100 });
          } else {
            setTimeout(() => {
              planningTableInstance.redraw(false);
            }, 50);
          }
        }
      }, 250);
      
      window.addEventListener('resize', resizeHandler);
      
      const visibilityHandler = () => {
        if (!document.hidden && planningTableInstance) {
          // Use requestIdleCallback to prevent blocking
          if (window.requestIdleCallback) {
            requestIdleCallback(() => {
              planningTableInstance.redraw(false); // Non-blocking redraw
            }, { timeout: 100 });
          } else {
            setTimeout(() => {
              planningTableInstance.redraw(false);
            }, 50);
          }
        }
      };
      
      document.addEventListener('visibilitychange', visibilityHandler);
      
      planningTableInstance._cleanup = () => {
        window.removeEventListener('resize', resizeHandler);
        document.removeEventListener('visibilitychange', visibilityHandler);
      };

      planningPerformance.end('grid initialization');
      
      // Yield before applying sort to prevent blocking
      await yieldToMain();
      
      // // Apply initial sort after all columns are added (COMMENTED OUT FOR TESTING)
      // try {
      //   if (planningTableInstance && planningTableInstance.getColumns().length > 0) {
      //     // Use requestIdleCallback for non-blocking sort
      //     if (window.requestIdleCallback) {
      //       requestIdleCallback(() => {
      //         planningTableInstance.setSort([{ column: "quarter", dir: "asc" }]);
      //         console.log("✅ Planning grid: Initial sort applied");
      //       }, { timeout: 100 });
      //     } else {
      //       setTimeout(() => {
      //         planningTableInstance.setSort([{ column: "quarter", dir: "asc" }]);
      //         console.log("✅ Planning grid: Initial sort applied");
      //       }, 25);
      //     }
      //   }
      // } catch (e) {
      //   console.warn("Planning grid: Could not apply initial sort:", e.message);
      // }
      
      resolve(planningTableInstance);
    };
    
    // Start the chunked initialization
    initializeInChunks().catch(error => {
      console.error("Error in chunked initialization:", error);
      resolve(null);
    });
  });
}

// Show Add Row Modal
function showAddRowModal() {
  // Remove existing modal if any
  const existingModal = document.getElementById("addRowModal");
  if (existingModal) {
    existingModal.remove();
  }

  const modalHtml = `
    <div id="addRowModal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1100;
      overflow-y: auto;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 32px;
        width: 90%;
        max-width: 800px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        margin: 20px;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #21262d 0%, #30363d 100%);
          border-bottom: 2px solid #21262d;
          padding: 20px 24px;
          border-radius: 12px 12px 0 0;
          margin: -32px -32px 24px -32px;
        ">
          <h2 style="margin: 0; color: #f0f6fc; display: flex; align-items: center; gap: 8px;">
            <i class="octicon octicon-plus" style="font-size: 20px; color: #f0f6fc;" aria-hidden="true"></i>
            Add New Campaign
          </h2>
          <button id="closeAddRowModal" class="modal-close-btn" style="color: #f0f6fc;">✕</button>
        </div>
        
        <form id="addRowForm" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        ">
          <!-- Row 1: Basic Info -->
          <div style="grid-column: 1 / -1;">
            <h3 style="margin: 0 0 16px 0; color: #f0f6fc; background: linear-gradient(135deg, #21262d 0%, #30363d 100%); border-bottom: 1px solid #21262d; padding: 12px 16px; border-radius: 8px;">
              <i class="octicon octicon-info" aria-hidden="true"></i>
              Basic Information
            </h3>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #24292e;">
              Program Type <span style="color: #d1242f;">*</span>
            </label>
            <select id="programType" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select program type...</option>
              ${programTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Strategic Pillar
            </label>
            <select id="strategicPillars" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            ">
              <option value="">Select strategic pillar...</option>
              ${strategicPillars.map(pillar => `<option value="${pillar}">${pillar}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Owner <span style="color: red;">*</span>
            </label>
            <select id="owner" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select owner...</option>
              ${names.map(name => `<option value="${name}">${name}</option>`).join('')}
            </select>
          </div>
          
          <!-- Row 2: Scheduling -->
          <div style="grid-column: 1 / -1; margin-top: 20px;">
            <h3 style="margin: 0 0 16px 0; color: #f0f6fc; background: linear-gradient(135deg, #21262d 0%, #30363d 100%); border-bottom: 1px solid #21262d; padding: 12px 16px; border-radius: 8px;">
              <i class="octicon octicon-calendar" aria-hidden="true"></i>
              Scheduling & Location
            </h3>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Quarter <span style="color: red;">*</span>
            </label>
            <select id="quarter" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select quarter...</option>
              ${quarterOptions.map(quarter => `<option value="${quarter}">${quarter}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Fiscal Year <span style="color: red;">*</span>
            </label>
            <select id="fiscalYear" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select fiscal year...</option>
              <option value="FY25">FY25</option>
              <option value="FY26">FY26</option>
              <option value="FY27">FY27</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Region <span style="color: red;">*</span>
            </label>
            <select id="region" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select region...</option>
              ${regionOptions.map(region => `<option value="${region}">${region}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Country
            </label>
            <select id="country" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            ">
              <option value="">Select country...</option>
              ${getAllCountries().map(country => `<option value="${country}">${country}</option>`).join('')}
            </select>
          </div>
          
          <!-- Row 3: Financial & Goals -->
          <div style="grid-column: 1 / -1; margin-top: 20px;">
            <h3 style="margin: 0 0 16px 0; color: #f0f6fc; background: linear-gradient(135deg, #21262d 0%, #30363d 100%); border-bottom: 1px solid #21262d; padding: 12px 16px; border-radius: 8px;">
              <i class="octicon octicon-currency-dollar" aria-hidden="true"></i>
              Financial & Goals
            </h3>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Forecasted Cost ($)
            </label>
            <input type="number" id="forecastedCost" min="0" step="0.01" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " placeholder="Enter forecasted cost..." />
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Expected Leads
            </label>
            <input type="number" id="expectedLeads" min="0" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " placeholder="Enter expected leads..." />
            <small style="color: #666; font-style: italic;">
              KPIs will be calculated automatically based on this value
            </small>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Revenue Play
            </label>
            <select id="revenuePlay" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            ">
              <option value="">Select revenue play...</option>
              ${revenuePlays.map(play => `<option value="${play}">${play}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Status
            </label>
            <select id="status" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            ">
              ${statusOptions.map(status => `<option value="${status}" ${status === 'Planning' ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
          </div>
          
          <!-- Description -->
          <div style="grid-column: 1 / -1; margin-top: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Description
            </label>
            <textarea id="description" rows="3" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
              resize: vertical;
            " placeholder="Enter campaign description..."></textarea>
          </div>
          
          <!-- Buttons -->
          <div style="grid-column: 1 / -1; margin-top: 30px; display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" id="cancelAddRow" class="modal-btn-cancel" style="padding: 12px 24px;">Cancel</button>
            <button type="submit" id="confirmAddRow" class="modal-btn-confirm" style="padding: 12px 24px;">✓ Add Campaign</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Set up event listeners
  setupAddRowModalEvents();
}

// Setup event listeners for add row modal
function setupAddRowModalEvents() {
  const modal = document.getElementById("addRowModal");
  const form = document.getElementById("addRowForm");
  const closeBtn = document.getElementById("closeAddRowModal");
  const cancelBtn = document.getElementById("cancelAddRow");

  // Close modal events
  const closeModal = () => {
    if (modal) modal.remove();
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  document.addEventListener("keydown", function escapeHandler(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", escapeHandler);
    }
  });

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Get form data
    window.hasUnsavedPlanningChanges = true;
    console.log("[Planning] Unsaved changes set to true (add row modal submit)");
    const formData = {
      id: `program-${Date.now()}`,
      programType: document.getElementById("programType").value,
      strategicPillars: document.getElementById("strategicPillars").value,
      owner: document.getElementById("owner").value,
      quarter: document.getElementById("quarter").value,
      fiscalYear: document.getElementById("fiscalYear").value,
      region: document.getElementById("region").value,
      country: document.getElementById("country").value,
      forecastedCost: document.getElementById("forecastedCost").value ? Number(document.getElementById("forecastedCost").value) : 0,
      expectedLeads: document.getElementById("expectedLeads").value ? Number(document.getElementById("expectedLeads").value) : 0,
      revenuePlay: document.getElementById("revenuePlay").value,
      status: document.getElementById("status").value || "Planning",
      description: document.getElementById("description").value,
      __modified: true,
      __unsavedPriority: 1, // Mark as unsaved for top placement
    };

    // Validate required fields
    const requiredFields = ['programType', 'owner', 'quarter', 'fiscalYear', 'region'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Calculate KPIs based on program type
    if (formData.programType === "In-Account Events (1:1)") {
      formData.expectedLeads = 0;
      formData.mqlForecast = 0;
      formData.sqlForecast = 0;
      formData.oppsForecast = 0;
      formData.pipelineForecast = formData.forecastedCost * 20;
    } else if (formData.expectedLeads > 0) {
      const kpiVals = kpis(formData.expectedLeads);
      formData.mqlForecast = kpiVals.mql;
      formData.sqlForecast = kpiVals.sql;
      formData.oppsForecast = kpiVals.opps;
      formData.pipelineForecast = kpiVals.pipeline;
    }


    // Add row to table and force unsaved to top
    let newRow;
    if (planningTableInstance && typeof planningTableInstance.addRow === 'function') {
      // Remove any existing row with this id (shouldn't happen, but for safety)
      const existing = planningTableInstance.getRows().find(r => r.getData().id === formData.id);
      if (existing) existing.delete();

      // Insert at the top by updating the data array directly
      let data = planningTableInstance.getData();
      // Remove any other unsaved priority flags (should only be one unsaved at a time)
      data.forEach(row => { if (row.__unsavedPriority) row.__unsavedPriority = 0; });
      data = [formData, ...data];
      planningTableInstance.replaceData(data);

      // Sort by __unsavedPriority desc, then by quarter asc (or any other field as needed)
      setTimeout(() => {
        planningTableInstance.setSort([
          { column: "__unsavedPriority", dir: "desc" },
          // Optionally add more sort fields here
        ]);
        const rows = planningTableInstance.getRows();
        newRow = rows.length > 0 ? rows[0] : null;
        highlightUnsavedRows();
        if (newRow && typeof newRow.scrollTo === 'function') {
          try {
            newRow.scrollTo();
            const el = newRow.getElement();
            el.classList.add('unsaved-row-highlight');
            el.style.transition = 'background 0.3s, box-shadow 0.3s';
            el.style.boxShadow = '0 0 0 3px #28a74580';
            setTimeout(() => {
              el.style.boxShadow = '';
            }, 1200);
          } catch (e) {
            console.warn("Could not scroll to new row:", e);
          }
        }
      }, 120);
    }
    // Highlight unsaved rows
    setTimeout(() => {
      highlightUnsavedRows();
      if (newRow && typeof newRow.scrollTo === 'function') {
        try {
          newRow.scrollTo();
          console.log("Scrolled to new planning row");
        } catch (e) {
          console.warn("Could not scroll to new row:", e);
        }
      }
    }, 100);

    // Trigger autosave
    triggerPlanningAutosave(planningTableInstance);

    // Close modal
    closeModal();

    // Show success message
    const successMsg = document.createElement("div");
    successMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 1200;
      font-weight: bold;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `;
    successMsg.textContent = `✓ Campaign "${formData.programType}" added successfully!`;
    document.body.appendChild(successMsg);

    setTimeout(() => {
      if (successMsg.parentNode) {
        successMsg.remove();
      }
    }, 3000);
  });
}

// PLANNING SAVE AND DOWNLOAD FUNCTIONS
// Save Changes for Planning Grid
function setupPlanningSave(table, rows) {
  // Use the correct button ID from your HTML
  const saveBtn = document.getElementById("savePlanningRows");
  if (!saveBtn) return;
  saveBtn.onclick = async () => {
    // Recalculate KPIs for all rows before saving
    const allRows = table.getData();
    
    // Process KPI calculations in very small batches to prevent long tasks
    for (let i = 0; i < allRows.length; i += 8) {
      const batch = allRows.slice(i, i + 8);
      
      batch.forEach((row) => {
        if (typeof row.expectedLeads === "number") {
          const kpiVals = kpis(row.expectedLeads);
          let changed = false;
          [
            "mqlForecast",
            "sqlForecast",
            "oppsForecast",
            "pipelineForecast",
          ].forEach((field) => {
            if (row[field] !== kpiVals[field]) {
              row[field] = kpiVals[field];
              changed = true;
            }
          });
          if (changed) row.__modified = true;
        }
      });
      
      // Yield control after each batch
      if (i + 8 < allRows.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }


    // Save all planning data
    const data = table.getData();
    // Clear __modified and __unsavedPriority on all rows after save
    data.forEach(row => { row.__modified = false; row.__unsavedPriority = 0; });
    setTimeout(() => {
      highlightUnsavedRows();
      // Remove unsaved sort, optionally restore default sort here
      if (table && typeof table.setSort === 'function') {
        table.setSort([]); // Remove sort, or set to your default
      }
    }, 200); // Remove highlight after save

    console.log("Saving planning data:", data.length, "rows");

    // Try Worker first, then backend fallback
    if (window.cloudflareSyncModule) {
      // Primary: Save to Worker
      window.cloudflareSyncModule
        .saveToWorker("planning", data, { source: "manual-save" })
        .then((result) => {
          console.log("Worker save successful:", result);
          alert(
            "✅ Planning data saved to GitHub!\n\n💡 Note: It may take 1-2 minutes for changes from other users to appear due to GitHub's caching. Use the 'Refresh Data' button in GitHub Sync if needed."
          );

          // Reset unsaved changes flag
          console.log("[Planning] (Worker) About to set unsaved flag to false. Current:", window.hasUnsavedPlanningChanges);
          window.hasUnsavedPlanningChanges = false;
          console.log("[Planning] Unsaved changes set to false (after successful save to Worker). Now:", window.hasUnsavedPlanningChanges);

          // Refresh data after successful save
          if (window.cloudflareSyncModule.refreshDataAfterSave) {
            window.cloudflareSyncModule.refreshDataAfterSave("planning");
          }

          // Update ROI metrics
          if (typeof window.roiModule?.updateRoiTotalSpend === "function") {
            window.roiModule.updateRoiTotalSpend();
          }
        })
        .catch((error) => {
          console.warn("Worker save failed, trying backend:", error);

          // Fallback: Save to backend
          fetch("http://localhost:3000/save-planning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data }),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.success) {
                alert(
                  "✅ Planning data saved to backend (Worker unavailable)!"
                );
                // Reset unsaved changes flag
                console.log("[Planning] (Backend fallback) About to set unsaved flag to false. Current:", window.hasUnsavedPlanningChanges);
                window.hasUnsavedPlanningChanges = false;
                console.log("[Planning] Unsaved changes set to false (after successful save to backend fallback). Now:", window.hasUnsavedPlanningChanges);
              } else {
                alert(
                  "❌ Failed to save: " + (result.error || "Unknown error")
                );
              }
            })
            .catch((err) => {
              alert("❌ Save failed: " + err.message);
            });
        });
    } else {
      // No Worker configured, use backend only
      fetch("http://localhost:3000/save-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            alert("✅ Planning data saved to backend!");
            // Reset unsaved changes flag
            console.log("[Planning] (Backend) About to set unsaved flag to false. Current:", window.hasUnsavedPlanningChanges);
            window.hasUnsavedPlanningChanges = false;
            console.log("[Planning] Unsaved changes set to false (after successful save to backend). Now:", window.hasUnsavedPlanningChanges);

            // Update ROI metrics
            if (typeof window.roiModule?.updateRoiTotalSpend === "function") {
              window.roiModule.updateRoiTotalSpend();
            }
          } else {
            alert("❌ Failed to save: " + (result.error || "Unknown error"));
          }
        })
        .catch((err) => {
          alert("❌ Save failed: " + err.message);
        });
    }
  };
}

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

// CSV IMPORT FUNCTIONALITY FOR PLANNING
// CSV Import functionality
document.getElementById("importCSVBtn").addEventListener("click", () => {
  document.getElementById("csvFileInput").click();
});

document
  .getElementById("csvFileInput")
  .addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show loading indicator for large files
    if (file.size > 100000) { // 100KB threshold
      showLoadingIndicator("Processing CSV file...");
    }
    
    const reader = new FileReader();
    reader.onload = async function (event) {
      try {
        const csv = event.target.result;
        
        // Use Tabulator's built-in CSV parser if available, else fallback
        let rows;
        if (Tabulator.prototype.parseCSV) {
          rows = Tabulator.prototype.parseCSV(csv);
        } else {
          rows = csvToObj(csv);
        }
        
        // Show progress for large imports
        if (rows.length > 100) {
          showLoadingIndicator(`Processing ${rows.length} rows...`);
        }
        
        // Map CSV headers to table fields and clean up data in batches
        const mappedRows = [];
        
        await processRowsInBatches(rows, 15, (row) => {
          const mappedRow = {};

          // Map column names from CSV to expected field names
          const columnMapping = {
            campaignType: "programType", // CSV uses campaignType, grid uses programType
            strategicPillars: "strategicPillars",
            revenuePlay: "revenuePlay",
            fiscalYear: "fiscalYear",
            quarterMonth: "quarter", // CSV uses quarterMonth, grid uses quarter
            region: "region",
            country: "country",
            owner: "owner",
            description: "description",
            forecastedCost: "forecastedCost",
            expectedLeads: "expectedLeads",
            status: "status",
          };

          // Apply mapping and clean up values
          Object.keys(row).forEach((csvField) => {
            const gridField = columnMapping[csvField] || csvField;
            let value = row[csvField];

            // Clean up specific fields
            if (gridField === "forecastedCost") {
              // Handle forecasted cost - remove commas, quotes, and convert to number
              if (typeof value === "string") {
                value = value.replace(/[",\s]/g, ""); // Remove commas, quotes, and spaces
                value = value ? Number(value) : 0;
              } else {
                value = value ? Number(value) : 0;
              }
            } else if (gridField === "expectedLeads") {
              // Ensure expected leads is a number
              if (typeof value === "string") {
                value = value.replace(/[",\s]/g, ""); // Remove any formatting
                value = value ? Number(value) : 0;
              } else {
                value = value ? Number(value) : 0;
              }
            } else if (gridField === "status") {
              // Ensure status is a string and handle any numeric values
              if (value && typeof value !== "string") {
                value = String(value);
              }
              // If it's empty or undefined, default to 'Planning'
              if (!value || value === "" || value === "undefined") {
                value = "Planning";
              }
            }

            // Only add non-empty values to avoid overwriting with empty strings
            if (value !== "" && value !== undefined && value !== null) {
              mappedRow[gridField] = value;
            }
          });

          mappedRows.push(mappedRow);
        });

        // Process calculated fields in batches
        await processRowsInBatches(mappedRows, 15, (row) => {
          // Special logic for In-Account Events (1:1): no leads, pipeline = 20x forecasted cost
          if (row.programType === "In-Account Events (1:1)") {
            row.expectedLeads = 0;
            row.mqlForecast = 0;
            row.sqlForecast = 0;
            row.oppsForecast = 0;
            row.pipelineForecast = row.forecastedCost
              ? Number(row.forecastedCost) * 20
              : 0;
          } else if (
            typeof row.expectedLeads === "number" ||
            (!isNaN(row.expectedLeads) &&
              row.expectedLeads !== undefined &&
              row.expectedLeads !== "")
          ) {
            const kpiVals = kpis(Number(row.expectedLeads));
            row.mqlForecast = kpiVals.mql;
            row.sqlForecast = kpiVals.sql;
            row.oppsForecast = kpiVals.opps;
            row.pipelineForecast = kpiVals.pipeline;
          }
        });
        
        if (planningTableInstance) {
          // Add data progressively for better UX
          const batchSize = 100;
          for (let i = 0; i < mappedRows.length; i += batchSize) {
            const batch = mappedRows.slice(i, i + batchSize);
            planningTableInstance.addData(batch);
            
            // Update progress
            if (mappedRows.length > 100) {
              const progress = Math.round(((i + batch.length) / mappedRows.length) * 100);
              showLoadingIndicator(`Importing... ${progress}%`);
            }
            
            // Small delay to prevent UI freezing
            if (i + batchSize < mappedRows.length) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
          
          // Update ROI metrics to reflect newly imported forecasted costs
          if (typeof window.roiModule?.updateRoiTotalSpend === "function") {
            setTimeout(window.roiModule.updateRoiTotalSpend, 100); // Small delay to ensure data is fully loaded
          }
        }
        
        hideLoadingIndicator();
        
        // Show success message
        const successMsg = document.createElement("div");
        successMsg.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          z-index: 1200;
          font-weight: bold;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        `;
        successMsg.textContent = `✓ Successfully imported ${mappedRows.length} campaigns!`;
        document.body.appendChild(successMsg);

        setTimeout(() => {
          if (successMsg.parentNode) {
            successMsg.remove();
          }
        }, 3000);
        
      } catch (error) {
        hideLoadingIndicator();
        console.error("CSV import error:", error);
        alert("Failed to import CSV: " + error.message);
      }
    };
    reader.readAsText(file);
  });

// Simple CSV to object parser (fallback)
function csvToObj(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0]
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim());

  return lines.slice(1).map((line) => {
    // Handle CSV parsing more carefully to deal with quoted values containing commas
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Don't forget the last value

    const obj = {};
    headers.forEach((h, i) => {
      const value = values[i] || "";
      obj[h] = value.replace(/^"|"$/g, ""); // Remove surrounding quotes
    });
    return obj;
  });
}

// PLANNING FILTER FUNCTIONALITY

// Custom multiselect implementation
function createMultiselect(selectElement) {
  const container = document.createElement('div');
  container.className = 'multiselect-container';
  
  const display = document.createElement('div');
  display.className = 'multiselect-display';
  
  const dropdown = document.createElement('div');
  dropdown.className = 'multiselect-dropdown';
  
  // Get options from original select
  const options = Array.from(selectElement.options).map(option => ({
    value: option.value,
    text: option.textContent,
    selected: option.selected
  }));
  
  let selectedValues = options.filter(opt => opt.selected).map(opt => opt.value);
  
  // Update display content
  function updateDisplay() {
    display.innerHTML = '';
    
    if (selectedValues.length === 0) {
      const placeholder = document.createElement('span');
      placeholder.className = 'multiselect-placeholder';
      placeholder.textContent = `(All ${selectElement.getAttribute('data-placeholder') || 'Options'})`;
      display.appendChild(placeholder);
    } else if (selectedValues.length <= 2) {
      const selectedContainer = document.createElement('div');
      selectedContainer.className = 'multiselect-selected';
      
      selectedValues.forEach(value => {
        const option = options.find(opt => opt.value === value);
        if (option) {
          const tag = document.createElement('span');
          tag.className = 'multiselect-tag';
          tag.innerHTML = `
            ${option.text}
            <span class="multiselect-tag-remove" data-value="${value}">×</span>
          `;
          selectedContainer.appendChild(tag);
        }
      });
      
      display.appendChild(selectedContainer);
    } else {
      const selectedContainer = document.createElement('div');
      selectedContainer.className = 'multiselect-selected';
      
      // Show first item and count
      const firstOption = options.find(opt => opt.value === selectedValues[0]);
      if (firstOption) {
        const tag = document.createElement('span');
        tag.className = 'multiselect-tag';
        tag.innerHTML = `
          ${firstOption.text}
          <span class="multiselect-tag-remove" data-value="${firstOption.value}">×</span>
        `;
        selectedContainer.appendChild(tag);
      }
      
      const count = document.createElement('span');
      count.className = 'multiselect-count';
      count.textContent = `+${selectedValues.length - 1}`;
      selectedContainer.appendChild(count);
      
      display.appendChild(selectedContainer);
    }
  }
  
  // Update dropdown content
  function updateDropdown() {
    dropdown.innerHTML = '';
    
    options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'multiselect-option';
      if (selectedValues.includes(option.value)) {
        optionElement.classList.add('selected');
      }
      
      optionElement.innerHTML = `
        <div class="multiselect-checkbox">${selectedValues.includes(option.value) ? '✓' : ''}</div>
        <span>${option.text}</span>
      `;
      
      optionElement.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOption(option.value);
      });
      
      dropdown.appendChild(optionElement);
    });
  }
  
  // Toggle option selection
  function toggleOption(value) {
    const index = selectedValues.indexOf(value);
    if (index === -1) {
      selectedValues.push(value);
    } else {
      selectedValues.splice(index, 1);
    }
    
    // Update original select
    Array.from(selectElement.options).forEach(option => {
      option.selected = selectedValues.includes(option.value);
    });
    
    updateDisplay();
    updateDropdown();
    
    // Trigger change event
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Handle tag removal
  display.addEventListener('click', (e) => {
    if (e.target.classList.contains('multiselect-tag-remove')) {
      e.stopPropagation();
      const value = e.target.getAttribute('data-value');
      toggleOption(value);
    } else {
      // Toggle dropdown
      const isOpen = dropdown.classList.contains('open');
      closeAllMultiselects();
      if (!isOpen) {
        display.classList.add('open');
        dropdown.classList.add('open');
      }
    }
  });
  
  // Setup container
  selectElement.parentNode.insertBefore(container, selectElement);
  container.appendChild(display);
  container.appendChild(dropdown);
  selectElement.classList.add('multiselect-hidden');
  
  // Store reference for cleanup
  selectElement._multiselectContainer = container;
  
  const multiselectAPI = {
    updateDisplay,
    updateDropdown,
    getSelectedValues: () => selectedValues,
    setSelectedValues: (values) => {
      selectedValues = values.slice();
      Array.from(selectElement.options).forEach(option => {
        option.selected = selectedValues.includes(option.value);
      });
      updateDisplay();
      updateDropdown();
    },
    destroy: () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      selectElement.classList.remove('multiselect-hidden');
      delete selectElement._multiselectContainer;
      delete selectElement._multiselectAPI;
    }
  };
  
  // Store API reference
  selectElement._multiselectAPI = multiselectAPI;
  
  // Initial update
  updateDisplay();
  updateDropdown();
  
  return multiselectAPI;
}

// Close all multiselects
function closeAllMultiselects() {
  document.querySelectorAll('.multiselect-display.open').forEach(display => {
    display.classList.remove('open');
  });
  document.querySelectorAll('.multiselect-dropdown.open').forEach(dropdown => {
    dropdown.classList.remove('open');
  });
}

// Close multiselects when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.multiselect-container')) {
    closeAllMultiselects();
  }
});

function updateDigitalMotionsButtonVisual(button) {
  const isActive = button.dataset.active === "true";
  if (isActive) {
    button.style.background = "#1a7f37";
    button.style.borderColor = "#1a7f37";
    button.style.color = "white";
    button.innerHTML = '<i class="octicon octicon-rocket" aria-hidden="true"></i> Digital Motions <i class="octicon octicon-check" aria-hidden="true"></i>';
  } else {
    button.style.background = "#2da44e";
    button.style.borderColor = "#2da44e";
    button.style.color = "white";
    button.innerHTML = '<i class="octicon octicon-rocket" aria-hidden="true"></i> Digital Motions';
  }
}

// Function to ensure planning grid is properly rendered and visible
function ensurePlanningGridVisible() {
  if (planningTableInstance) {
    // Use requestIdleCallback for non-blocking operations, with even more granular yielding
    const performRecalc = () => {
      if (window.requestIdleCallback) {
        requestIdleCallback(() => {
          // Micro-yield before recalc
          setTimeout(() => {
            planningTableInstance.recalc();
            // Micro-yield before redraw
            setTimeout(() => {
              requestIdleCallback(() => {
                planningTableInstance.redraw(false); // Non-blocking redraw
                // Micro-yield before scroll
                setTimeout(() => {
                  requestIdleCallback(() => {
                    const data = planningTableInstance.getData();
                    if (data && data.length > 0) {
                      // Micro-yield before scroll
                      setTimeout(() => {
                        requestIdleCallback(() => {
                          safeScrollToRow(planningTableInstance, 1, "top", false);
                        }, { timeout: 10 });
                      }, 5);
                    }
                  }, { timeout: 10 });
                }, 5);
              }, { timeout: 10 });
            }, 5);
          }, 5);
        }, { timeout: 5 });
      } else {
        // Fallback to setTimeout with even smaller delays and yields
        setTimeout(() => {
          planningTableInstance.recalc();
          setTimeout(() => {
            planningTableInstance.redraw(false);
            setTimeout(() => {
              const data = planningTableInstance.getData();
              if (data && data.length > 0) {
                setTimeout(() => {
                  safeScrollToRow(planningTableInstance, 1, "top", false);
                }, 5);
              }
            }, 5);
          }, 5);
        }, 2);
      }
    };
    performRecalc();
  }
}

function populatePlanningFilters() {
  const regionSelect = document.getElementById("planningRegionFilter");
  const quarterSelect = document.getElementById("planningQuarterFilter");
  const statusSelect = document.getElementById("planningStatusFilter");
  const programTypeSelect = document.getElementById("planningProgramTypeFilter");
  const strategicPillarSelect = document.getElementById("planningStrategicPillarFilter");
  const ownerSelect = document.getElementById("planningOwnerFilter");
  const digitalMotionsButton = document.getElementById("planningDigitalMotionsFilter");

  if (!regionSelect || !quarterSelect || !statusSelect || 
      !programTypeSelect || !strategicPillarSelect || !ownerSelect || !digitalMotionsButton) {
    return;
  }

  // Initialize Digital Motions button state
  if (!digitalMotionsButton.hasAttribute("data-active")) {
    digitalMotionsButton.dataset.active = "false";
  }

  updateDigitalMotionsButtonVisual(digitalMotionsButton);

  // Get options from planning data
  const planningData = planningTableInstance?.getData() || [];
  const uniqueRegions = Array.from(
    new Set(planningData.map((c) => c.region).filter(Boolean)),
  ).sort();
  const uniqueOwners = Array.from(
    new Set(planningData.map((c) => c.owner).filter(Boolean)),
  ).sort();

  // Set placeholder attributes for custom multiselects
  regionSelect.setAttribute('data-placeholder', 'Regions');
  quarterSelect.setAttribute('data-placeholder', 'Quarters');
  statusSelect.setAttribute('data-placeholder', 'Statuses');
  programTypeSelect.setAttribute('data-placeholder', 'Program Types');
  strategicPillarSelect.setAttribute('data-placeholder', 'Strategic Pillars');
  ownerSelect.setAttribute('data-placeholder', 'Owners');

  // Only populate if not already populated
  if (regionSelect.children.length === 0) {
    regionOptions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
  }

  if (quarterSelect.children.length === 0) {
    quarterOptions.forEach((quarter) => {
      const option = document.createElement("option");
      const normalizedQuarter = normalizeQuarter(quarter);
      option.value = normalizedQuarter;
      option.textContent = normalizedQuarter;
      quarterSelect.appendChild(option);
    });
  }

  if (statusSelect.children.length === 0) {
    statusOptions.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusSelect.appendChild(option);
    });
  }

  if (programTypeSelect.children.length === 0) {
    programTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      programTypeSelect.appendChild(option);
    });
  }

  if (strategicPillarSelect.children.length === 0) {
    strategicPillars.forEach((pillar) => {
      const option = document.createElement("option");
      option.value = pillar;
      option.textContent = pillar;
      strategicPillarSelect.appendChild(option);
    });
  }

  if (ownerSelect.children.length === 0) {
    names.forEach((owner) => {
      const option = document.createElement("option");
      option.value = owner;
      option.textContent = owner;
      ownerSelect.appendChild(option);
    });
  }

  // Initialize custom multiselects if not already done
  const selectElements = [
    regionSelect, quarterSelect, statusSelect, 
    programTypeSelect, strategicPillarSelect, ownerSelect
  ];

  selectElements.forEach(select => {
    if (!select._multiselectContainer) {
      createMultiselect(select);
    }
  });

  // Set up event listeners for all filters (only if not already attached)
  selectElements.forEach((select) => {
    if (!select.hasAttribute("data-listener-attached")) {
      select.addEventListener("change", applyPlanningFilters);
      select.setAttribute("data-listener-attached", "true");
    }
  });

  // Digital Motions filter button toggle (only attach once)
  if (!digitalMotionsButton.hasAttribute("data-listener-attached")) {
    digitalMotionsButton.addEventListener("click", () => {
      const currentState = digitalMotionsButton.dataset.active;
      const isActive = currentState === "true";
      const newState = !isActive;

      console.log("[Planning] Digital Motions button clicked:", {
        currentState,
        isActive,
        newState,
      });

      digitalMotionsButton.dataset.active = newState.toString();
      updateDigitalMotionsButtonVisual(digitalMotionsButton);

      console.log(
        "[Planning] About to apply filters with Digital Motions state:",
        newState,
      );
      applyPlanningFilters();
    });
    digitalMotionsButton.setAttribute("data-listener-attached", "true");
  }

  // Clear filters button
  const clearButton = document.getElementById("planningClearFilters");
  if (clearButton && !clearButton.hasAttribute("data-listener-attached")) {
    clearButton.addEventListener("click", () => {
      // Clear all multiselect values
      selectElements.forEach(select => {
        if (select && select.multiple) {
          // Clear all selected options in multiselect
          Array.from(select.options).forEach(option => {
            option.selected = false;
          });
          
          // Update custom multiselect display if it exists
          if (select._multiselectContainer) {
            const multiselectAPI = select._multiselectAPI;
            if (multiselectAPI) {
              multiselectAPI.setSelectedValues([]);
            }
          }
        } else if (select) {
          select.value = "";
        }
      });
      
      // Reset Digital Motions button
      digitalMotionsButton.dataset.active = "false";
      updateDigitalMotionsButtonVisual(digitalMotionsButton);
      
      // Clear universal search filters
      universalSearchFilters = {
        region: [],
        quarter: [],
        status: [],
        programType: [],
        strategicPillar: [],
        owner: [],
        fiscalYear: []
      };
      
      // Clear universal search display if it exists
      if (window.planningUniversalSearch && typeof window.planningUniversalSearch.clearAllFilters === 'function') {
        window.planningUniversalSearch.clearAllFilters();
      }
      
      // Apply filters (which will show all data since no filters are selected)
      applyPlanningFilters();
    });
    clearButton.setAttribute("data-listener-attached", "true");
  }

  // Reapply filters if any are currently active (after multiselects are initialized)
  const currentFilters = getPlanningFilterValues();
  const hasActiveFilters = currentFilters.region.length > 0 || 
    currentFilters.quarter.length > 0 || currentFilters.status.length > 0 || 
    currentFilters.programType.length > 0 || 
    currentFilters.strategicPillar.length > 0 || currentFilters.owner.length > 0 || 
    currentFilters.digitalMotions;

  if (hasActiveFilters) {
    applyPlanningFilters();
  }
}

// Store universal search filters globally
let universalSearchFilters = {
  region: [],
  quarter: [],
  status: [],
  programType: [],
  strategicPillar: [],
  owner: [],
  fiscalYear: [],
  digitalMotions: false
};

function getPlanningFilterValues() {
  const digitalMotionsButton = document.getElementById(
    "planningDigitalMotionsFilter",
  );
  const digitalMotionsActive = digitalMotionsButton?.dataset.active === "true";

  // Helper function to get selected values from multiselect
  const getSelectedValues = (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) return [];
    
    if (element.multiple) {
      return Array.from(element.selectedOptions).map(option => option.value).filter(value => value !== "");
    } else {
      const value = element.value;
      return value ? [value] : [];
    }
  };

  // Get values from dropdown filters
  const dropdownFilterValues = {
    region: getSelectedValues("planningRegionFilter"),
    quarter: getSelectedValues("planningQuarterFilter"),
    status: getSelectedValues("planningStatusFilter"),
    programType: getSelectedValues("planningProgramTypeFilter"),
    strategicPillar: getSelectedValues("planningStrategicPillarFilter"),
    owner: getSelectedValues("planningOwnerFilter"),
    digitalMotions: digitalMotionsActive,
  };

  // Combine dropdown filters with universal search filters
  const filterValues = {
    region: [...new Set([...dropdownFilterValues.region, ...universalSearchFilters.region])],
    quarter: [...new Set([...dropdownFilterValues.quarter, ...universalSearchFilters.quarter])],
    status: [...new Set([...dropdownFilterValues.status, ...universalSearchFilters.status])],
    programType: [...new Set([...dropdownFilterValues.programType, ...universalSearchFilters.programType])],
    strategicPillar: [...new Set([...dropdownFilterValues.strategicPillar, ...universalSearchFilters.strategicPillar])],
    owner: [...new Set([...dropdownFilterValues.owner, ...universalSearchFilters.owner])],
    digitalMotions: digitalMotionsActive || !!universalSearchFilters.digitalMotions,
  };

  // Only log filter values in debug mode (reduced console noise)
  if (window.DEBUG_FILTERS) {
    console.log(
      "[Planning] getPlanningFilterValues - Digital Motions button state:",
      {
        element: !!digitalMotionsButton,
        datasetActive: digitalMotionsButton?.dataset.active,
        digitalMotionsActive,
      },
    );
    console.log("[Planning] Combined filters (dropdown + universal search):", filterValues);
  }

  return filterValues;
}

function applyPlanningFilters() {
  if (!planningTableInstance) {
    console.warn(
      "[Planning] Table instance not available, cannot apply filters",
    );
    return;
  }

  const filters = getPlanningFilterValues();
  console.log("[Planning] Applying filters:", filters);

  // Use data store for faster filtering
  const filteredData = planningDataStore.applyFilters(filters);
  
  // Update table with filtered data
  planningTableInstance.setData(filteredData);

  console.log("[Planning] Filters applied, showing", filteredData.length, "rows");

  // Update filter summary display
  updatePlanningFilterSummary(filters, filteredData.length);

  // Show helpful message when Digital Motions filter is active
  if (filters.digitalMotions) {
    console.log(
      "[Planning] Digital Motions filter active - showing only campaigns with digitalMotions: true",
    );
  }
}

function updatePlanningFilterSummary(filters, resultCount) {
  // Count active filters
  let activeFilters = 0;
  let filterDetails = [];
  
  Object.keys(filters).forEach(key => {
    if (key === 'digitalMotions') {
      if (filters[key]) {
        activeFilters++;
        filterDetails.push('Digital Motions');
      }
    } else if (Array.isArray(filters[key]) && filters[key].length > 0) {
      activeFilters++;
      const count = filters[key].length;
      const keyName = key.charAt(0).toUpperCase() + key.slice(1);
      filterDetails.push(`${keyName} (${count})`);
    }
  });
  
  // Update or create filter summary element
  let summaryElement = document.getElementById('planningFilterSummary');
  if (!summaryElement) {
    summaryElement = document.createElement('div');
    summaryElement.id = 'planningFilterSummary';
    summaryElement.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #666;
      border-left: 3px solid #1976d2;
    `;
    
    const filtersContainer = document.getElementById('planningFilters');
    if (filtersContainer) {
      filtersContainer.appendChild(summaryElement);
    }
  }
  
  if (activeFilters === 0) {
    summaryElement.textContent = `Showing all ${resultCount} campaigns`;
  } else {
    const filterText = filterDetails.join(', ');
    summaryElement.textContent = `Showing ${resultCount} campaigns filtered by: ${filterText}`;
  }
}

// Initialize planning filters when planning grid is ready
function initializePlanningFilters() {
  // Wait a bit for the planning grid to be initialized
  setTimeout(() => {
    populatePlanningFilters();
  }, 500);
}

// EXPORT PLANNING MODULE FUNCTIONS
window.planningModule = {
  loadPlanning,
  initPlanningGrid,
  initPlanningGridLazy,
  setupPlanningSave,
  getAllCountries,
  getCountryOptionsForRegion,
  populatePlanningFilters,
  applyPlanningFilters,
  initializePlanningFilters,
  cleanupPlanningGrid,
  clearPlanningCache,
  ensurePlanningGridVisible, // Add grid visibility function
  initPlanningWorker,
  cleanupPlanningWorker,
  initializePlanningUniversalSearch,
  updatePlanningSearchData,
  // State getters
  getIsInitialized: () => isGridInitialized,
  getIsLoading: () => isDataLoading,
  getCacheSize: () => planningDataCache ? planningDataCache.length : 0,
  // Export constants for use by other modules
  constants: {
    programTypes,
    strategicPillars,
    names,
    revenuePlays,
    fyOptions,
    quarterOptions,
    monthOptions,
    regionOptions,
    statusOptions,
    yesNo,
    countryOptionsByRegion,
  },
};

// Register with tab manager if available
if (window.tabManager) {
  window.tabManager.registerTab(
    'planning',
    async () => {
      // Tab initialization callback
      console.log("🎯 Initializing planning tab via TabManager");
      await initPlanningGridLazy();
      populatePlanningFilters();
      
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        initializePlanningUniversalSearch();
      }, 100);
    },
    async () => {
      // Tab cleanup callback
      console.log("🧹 Cleaning up planning tab via TabManager");
      cleanupPlanningGrid();
    }
  );
  console.log("✅ Planning tab registered with TabManager");
} else {
  // Fallback: Initialize when explicitly needed
  console.log("🎯 TabManager not available, planning will initialize on demand");
  
  // Store fallback initialization function for later use
  window.planningModule.initializeFallback = async () => {
    try {
      await initPlanningGridLazy();
      populatePlanningFilters();
      
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        initializePlanningUniversalSearch();
      }, 100);
      
      console.log("✅ Planning tab initialized via fallback");
    } catch (error) {
      console.error("❌ Failed to initialize planning tab:", error);
    }
  };
}

// Memory management and cleanup functions
function cleanupPlanningGrid() {
  console.log("🧹 Cleaning up planning grid...");
  
  // Clean up custom multiselects
  const multiselects = document.querySelectorAll('.filter-select[multiple]');
  multiselects.forEach(select => {
    if (select._multiselectAPI) {
      select._multiselectAPI.destroy();
    }
  });
  
  if (planningTableInstance) {
    try {
      // Clear any pending timeouts
      const data = planningTableInstance.getData();
      data.forEach(row => {
        if (row._updateTimeout) {
          clearTimeout(row._updateTimeout);
          delete row._updateTimeout;
        }
      });
      
      // Destroy the table instance
      planningTableInstance.destroy();
      planningTableInstance = null;
      isGridInitialized = false;
      
      console.log("✅ Planning grid cleaned up successfully");
    } catch (error) {
      console.warn("⚠️ Error during planning grid cleanup:", error);
    }
  }
  
  // Clean up worker
  cleanupPlanningWorker();
  
  // Clean up loading indicators
  hideLoadingIndicator();
  
  // Remove tooltips
  const tooltips = document.querySelectorAll(".desc-tooltip");
  tooltips.forEach((t) => t.remove());
}

// Clear cache function
function clearPlanningCache() {
  console.log("🗑️ Clearing planning data cache...");
  planningDataCache = null;
}

// Export the planning table instance getter
Object.defineProperty(window.planningModule, "tableInstance", {
  get: function () {
    return planningTableInstance;
  },
});

console.log(
  "Planning module initialized and exported to window.planningModule",
);

// Autosave functionality for planning - optimized for large datasets
function triggerPlanningAutosave(table) {
  if (!window.cloudflareSyncModule) {
    console.log("Cloudflare sync module not available");
    return;
  }

  // Get only modified data to reduce payload size
  const allData = table.getData();
  const modifiedData = allData.filter(row => row.__modified);
  
  // For large datasets, prioritize saving modified rows
  if (allData.length > 1000 && modifiedData.length < allData.length * 0.1) {
    console.log(`Autosave: Only ${modifiedData.length} of ${allData.length} rows modified, saving all data`);
  }
  
  window.cloudflareSyncModule.scheduleSave("planning", allData, {
    source: "planning-autosave",
    modifiedCount: modifiedData.length,
    totalCount: allData.length,
  });
}

// Universal Search Filter Implementation

function initializePlanningUniversalSearch() {
  console.log("🔍 PLANNING: Starting universal search initialization...");
  
  // Check if UniversalSearchFilter class is available
  if (!window.UniversalSearchFilter) {
    console.error("❌ PLANNING: UniversalSearchFilter class not found!");
    console.log("Available on window:", Object.keys(window).filter(k => k.includes('Search') || k.includes('Universal')));
    return;
  }
  
  console.log("✅ PLANNING: UniversalSearchFilter class found");
  
  // Check if container exists
  const container = document.getElementById('planningUniversalSearch');
  if (!container) {
    console.error("❌ PLANNING: Container 'planningUniversalSearch' not found in DOM!");
    console.log("Available elements with 'planning' in id:", Array.from(document.querySelectorAll('[id*="planning"]')).map(el => el.id));
    return;
  }
  
  console.log("✅ PLANNING: Container found:", container);
  console.log("✅ PLANNING: Container visible:", container.offsetParent !== null);
  
  try {
    // Initialize universal search for planning
    window.planningUniversalSearch = new window.UniversalSearchFilter(
      'planningUniversalSearch',
      {
        onFilterChange: (selectedFilters) => {
          console.log("🔄 PLANNING: Search filters changed:", selectedFilters);
          applyPlanningSearchFilters(selectedFilters);
        }
      }
    );
    
    console.log("✅ PLANNING: Universal search initialized successfully!");
    
    // Update search data with current planning data
    updatePlanningSearchData();
    
  } catch (error) {
    console.error("❌ PLANNING: Error initializing universal search:", error);
    console.error("❌ PLANNING: Error stack:", error.stack);
  }
}

function updatePlanningSearchData() {
  console.log("📊 PLANNING: Updating search data...");
  
  if (!window.planningUniversalSearch) {
    console.warn("⚠️ PLANNING: Universal search not initialized yet");
    return;
  }
  
  if (!planningTableInstance) {
    console.warn("⚠️ PLANNING: Planning table instance not available yet");
    return;
  }
  
  try {
    const planningData = planningTableInstance.getData();
    console.log("📈 PLANNING: Creating filter options from", planningData.length, "planning records");
    
    // Get unique values from actual data
    const uniqueOwners = Array.from(
      new Set(planningData.map((c) => c.owner).filter(Boolean)),
    ).sort();
    
    // Create searchable filter options
    const searchData = [];
    
    // Add region filters
    regionOptions.forEach(region => {
      searchData.push({
        id: `region_${region}`,
        title: region,
        category: 'region',
        value: region,
        description: `Filter by ${region} region`,
        type: 'filter'
      });
    });
    
    // Add quarter filters
    quarterOptions.forEach(quarter => {
      const normalizedQuarter = normalizeQuarter(quarter);
      searchData.push({
        id: `quarter_${normalizedQuarter}`,
        title: normalizedQuarter,
        category: 'quarter',
        value: normalizedQuarter,
        description: `Filter by ${normalizedQuarter}`,
        type: 'filter'
      });
    });
    
    // Add status filters
    statusOptions.forEach(status => {
      searchData.push({
        id: `status_${status}`,
        title: status,
        category: 'status',
        value: status,
        description: `Filter by ${status} status`,
        type: 'filter'
      });
    });
    
    // Add program type filters
    programTypes.forEach(programType => {
      searchData.push({
        id: `programType_${programType}`,
        title: programType,
        category: 'programType',
        value: programType,
        description: `Filter by ${programType}`,
        type: 'filter'
      });
    });
    
    // Add strategic pillar filters
    strategicPillars.forEach(pillar => {
      searchData.push({
        id: `strategicPillars_${pillar}`,
        title: pillar,
        category: 'strategicPillars',
        value: pillar,
        description: `Filter by ${pillar}`,
        type: 'filter'
      });
    });
    

    // Add owner filters (from actual data)
    uniqueOwners.forEach(owner => {
      searchData.push({
        id: `owner_${owner}`,
        title: owner,
        category: 'owner',
        value: owner,
        description: `Filter by ${owner}`,
        type: 'filter'
      });
    });

    // Add Digital Motions filter in the same group as other filters
    searchData.push({
      id: 'digitalMotions_true',
      title: 'Digital Motions',
      category: 'digitalMotions',
      value: 'true',
      displayValue: 'Digital Motions',
      description: 'Show only Digital Motions campaigns',
      type: 'filter',
    });

    // Add fiscal year filters
    fyOptions.forEach(fy => {
      searchData.push({
        id: `fiscalYear_${fy}`,
        title: fy,
        category: 'fiscalYear',
        value: fy,
        description: `Filter by ${fy}`,
        type: 'filter'
      });
    });

    console.log('[DEBUG] planning.js: searchData sent to updateData:', searchData);
    window.planningUniversalSearch.updateData(searchData);
    console.log("✅ PLANNING: Search data updated with", searchData.length, "filter options");
    
  } catch (error) {
    console.error("❌ PLANNING: Error updating search data:", error);
  }
}

function applyPlanningSearchFilters(selectedFilters) {
  console.log("🎯 PLANNING: Applying search filters:", selectedFilters);
  
  if (!planningTableInstance) {
    console.warn("⚠️ PLANNING: Planning table instance not available");
    return;
  }
  
  try {
    // Reset universal search filters (must include digitalMotions property)
    universalSearchFilters = {
      region: [],
      quarter: [],
      status: [],
      programType: [],
      strategicPillar: [],
      owner: [],
      fiscalYear: [],
      digitalMotions: false
    };
    
    // selectedFilters is an object with categories as keys and arrays as values
    // e.g., { region: ['SAARC'], status: ['Planning'] }
    if (selectedFilters && typeof selectedFilters === 'object') {
      Object.entries(selectedFilters).forEach(([category, values]) => {
        if (category === 'digitalMotions') {
          // If Digital Motions filter is present, set boolean (accept true or 'true')
          universalSearchFilters.digitalMotions = Array.isArray(values) && (values.includes(true) || values.includes('true'));
        } else if (universalSearchFilters.hasOwnProperty(category) && Array.isArray(values)) {
          universalSearchFilters[category] = [...values];
        }
      });
    }

    console.log("🔍 PLANNING: Universal search filters updated:", universalSearchFilters);

    // Apply filters using the main planning filter system
    applyPlanningFilters();
    
  } catch (error) {
    console.error("❌ PLANNING: Error applying search filters:", error);
  }
}

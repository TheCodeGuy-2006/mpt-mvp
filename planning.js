import { kpis } from "./src/calc.js";

// PLANNING TAB CONSTANTS AND DATA
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

const regionOptions = ["JP & Korea", "South APAC", "SAARC"];

const statusOptions = ["Planning", "On Track", "Shipped", "Cancelled"];
const yesNo = ["Yes", "No"];

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

// Utility: Get all unique countries from all regions
function getAllCountries() {
  const all = [];
  Object.values(countryOptionsByRegion).forEach((arr) => {
    if (Array.isArray(arr)) all.push(...arr);
  });
  // Remove duplicates
  return Array.from(new Set(all));
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
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Batch processing utility for large datasets
function processRowsInBatches(rows, batchSize = 100, callback) {
  return new Promise((resolve) => {
    let index = 0;
    
    function processBatch() {
      const batch = rows.slice(index, index + batchSize);
      if (batch.length === 0) {
        resolve();
        return;
      }
      
      // Process batch
      batch.forEach((row, i) => {
        callback(row, index + i);
      });
      
      index += batchSize;
      
      // Use requestAnimationFrame for non-blocking processing
      requestAnimationFrame(() => {
        // Add small delay to prevent UI freezing
        setTimeout(processBatch, 0);
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
    
    // Show loading indicator for large datasets
    if (rows.length > 500) {
      showLoadingIndicator("Processing " + rows.length + " campaigns...");
    }
    
    // Use Web Worker for heavy processing if available and dataset is large
    if (rows.length > 200 && initPlanningWorker()) {
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
          options: { batchSize: 100 }
        });
      });
    } else {
      // Fallback to main thread processing for smaller datasets
      await processRowsInBatches(rows, 100, (row, i) => {
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
      planningTableInstance.replaceData(this.data);
    }
  }
  
  applyFilters(filters) {
    const startTime = performance.now();
    
    this.filteredData = this.data.filter(row => {
    // Campaign name filter removed      // Digital Motions filter
      if (filters.digitalMotions && row.digitalMotions !== true) {
        return false;
      }
      
      // Exact match filters
      const exactMatchFields = ['region', 'quarter', 'status', 'programType', 'strategicPillars', 'owner'];
      for (const field of exactMatchFields) {
        if (filters[field] && row[field] !== filters[field]) {
          return false;
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
    
    // Initialize grid with data
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
  
  // Performance optimizations for large datasets with fixed virtual DOM
  const performanceConfig = {
    // Adjust virtual DOM settings for better visibility
    virtualDom: true,
    virtualDomBuffer: 50, // Larger buffer to show more rows initially
    
    // Remove explicit height to use CSS height for proper virtual DOM calculation
    // height: "calc(100vh - 300px)", // Let CSS handle this
    
    // Pagination to improve initial load
    pagination: "local",
    paginationSize: 50, // Larger page size for better user experience
    paginationSizeSelector: [25, 50, 100, 200, "all"],
    paginationCounter: "rows",
    
    // Enable progressive loading for smoother experience
    progressiveLoad: "scroll",
    progressiveLoadDelay: 100,
    
    // Fix horizontal scrolling - disable virtual horizontal rendering
    renderHorizontal: "basic", // Changed from "virtual" to "basic" for better column visibility
    renderVertical: "virtual", // Keep vertical virtual for performance
    
    // Enable auto-resize for proper viewport calculation
    autoResize: true,
    responsiveLayout: false, // Disable to allow horizontal scrolling
    
    // Enable proper data loading indicators
    dataLoaderLoading: "<div style='padding:20px; text-align:center;'>Loading...</div>",
    dataLoaderError: "<div style='padding:20px; text-align:center; color:red;'>Error loading data</div>",
    
    // Reduce column calculations only if not needed
    columnCalcs: false,
    
    // Optimized scroll handling
    scrollToRowPosition: "center",
    scrollToRowIfVisible: false,
    
    // Debounced data updates with reasonable delay
    dataChanged: debounce(() => {
      console.log("Planning data changed");
    }, 500), // Shorter debounce for better responsiveness
  };
  
  planningTableInstance = new Tabulator("#planningGrid", {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    layout: "fitData", // Changed from "fitColumns" to "fitData" for better horizontal scrolling
    initialSort: [
      { column: "id", dir: "desc" }, // Sort by ID descending so newer rows appear at top
    ],
    
    // Apply performance optimizations
    ...performanceConfig,
    
    // Add table built callback to ensure proper rendering
    tableBuilt: function() {
      // Force a redraw after table is built to ensure virtual DOM is properly calculated
      setTimeout(() => {
        this.redraw(true);
        // Scroll to top to ensure we see the first rows
        this.scrollToRow(1, "top", false);
      }, 100);
    },
    
    // Add data loaded callback
    dataLoaded: function(data) {
      console.log(`Planning grid loaded with ${data.length} rows`);
      // Ensure virtual DOM recalculates after data load
      setTimeout(() => {
        this.redraw(true);
      }, 50);
    },
    
    columns: [
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
        frozen: true, // Keep this column visible when scrolling horizontally
      },
      // Select row button (circle)
      {
        title: "",
        field: "select",
        formatter: function (cell) {
          const row = cell.getRow();
          const selected = row.getElement().classList.contains("row-selected");
          return `<span class="select-circle" style="display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid #888;background:${selected ? "#1976d2" : "transparent"};cursor:pointer;"></span>`;
        },
        width: 40,
        hozAlign: "center",
        cellClick: function (e, cell) {
          const row = cell.getRow();
          row.getElement().classList.toggle("row-selected");
          cell.getTable().redraw(true);
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

          // Special logic for In-Account Events (1:1)
          if (cell.getValue() === "In-Account Events (1:1)") {
            r.update({
              expectedLeads: 0,
              mqlForecast: 0,
              sqlForecast: 0,
              oppsForecast: 0,
              pipelineForecast: rowData.forecastedCost ? Number(rowData.forecastedCost) * 20 : 0,
            });
          } else {
            // For other program types, recalculate based on expected leads
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
        // Simplified tooltip - only show on click to reduce overhead
        cellClick: function (e, cell) {
          if (cell.getValue() && cell.getValue().length > 20) {
            const tooltip = prompt("Description:", cell.getValue());
            if (tooltip !== null && tooltip !== cell.getValue()) {
              cell.setValue(tooltip);
            }
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

          // Special logic for In-Account Events (1:1) - recalculate pipeline based on cost
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

          // Special logic for In-Account Events (1:1) - ignore expected leads, use forecasted cost
          if (rowData.programType === "In-Account Events (1:1)") {
            r.update({
              expectedLeads: 0,
              mqlForecast: 0,
              sqlForecast: 0,
              oppsForecast: 0,
              pipelineForecast: rowData.forecastedCost ? Number(rowData.forecastedCost) * 20 : 0,
            });
          } else {
            // Normal KPI calculation for other program types
            const kpiVals = kpis(cell.getValue());
            r.update({
              mqlForecast: kpiVals.mql,
              sqlForecast: kpiVals.sql,
              oppsForecast: kpiVals.opps,
              pipelineForecast: kpiVals.pipeline,
            });
          }
          rowData.__modified = true;
          debouncedAutosave();
        }, 1000),
      },
      { title: "MQL", field: "mqlForecast", editable: false, width: 90 },
      { title: "SQL", field: "sqlForecast", editable: false, width: 90 },
      { title: "Opps", field: "oppsForecast", editable: false, width: 90 },
      {
        title: "Pipeline",
        field: "pipelineForecast",
        editable: false,
        width: 120,
        formatter: function (cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        },
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
          debouncedAutosave();
        }, 1000),
      },
      {
        title: "PO raised",
        field: "poRaised",
        editor: "list",
        editorParams: { values: yesNo },
        width: 110,
      },
      // Digital Motions toggle
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
          // Toggle value
          const current = !!cell.getValue();
          cell.setValue(!current);

          // Sync digitalMotions change to execution table
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

          // Trigger ROI budget updates when Digital Motions toggle changes
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
      // Bin icon (delete)
      {
        title: "",
        field: "delete",
        formatter: function () {
          return '<button class="delete-row-btn" title="Delete"><span style="font-size:1.2em; color:#b71c1c;">🗑️</span></button>';
        },
        width: 50,
        hozAlign: "center",
        cellClick: function (e, cell) {
          cell.getRow().delete();
        },
        headerSort: false,
      },
    ],
  });

  // Create debounced autosave function for this table instance with longer delay
  const debouncedAutosave = debounce(() => {
    triggerPlanningAutosave(planningTableInstance);
  }, 3000); // Much longer autosave delay

  // Wire up Add Row and Delete Row buttons for Planning grid
  const addBtn = document.getElementById("addPlanningRow");
  if (addBtn) {
    addBtn.onclick = () => showAddRowModal();
  }

  const delBtn = document.getElementById("deletePlanningRow");
  if (delBtn) {
    delBtn.textContent = "Delete Highlighted Rows";
    delBtn.onclick = () => {
      const rows = planningTableInstance.getRows();
      let deleted = 0;
      rows.forEach((row) => {
        if (row.getElement().classList.contains("row-selected")) {
          row.delete();
          deleted++;
        }
      });
      if (deleted === 0) {
        alert("No rows selected for deletion.");
      }
    };
  }

  setupPlanningSave(planningTableInstance, rows);

  // Update global reference
  window.planningTableInstance = planningTableInstance;

  // Add window resize handler for proper virtual DOM recalculation
  const resizeHandler = debounce(() => {
    if (planningTableInstance) {
      planningTableInstance.redraw(true);
    }
  }, 250);
  
  window.addEventListener('resize', resizeHandler);
  
  // Add visibility change handler to redraw when tab becomes visible
  const visibilityHandler = () => {
    if (!document.hidden && planningTableInstance) {
      setTimeout(() => {
        planningTableInstance.redraw(true);
      }, 100);
    }
  };
  
  document.addEventListener('visibilitychange', visibilityHandler);
  
  // Store cleanup function for later use
  planningTableInstance._cleanup = () => {
    window.removeEventListener('resize', resizeHandler);
    document.removeEventListener('visibilitychange', visibilityHandler);
  };

  planningPerformance.end('grid initialization');
  
  return planningTableInstance;
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
          border-bottom: 2px solid #e3f2fd;
          padding-bottom: 16px;
        ">
          <h2 style="margin: 0; color: #1976d2; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">➕</span>
            Add New Campaign
          </h2>
          <button id="closeAddRowModal" style="
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
          ">✕</button>
        </div>
        
        <form id="addRowForm" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        ">
          <!-- Row 1: Basic Info -->
          <div style="grid-column: 1 / -1;">
            <h3 style="margin: 0 0 16px 0; color: #1976d2; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">
              📋 Basic Information
            </h3>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Program Type <span style="color: red;">*</span>
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
            <h3 style="margin: 0 0 16px 0; color: #1976d2; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">
              📅 Scheduling & Location
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
            <h3 style="margin: 0 0 16px 0; color: #1976d2; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">
              💰 Financial & Goals
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
            <button type="button" id="cancelAddRow" style="
              background: #6c757d;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
            ">Cancel</button>
            <button type="submit" id="confirmAddRow" style="
              background: #28a745;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
            ">✓ Add Campaign</button>
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

    // Add row to table
    const newRow = planningTableInstance.addRow(formData, true);

    // Scroll to the new row and make it visible
    setTimeout(() => {
      if (newRow && newRow.scrollTo) {
        newRow.scrollTo();
        console.log("Scrolled to new planning row");
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
  saveBtn.onclick = () => {
    // Recalculate KPIs for all rows before saving
    const allRows = table.getData();
    allRows.forEach((row) => {
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
    // Save all planning data
    const data = table.getData();

    console.log("Saving planning data:", data.length, "rows");

    // Try Worker first, then backend fallback
    if (window.cloudflareSyncModule) {
      // Primary: Save to Worker
      window.cloudflareSyncModule
        .saveToWorker("planning", data, { source: "manual-save" })
        .then((result) => {
          console.log("Worker save successful:", result);
          alert(
            "✅ Planning data saved to GitHub!\n\n💡 Note: It may take 1-2 minutes for changes from other users to appear due to GitHub's caching. Use the 'Refresh Data' button in GitHub Sync if needed.",
          );

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
                  "✅ Planning data saved to backend (Worker unavailable)!",
                );
              } else {
                alert(
                  "❌ Failed to save: " + (result.error || "Unknown error"),
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
        
        await processRowsInBatches(rows, 50, (row) => {
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
        await processRowsInBatches(mappedRows, 50, (row) => {
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
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
function updateDigitalMotionsButtonVisual(button) {
  const isActive = button.dataset.active === "true";
  if (isActive) {
    button.style.background = "#2e7d32";
    button.style.borderColor = "#2e7d32";
    button.style.color = "white";
    button.textContent = "🚀 Digital Motions ✓";
  } else {
    button.style.background = "#4caf50";
    button.style.borderColor = "#45a049";
    button.style.color = "white";
    button.textContent = "🚀 Digital Motions";
  }
}

// Function to ensure planning grid is properly rendered and visible
function ensurePlanningGridVisible() {
  if (planningTableInstance) {
    // Force recalculation of virtual DOM and redraw
    requestAnimationFrame(() => {
      // First, recalculate the table height and dimensions
      planningTableInstance.recalc();
      
      // Force recalculation of column widths for horizontal scrolling
      planningTableInstance.redraw(true);
      
      // Ensure we're scrolled to a visible position
      const data = planningTableInstance.getData();
      if (data && data.length > 0) {
        // Scroll to first row to ensure visibility
        setTimeout(() => {
          planningTableInstance.scrollToRow(1, "top", false);
        }, 50);
      }
      
      // Final recalculation after everything is settled
      setTimeout(() => {
        if (planningTableInstance) {
          // Force column width recalculation for horizontal scrolling
          planningTableInstance.recalc();
          planningTableInstance.redraw(true);
        }
      }, 150);
    });
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

  // Reapply filters if any are currently active
  const currentFilters = getPlanningFilterValues();
  const hasActiveFilters = currentFilters.region || 
    currentFilters.quarter || currentFilters.status || currentFilters.programType || 
    currentFilters.owner || currentFilters.digitalMotions;

  if (hasActiveFilters) {
    applyPlanningFilters();
  }

  // Get options from planning data
  const planningData = planningTableInstance?.getData() || [];
  const uniqueRegions = Array.from(
    new Set(planningData.map((c) => c.region).filter(Boolean)),
  ).sort();
  const uniqueOwners = Array.from(
    new Set(planningData.map((c) => c.owner).filter(Boolean)),
  ).sort();

  // Only populate if not already populated
  if (regionSelect.children.length <= 1) {
    regionOptions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
  }

  if (quarterSelect.children.length <= 1) {
    quarterOptions.forEach((quarter) => {
      const option = document.createElement("option");
      option.value = quarter;
      option.textContent = quarter;
      quarterSelect.appendChild(option);
    });
  }

  if (statusSelect.children.length <= 1) {
    statusOptions.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusSelect.appendChild(option);
    });
  }

  if (programTypeSelect.children.length <= 1) {
    programTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      programTypeSelect.appendChild(option);
    });
  }

  if (strategicPillarSelect.children.length <= 1) {
    strategicPillars.forEach((pillar) => {
      const option = document.createElement("option");
      option.value = pillar;
      option.textContent = pillar;
      strategicPillarSelect.appendChild(option);
    });
  }

  if (ownerSelect.children.length <= 1) {
    names.forEach((owner) => {
      const option = document.createElement("option");
      option.value = owner;
      option.textContent = owner;
      ownerSelect.appendChild(option);
    });
  }

  // Set up event listeners for all filters (only if not already attached)
  [
    regionSelect,
    quarterSelect,
    statusSelect,
    programTypeSelect,
    strategicPillarSelect,
    ownerSelect,
  ].forEach((select) => {
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
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      regionSelect.value = "";
      quarterSelect.value = "";
      statusSelect.value = "";
      programTypeSelect.value = "";
      strategicPillarSelect.value = "";
      ownerSelect.value = "";
      digitalMotionsButton.dataset.active = "false";
      updateDigitalMotionsButtonVisual(digitalMotionsButton);
      applyPlanningFilters();
    });
  }
}

function getPlanningFilterValues() {
  const digitalMotionsButton = document.getElementById(
    "planningDigitalMotionsFilter",
  );
  const digitalMotionsActive = digitalMotionsButton?.dataset.active === "true";

  const filterValues = {
    region: document.getElementById("planningRegionFilter")?.value || "",
    quarter: document.getElementById("planningQuarterFilter")?.value || "",
    status: document.getElementById("planningStatusFilter")?.value || "",
    programType:
      document.getElementById("planningProgramTypeFilter")?.value || "",
    strategicPillar:
      document.getElementById("planningStrategicPillarFilter")?.value || "",
    owner: document.getElementById("planningOwnerFilter")?.value || "",
    digitalMotions: digitalMotionsActive,
  };

  console.log(
    "[Planning] getPlanningFilterValues - Digital Motions button state:",
    {
      element: !!digitalMotionsButton,
      datasetActive: digitalMotionsButton?.dataset.active,
      digitalMotionsActive,
    },
  );

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

  // Show helpful message when Digital Motions filter is active
  if (filters.digitalMotions) {
    console.log(
      "[Planning] Digital Motions filter active - showing only campaigns with digitalMotions: true",
    );
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
    },
    async () => {
      // Tab cleanup callback
      console.log("🧹 Cleaning up planning tab via TabManager");
      cleanupPlanningGrid();
    }
  );
  console.log("✅ Planning tab registered with TabManager");
} else {
  console.warn("⚠️ TabManager not available, using direct initialization");
}

// Memory management and cleanup functions
function cleanupPlanningGrid() {
  console.log("🧹 Cleaning up planning grid...");
  
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

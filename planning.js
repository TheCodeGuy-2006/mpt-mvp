import { kpis } from "./src/calc.js";

console.log("planning.js loaded");

// PLANNING TAB CONSTANTS AND DATA
const programTypes = [
  "User Groups",
  "Targeted paid ads & content sydication",
  "Flagship events (galaxy, universe recaps) 1:many",
  "3P sponsored events",
  "Webinars",
  "Microsoft",
  "Lunch & learns and workshops (1:few)",
  "Localized Programs",
  "CxO events (1:few)",
  "Exec engagement programs",
  "In-Account events (1:1)",
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

// Patch: For now, allow all countries for any region (as array, not object)
function getCountryOptionsForRegion(region) {
  const allCountries = getAllCountries();
  if (allCountries.length > 0) {
    return allCountries;
  }
  return ["(No countries available)"];
}

// Patch: Debug country dropdown
window.debugCountryOptions = countryOptionsByRegion;
window.debugGetCountryOptionsForRegion = getCountryOptionsForRegion;

// PLANNING DATA LOADING
// Load planning data via Worker API for real-time updates
async function loadPlanning(retryCount = 0) {
  try {
    // Try to load via Worker API first (real-time, no caching issues)
    let rows;
    
    try {
      // Use Worker API endpoint instead of raw GitHub files
      const workerEndpoint = window.cloudflareSyncModule?.getWorkerEndpoint() || 'https://mpt-mvp-sync.jordanradford.workers.dev';
      const workerUrl = `${workerEndpoint}/data/planning`;
      
      console.log(`Fetching planning data via Worker API (attempt ${retryCount + 1}):`, workerUrl);
      
      const response = await fetch(workerUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(
        "Worker API response - status:",
        response.status,
        response.statusText,
        "URL:",
        response.url,
      );
      
      if (response.ok) {
        const result = await response.json();
        rows = result.data;
        console.log("✅ Loaded planning data via Worker API:", rows.length, "rows", `(source: ${result.source})`);
        
        // Validate that we got actual data
        if (rows && rows.length > 0) {
          console.log("✅ Worker API data validation passed");
        } else {
          console.warn("⚠️ Worker API returned empty data");
          if (retryCount < 2) {
            console.log(`Retrying Worker API fetch in ${(retryCount + 1) * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
            return loadPlanning(retryCount + 1);
          }
        }
      } else {
        throw new Error(`Worker API failed: ${response.status} ${response.statusText}`);
      }
    } catch (workerError) {
      console.warn("Worker API failed, falling back to local file:", workerError);
      
      // Fallback: Try local file
      try {
        const r = await fetch("data/planning.json");
        console.log(
          "Fallback: Fetching local data/planning.json, status:",
          r.status,
          r.statusText,
          r.url,
        );
        if (!r.ok) throw new Error("Failed to fetch planning.json");
        rows = await r.json();
        console.log("📁 Loaded planning data from local file:", rows.length, "rows");
        
        // Show a message to the user about the Worker API being unavailable
        if (retryCount === 0) {
          console.warn("⚠️ Worker API unavailable - using local data. Real-time sync disabled.");
          // You might want to show a notification to the user here
        }
      } catch (localError) {
        console.error("Local file also failed:", localError);
        throw new Error("Failed to load planning data from both Worker API and local file");
      }
    }
    
    console.log("Processing loaded planning data:", rows.length, "rows");
    // Ensure all rows have calculated fields before rendering
    rows.forEach((row, i) => {
      if (typeof row.expectedLeads === "number") {
        Object.assign(row, kpis(row.expectedLeads));
      }
      if (!row.id) {
        // Assign a unique id if missing
        row.id = `row_${i}_${Date.now()}`;
        console.warn("Row missing id at index", i, row);
      }
    });
    return rows;
  } catch (e) {
    console.error("Error loading planning.json:", e);
    alert("Failed to fetch planning.json");
    return [];
  }
}

// PLANNING GRID INITIALIZATION
let planningTableInstance = null;

// Make globally accessible for data refreshing
window.planningTableInstance = planningTableInstance;
window.loadPlanning = loadPlanning;

function initPlanningGrid(rows) {
  console.log("Initializing Planning Grid with rows:", rows);
  planningTableInstance = new Tabulator("#planningGrid", {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    layout: "fitColumns",
    initialSort: [
      {column: "id", dir: "desc"} // Sort by ID descending so newer rows appear at top
    ],
    columns: [
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
        title: "Campaign Name",
        field: "campaignName",
        editor: "input",
        width: 160,
      },
      {
        title: "Program Type",
        field: "programType",
        editor: "list",
        editorParams: { values: programTypes },
        width: 200,
        cellEdited: (cell) => {
          const r = cell.getRow();
          const rowData = r.getData();

          // Special logic for In-Account events (1:1)
          if (cell.getValue() === "In-Account events (1:1)") {
            r.update({
              expectedLeads: 0,
              mqlForecast: 0,
              sqlForecast: 0,
              oppsForecast: 0,
              pipelineForecast: rowData.forecastedCost
                ? Number(rowData.forecastedCost) * 20
                : 0,
            });
          } else {
            // For other program types, recalculate based on expected leads
            if (
              typeof rowData.expectedLeads === "number" &&
              rowData.expectedLeads > 0
            ) {
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
          
          // Trigger autosave
          triggerPlanningAutosave(cell.getTable());
        },
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
        cellMouseOver: function (e, cell) {
          if (!cell.getElement().classList.contains("tabulator-editing")) {
            let tooltip = document.createElement("div");
            tooltip.className = "desc-tooltip";
            tooltip.innerText = cell.getValue();
            tooltip.setAttribute(
              "data-tooltip-for",
              cell.getRow().getPosition() + "-" + cell.getField(),
            );
            document.body.appendChild(tooltip);
            const rect = cell.getElement().getBoundingClientRect();
            tooltip.style.left = rect.left + window.scrollX + 10 + "px";
            tooltip.style.top = rect.top + window.scrollY + 30 + "px";
          }
        },
        cellMouseOut: function (e, cell) {
          const tooltips = document.querySelectorAll(".desc-tooltip");
          tooltips.forEach((t) => t.remove());
        },
        cellEditing: function (cell) {
          const selector =
            '.desc-tooltip[data-tooltip-for="' +
            cell.getRow().getPosition() +
            "-" +
            cell.getField() +
            '"]';
          const tooltips = document.querySelectorAll(selector);
          tooltips.forEach((t) => t.remove());
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
        cellEdited: (cell) => {
          const r = cell.getRow();
          const rowData = r.getData();

          // Special logic for In-Account events (1:1) - recalculate pipeline based on cost
          if (rowData.programType === "In-Account events (1:1)") {
            r.update({
              expectedLeads: 0,
              mqlForecast: 0,
              sqlForecast: 0,
              oppsForecast: 0,
              pipelineForecast: cell.getValue()
                ? Number(cell.getValue()) * 20
                : 0,
            });
          }
          rowData.__modified = true;
          
          // Trigger autosave
          triggerPlanningAutosave(cell.getTable());
        },
      },
      {
        title: "Expected Leads",
        field: "expectedLeads",
        editor: "number",
        width: 150,
        cellEdited: (cell) => {
          const r = cell.getRow();
          const rowData = r.getData();

          // Special logic for In-Account events (1:1) - ignore expected leads, use forecasted cost
          if (rowData.programType === "In-Account events (1:1)") {
            r.update({
              expectedLeads: 0,
              mqlForecast: 0,
              sqlForecast: 0,
              oppsForecast: 0,
              pipelineForecast: rowData.forecastedCost
                ? Number(rowData.forecastedCost) * 20
                : 0,
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
          
          // Trigger autosave
          triggerPlanningAutosave(cell.getTable());
        },
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
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
          
          // Trigger autosave
          triggerPlanningAutosave(cell.getTable());
        },
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
        formatter: function(cell) {
          const value = cell.getValue();
          return `<input type='checkbox' ${value ? "checked" : ""} style='transform:scale(1.3); cursor:pointer;' />`;
        },
        width: 120,
        hozAlign: "center",
        cellClick: function(e, cell) {
          // Toggle value
          const current = !!cell.getValue();
          cell.setValue(!current);
          
          // Trigger ROI budget updates when Digital Motions toggle changes
          setTimeout(() => {
            if (window.roiModule && typeof window.roiModule.updateRemainingBudget === 'function') {
              const regionFilter = document.getElementById("roiRegionFilter")?.value || "";
              window.roiModule.updateRemainingBudget(regionFilter);
              window.roiModule.updateForecastedBudgetUsage(regionFilter);
              console.log('[Planning] Triggered ROI budget updates after Digital Motions toggle');
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

  // Wire up Add Row and Delete Row buttons for Planning grid
  const addBtn = document.getElementById("addPlanningRow");
  console.log("addPlanningRow button:", addBtn);
  if (addBtn) {
    addBtn.onclick = () => {
      console.log("Add Planning Row button clicked");
      const newRow = planningTableInstance.addRow({
        id: `program-${Date.now()}`,
        status: "Planning",
        __modified: true,
      }, true); // Add 'true' as second parameter to add at top
      
      // Scroll to the new row and make it visible
      setTimeout(() => {
        if (newRow && newRow.scrollTo) {
          newRow.scrollTo();
          console.log("Scrolled to new planning row");
        }
      }, 100);
    };
  }

  const delBtn = document.getElementById("deletePlanningRow");
  console.log("deletePlanningRow button:", delBtn);
  if (delBtn) {
    delBtn.textContent = "Delete Highlighted Rows";
    delBtn.onclick = () => {
      console.log("Delete Planning Row button clicked");
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
  setupPlanningDownload(planningTableInstance);
  
  // Update global reference for data refreshing
  window.planningTableInstance = planningTableInstance;
  
  return planningTableInstance;
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
    
    console.log('Saving planning data:', data.length, 'rows');
    
    // Try Worker first, then backend fallback
    if (window.cloudflareSyncModule) {
      // Primary: Save to Worker
      window.cloudflareSyncModule.saveToWorker('planning', data, { source: 'manual-save' })
        .then((result) => {
          console.log('Worker save successful:', result);
          alert("✅ Planning data saved to GitHub!\n\n💡 Note: It may take 1-2 minutes for changes from other users to appear due to GitHub's caching. Use the 'Refresh Data' button in GitHub Sync if needed.");
          
          // Refresh data after successful save
          if (window.cloudflareSyncModule.refreshDataAfterSave) {
            window.cloudflareSyncModule.refreshDataAfterSave('planning');
          }
          
          // Update ROI metrics
          if (typeof window.roiModule?.updateRoiTotalSpend === "function") {
            window.roiModule.updateRoiTotalSpend();
          }
        })
        .catch((error) => {
          console.warn('Worker save failed, trying backend:', error);
          
          // Fallback: Save to backend
          fetch("http://localhost:3000/save-planning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data }),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.success) {
                alert("✅ Planning data saved to backend (Worker unavailable)!");
              } else {
                alert("❌ Failed to save: " + (result.error || "Unknown error"));
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

function setupPlanningDownload(table) {
  let btn = document.getElementById("downloadPlanningAll");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "downloadPlanningAll";
    btn.textContent = "Download All as JSON";
    btn.style.margin = "12px 0 12px 12px";
    document
      .getElementById("view-planning")
      .insertBefore(btn, document.getElementById("planningGrid"));
  }
  btn.onclick = () => {
    const data = table.getData();
    downloadJSON(data, "planning-all.json");
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
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const csv = event.target.result;
      // Use Tabulator's built-in CSV parser if available, else fallback
      let rows;
      if (Tabulator.prototype.parseCSV) {
        rows = Tabulator.prototype.parseCSV(csv);
      } else {
        rows = csvToObj(csv);
      }
      // Map CSV headers to table fields and clean up data
      const mappedRows = rows.map((row) => {
        const mappedRow = {};

        // Map column names from CSV to expected field names
        const columnMapping = {
          campaignName: "campaignName",
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

        return mappedRow;
      });

      // Before adding, update calculated fields for each row
      mappedRows.forEach((row) => {
        // Special logic for In-Account events (1:1): no leads, pipeline = 20x forecasted cost
        if (row.programType === "In-Account events (1:1)") {
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
        planningTableInstance.addData(mappedRows);
        // Update ROI metrics to reflect newly imported forecasted costs
        if (typeof window.roiModule?.updateRoiTotalSpend === "function") {
          setTimeout(window.roiModule.updateRoiTotalSpend, 100); // Small delay to ensure data is fully loaded
        }
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

function populatePlanningFilters() {
  const campaignNameInput = document.getElementById("planningCampaignNameFilter");
  const regionSelect = document.getElementById("planningRegionFilter");
  const quarterSelect = document.getElementById("planningQuarterFilter");
  const statusSelect = document.getElementById("planningStatusFilter");
  const programTypeSelect = document.getElementById("planningProgramTypeFilter");
  const ownerSelect = document.getElementById("planningOwnerFilter");
  const digitalMotionsButton = document.getElementById("planningDigitalMotionsFilter");

  if (!campaignNameInput || !regionSelect || !quarterSelect || !statusSelect || !programTypeSelect || !ownerSelect || !digitalMotionsButton) {
    console.error("[Planning] Missing filter elements:", {
      campaignNameInput: !!campaignNameInput,
      regionSelect: !!regionSelect,
      quarterSelect: !!quarterSelect,
      statusSelect: !!statusSelect,
      programTypeSelect: !!programTypeSelect,
      ownerSelect: !!ownerSelect,
      digitalMotionsButton: !!digitalMotionsButton
    });
    return;
  }

  // Initialize Digital Motions button state (preserve existing state if already set)
  if (!digitalMotionsButton.hasAttribute('data-active')) {
    digitalMotionsButton.dataset.active = "false";
    console.log("[Planning] Initialized Digital Motions button state to false");
  } else {
    console.log("[Planning] Preserving existing Digital Motions button state:", digitalMotionsButton.dataset.active);
  }
  
  // Update button visual state to match data attribute
  updateDigitalMotionsButtonVisual(digitalMotionsButton);
  
  // Reapply filters if any are currently active (after navigation)
  const currentFilters = getPlanningFilterValues();
  const hasActiveFilters = currentFilters.campaignName || currentFilters.region || currentFilters.quarter || 
                          currentFilters.status || currentFilters.programType || currentFilters.owner || 
                          currentFilters.digitalMotions;
  
  if (hasActiveFilters) {
    console.log("[Planning] Reapplying active filters after navigation");
    applyPlanningFilters();
  }

  // Get options from planning data
  const planningData = planningTableInstance?.getData() || [];
  const uniqueRegions = Array.from(new Set(planningData.map(c => c.region).filter(Boolean))).sort();
  const uniqueOwners = Array.from(new Set(planningData.map(c => c.owner).filter(Boolean))).sort();

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
  
  if (ownerSelect.children.length <= 1) {
    names.forEach((owner) => {
      const option = document.createElement("option");
      option.value = owner;
      option.textContent = owner;
      ownerSelect.appendChild(option);
    });
  }

  // Set up event listeners for all filters (only if not already attached)
  if (!campaignNameInput.hasAttribute('data-listener-attached')) {
    campaignNameInput.addEventListener("input", applyPlanningFilters);
    campaignNameInput.setAttribute('data-listener-attached', 'true');
  }
  
  [regionSelect, quarterSelect, statusSelect, programTypeSelect, ownerSelect].forEach(select => {
    if (!select.hasAttribute('data-listener-attached')) {
      select.addEventListener("change", applyPlanningFilters);
      select.setAttribute('data-listener-attached', 'true');
    }
  });

  // Digital Motions filter button toggle (only attach once)
  if (!digitalMotionsButton.hasAttribute('data-listener-attached')) {
    digitalMotionsButton.addEventListener("click", () => {
      const currentState = digitalMotionsButton.dataset.active;
      const isActive = currentState === "true";
      const newState = !isActive;
      
      console.log("[Planning] Digital Motions button clicked:", {
        currentState,
        isActive,
        newState
      });
      
      digitalMotionsButton.dataset.active = newState.toString();
      updateDigitalMotionsButtonVisual(digitalMotionsButton);
      
      console.log("[Planning] About to apply filters with Digital Motions state:", newState);
      applyPlanningFilters();
    });
    digitalMotionsButton.setAttribute('data-listener-attached', 'true');
  }

  // Clear filters button
  const clearButton = document.getElementById("planningClearFilters");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      campaignNameInput.value = "";
      regionSelect.value = "";
      quarterSelect.value = "";
      statusSelect.value = "";
      programTypeSelect.value = "";
      ownerSelect.value = "";
      digitalMotionsButton.dataset.active = "false";
      updateDigitalMotionsButtonVisual(digitalMotionsButton);
      applyPlanningFilters();
    });
  }
}

function getPlanningFilterValues() {
  const digitalMotionsButton = document.getElementById("planningDigitalMotionsFilter");
  const digitalMotionsActive = digitalMotionsButton?.dataset.active === "true";
  
  const filterValues = {
    campaignName: document.getElementById("planningCampaignNameFilter")?.value || "",
    region: document.getElementById("planningRegionFilter")?.value || "",
    quarter: document.getElementById("planningQuarterFilter")?.value || "",
    status: document.getElementById("planningStatusFilter")?.value || "",
    programType: document.getElementById("planningProgramTypeFilter")?.value || "",
    owner: document.getElementById("planningOwnerFilter")?.value || "",
    digitalMotions: digitalMotionsActive
  };
  
  console.log("[Planning] getPlanningFilterValues - Digital Motions button state:", {
    element: !!digitalMotionsButton,
    datasetActive: digitalMotionsButton?.dataset.active,
    digitalMotionsActive
  });
  
  return filterValues;
}

function applyPlanningFilters() {
  if (!planningTableInstance) {
    console.warn("[Planning] Table instance not available, cannot apply filters");
    return;
  }
  
  const filters = getPlanningFilterValues();
  console.log("[Planning] Applying filters:", filters);
  
  // Debug: Show Digital Motions data in the table
  if (filters.digitalMotions) {
    const allData = planningTableInstance.getData();
    const digitalMotionsRows = allData.filter(row => row.digitalMotions === true);
    console.log("[Planning] Total rows:", allData.length);
    console.log("[Planning] Rows with digitalMotions=true:", digitalMotionsRows.length);
    console.log("[Planning] Digital Motions campaigns:", digitalMotionsRows.map(r => ({
      id: r.id,
      campaignName: r.campaignName,
      digitalMotions: r.digitalMotions
    })));
  }
  
  // Use requestAnimationFrame to reduce forced reflow
  requestAnimationFrame(() => {
    // Clear existing filters first
    planningTableInstance.clearFilter();
    
    // Build filter functions array
    const filterFunctions = [];
    
    // Campaign name filter (case-insensitive partial match)
    if (filters.campaignName) {
      const searchTerm = filters.campaignName.toLowerCase();
      filterFunctions.push((data) => {
        const campaignName = (data.campaignName || "").toLowerCase();
        return campaignName.includes(searchTerm);
      });
    }
    
    // Digital Motions filter
    if (filters.digitalMotions) {
      console.log("[Planning] Digital Motions filter is active, adding filter function");
      filterFunctions.push((data) => {
        const hasDigitalMotions = data.digitalMotions === true;
        if (!hasDigitalMotions) {
          console.log("[Planning] Filtering out row without digitalMotions:", data.campaignName || data.id);
        }
        return hasDigitalMotions;
      });
    }
    
    // Standard exact match filters
    if (filters.region) {
      filterFunctions.push((data) => data.region === filters.region);
    }
    if (filters.quarter) {
      filterFunctions.push((data) => data.quarter === filters.quarter);
    }
    if (filters.status) {
      filterFunctions.push((data) => data.status === filters.status);
    }
    if (filters.programType) {
      filterFunctions.push((data) => data.programType === filters.programType);
    }
    if (filters.owner) {
      filterFunctions.push((data) => data.owner === filters.owner);
    }
    
    // Apply combined filter function if any filters are active
    if (filterFunctions.length > 0) {
      planningTableInstance.addFilter(function(data) {
        // All filter functions must return true (AND logic)
        return filterFunctions.every(fn => fn(data));
      });
    }
    
    const visibleRows = planningTableInstance.getDataCount(true);
    console.log("[Planning] Filters applied, showing", visibleRows, "rows");
    
    // Show helpful message when Digital Motions filter is active
    if (filters.digitalMotions) {
      console.log("[Planning] Digital Motions filter active - showing only campaigns with digitalMotions: true");
    }
  });
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
  setupPlanningSave,
  setupPlanningDownload,
  getAllCountries,
  getCountryOptionsForRegion,
  populatePlanningFilters,
  applyPlanningFilters,
  initializePlanningFilters,
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

// Export the planning table instance getter
Object.defineProperty(window.planningModule, "tableInstance", {
  get: function () {
    return planningTableInstance;
  },
});

console.log(
  "Planning module initialized and exported to window.planningModule",
);

// Autosave functionality for planning
function triggerPlanningAutosave(table) {
  if (!window.cloudflareSyncModule) {
    console.log('Cloudflare sync module not available');
    return;
  }

  const data = table.getData();
  window.cloudflareSyncModule.scheduleSave('planning', data, {
    source: 'planning-autosave'
  });
}

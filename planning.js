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

const regionOptions = [
  "JP & Korea",
  "South APAC",
  "SAARC",
];

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
// Load planning data from planning.json only
async function loadPlanning() {
  try {
    const r = await fetch("data/planning.json");
    console.log(
      "Fetching data/planning.json, status:",
      r.status,
      r.statusText,
      r.url,
    );
    if (!r.ok) throw new Error("Failed to fetch planning.json");
    const rows = await r.json();
    console.log("Loaded planning.json rows:", rows);
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

function initPlanningGrid(rows) {
  console.log("Initializing Planning Grid with rows:", rows);
  planningTableInstance = new Tabulator("#planningGrid", {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    layout: "fitColumns",
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
        headerFilter: "input",
        headerFilterPlaceholder: "Search...",
      },
      {
        title: "Program Type",
        field: "programType",
        editor: "list",
        editorParams: { values: programTypes },
        width: 200,
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            ...Object.fromEntries(programTypes.map((v) => [v, v])),
          },
        },
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
        },
      },
      {
        title: "Strategic Pillar",
        field: "strategicPillars",
        editor: "list",
        editorParams: { values: strategicPillars },
        width: 220,
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            ...Object.fromEntries(strategicPillars.map((v) => [v, v])),
          },
        },
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
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            ...Object.fromEntries(names.map((v) => [v, v])),
          },
        },
      },
      {
        title: "Quarter",
        field: "quarter",
        editor: "list",
        editorParams: { values: quarterOptions },
        width: 120,
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            ...Object.fromEntries(quarterOptions.map((v) => [v, v])),
          },
        },
      },
      {
        title: "Region",
        field: "region",
        editor: "list",
        editorParams: { values: regionOptions },
        width: 120,
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            ...Object.fromEntries(regionOptions.map((v) => [v, v])),
          },
        },
      },
      {
        title: "Fiscal Year",
        field: "fiscalYear",
        editor: "list",
        editorParams: { values: ["FY25", "FY26", "FY27"] },
        width: 100,
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            "FY25": "FY25",
            "FY26": "FY26",
            "FY27": "FY27",
          },
        },
      },
      {
        title: "Country",
        field: "country",
        editor: "list",
        editorParams: {
          values: getAllCountries(),
        },
        width: 130,
        headerFilter: "list",
        headerFilterParams: {
          values: (function () {
            const allCountries = getAllCountries();
            const obj = { "": "(Clear Filter)" };
            allCountries.forEach((v) => {
              obj[v] = v;
            });
            return obj;
          })(),
        },
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
        headerFilter: function (
          cell,
          onRendered,
          success,
          cancel,
          editorParams,
        ) {
          var container = document.createElement("div");
          container.style.display = "flex";
          container.style.flexDirection = "column";
          container.style.alignItems = "stretch";
          var row1 = document.createElement("div");
          row1.style.display = "flex";
          row1.style.flexDirection = "row";
          row1.style.alignItems = "center";
          var min = document.createElement("input");
          min.type = "number";
          min.placeholder = "Min";
          min.style.width = "60px";
          min.style.marginRight = "4px";
          var max = document.createElement("input");
          max.type = "number";
          max.placeholder = "Max";
          max.style.width = "60px";
          row1.appendChild(min);
          row1.appendChild(document.createTextNode(" - "));
          row1.appendChild(max);
          var clearBtn = document.createElement("button");
          clearBtn.textContent = "Clear";
          clearBtn.style.marginTop = "4px";
          clearBtn.style.padding = "2px 10px";
          clearBtn.style.fontSize = "0.95em";
          clearBtn.onclick = function (e) {
            min.value = "";
            max.value = "";
            success({ min: "", max: "" });
          };
          function updateFilter() {
            success({ min: min.value, max: max.value });
          }
          min.addEventListener("input", updateFilter);
          min.addEventListener("change", updateFilter);
          max.addEventListener("input", updateFilter);
          max.addEventListener("change", updateFilter);
          container.appendChild(row1);
          container.appendChild(clearBtn);
          return container;
        },
        headerFilterFunc: function (headerValue, rowValue) {
          let min =
            headerValue &&
            headerValue.min !== undefined &&
            headerValue.min !== ""
              ? parseFloat(headerValue.min)
              : null;
          let max =
            headerValue &&
            headerValue.max !== undefined &&
            headerValue.max !== ""
              ? parseFloat(headerValue.max)
              : null;
          let value =
            rowValue !== undefined && rowValue !== null && rowValue !== ""
              ? parseFloat(rowValue)
              : null;
          if (value === null || isNaN(value)) return false;
          if (min !== null && value < min) return false;
          if (max !== null && value > max) return false;
          return true;
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
              pipelineForecast: cell.getValue() ? Number(cell.getValue()) * 20 : 0,
            });
          }
          rowData.__modified = true;
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
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            ...Object.fromEntries(revenuePlays.map((v) => [v, v])),
          },
        },
      },
      {
        title: "Status",
        field: "status",
        editor: "list",
        editorParams: { values: statusOptions },
        width: 130,
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            ...Object.fromEntries(statusOptions.map((v) => [v, v])),
          },
        },
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
      {
        title: "PO raised",
        field: "poRaised",
        editor: "list",
        editorParams: { values: yesNo },
        width: 110,
        headerFilter: "list",
        headerFilterParams: {
          values: {
            "": "(Clear Filter)",
            ...Object.fromEntries(yesNo.map((v) => [v, v])),
          },
        },
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
      planningTableInstance.addRow({
        id: `program-${Date.now()}`,
        status: "Planning",
        __modified: true,
      });
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
    // Save all planning data to planning.json via backend API
    const data = table.getData();
    fetch("http://localhost:3000/save-planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: data }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          alert("Planning data saved to backend!");
          // Update ROI metrics to reflect changes in forecasted costs
          if (typeof updateRoiTotalSpend === "function") {
            updateRoiTotalSpend();
          }
        } else {
          alert("Failed to save: " + (result.error || "Unknown error"));
        }
      })
      .catch((err) => {
        alert("Failed to save: " + err.message);
      });
  };
}

function setupPlanningDownload(table) {
  let btn = document.getElementById("downloadPlanningAll");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "downloadPlanningAll";
    btn.textContent = "Download All as JSON";
    btn.style.margin = "12px 0 12px 12px";
    document.getElementById("view-planning").insertBefore(btn, document.getElementById("planningGrid"));
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
      const mappedRows = rows.map(row => {
        const mappedRow = {};
        
        // Map column names from CSV to expected field names
        const columnMapping = {
          'campaignName': 'campaignName',
          'campaignType': 'programType',  // CSV uses campaignType, grid uses programType
          'strategicPillars': 'strategicPillars',
          'revenuePlay': 'revenuePlay',
          'fiscalYear': 'fiscalYear',
          'quarterMonth': 'quarter',  // CSV uses quarterMonth, grid uses quarter
          'region': 'region',
          'country': 'country',
          'owner': 'owner',
          'description': 'description',
          'forecastedCost': 'forecastedCost',
          'expectedLeads': 'expectedLeads',
          'status': 'status'
        };
        
        // Apply mapping and clean up values
        Object.keys(row).forEach(csvField => {
          const gridField = columnMapping[csvField] || csvField;
          let value = row[csvField];
          
          // Clean up specific fields
          if (gridField === 'forecastedCost') {
            // Handle forecasted cost - remove commas, quotes, and convert to number
            if (typeof value === 'string') {
              value = value.replace(/[",\s]/g, ''); // Remove commas, quotes, and spaces
              value = value ? Number(value) : 0;
            } else {
              value = value ? Number(value) : 0;
            }
          } else if (gridField === 'expectedLeads') {
            // Ensure expected leads is a number
            if (typeof value === 'string') {
              value = value.replace(/[",\s]/g, ''); // Remove any formatting
              value = value ? Number(value) : 0;
            } else {
              value = value ? Number(value) : 0;
            }
          } else if (gridField === 'status') {
            // Ensure status is a string and handle any numeric values
            if (value && typeof value !== 'string') {
              value = String(value);
            }
            // If it's empty or undefined, default to 'Planning'
            if (!value || value === '' || value === 'undefined') {
              value = 'Planning';
            }
          }
          
          // Only add non-empty values to avoid overwriting with empty strings
          if (value !== '' && value !== undefined && value !== null) {
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
        if (typeof updateRoiTotalSpend === "function") {
          setTimeout(updateRoiTotalSpend, 100); // Small delay to ensure data is fully loaded
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
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Don't forget the last value
    
    const obj = {};
    headers.forEach((h, i) => {
      const value = values[i] || '';
      obj[h] = value.replace(/^"|"$/g, ""); // Remove surrounding quotes
    });
    return obj;
  });
}

// EXPORT PLANNING MODULE FUNCTIONS
window.planningModule = {
  loadPlanning,
  initPlanningGrid,
  setupPlanningSave,
  setupPlanningDownload,
  getAllCountries,
  getCountryOptionsForRegion,
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
    countryOptionsByRegion
  }
};

// Export the planning table instance getter
Object.defineProperty(window.planningModule, 'tableInstance', {
  get: function() {
    return planningTableInstance;
  }
});

console.log("Planning module initialized and exported to window.planningModule");

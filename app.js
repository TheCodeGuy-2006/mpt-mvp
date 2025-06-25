import { kpis } from "./src/calc.js";

console.log("app.js loaded");
// PLANNING GRID
const programTypes = [
  "In-Account Events (1:1)",
  "Exec Engagement Programs",
  "CxO Events (1:Few)",
  "Localized Events",
  "Localized Programs",
  "Lunch & Learns and Workshops (1:Few)",
  "Microsoft",
  "Partners",
  "Webinars",
  "3P Sponsored Events",
  "Flagship Events (Galaxy, Universe Recaps)",
  "Targeted Paid Ads & Content Syndication",
  "User Groups",
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
  "Q4 June"
];
const monthOptions = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const regionOptions = [
  "North APAC",
  "South APAC",
  "SAARC",
  "Digital Motions",
  "X APAC Non English",
  "X APAC English",
  "ANZ",
  "ASEAN",
  "GCR"
];
const statusOptions = ["Planning", "On Track", "Shipped", "Cancelled"];
const yesNo = ["Yes", "No"];

// Load planning data from planning.json only
async function loadPlanning() {
  try {
    const r = await fetch("data/planning.json");
    console.log("Fetching data/planning.json, status:", r.status, r.statusText, r.url);
    if (!r.ok) throw new Error("Failed to fetch planning.json");
    const rows = await r.json();
    console.log("Loaded planning.json rows:", rows);
    // Ensure all rows have calculated fields before rendering
    rows.forEach((row, i) => {
      if (typeof row.expectedLeads === "number") {
        Object.assign(row, kpis(row.expectedLeads));
      }
      if (!row.id) {
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

// Load budgets data from budgets.json only
async function loadBudgets() {
  try {
    const r = await fetch("data/budgets.json");
    if (!r.ok) throw new Error("Failed to fetch budgets.json");
    return await r.json();
  } catch (e) {
    alert("Failed to fetch budgets.json");
    return {};
  }
}

// PLANNING GRID
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
        formatter: function(cell) {
          const row = cell.getRow();
          const selected = row.getElement().classList.contains("row-selected");
          return `<span class="select-circle" style="display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid #888;background:${selected ? '#1976d2' : 'transparent'};cursor:pointer;"></span>`;
        },
        width: 40,
        hozAlign: "center",
        cellClick: function(e, cell) {
          const row = cell.getRow();
          row.getElement().classList.toggle("row-selected");
          cell.getTable().redraw(true);
        },
        headerSort: false
      },
      { title: "Campaign Name", field: "campaignName", editor: "input", width: 160, headerFilter: "input", headerFilterPlaceholder: "Search..." },
      { title: "Program Type", field: "programType", editor: "list", editorParams: { values: programTypes }, width: 200, headerFilter: "list", headerFilterParams: { values: {"":"(Clear Filter)", ...Object.fromEntries(programTypes.map(v => [v, v])) } } },
      { title: "Strategic Pillar", field: "strategicPillars", editor: "list", editorParams: { values: strategicPillars }, width: 220, headerFilter: "list", headerFilterParams: { values: {"":"(Clear Filter)", ...Object.fromEntries(strategicPillars.map(v => [v, v])) } } },
      { title: "Description", field: "description", editor: "input", width: 180,
        cellMouseOver: function(e, cell) {
          if (!cell.getElement().classList.contains('tabulator-editing')) {
            let tooltip = document.createElement('div');
            tooltip.className = 'desc-tooltip';
            tooltip.innerText = cell.getValue();
            tooltip.setAttribute('data-tooltip-for', cell.getRow().getPosition() + '-' + cell.getField());
            document.body.appendChild(tooltip);
            const rect = cell.getElement().getBoundingClientRect();
            tooltip.style.left = (rect.left + window.scrollX + 10) + 'px';
            tooltip.style.top = (rect.top + window.scrollY + 30) + 'px';
          }
        },
        cellMouseOut: function(e, cell) {
          const tooltips = document.querySelectorAll('.desc-tooltip');
          tooltips.forEach(t => t.remove());
        },
        cellEditing: function(cell) {
          const selector = '.desc-tooltip[data-tooltip-for="' + cell.getRow().getPosition() + '-' + cell.getField() + '"]';
          const tooltips = document.querySelectorAll(selector);
          tooltips.forEach(t => t.remove());
        }
      },
      { title: "Owner", field: "owner", editor: "list", editorParams: { values: names }, width: 140, headerFilter: "list", headerFilterParams: { values: {"":"(Clear Filter)", ...Object.fromEntries(names.map(v => [v, v])) } } },
      { title: "Quarter", field: "quarter", editor: "list", editorParams: { values: quarterOptions }, width: 120, headerFilter: "list", headerFilterParams: { values: {"":"(Clear Filter)", ...Object.fromEntries(quarterOptions.map(v => [v, v])) } } },
      { title: "Region", field: "region", editor: "list", editorParams: { values: regionOptions }, width: 120, headerFilter: "list", headerFilterParams: { values: {"":"(Clear Filter)", ...Object.fromEntries(regionOptions.map(v => [v, v])) } } },
      { title: "Country", field: "country", editor: "list", editorParams: {
        values: getAllCountries()
      }, width: 130, headerFilter: "list", headerFilterParams: {
        values: (function() {
          const allCountries = getAllCountries();
          const obj = {"":"(Clear Filter)"};
          allCountries.forEach(v => { obj[v] = v; });
          return obj;
        })()
      }
    },
      { title: "Forecasted Cost", field: "forecastedCost", editor: "number", width: 200,
        formatter: function(cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        },
        headerFilter: function(cell, onRendered, success, cancel, editorParams){
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
          clearBtn.onclick = function(e) {
            min.value = "";
            max.value = "";
            success({min: "", max: ""});
          };
          function updateFilter() {
            success({min: min.value, max: max.value});
          }
          min.addEventListener('input', updateFilter);
          min.addEventListener('change', updateFilter);
          max.addEventListener('input', updateFilter);
          max.addEventListener('change', updateFilter);
          container.appendChild(row1);
          container.appendChild(clearBtn);
          return container;
        },
        headerFilterFunc: function(headerValue, rowValue){
          let min = (headerValue && headerValue.min !== undefined && headerValue.min !== "") ? parseFloat(headerValue.min) : null;
          let max = (headerValue && headerValue.max !== undefined && headerValue.max !== "") ? parseFloat(headerValue.max) : null;
          let value = (rowValue !== undefined && rowValue !== null && rowValue !== "") ? parseFloat(rowValue) : null;
          if (value === null || isNaN(value)) return false;
          if (min !== null && value < min) return false;
          if (max !== null && value > max) return false;
          return true;
        }
      },
      { title: "Expected Leads", field: "expectedLeads", editor: "number", width: 150, cellEdited: (cell) => {
          const r = cell.getRow();
          const kpiVals = kpis(cell.getValue());
          r.update({
            mqlForecast: kpiVals.mql,
            sqlForecast: kpiVals.sql,
            oppsForecast: kpiVals.opps,
            pipelineForecast: kpiVals.pipeline,
          });
          r.getData().__modified = true;
        },
      },
      { title: "MQL", field: "mqlForecast", editable: false, width: 90 },
      { title: "SQL", field: "sqlForecast", editable: false, width: 90 },
      { title: "Opps", field: "oppsForecast", editable: false, width: 90 },
      { title: "Pipeline", field: "pipelineForecast", editable: false, width: 120,
        formatter: function(cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        }
      },
      { title: "Revenue Play", field: "revenuePlay", editor: "list", editorParams: { values: revenuePlays }, width: 140, headerFilter: "list", headerFilterParams: { values: {"":"(Clear Filter)", ...Object.fromEntries(revenuePlays.map(v => [v, v])) } } },
      { title: "Status", field: "status", editor: "list", editorParams: { values: statusOptions }, cellEdited: (cell) => { cell.getRow().getData().__modified = true; } },
      { title: "PO raised", field: "poRaised", editor: "list", editorParams: { values: yesNo }, width: 110, headerFilter: "list", headerFilterParams: { values: {"":"(Clear Filter)", ...Object.fromEntries(yesNo.map(v => [v, v])) } } },
      // Bin icon (delete)
      {
        title: "",
        field: "delete",
        formatter: function() {
          return '<button class="delete-row-btn" title="Delete"><span style="font-size:1.2em; color:#b71c1c;">🗑️</span></button>';
        },
        width: 50,
        hozAlign: "center",
        cellClick: function(e, cell) {
          cell.getRow().delete();
        },
        headerSort: false
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

// EXECUTION GRID
function initExecutionGrid(rows) {
  const statusOptions = ["Planning", "Shipped"];
  const yesNo = ["Yes", "No"];
  const table = new Tabulator("#executionGrid", {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    layout: "fitColumns",
    rowFormatter: function (row) {
      // Visual indicator for shipped
      if (row.getData().status === "Shipped") {
        row.getElement().style.background = "#e3f2fd";
      } else {
        row.getElement().style.background = "";
      }
    },
    columns: [
      { title: "Campaign Name", field: "campaignName", editor: false, width: 160 },
      { title: "Details", field: "details", width: 240, editable: false, formatter: function(cell) {
        const data = cell.getRow().getData();
        // Render region and owner as button-like spans, then description below
        return `
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <span style="background:#1976d2;color:#fff;padding:2px 10px;border-radius:12px;font-size:0.95em;display:inline-block;">${data.region || ""}</span>
            <span style="background:#90caf9;color:#1a237e;padding:2px 10px;border-radius:12px;font-size:0.95em;display:inline-block;">${data.owner || ""}</span>
          </div>
          <div style="font-size:0.98em;color:#1a237e;white-space:pre-line;">${data.description || ""}</div>
        `;
      } },
      { title: "Status", field: "status", editor: "list", editorParams: { values: statusOptions }, cellEdited: (cell) => { cell.getRow().getData().__modified = true; } },
      { title: "PO Raised", field: "poRaised", editor: "list", editorParams: { values: yesNo }, cellEdited: (cell) => { cell.getRow().getData().__modified = true; } },
      { title: "Forecasted Cost", field: "forecastedCost", editor: false, formatter: function(cell) {
        const v = cell.getValue();
        if (v === null || v === undefined || v === "") return "";
        return "$" + Number(v).toLocaleString();
      } },
      {
        title: "Actual Cost",
        field: "actualCost",
        editor: "number",
        formatter: function(cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        },
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
      { title: "Expected Leads", field: "expectedLeads" },
      {
        title: "Actual Leads",
        field: "actualLeads",
        editor: "number",
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
      { title: "MQL", field: "mqlForecast", editable: false },
      {
        title: "Actual MQLs",
        field: "actualMQLs",
        editor: "number",
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
      { title: "SQL", field: "sqlForecast", editable: false },
      { title: "Opps", field: "oppsForecast", editable: false },
      { title: "Pipeline", field: "pipelineForecast", editable: false, formatter: function(cell) {
        const v = cell.getValue();
        if (v === null || v === undefined || v === "") return "";
        return "$" + Number(v).toLocaleString();
      } },
    ],
  });
  setupExecutionSave(table, rows);
  return table;
}

// BUDGETS TABLE
function initBudgetsTable(budgets, rows) {
  const table = new Tabulator("#budgetsTable", {
    data: budgets,
    layout: "fitColumns",
    columns: [
      { title: "Region", field: "region", editor: "input" },
      { title: "Assigned Budget", field: "assignedBudget", editor: "number" },
      { title: "Notes", field: "notes", editor: "input" },
      {
        title: "Utilisation",
        field: "utilisation",
        mutator: (value, data) => value,
        formatter: (cell) => {
          const val = cell.getValue();
          return val !== undefined ? val : "";
        },
      },
    ],
  });
  // Use rows (from planning.json) instead of fetching individual files
  import("./src/calc.js").then(({ regionMetrics }) => {
    const budgetsObj = {};
    budgets.forEach(
      (b) => (budgetsObj[b.region] = { assignedBudget: b.assignedBudget })
    );
    const metrics = regionMetrics(rows, budgetsObj);
    table.getRows().forEach((row) => {
      const region = row.getData().region;
      if (metrics[region]) {
        row.update({
          utilisation: `${metrics[region].forecast} / ${metrics[region].plan}`,
        });
        if (metrics[region].forecast > metrics[region].plan) {
          row.getElement().style.background = "#ffebee";
          row.getElement().style.color = "#b71c1c";
        }
      }
    });
  });
  setupBudgetsSave(table);
  return table;
}

// REPORT GRID
function initReportGrid(rows) {
  const table = new Tabulator("#reportGrid", {
    data: rows,
    layout: "fitColumns",
    columns: [
      { title: "Region", field: "region", headerFilter: "input" },
      { title: "Country", field: "country", headerFilter: "input" },
      { title: "Quarter", field: "quarter", headerFilter: "input" },
      { title: "Forecasted Cost", field: "forecastedCost" },
      { title: "Actual Cost", field: "actualCost" },
      { title: "Expected Leads", field: "expectedLeads" },
      { title: "Actual Leads", field: "actualLeads" },
      { title: "MQL", field: "mqlForecast" },
      { title: "SQL", field: "sqlForecast" },
      { title: "Opps", field: "oppsForecast" },
      { title: "Pipeline", field: "pipelineForecast" },
    ],
    footerElement: '<div id="reportTotals"></div>',
  });
  setupReportExport(table);
  // Show calculated totals using regionMetrics
  import("./src/calc.js").then(({ regionMetrics }) => {
    fetch("data/budgets.json")
      .then((r) => r.json())
      .then((budgetsObj) => {
        const metrics = regionMetrics(rows, budgetsObj);
        let html = "<b>Totals by Region:</b><br>";
        Object.entries(metrics).forEach(([region, m]) => {
          html += `${region}: Plan ${m.plan}, Forecast ${m.forecast}, Actuals ${m.actuals}, Var Plan ${m.varPlan}, Var Actual ${m.varActual}<br>`;
        });
        document.getElementById("reportTotals").innerHTML = html;
      });
  });
}

// GITHUB SYNC PLACEHOLDER
function initGithubSync() {
  document.getElementById("githubSync").innerHTML = `
    <form id="githubSyncForm" onsubmit="return false;">
      <p>Configure your GitHub repo and branch for JSON sync. (Coming soon!)</p>
      <label>Repo: <input type="text" id="repoName" placeholder="user/repo" autocomplete="off"></label><br>
      <label>Branch: <input type="text" id="branchName" placeholder="main" autocomplete="off"></label><br>
      <label>PAT: <input type="password" id="pat" placeholder="Personal Access Token" autocomplete="current-password"></label><br>
      <button id="syncBtn">Sync Now</button>
      <button id="zipExportBtn">Export ZIP</button>
    </form>
  `;
}

// Country options by region (partial mapping)
const countryOptionsByRegion = {
  "ASEAN": [
    "Brunei Darussalam",
    "Cambodia",
    "Indonesia",
    "Lao People's Democratic Republic",
    "Malaysia",
    "Myanmar",
    "Philippines",
    "Singapore",
    "Thailand",
    "Vietnam"
  ],
  "ANZ": [
    "Australia",
    "New Zealand"
  ],
  "GCR": [
    "China",
    "Hong Kong",
    "Taiwan"
  ],
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
    "Taiwan"
  ],
  "North APAC": [
    "Japan",
    "South Korea"
  ],
  "SAARC": [
    "Afghanistan",
    "Bangladesh",
    "Bhutan",
    "India",
    "Maldives",
    "Nepal",
    "Pakistan",
    "Sri Lanka"
  ],
  // ...other regions to be filled in as provided...
};

// Ensure all country dropdowns have at least an empty option if no region is selected
Object.keys(countryOptionsByRegion).forEach(region => {
  if (!Array.isArray(countryOptionsByRegion[region]) || countryOptionsByRegion[region].length === 0) {
    countryOptionsByRegion[region] = [""];
  }
});

// Utility: Get all unique countries from all regions
function getAllCountries() {
  const all = [];
  Object.values(countryOptionsByRegion).forEach(arr => {
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
        } else {
          alert("Failed to save: " + (result.error || "Unknown error"));
        }
      })
      .catch((err) => {
        alert("Failed to save: " + err.message);
      });
  };
}

function setupExecutionSave(table, rows) {
  let btn = document.getElementById("saveExecutionRows");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "saveExecutionRows";
    btn.textContent = "Save";
    btn.style.margin = "12px 0";
    document
      .getElementById("view-execution")
      .insertBefore(btn, document.getElementById("executionGrid"));
  } else {
    btn.textContent = "Save";
  }
  btn.onclick = () => {
    // Save all execution data to planning.json via backend API (same as planning)
    const data = table.getData();
    fetch("http://localhost:3000/save-planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: data }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          alert("Execution data saved to backend!");
        } else {
          alert("Failed to save: " + (result.error || "Unknown error"));
        }
      })
      .catch((err) => {
        alert("Failed to save: " + err.message);
      });
  };
}

function setupBudgetsSave(table) {
  let btn = document.getElementById("saveBudgetDashboard");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "saveBudgetDashboard";
    btn.textContent = "Save Budget Dashboard";
    btn.style.margin = "12px 0";
    document
      .getElementById("view-budgets")
      .appendChild(btn);
  }
  btn.onclick = () => {
    // Save all budgets data to budgets.json
    const data = table.getData();
    // Convert array back to object by region
    const obj = {};
    data.forEach((row) => {
      obj[row.region] = {
        assignedBudget: row.assignedBudget,
        notes: row.notes,
        utilisation: row.utilisation,
      };
    });
    downloadJSON(obj, "data/budgets.json");
    alert("Budgets data downloaded as budgets.json. Commit this file in GitHub.");
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

function setupReportExport(table) {
  // Add an Export CSV button to the Report view
  let btn = document.getElementById("exportReportCSV");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "exportReportCSV";
    btn.textContent = "Export to CSV";
    btn.style.margin = "12px 0";
    document
      .getElementById("view-report")
      .insertBefore(btn, document.getElementById("reportGrid"));
  }
  btn.onclick = () => {
    table.download("csv", "report.csv");
  };
}

// --- LIVE SYNC LOGIC ---
function syncGridsOnEdit(sourceTable, targetTable) {
  sourceTable.on("cellEdited", function(cell) {
    const rowData = cell.getRow().getData();
    // Find the matching row in the target table by unique id (use 'id' or 'campaignName' as fallback)
    let match;
    if (rowData.id) {
      match = targetTable.getRows().find(r => r.getData().id === rowData.id);
    } else {
      match = targetTable.getRows().find(r => r.getData().campaignName === rowData.campaignName);
    }
    if (match) {
      match.update({ ...rowData });
    }
  });
}

// run once the page loads
if (location.hash === "#grid" || location.hash === "") loadProgrammes();

// Ensure grid and button handlers are set up every time user navigates to Programme Grid
window.addEventListener("hashchange", () => {
  if (location.hash === "#grid") loadProgrammes();
});

// Show the section whose ID matches the current hash
function route() {
  const hash = location.hash || "#planning";
  document.querySelectorAll("section").forEach((sec) => {
    const name = "#" + sec.id.replace("view-", "");
    // Show both Budgets Dashboard and Annual Budget Plan for Budgets tab
    if (
      hash === "#budgets" &&
      (sec.id === "view-budgets" || sec.id === "view-budget-setup")
    ) {
      sec.style.display = "block";
    } else if (name === hash) {
      sec.style.display = "block";
      // If showing planning, force redraw
      if (name === "#planning" && planningTableInstance) {
        setTimeout(() => {
          planningTableInstance.redraw(true);
          planningTableInstance.setData(planningTableInstance.getData());
          console.log("Forced redraw of planning grid");
        }, 0);
      }
    } else {
      sec.style.display = "none";
    }
  });
}

window.addEventListener("hashchange", route);
route(); // Initial call
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
    [rows, budgetsObj] = await Promise.all([
      loadPlanning(),
      loadBudgets(),
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
  const planningTable = initPlanningGrid(rows);
  const executionTable = initExecutionGrid(rows);
  const budgetsTable = initBudgetsTable(budgets, rows); // pass rows to budgets table
  initReportGrid(rows);
  initGithubSync();
  setupPlanningSave(planningTable, rows);
  setupBudgetsSave(budgetsTable);
  setupExecutionSave(executionTable, rows);
  setupReportExport(document.getElementById("reportGrid"));
  setupPlanningDownload(planningTable);

  // Add handler for '+ Add Region' button in Annual Budget Plan
  const addRegionBtn = document.getElementById("addRegionRow");
  if (addRegionBtn) {
    addRegionBtn.onclick = () => {
      const tbody = document.querySelector("#planTable tbody");
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td><input type="text" placeholder="Region name" /></td>
        <td><input type="number" value="" /></td>
      `;
      tbody.appendChild(newRow);
    };
  }

  // Populate Annual Budget Plan table from budgets.json
  try {
    const planTableBody = document.querySelector("#planTable tbody");
    if (planTableBody && budgets.length > 0) {
      planTableBody.innerHTML = "";
      budgets.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" value="${row.region}" /></td>
          <td><input type="number" value="${row.assignedBudget ?? 0}" /></td>
        `;
        planTableBody.appendChild(tr);
      });
    }
  } catch (e) {
    // fallback: do nothing if error
  }

  // Ensure hash is set to a valid tab on load (after all sections are initialized)
  const validTabs = [
    "#planning",
    "#execution",
    "#budgets",
    "#report",
    "#github-sync",
    "#budget-setup",
  ];
  if (!validTabs.includes(location.hash)) {
    location.hash = "#planning";
  }
  // Always call route() after everything is ready
  setTimeout(route, 0);

  // After both tables are initialized:
  syncGridsOnEdit(planningTable, executionTable);
  syncGridsOnEdit(executionTable, planningTable);
});

// CSV Import functionality
document.getElementById('importCSVBtn').addEventListener('click', () => {
  document.getElementById('csvFileInput').click();
});

document.getElementById('csvFileInput').addEventListener('change', function (e) {
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
    // Optionally: map CSV headers to your table fields here if needed
    // Before adding, update calculated fields for each row
    rows.forEach(row => {
      // Special logic for In-Account Events (1:1): no leads, pipeline = 20x forecasted cost
      if (row.programType === "In-Account Events (1:1)") {
        row.expectedLeads = 0;
        row.mqlForecast = 0;
        row.sqlForecast = 0;
        row.oppsForecast = 0;
        row.pipelineForecast = row.forecastedCost ? Number(row.forecastedCost) * 20 : 0;
      } else if (typeof row.expectedLeads === "number" || (!isNaN(row.expectedLeads) && row.expectedLeads !== undefined && row.expectedLeads !== "")) {
        const kpiVals = kpis(Number(row.expectedLeads));
        row.mqlForecast = kpiVals.mql;
        row.sqlForecast = kpiVals.sql;
        row.oppsForecast = kpiVals.opps;
        row.pipelineForecast = kpiVals.pipeline;
      }
    });
    if (planningTableInstance) {
      planningTableInstance.addData(rows);
    }
  };
  reader.readAsText(file);
});

// Simple CSV to object parser (fallback)
function csvToObj(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]);
    return obj;
  });
}

// Add region, status, and PO Raised filter buttons below the execution tracking title
const execRegionFilterDiv = document.createElement('div');
execRegionFilterDiv.id = 'execRegionFilterDiv';
execRegionFilterDiv.style.margin = '0 0 16px 0';
execRegionFilterDiv.style.display = 'flex';
execRegionFilterDiv.style.gap = '18px';
execRegionFilterDiv.innerHTML = `
  <label for="execRegionFilter" style="font-weight:500;margin-right:8px;">Filter by Region:</label>
  <select id="execRegionFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
    <option value="">(All Regions)</option>
    ${regionOptions.map(r => `<option value="${r}">${r}</option>`).join('')}
  </select>
  <label for="execStatusFilter" style="font-weight:500;margin-left:18px;margin-right:8px;">Status:</label>
  <select id="execStatusFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
    <option value="">(All Statuses)</option>
    ${statusOptions.map(s => `<option value="${s}">${s}</option>`).join('')}
  </select>
  <label for="execPOFilter" style="font-weight:500;margin-left:18px;margin-right:8px;">PO Raised:</label>
  <select id="execPOFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
    <option value="">(All)</option>
    ${yesNo.map(v => `<option value="${v}">${v}</option>`).join('')}
  </select>
`;
const execGridSection = document.getElementById('view-execution');
if (execGridSection) {
  const h2 = execGridSection.querySelector('h2');
  if (h2 && execGridSection.contains(h2)) {
    h2.insertAdjacentElement('afterend', execRegionFilterDiv);
  } else {
    execGridSection.insertBefore(execRegionFilterDiv, execGridSection.firstChild);
  }
}

// Add filter logic for execution grid
function updateExecFilters() {
  const regionVal = document.getElementById('execRegionFilter').value;
  const statusVal = document.getElementById('execStatusFilter').value;
  const poVal = document.getElementById('execPOFilter').value;
  if (window.executionTableInstance) {
    window.executionTableInstance.setFilter([
      regionVal ? { field: 'region', type: '=', value: regionVal } : null,
      statusVal ? { field: 'status', type: '=', value: statusVal } : null,
      poVal ? { field: 'poRaised', type: '=', value: poVal } : null,
    ].filter(Boolean));
  }
}
['execRegionFilter', 'execStatusFilter', 'execPOFilter'].forEach(id => {
  document.getElementById(id).addEventListener('change', updateExecFilters);
});

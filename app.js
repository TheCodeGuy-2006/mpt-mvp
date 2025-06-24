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
const quarterOptions = ["Q1", "Q2", "Q3", "Q4"];
const monthOptions = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const regionOptions = ["ANZ", "SAARC", "EMEA", "Americas"];
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
      {
        title: "Program Type",
        field: "programType",
        editor: "list",
        editorParams: { values: programTypes },
      },
      {
        title: "Strategic Pillar",
        field: "strategicPillars",
        editor: "list",
        editorParams: { values: strategicPillars },
      },
      {
        title: "Name",
        field: "owner",
        editor: "list",
        editorParams: { values: names },
      },
      {
        title: "Quarter",
        field: "quarter",
        editor: "list",
        editorParams: { values: quarterOptions },
      },
      {
        title: "Region",
        field: "region",
        editor: "list",
        editorParams: { values: regionOptions },
      },
      { title: "Forecasted Cost", field: "forecastedCost", editor: "number" },
      {
        title: "Expected Leads",
        field: "expectedLeads",
        editor: "number",
        cellEdited: (cell) => {
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
      { title: "MQL", field: "mqlForecast", editable: false },
      { title: "SQL", field: "sqlForecast", editable: false },
      { title: "Opps", field: "oppsForecast", editable: false },
      { title: "Pipeline", field: "pipelineForecast", editable: false },
      {
        title: "Status",
        field: "status",
        editor: "list",
        editorParams: { values: statusOptions },
      },
      {
        title: "PO raised",
        field: "poRaised",
        editor: "list",
        editorParams: { values: yesNo },
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
    delBtn.onclick = () => {
      console.log("Delete Planning Row button clicked");
      planningTableInstance.getSelectedRows().forEach((r) => r.delete());
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
      { title: "Campaign Type", field: "campaignType" },
      { title: "Region", field: "region" },
      { title: "Forecasted Cost", field: "forecastedCost" },
      {
        title: "Actual Cost",
        field: "actualCost",
        editor: "number",
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
      { title: "Pipeline", field: "pipelineForecast", editable: false },
      {
        title: "Status",
        field: "status",
        editor: "list",
        editorParams: { values: statusOptions },
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
      {
        title: "PO Raised",
        field: "poRaised",
        editor: "list",
        editorParams: { values: yesNo },
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
    ],
  });
  setupExecutionSave(table, rows);
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
    btn.textContent = "Save Changes";
    btn.style.margin = "12px 0";
    document
      .getElementById("view-execution")
      .insertBefore(btn, document.getElementById("executionGrid"));
  }
  btn.onclick = () => {
    // Save all execution data to planning.json (same as planning)
    const data = table.getData();
    downloadJSON(data, "data/planning.json");
    alert("Execution data downloaded as planning.json. Commit this file in GitHub.");
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
});

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
  "North APAC",
  "South APAC",
  "SAARC",
  "Digital Motions",
  "X APAC Non English",
  "X APAC English",
  "ANZ",
  "ASEAN",
  "GCR",
];
const statusOptions = ["Planning", "On Track", "Shipped", "Cancelled"];
const yesNo = ["Yes", "No"];

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
      {
        title: "Campaign Name",
        field: "campaignName",
        editor: false,
        width: 160,
      },
      {
        title: "Details",
        field: "details",
        width: 240,
        editable: false,
        formatter: function (cell) {
          const data = cell.getRow().getData();
          const region = data.region || "";
          const owner = data.owner || "";
          const description = data.description || "";
          const programType = data.programType || "";
          
          // Create multi-line informative format
          let html = '<div style="padding: 4px; line-height: 1.3; font-size: 12px;">';
          
          if (region) {
            html += `<div style="font-weight: bold; color: #1976d2;">${region}</div>`;
          }
          
          if (owner) {
            html += `<div style="color: #666; margin-top: 2px;">${owner}</div>`;
          }
          
          if (programType) {
            html += `<div style="color: #888; font-size: 11px; margin-top: 2px;">${programType}</div>`;
          }
          
          if (description) {
            html += `<div style="color: #333; margin-top: 2px; word-wrap: break-word;">${description}</div>`;
          }
          
          html += '</div>';
          return html;
        },
      },
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
      {
        title: "Forecasted Cost",
        field: "forecastedCost",
        editor: false,
        formatter: function (cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        },
      },
      {
        title: "Actual Cost",
        field: "actualCost",
        editor: "number",
        formatter: function (cell) {
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
      {
        title: "Pipeline",
        field: "pipelineForecast",
        editable: false,
        formatter: function (cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        },
      },
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
      (b) => (budgetsObj[b.region] = { assignedBudget: b.assignedBudget }),
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
    document.getElementById("view-budgets").appendChild(btn);
  }
  btn.onclick = () => {
    // Save all budgets data to budgets.json via backend
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
    fetch("http://localhost:3000/save-budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: obj }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          alert("Budgets data saved to backend!");
        } else {
          alert("Failed to save: " + (result.error || "Unknown error"));
        }
      })
      .catch((err) => {
        alert("Failed to save: " + err.message);
      });
  };
}

// Patch: Update annual budget plan save logic to POST to /save-budgets for backend integration. Also ensure budgets dashboard and execution/planning grids use backend save endpoints.
function setupAnnualBudgetSave() {
  const saveBtn = document.getElementById("saveAnnualBudget");
  if (!saveBtn) return;
  saveBtn.onclick = () => {
    const planTableBody = document.querySelector("#planTable tbody");
    if (!planTableBody) return;
    const rows = Array.from(planTableBody.querySelectorAll("tr"));
    const budgets = rows
      .map((tr) => {
        const tds = tr.querySelectorAll("td");
        const region = tds[0]?.querySelector("input")?.value?.trim() || "";
        let assignedBudgetRaw = tds[1]?.querySelector("input")?.value || "0";
        // Remove $ and commas for parsing
        assignedBudgetRaw = assignedBudgetRaw.replace(/[^\d.]/g, "");
        const assignedBudget = Number(assignedBudgetRaw) || 0;
        return region ? { region, assignedBudget } : null;
      })
      .filter(Boolean);
    if (window.budgetsTableInstance) {
      window.budgetsTableInstance.replaceData(budgets);
      // Also save to backend
      const data = window.budgetsTableInstance.getData();
      const obj = {};
      data.forEach((row) => {
        obj[row.region] = {
          assignedBudget: row.assignedBudget,
          notes: row.notes,
          utilisation: row.utilisation,
        };
      });
      fetch("http://localhost:3000/save-budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: obj }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            alert("Budgets data saved to backend!");
          } else {
            alert("Failed to save: " + (result.error || "Unknown error"));
          }
        })
        .catch((err) => {
          alert("Failed to save: " + err.message);
        });
    }
  };
}

// --- LIVE SYNC LOGIC ---
function syncGridsOnEdit(sourceTable, targetTable) {
  sourceTable.on("cellEdited", function (cell) {
    const rowData = cell.getRow().getData();
    // Find the matching row in the target table by unique id (use 'id' or 'campaignName' as fallback)
    let match;
    if (rowData.id) {
      match = targetTable.getRows().find((r) => r.getData().id === rowData.id);
    } else {
      match = targetTable
        .getRows()
        .find((r) => r.getData().campaignName === rowData.campaignName);
    }
    if (match) {
      match.update({ ...rowData });
    }
  });
}

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
  const allSections = Array.from(document.querySelectorAll("section")).map(sec => sec.id);
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
        window.budgetsTableInstance.setData(window.budgetsTableInstance.getData());
        console.log("[route] Redrew budgets table");
      }, 0);
    }
  } else {
    // Show only the section matching the tab
    const section = document.querySelector(`section#view-${hash.replace('#','')}`);
    console.log(`[route] hash:`, hash, 'section:', section);
    if (section) section.style.display = "block";
    if (hash === "#planning" && window.planningTableInstance) {
      setTimeout(() => {
        window.planningTableInstance.redraw(true);
        window.planningTableInstance.setData(window.planningTableInstance.getData());
        console.log("[route] Redrew planning grid");
      }, 0);
    }
    if (hash === "#execution" && window.executionTableInstance) {
      setTimeout(() => {
        window.executionTableInstance.redraw(true);
        window.executionTableInstance.setData(window.executionTableInstance.getData());
        console.log("[route] Redrew execution grid");
      }, 0);
    }
    if (hash === "#roi" && typeof updateRoiTotalSpend === "function") {
      setTimeout(updateRoiTotalSpend, 0);
      console.log("[route] Updated ROI total spend");
    }
    if (hash === "#report" && window.reportTableInstance) {
      setTimeout(() => {
        window.reportTableInstance.redraw(true);
        window.reportTableInstance.setData(window.reportTableInstance.getData());
        console.log("[route] Redrew report grid");
      }, 0);
    }
    if (hash === "#report" && typeof updateReportTotalSpend === "function") {
      setTimeout(updateReportTotalSpend, 0);
      console.log("[route] Updated report total spend");
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
    [rows, budgetsObj] = await Promise.all([loadPlanning(), loadBudgets()]);
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
  window.pl
  const executionTable = initExecutionGrid(rows);
  window.executionTableInstance = executionTable;
  const budgetsTable = initBudgetsTable(budgets, rows); // pass rows to budgets table
  window.budgetsTableInstance = budgetsTable;
  initReportGrid(rows);
  initGithubSync();
  setupPlanningSave(planningTable, rows);
  setupBudgetsSave(budgetsTable);
  setupExecutionSave(executionTable, rows);
  setupPlanningDownload(planningTable);

  // Initialize reporting total spend
  updateReportTotalSpend();

  // Add handler for '+ Add Region' button in Annual Budget Plan
  const addRegionBtn = document.getElementById("addRegionRow");
  if (addRegionBtn) {
    addRegionBtn.onclick = () => {
      const tbody = document.querySelector("#planTable tbody");
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td><input type="text" placeholder="Region name" /></td>
        <td><input type="number" value="" /></td>
        <td><button class="plan-delete-btn" title="Delete"><span style="font-size:1.2em;color:#b71c1c;">🗑️</span></button></td>
      `;
      newRow.querySelector(".plan-delete-btn").onclick = function () {
        newRow.remove();
      };
      tbody.appendChild(newRow);
      const input = newRow.querySelector('input[type="number"]');
      if (input) {
        input.type = 'text';
        input.classList.add('plan-usd-input');
        input.addEventListener('blur', function() {
          let val = input.value.replace(/[^\d.]/g, '');
          val = val ? Number(val) : 0;
          input.value = `$${val.toLocaleString()}`;
        });
        input.addEventListener('focus', function() {
          let val = input.value.replace(/[^\d.]/g, '');
          input.value = val;
        });
      }
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
          <td><input type="text" class="plan-usd-input" value="$${Number(row.assignedBudget ?? 0).toLocaleString()}" /></td>
          <td><button class="plan-delete-btn" title="Delete"><span style="font-size:1.2em;color:#b71c1c;">🗑️</span></button></td>
        `;
        // Add delete handler
        tr.querySelector(".plan-delete-btn").onclick = function () {
          tr.remove();
        };
        // Format input on blur/change
        const input = tr.querySelector('.plan-usd-input');
        input.addEventListener('blur', function() {
          let val = input.value.replace(/[^\d.]/g, '');
          val = val ? Number(val) : 0;
          input.value = `$${val.toLocaleString()}`;
        });
        input.addEventListener('focus', function() {
          // Remove formatting for editing
          let val = input.value.replace(/[^\d.]/g, '');
          input.value = val;
        });
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
  syncGridsOnEdit(planningTable, executionTable);
  syncGridsOnEdit(executionTable, planningTable);
});

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
      // Optionally: map CSV headers to your table fields here if needed
      // Before adding, update calculated fields for each row
      rows.forEach((row) => {
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
        planningTableInstance.addData(rows);
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
    const values = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i]));
    return obj;
  });
}

// Add region, status, and PO Raised filter buttons below the execution tracking title
const execRegionFilterDiv = document.createElement("div");
execRegionFilterDiv.id = "execRegionFilterDiv";
execRegionFilterDiv.style.margin = "0 0 16px 0";
execRegionFilterDiv.style.display = "flex";
execRegionFilterDiv.style.gap = "18px";
execRegionFilterDiv.innerHTML = `
  <label for="execRegionFilter" style="font-weight:500;margin-right:8px;">Filter by Region:</label>
  <select id="execRegionFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
    <option value="">(All Regions)</option>
    ${regionOptions.map((r) => `<option value="${r}">${r}</option>`).join("")}
  </select>
  <label for="execStatusFilter" style="font-weight:500;margin-left:18px;margin-right:8px;">Status:</label>
  <select id="execStatusFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
    <option value="">(All Statuses)</option>
    ${statusOptions.map((s) => `<option value="${s}">${s}</option>`).join("")}
  </select>
  <label for="execPOFilter" style="font-weight:500;margin-left:18px;margin-right:8px;">PO Raised:</label>
  <select id="execPOFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
    <option value="">(All)</option>
    ${yesNo.map((v) => `<option value="${v}">${v}</option>`).join("")}
  </select>
`;
const execGridSection = document.getElementById("view-execution");
if (execGridSection) {
  const h2 = execGridSection.querySelector("h2");
  if (h2 && execGridSection.contains(h2)) {
    h2.insertAdjacentElement("afterend", execRegionFilterDiv);
  } else {
    execGridSection.insertBefore(
      execRegionFilterDiv,
      execGridSection.firstChild,
    );
  }
}

// Add filter logic for execution grid
function updateExecFilters() {
  const regionVal = document.getElementById("execRegionFilter").value;
  const statusVal = document.getElementById("execStatusFilter").value;
  const poVal = document.getElementById("execPOFilter").value;
  if (window.executionTableInstance) {
    window.executionTableInstance.setFilter(
      [
        regionVal ? { field: "region", type: "=", value: regionVal } : null,
        statusVal ? { field: "status", type: "=", value: statusVal } : null,
        poVal ? { field: "poRaised", type: "=", value: poVal } : null,
      ].filter(Boolean),
    );
  }
}
["execRegionFilter", "execStatusFilter", "execPOFilter"].forEach((id) => {
  document.getElementById(id).addEventListener("change", updateExecFilters);
});

// Add Chart.js for bar graph rendering
if (!window.Chart) {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js";
  script.onload = renderBudgetsBarChart;
  document.head.appendChild(script);
} else {
  renderBudgetsBarChart();
}

function renderBudgetsBarChart() {
  const ctx = document.getElementById("budgetsBarChart");
  if (!ctx) return;
  // Get budgets data from the table or from the budgets object
  let budgetsData = [];
  if (window.budgetsTableInstance) {
    budgetsData = window.budgetsTableInstance.getData();
  } else if (window.budgetsObj) {
    budgetsData = Object.entries(window.budgetsObj).map(([region, data]) => ({
      region,
      ...data,
    }));
  }
  if (!budgetsData || budgetsData.length === 0) return;
  // Prepare data for chart
  const labels = budgetsData.map((row) => row.region || row.Region || "");
  const values = budgetsData.map((row) =>
    Number(row.assignedBudget || row.AssignedBudget || 0),
  );
  // Destroy previous chart if exists
  if (window.budgetsBarChartInstance) {
    window.budgetsBarChartInstance.destroy();
  }
  window.budgetsBarChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Assigned Budget (USD)",
          data: values,
          backgroundColor: "#1976d2",
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 600000,
          title: { display: true, text: "Dollars (USD)" },
          ticks: { callback: (v) => "$" + v.toLocaleString() },
        },
        x: {
          title: { display: false },
        },
      },
    },
  });
}
// After budgets table is initialized, render the chart
const origInitBudgetsTable = initBudgetsTable;
initBudgetsTable = function (budgets, rows) {
  const table = origInitBudgetsTable(budgets, rows);
  window.budgetsTableInstance = table;
  setTimeout(renderBudgetsBarChart, 200);
  table.on("dataChanged", renderBudgetsBarChart);
  return table;
};

// Render region charts for budgets
function renderBudgetsRegionCharts() {
  const container = document.getElementById("budgetsChartsContainer");
  if (!container) return;
  container.innerHTML = "";
  // Get budgets data
  let budgetsData = [];
  if (window.budgetsTableInstance) {
    budgetsData = window.budgetsTableInstance.getData();
  } else if (window.budgetsObj) {
    budgetsData = Object.entries(window.budgetsObj).map(([region, data]) => ({
      region,
      ...data,
    }));
  }
  // Get planning data (for forecasted/actual cost)
  let planningRows = [];
  if (window.planningTableInstance) {
    planningRows = window.planningTableInstance.getData();
  } else if (window.planningRows) {
    planningRows = window.planningRows;
  }
  // Get all unique regions from budgets and planning
  const allRegions = Array.from(
    new Set([
      ...budgetsData.map((b) => b.region),
      ...planningRows.map((r) => r.region),
    ]),
  ).filter(Boolean);
  // For each region, create a chart
  let rowDiv = null;
  allRegions.forEach((region, idx) => {
    if (idx % 4 === 0) {
      rowDiv = document.createElement('div');
      rowDiv.className = 'budgets-graph-row';
      rowDiv.style.display = 'flex';
      rowDiv.style.flexDirection = 'row';
      rowDiv.style.gap = '24px';
      rowDiv.style.marginBottom = '24px';
      container.appendChild(rowDiv);
    }
    // Assigned budget
    const budgetObj = budgetsData.find((b) => b.region === region);
    const assignedBudget =
      budgetObj && budgetObj.assignedBudget
        ? Number(budgetObj.assignedBudget)
        : 0;
    // Forecasted cost: sum of forecastedCost for this region
    const regionForecasts = planningRows.filter(
      (r) => r.region === region && typeof r.forecastedCost === "number",
    );
    const forecastedCost = regionForecasts.reduce(
      (sum, r) => sum + r.forecastedCost,
      0,
    );
    // Actual cost: sum of actualCost for this region
    const actualCost = planningRows
      .filter((r) => r.region === region && typeof r.actualCost === "number")
      .reduce((sum, r) => sum + r.actualCost, 0);
    // Prepare forecasted cost breakdown
    let forecastBreakdown = "";
    if (regionForecasts.length > 1) {
      forecastBreakdown =
        '<div style="font-size:0.98em;margin-top:8px;text-align:left;">';
      forecastBreakdown += "<b>Forecasted Cost Breakdown:</b><br>";
      regionForecasts.forEach((r) => {
        forecastBreakdown += `${r.campaignName ? r.campaignName : "(Unnamed)"}: $${Number(r.forecastedCost).toLocaleString()}<br>`;
      });
      forecastBreakdown += "</div>";
    }
    // Create chart canvas and fullscreen button
    const chartDiv = document.createElement("div");
    chartDiv.style.width = "300px";
    chartDiv.style.height = "auto";
    chartDiv.style.background = "#fff";
    chartDiv.style.borderRadius = "12px";
    chartDiv.style.boxShadow = "0 2px 12px rgba(25,118,210,0.08)";
    chartDiv.style.padding = "18px 12px 8px 12px";
    chartDiv.style.display = "flex";
    chartDiv.style.flexDirection = "column";
    chartDiv.style.alignItems = "center";
    chartDiv.style.position = "relative";
    // Title and canvas
    chartDiv.innerHTML = `<h3 style="font-size:1.18rem;margin:0 0 12px 0;color:#1976d2;">${region}</h3><canvas id="chart-${region}"></canvas>${forecastBreakdown}`;
    // Fullscreen button
    const fullscreenBtn = document.createElement("button");
    fullscreenBtn.className = "graph-fullscreen-btn";
    fullscreenBtn.title = "Expand graph";
    fullscreenBtn.innerHTML = "⛶";
    fullscreenBtn.style.position = "absolute";
    fullscreenBtn.style.top = "6px";
    fullscreenBtn.style.right = "8px";
    fullscreenBtn.style.fontSize = "1.1em";
    fullscreenBtn.style.background = "none";
    fullscreenBtn.style.border = "none";
    fullscreenBtn.style.cursor = "pointer";
    fullscreenBtn.style.opacity = "0.7";
    fullscreenBtn.style.padding = "2px 6px";
    fullscreenBtn.style.zIndex = "2";
    chartDiv.appendChild(fullscreenBtn);
    rowDiv.appendChild(chartDiv);
    // Render chart in normal box
    setTimeout(() => {
      const ctx = chartDiv.querySelector("canvas");
      if (!ctx) return;
      if (ctx.chartInstance) ctx.chartInstance.destroy();
      ctx.chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Assigned", "Forecasted", "Actual"],
          datasets: [
            {
              label: "USD",
              data: [assignedBudget, forecastedCost, actualCost],
              backgroundColor: ["#1976d2", "#42a5f5", "#66bb6a"],
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 600000,
              title: { display: true, text: "Dollars (USD)" },
              ticks: { callback: (v) => "$" + v.toLocaleString() },
            },
            x: {
              title: { display: false },
            },
          },
        },
      });
    }, 0);
    // Fullscreen overlay logic (toggle)
    fullscreenBtn.onclick = function () {
      let overlay = document.getElementById("graphFullscreenOverlay");
      if (overlay) {
        overlay.remove();
        return;
      }
      overlay = document.createElement("div");
      overlay.id = "graphFullscreenOverlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.background = "rgba(20,30,60,0.92)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "9999";
      overlay.onclick = function (e) {
        if (e.target === overlay) overlay.remove();
      };
      document.body.appendChild(overlay);
      // Chart container for fullscreen
      const fsDiv = document.createElement("div");
      fsDiv.style.background = "#fff";
      fsDiv.style.borderRadius = "16px";
      fsDiv.style.boxShadow = "0 4px 32px rgba(25,118,210,0.18)";
      fsDiv.style.padding = "32px 32px 18px 32px";
      fsDiv.style.display = "flex";
      fsDiv.style.flexDirection = "column";
      fsDiv.style.alignItems = "center";
      fsDiv.style.position = "relative";
      fsDiv.style.width = "75vw";
      fsDiv.style.height = "75vh";
      // Close button (same as fullscreen button)
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕";
      closeBtn.title = "Close";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "10px";
      closeBtn.style.right = "16px";
      closeBtn.style.fontSize = "1.3em";
      closeBtn.style.background = "none";
      closeBtn.style.border = "none";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.opacity = "0.7";
      closeBtn.onclick = () => overlay.remove();
      fsDiv.appendChild(closeBtn);
      // Title
      const title = document.createElement("h2");
      title.textContent = region;
      title.style.color = "#1976d2";
      title.style.margin = "0 0 18px 0";
      fsDiv.appendChild(title);
      // Canvas
      const fsCanvas = document.createElement("canvas");
      fsCanvas.width = Math.floor(window.innerWidth * 0.7);
      fsCanvas.height = Math.floor(window.innerHeight * 0.6);
      fsDiv.appendChild(fsCanvas);
      overlay.appendChild(fsDiv);
      // Render chart in fullscreen
      setTimeout(() => {
        new Chart(fsCanvas, {
          type: "bar",
          data: {
            labels: ["Assigned", "Forecasted", "Actual"],
            datasets: [
              {
                label: "USD",
                data: [assignedBudget, forecastedCost, actualCost],
                backgroundColor: ["#1976d2", "#42a5f5", "#66bb6a"],
                borderRadius: 8,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: false,
            plugins: {
              legend: { display: false },
              title: { display: false },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 600000,
                title: { display: true, text: "Dollars (USD)" },
                ticks: { callback: (v) => "$" + v.toLocaleString() },
              },
              x: {
                title: { display: false },
              },
            },
          },
        });
      }, 0);
    };
  });
}
// After budgets table is initialized, render the region charts
const origInitBudgetsTable2 = initBudgetsTable;
initBudgetsTable = function (budgets, rows) {
  const table = origInitBudgetsTable2(budgets, rows);
  window.budgetsTableInstance = table;
  setTimeout(renderBudgetsRegionCharts, 200);
  table.on("dataChanged", renderBudgetsRegionCharts);
  return table;
};
// Also render on planning table data change
const origInitPlanningGrid2 = initPlanningGrid;
initPlanningGrid = function (rows) {
  const table = origInitPlanningGrid2(rows);
  window.planningTableInstance = table;
  window.planningRows = rows;
  table.on("dataChanged", renderBudgetsRegionCharts);
  setTimeout(renderBudgetsRegionCharts, 200);
  return table;
};

// Sync Annual Budget Plan edits to budgets table and charts
const saveAnnualBudgetBtn = document.getElementById("saveAnnualBudget");
if (saveAnnualBudgetBtn) {
  saveAnnualBudgetBtn.addEventListener("click", () => {
    const planTableBody = document.querySelector("#planTable tbody");
    if (!planTableBody) return;
    const rows = Array.from(planTableBody.querySelectorAll("tr"));
    const budgets = rows
      .map((tr) => {
        const tds = tr.querySelectorAll("td");
        const region = tds[0]?.querySelector("input")?.value?.trim() || "";
        let assignedBudgetRaw = tds[1]?.querySelector("input")?.value || "0";
        // Remove $ and commas for parsing
        assignedBudgetRaw = assignedBudgetRaw.replace(/[^\d.]/g, "");
        const assignedBudget = Number(assignedBudgetRaw) || 0;
        return region ? { region, assignedBudget } : null;
      })
      .filter(Boolean);
    if (window.budgetsTableInstance) {
      window.budgetsTableInstance.replaceData(budgets);
      // Also save to backend
      const data = window.budgetsTableInstance.getData();
      const obj = {};
      data.forEach((row) => {
        obj[row.region] = {
          assignedBudget: row.assignedBudget,
          notes: row.notes,
          utilisation: row.utilisation,
        };
      });
      fetch("http://localhost:3000/save-budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: obj }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            alert("Budgets data saved to backend!");
          } else {
            alert("Failed to save: " + (result.error || "Unknown error"));
          }
        })
        .catch((err) => {
          alert("Failed to save: " + err.message);
        });
    }
  });
}

// ROI Total Spend and Pipeline Calculation
function updateRoiTotalSpend() {
  // Populate filter dropdowns if not already done
  populateRoiFilters();
  
  // Get filter values
  const regionFilter = document.getElementById("roiRegionFilter")?.value || "";
  const quarterFilter = document.getElementById("roiQuarterFilter")?.value || "";
  
  // Filter data based on selected filters
  let filteredData = [];
  if (window.executionTableInstance) {
    filteredData = window.executionTableInstance.getData().filter(row => {
      let matchesRegion = !regionFilter || row.region === regionFilter;
      let matchesQuarter = !quarterFilter || row.quarter === quarterFilter;
      return matchesRegion && matchesQuarter;
    });
  }

  let totalSpend = 0;
  let totalPipeline = 0;
  // Debug: log pipelineForecast values
  console.log('[ROI] Filtered data for pipeline calculation:', filteredData.map(r => r.pipelineForecast));
  totalSpend = filteredData.reduce((sum, row) => {
    let val = row.actualCost;
    if (typeof val === "string") val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  totalPipeline = filteredData.reduce((sum, row) => {
    let val = row.pipelineForecast;
    if (typeof val === "string") val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  // Debug: log total pipeline
  console.log('[ROI] Total pipeline calculated:', totalPipeline);
  
  const spendEl = document.getElementById("roiTotalSpendValue");
  if (spendEl) {
    spendEl.textContent = "$" + totalSpend.toLocaleString();
  }
  // Update pipeline value in existing span if present
  const pipelineValue = isNaN(totalPipeline) || totalPipeline === undefined ? 0 : totalPipeline;
  const pipelineEl = document.getElementById("roiTotalPipelineValue");
  if (pipelineEl) {
    pipelineEl.textContent = "$" + pipelineValue.toLocaleString();
  }
  // Update leads/conversions value in existing span if present
  let totalLeads = 0;
  totalLeads = filteredData.reduce((sum, row) => {
    let val = row.actualLeads;
    if (typeof val === "string") val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  
  const leadsEl = document.getElementById("roiTotalLeadsValue");
  if (leadsEl) {
    leadsEl.textContent = totalLeads.toLocaleString();
  }
  // Update ROI percentage value in existing span if present
  let roiPercent = 0;
  if (totalSpend > 0) {
    roiPercent = (totalPipeline / totalSpend) * 100;
  }
  const roiEl = document.getElementById("roiTotalRoiValue");
  if (roiEl) {
    roiEl.textContent = isNaN(roiPercent) ? "0%" : roiPercent.toFixed(1) + "%";
  }

  // Update Total MQL value
  let totalMql = 0;
  totalMql = filteredData.reduce((sum, row) => {
    let val = row.actualMQLs || row.mqlForecast; // Use actual MQLs if available, otherwise forecast
    if (typeof val === "string") val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  
  const mqlEl = document.getElementById("roiTotalMqlValue");
  if (mqlEl) {
    mqlEl.textContent = totalMql.toLocaleString();
  }

  // Update Total SQL value
  let totalSql = 0;
  totalSql = filteredData.reduce((sum, row) => {
    let val = row.actualSQLs || row.sqlForecast; // Use actual SQLs if available, otherwise forecast
    if (typeof val === "string") val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  
  const sqlEl = document.getElementById("roiTotalSqlValue");
  if (sqlEl) {
    sqlEl.textContent = totalSql.toLocaleString();
  }

  // Update Total Opportunities value
  let totalOpps = 0;
  totalOpps = filteredData.reduce((sum, row) => {
    let val = row.actualOpps || row.oppsForecast; // Use actual Opps if available, otherwise forecast
    if (typeof val === "string") val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  
  const oppsEl = document.getElementById("roiTotalOppsValue");
  if (oppsEl) {
    oppsEl.textContent = totalOpps.toLocaleString();
  }

  // --- Program Type Breakdown Table ---
  const programTypeTableId = "roiProgramTypeBreakdownTable";
  let table = document.getElementById(programTypeTableId);
  if (!table) {
    // Create table if not present
    table = document.createElement("table");
    table.id = programTypeTableId;
    table.style.margin = "24px 0 0 0";
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.innerHTML = `<thead><tr style='background:#e3f2fd;'>
      <th style='padding:6px 12px;border:1px solid #90caf9;'>Program Type</th>
      <th style='padding:6px 12px;border:1px solid #90caf9;'>Total Spend</th>
      <th style='padding:6px 12px;border:1px solid #90caf9;'>Total Pipeline</th>
      <th style='padding:6px 12px;border:1px solid #90caf9;'>Total Leads</th>
      <th style='padding:6px 12px;border:1px solid #90caf9;'>ROI %</th>
    </tr></thead><tbody></tbody>`;
    // Insert after region breakdown table if present, else at end of ROI tab
    const regionTable = document.getElementById("roiRegionBreakdownTable");
    if (regionTable && regionTable.parentNode) {
      regionTable.parentNode.insertBefore(table, regionTable.nextSibling);
    } else {
      const roiTab = document.getElementById("view-roi") || document.body;
      roiTab.appendChild(table);
    }
  }
  // Calculate breakdown by program type
  let programTypeMap = {};
  if (window.executionTableInstance) {
    const data = window.executionTableInstance.getData();
    data.forEach(row => {
      const pt = row.programType || "(None)";
      if (!programTypeMap[pt]) {
        programTypeMap[pt] = { spend: 0, pipeline: 0, leads: 0 };
      }
      let spend = row.actualCost;
      if (typeof spend === "string") spend = Number(spend.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(spend)) programTypeMap[pt].spend += Number(spend);
      let pipeline = row.pipelineForecast;
      if (typeof pipeline === "string") pipeline = Number(pipeline.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(pipeline)) programTypeMap[pt].pipeline += Number(pipeline);
      let leads = row.actualLeads;
      if (typeof leads === "string") leads = Number(leads.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(leads)) programTypeMap[pt].leads += Number(leads);
    });
  }
  // Render table body
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  Object.entries(programTypeMap).forEach(([pt, vals]) => {
    const roi = vals.spend > 0 ? (vals.pipeline / vals.spend) * 100 : 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style='padding:6px 12px;border:1px solid #bbdefb;'>${pt}</td>
      <td style='padding:6px 12px;border:1px solid #bbdefb;'>$${vals.spend.toLocaleString()}</td>
      <td style='padding:6px 12px;border:1px solid #bbdefb;'>$${vals.pipeline.toLocaleString()}</td>
      <td style='padding:6px 12px;border:1px solid #bbdefb;'>${vals.leads.toLocaleString()}</td>
      <td style='padding:6px 12px;border:1px solid #bbdefb;'>${isNaN(roi) ? "0%" : roi.toFixed(1) + "%"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ROI % by Region Bar Chart
function renderRoiByRegionChart() {
  // Prepare data
  let regionMap = {};
  if (window.executionTableInstance) {
    const data = window.executionTableInstance.getData();
    data.forEach(row => {
      const region = row.region || "(None)";
      if (!regionMap[region]) {
        regionMap[region] = { spend: 0, pipeline: 0 };
      }
      let spend = row.actualCost;
      if (typeof spend === "string") spend = Number(spend.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(spend)) regionMap[region].spend += Number(spend);
      let pipeline = row.pipelineForecast;
      if (typeof pipeline === "string") pipeline = Number(pipeline.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(pipeline)) regionMap[region].pipeline += Number(pipeline);
       });
  }
  const regions = Object.keys(regionMap);
  const roiPercents = regions.map(region => {
    const vals = regionMap[region];
    return vals.spend > 0 ? (vals.pipeline / vals.spend) * 100 : 0;
  });

  // Create or select chart container
  let chartDiv = document.getElementById("roiRegionChartDiv");
  if (!chartDiv) {
    chartDiv = document.createElement("div");
    chartDiv.id = "roiRegionChartDiv";
    chartDiv.style.margin = "32px 0 24px 0";
    chartDiv.style.background = "#fff";
    chartDiv.style.borderRadius = "12px";
    chartDiv.style.boxShadow = "0 2px 12px rgba(25,118,210,0.08)";
    chartDiv.style.padding = "18px 12px 8px 12px";
    chartDiv.style.maxWidth = "700px";
    chartDiv.style.display = "flex";
    chartDiv.style.flexDirection = "column";
    chartDiv.style.alignItems = "center";
    // Insert at top of ROI tab
    const roiTab = document.getElementById("view-roi") || document.body;
    roiTab.insertBefore(chartDiv, roiTab.firstChild);
  }
  chartDiv.innerHTML = `<h3 style='font-size:1.18rem;margin:0 0 12px 0;color:#1976d2;'>ROI % by Region</h3><canvas id='roiRegionChart' height='220'></canvas>`;
  const ctx = chartDiv.querySelector("#roiRegionChart");
  if (!ctx) return;
  // Destroy previous chart if exists
  if (window.roiRegionChartInstance) {
    window.roiRegionChartInstance.destroy();
  }
  window.roiRegionChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: regions,
      datasets: [
        {
          label: "ROI %",
          data: roiPercents,
          backgroundColor: "#42a5f5",
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.parsed.y.toFixed(1) + "%";
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
                   title: { display: true, text: "ROI %" },
          ticks: { callback: (v) => v + "%" },
        },
        x: {
          title: { display: false },
        },
      },
    },
  });
}

// ROI % by Program Type Bar Chart
function renderRoiByProgramTypeChart() {
  // Prepare data
  let ptMap = {};
  if (window.executionTableInstance) {
    const data = window.executionTableInstance.getData();
    data.forEach(row => {
      const pt = row.programType || "(None)";
      if (!ptMap[pt]) {
        ptMap[pt] = { spend: 0, pipeline: 0 };
      }
      let spend = row.actualCost;
      if (typeof spend === "string") spend = Number(spend.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(spend)) ptMap[pt].spend += Number(spend);
      let pipeline = row.pipelineForecast;
      if (typeof pipeline === "string") pipeline = Number(pipeline.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(pipeline)) ptMap[pt].pipeline += Number(pipeline);
    });
  }
  const pts = Object.keys(ptMap);
  const roiPercents = pts.map(pt => {
    const vals = ptMap[pt];
    return vals.spend > 0 ? (vals.pipeline / vals.spend) * 100 : 0;
  });

  // Create or select chart container
  let chartDiv = document.getElementById("roiProgramTypeChartDiv");
  if (!chartDiv) {
    chartDiv = document.createElement("div");
    chartDiv.id = "roiProgramTypeChartDiv";
    chartDiv.style.margin = "32px 0 24px 0";
    chartDiv.style.background = "#fff";
    chartDiv.style.borderRadius = "12px";
    chartDiv.style.boxShadow = "0 2px 12px rgba(25,118,210,0.08)";
    chartDiv.style.padding = "18px 12px 8px 12px";
    chartDiv.style.maxWidth = "900px";
    chartDiv.style.display = "flex";
    chartDiv.style.flexDirection = "column";
    chartDiv.style.alignItems = "center";
    // Insert after ROI region chart if present, else at top
    const regionChartDiv = document.getElementById("roiRegionChartDiv");
    const roiTab = document.getElementById("view-roi") || document.body;
    if (regionChartDiv && regionChartDiv.parentNode) {
      regionChartDiv.parentNode.insertBefore(chartDiv, regionChartDiv.nextSibling);
    } else {
      roiTab.insertBefore(chartDiv, roiTab.firstChild);
    }
  }
  chartDiv.innerHTML = `<h3 style='font-size:1.18rem;margin:0 0 12px 0;color:#1976d2;'>ROI % by Program Type</h3><canvas id='roiProgramTypeChart' height='220'></canvas>`;
  const ctx = chartDiv.querySelector("#roiProgramTypeChart");
  if (!ctx) return;
  // Destroy previous chart if exists
  if (window.roiProgramTypeChartInstance) {
    window.roiProgramTypeChartInstance.destroy();
  }
  window.roiProgramTypeChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: pts,
      datasets: [
        {
          label: "ROI %",
          data: roiPercents,
          backgroundColor: "#66bb6a",
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.parsed.y.toFixed(1) + "%";
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "ROI %" },
          ticks: { callback: (v) => v + "%" },
        },
        x: {
          title: { display: false },
        },
      },
    },
  });
}

// Update ROI region and program type charts on execution grid changes and tab switch
window.addEventListener("hashchange", () => {
  if (location.hash === "#roi") {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
  }
});
if (window.executionTableInstance) {
  window.executionTableInstance.on("dataChanged", () => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
  });
  window.executionTableInstance.on("cellEdited", () => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
  });
}
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
  }, 700);
});

// Re-add missing setupPlanningDownload function
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

// Report export setup - REMOVED

// Populate ROI filter dropdowns
function populateRoiFilters() {
  const regionSelect = document.getElementById("roiRegionFilter");
  const quarterSelect = document.getElementById("roiQuarterFilter");
  
  if (!regionSelect || !quarterSelect) return;
  
  // Only populate if not already populated
  if (regionSelect.children.length <= 1) {
    // Populate region filter
    regionOptions.forEach(region => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
    
    // Populate quarter filter
    quarterOptions.forEach(quarter => {
      const option = document.createElement("option");
      option.value = quarter;
      option.textContent = quarter;
      quarterSelect.appendChild(option);
    });
    
    // Set up event listeners
    regionSelect.addEventListener("change", updateRoiTotalSpend);
    quarterSelect.addEventListener("change", updateRoiTotalSpend);
    
    // Clear filters button
    const clearButton = document.getElementById("roiClearFilters");
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        regionSelect.value = "";
        quarterSelect.value = "";
        updateRoiTotalSpend();
      });
    }
  }
}

// Reporting Total Spend Calculation
function updateReportTotalSpend() {
  // Calculate forecasted spend and pipeline from planning data
  fetch("data/planning.json")
    .then(response => response.json())
    .then(data => {
      let totalForecastedSpend = 0;
      let totalPipelineForecast = 0;
      
      // Sum all forecasted costs and pipeline from planning data
      data.forEach(row => {
        // Forecasted Cost
        let cost = row.forecastedCost || 0;
        if (typeof cost === "string") {
          cost = Number(cost.toString().replace(/[^\d.-]/g, ""));
        }
        if (!isNaN(cost)) {
          totalForecastedSpend += Number(cost);
        }
        
        // Pipeline Forecast
        let pipeline = row.pipelineForecast || 0;
        if (typeof pipeline === "string") {
          pipeline = Number(pipeline.toString().replace(/[^\d.-]/g, ""));
        }
        if (!isNaN(pipeline)) {
          totalPipelineForecast += Number(pipeline);
        }
      });
      
      // Update the forecasted spend display
      const spendEl = document.getElementById("reportTotalSpendValue");
      if (spendEl) {
        spendEl.textContent = "$" + totalForecastedSpend.toLocaleString();
      }
      
      // Update the pipeline forecast display
      const pipelineEl = document.getElementById("reportTotalPipelineValue");
      if (pipelineEl) {
        pipelineEl.textContent = "$" + totalPipelineForecast.toLocaleString();
      }
    })
    .catch(error => {
      console.error('Error loading planning data for reporting:', error);
    });

  // Calculate actual spend, MQL, and SQL from execution data
  if (window.executionTableInstance) {
    const executionData = window.executionTableInstance.getData();
    let totalActualSpend = 0;
    let totalActualMql = 0;
    let totalActualSql = 0;
    
    // Sum all actual costs, MQLs, and SQLs from execution data
    executionData.forEach(row => {
      // Actual Cost
      let cost = row.actualCost || 0;
      if (typeof cost === "string") {
        cost = Number(cost.toString().replace(/[^\d.-]/g, ""));
      }
      if (!isNaN(cost)) {
        totalActualSpend += Number(cost);
      }
      
      // Actual MQLs
      let mql = row.actualMQLs || 0;
      if (typeof mql === "string") {
        mql = Number(mql.toString().replace(/[^\d.-]/g, ""));
      }
      if (!isNaN(mql)) {
        totalActualMql += Number(mql);
      }
      
      // Actual SQLs - Note: need to check the actual field name
      let sql = row.actualSQLs || row.actualSQL || 0;
      if (typeof sql === "string") {
        sql = Number(sql.toString().replace(/[^\d.-]/g, ""));
      }
      if (!isNaN(sql)) {
        totalActualSql += Number(sql);
      }
    });
    
    // Update the actual spend display
    const actualSpendEl = document.getElementById("reportTotalActualSpendValue");
    if (actualSpendEl) {
      actualSpendEl.textContent = "$" + totalActualSpend.toLocaleString();
    }
    
    // Update the total MQL display
    const mqlEl = document.getElementById("reportTotalMqlValue");
    if (mqlEl) {
      mqlEl.textContent = totalActualMql.toLocaleString();
    }
    
    // Update the total SQL display
    const sqlEl = document.getElementById("reportTotalSqlValue");
    if (sqlEl) {
      sqlEl.textContent = totalActualSql.toLocaleString();
    }
  }
}

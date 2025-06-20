import { kpis } from "./src/calc.js"; // ensure script type=module or use inline

async function loadProgrammes() {
  // 1. list files in /data
  const listURL =
    "https://api.github.com/repos/TheCodeGuy-2006/mpt-mvp/contents/data";
  const list = await fetch(listURL).then((r) => r.json());
  if (!Array.isArray(list)) {
    alert(
      "Failed to fetch programme files. Check the API URL and repository permissions.",
    );
    return;
  }

  // 2. fetch each JSON file
  const rows = await Promise.all(
    list.map((item) => fetch(item.download_url).then((r) => r.json())),
  );

  initGrid(rows);
}

function initGrid(rows) {
  const table = new Tabulator("#gridContainer", {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    columns: [
      { title: "Program Type", field: "programType", editor: "input" },
      { title: "Forecasted Cost", field: "forecastedCost", editor: "number" },
      {
        title: "Expected Leads",
        field: "expectedLeads",
        editor: "number",
        cellEdited: (cell) => {
          const r = cell.getRow();
          Object.assign(r.getData(), kpis(cell.getValue()));
          r.update(r.getData());
          r.getData().__modified = true; // mark as dirty
        },
      },
      { title: "MQL", field: "mqlForecast" },
      { title: "SQL", field: "sqlForecast" },
      { title: "Opps", field: "oppsForecast" },
      { title: "Pipeline", field: "pipelineForecast" },
      {
        title: "Status",
        field: "status",
        editor: "list",
        editorParams: { values: ["Planning", "Shipped"] },
      },
      { title: "Region", field: "region", editor: "input" },
    ],
  });

  // UI buttons
  document.getElementById("addRow").onclick = () =>
    table.addRow({
      id: `program-${Date.now()}`,
      status: "Planning",
      __modified: true,
    });

  document.getElementById("delRow").onclick = () =>
    table.getSelectedRows().forEach((r) => r.delete());

  document.getElementById("saveRows").onclick = () => {
    const modified = table.getData().filter((r) => r.__modified);
    if (modified.length === 0) {
      alert("No changes to save.");
      return;
    }
    Promise.all(
      modified.map((r) => {
        const filename = `${r.id}.json`;
        delete r.__modified;
        return fetch("http://localhost:3000/save-programme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename,
            content: r,
            message: `Update ${filename} from web app`,
          }),
        })
          .then((res) => res.json())
          .then((result) => {
            if (!result.success) throw new Error(result.error);
          });
      }),
    )
      .then(() => {
        alert("Saved to GitHub!");
      })
      .catch((err) => {
        alert("Failed to save: " + err.message);
      });
  };
}

// PLANNING GRID
function initPlanningGrid(rows) {
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
  const regionOptions = ["ANZ", "SAARC", "EMEA", "Americas"];
  const statusOptions = ["Planning", "On Track", "Shipped", "Cancelled"];
  const yesNo = ["Yes", "No"];

  const table = new Tabulator("#planningGrid", {
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
          Object.assign(r.getData(), kpis(cell.getValue()));
          r.update(r.getData());
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
  if (addBtn) {
    addBtn.onclick = () =>
      table.addRow({
        id: `program-${Date.now()}`,
        status: "Planning",
        __modified: true,
      });
  }
  const delBtn = document.getElementById("deletePlanningRow");
  if (delBtn) {
    delBtn.onclick = () => table.getSelectedRows().forEach((r) => r.delete());
  }
  setupPlanningSave(table, rows);
  setupPlanningDownload(table);
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
function initBudgetsTable(budgets) {
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
        mutator: (value, data) => {
          // Will be filled in below
          return value;
        },
        formatter: (cell) => {
          const val = cell.getValue();
          return val !== undefined ? val : "";
        },
      },
    ],
  });
  // Calculate utilisation and alert if needed
  fetch("data/prog1.json")
    .then((r) => r.json())
    .then((prog1) => {
      fetch("data/prog2.json")
        .then((r) => r.json())
        .then((prog2) => {
          fetch("data/program-1750045569180.json")
            .then((r) => r.json())
            .then((prog3) => {
              const rows = [prog1, prog2, prog3];
              import("./src/calc.js").then(({ regionMetrics }) => {
                const budgetsObj = {};
                budgets.forEach(
                  (b) =>
                    (budgetsObj[b.region] = {
                      assignedBudget: b.assignedBudget,
                    }),
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
            });
        });
    });
  setupBudgetsSave(table);
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
    <p>Configure your GitHub repo and branch for JSON sync. (Coming soon!)</p>
    <label>Repo: <input type="text" id="repoName" placeholder="user/repo"></label><br>
    <label>Branch: <input type="text" id="branchName" placeholder="main"></label><br>
    <label>PAT: <input type="password" id="pat" placeholder="Personal Access Token"></label><br>
    <button id="syncBtn">Sync Now</button>
    <button id="zipExportBtn">Export ZIP</button>
  `;
}

// Load data from JSON files (static for GitHub Pages)
async function loadProgrammeData() {
  // In a static site, fetch local JSON files
  const files = [
    "data/prog1.json",
    "data/prog2.json",
    "data/program-1750045569180.json",
  ];
  const rows = await Promise.all(
    files.map((f) => fetch(f).then((r) => r.json())),
  );
  return rows;
}
async function loadBudgets() {
  return fetch("data/budgets.json").then((r) => r.json());
}

// run once the page loads
if (location.hash === "#grid" || location.hash === "") loadProgrammes();

// Ensure grid and button handlers are set up every time user navigates to Programme Grid
window.addEventListener("hashchange", () => {
  if (location.hash === "#grid") loadProgrammes();
});

// Show the section whose ID matches the current hash
function route() {
  const hash = location.hash || "#budget-setup";
  document.querySelectorAll("section").forEach((sec) => {
    const name = "#" + sec.id.replace("view-", "");
    // Always show the budget setup section
    if (sec.id === "view-budget-setup") {
      sec.style.display = "block";
    } else {
      sec.style.display = name === hash ? "block" : "none";
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

document.getElementById("savePlan").onclick = () => {
  const rows = [...document.querySelectorAll("#planTable tbody tr")];
  const budgets = {};
  rows.forEach((row) => {
    const region = row.cells[0].innerText.trim();
    const plan = Number(row.cells[1].querySelector("input").value || 0);
    budgets[region] = { assignedBudget: plan };
  });
  downloadJSON(budgets, "budgets.json");
  alert("budgets.json downloaded – commit this file in GitHub");
};

// Save Changes for Planning Grid
function setupPlanningSave(table, rows) {
  // Use the correct button ID from your HTML
  const saveBtn = document.getElementById("savePlanningRows");
  if (!saveBtn) return;
  saveBtn.onclick = () => {
    const changed = table.getData().filter((r) => r.__modified);
    if (!changed.length) {
      alert("No changes to save.");
      return;
    }
    changed.forEach((row) => {
      const { id, ...data } = row;
      downloadJSON(row, `data/${id || "programme"}.json`);
      row.__modified = false;
    });
    alert("Changed rows downloaded as JSON.");
  };
}

// Download all Planning data as JSON
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

// Save Changes for Execution Grid
function setupExecutionSave(table, rows) {
  // Add a Save button to the Execution view
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
    const changed = table.getData().filter((r) => r.__modified);
    if (!changed.length) {
      alert("No changes to save.");
      return;
    }
    changed.forEach((row) => {
      const { id, ...data } = row;
      downloadJSON(row, `data/${id || "programme"}.json`);
      row.__modified = false;
    });
    alert("Changed rows downloaded as JSON.");
  };
}

// Save Plan for Budgets Table
function setupBudgetsSave(table) {
  const btn = document.getElementById("savePlan");
  if (!btn) return;
  btn.onclick = () => {
    const data = table.getData();
    // Convert array back to object by region
    const obj = {};
    data.forEach((row) => {
      obj[row.region] = {
        assignedBudget: row.assignedBudget,
        notes: row.notes,
      };
    });
    downloadJSON(obj, "data/budgets.json");
    alert("Budgets downloaded as JSON.");
  };
}

// Save as CSV for Report Grid
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

// Hash router to show/hide views
function showView(hash) {
  document
    .querySelectorAll("section")
    .forEach((sec) => (sec.style.display = "none"));
  switch (hash) {
    case "#planning":
      document.getElementById("view-planning").style.display = "block";
      break;
    case "#execution":
      document.getElementById("view-execution").style.display = "block";
      break;
    case "#budgets":
      document.getElementById("view-budgets").style.display = "block";
      document.getElementById("view-budget-setup").style.display = "block"; // Show budget plan table only in Budgets tab
      break;
    case "#report":
      document.getElementById("view-report").style.display = "block";
      break;
    case "#github-sync":
      document.getElementById("view-github-sync").style.display = "block";
      break;
    default:
      document.getElementById("view-planning").style.display = "block";
  }
}
window.addEventListener("hashchange", () => showView(location.hash));
window.addEventListener("DOMContentLoaded", () => showView(location.hash));

// Example: Load and initialize all views on DOMContentLoaded
window.addEventListener("DOMContentLoaded", async () => {
  showView(location.hash);
  // Load real data
  const rows = await loadProgrammeData();
  const budgetsObj = await loadBudgets();
  // Convert budgets object to array for Tabulator
  const budgets = Object.entries(budgetsObj).map(([region, data]) => ({
    region,
    ...data,
  }));
  initPlanningGrid(rows);
  initExecutionGrid(rows);
  initBudgetsTable(budgets);
  initReportGrid(rows);
  initGithubSync();
  setupPlanningSave(initPlanningGrid(rows), rows);
  setupBudgetsSave(initBudgetsTable(budgets));
  setupExecutionSave(initExecutionGrid(rows), rows);
  setupReportExport(initReportGrid(rows));
  setupPlanningDownload(initPlanningGrid(rows));
});

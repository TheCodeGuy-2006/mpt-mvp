import { kpis } from "./src/calc.js";

console.log("app.js loaded");

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

// Patch: Update annual budget plan save logic to POST to /save-budgets for backend integration. Also ensure budgets dashboard and execution/planning grids use backend save endpoints.
// Annual budget functionality moved to budgets module

// --- LIVE SYNC LOGIC ---
// Sync function is now in execution module

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
    if (hash === "#planning" && window.planningModule.tableInstance) {
      setTimeout(() => {
        window.planningModule.tableInstance.redraw(true);
        window.planningModule.tableInstance.setData(window.planningModule.tableInstance.getData());
        console.log("[route] Redrew planning grid");
      }, 0);
    }
    if (hash === "#execution" && window.executionModule.tableInstance) {
      setTimeout(() => {
        window.executionModule.tableInstance.redraw(true);
        window.executionModule.tableInstance.setData(window.executionModule.tableInstance.getData());
        console.log("[route] Redrew execution grid");
      }, 0);
    }
    if (hash === "#roi" && typeof window.roiModule.updateRoiTotalSpend === "function") {
      setTimeout(window.roiModule.updateRoiTotalSpend, 0);
      setTimeout(initRoiTabSwitching, 100); // Initialize tab switching when ROI tab is viewed
      console.log("[route] Updated ROI total spend");
    }
    if (hash === "#report" && window.reportTableInstance) {
      setTimeout(() => {
        window.reportTableInstance.redraw(true);
        window.reportTableInstance.setData(window.reportTableInstance.getData());
        console.log("[route] Redrew report grid");
      }, 0);
    }
    if (hash === "#report" && typeof window.roiModule.updateReportTotalSpend === "function") {
      setTimeout(window.roiModule.updateReportTotalSpend, 0);
      console.log("[route] Updated report total spend");
    }
    if (hash === "#calendar" && typeof window.calendarModule?.handleCalendarRouting === "function") {
      window.calendarModule.handleCalendarRouting();
      console.log("[route] Handled calendar routing");
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
  
  // Initialize constants from planning module
  initializeConstants();
  
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
    // Use planning module functions
    [rows, budgetsObj] = await Promise.all([
      window.planningModule.loadPlanning(), 
      window.budgetsModule.loadBudgets()
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
  const planningTable = window.planningModule.initPlanningGrid(rows);
  window.planningTableInstance = planningTable;
  const executionTable = window.executionModule.initExecutionGrid(rows);
  window.executionTableInstance = executionTable;
  const budgetsTable = window.budgetsModule.initBudgetsTable(budgets, rows); // pass rows to budgets table
  window.budgetsTableInstance = budgetsTable;
  initGithubSync();
  window.planningModule.setupPlanningSave(planningTable, rows);
  window.budgetsModule.setupBudgetsSave(budgetsTable);
  window.budgetsModule.setupBudgetsDownload(budgetsTable);
  window.planningModule.setupPlanningDownload(planningTable);

  // Initialize reporting total spend using ROI module
  window.roiModule.updateReportTotalSpend();

  // Initialize Annual Budget Plan using budgets module
  window.budgetsModule.initializeAnnualBudgetPlan(budgets);

  // Ensure hash is set to a valid tab on load (after all sections are initialized)
  const validTabs = [
    "#planning",
    "#execution",
    "#budgets",
    "#calendar",
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
  window.executionModule.syncGridsOnEdit(planningTable, executionTable);
  window.executionModule.syncGridsOnEdit(executionTable, planningTable);
  
  // Setup ROI chart event handlers
  window.roiModule.setupRoiChartEventHandlers();
  
  // Initialize calendar module
  window.calendarModule.initializeCalendar();
});

// Initialize Chart.js and render charts
initializeChartJS();

// After budgets table is initialized, render the chart
const origInitBudgetsTable = window.budgetsModule.initBudgetsTable;
window.budgetsModule.initBudgetsTable = function (budgets, rows) {
  const table = origInitBudgetsTable(budgets, rows);
  window.budgetsTableInstance = table;
  setTimeout(renderBudgetsBarChart, 200);
  table.on("dataChanged", renderBudgetsBarChart);
  return table;
};

// After budgets table is initialized, render the region charts
const origInitBudgetsTable2 = window.budgetsModule.initBudgetsTable;
window.budgetsModule.initBudgetsTable = function (budgets, rows) {
  const table = origInitBudgetsTable2(budgets, rows);
  window.budgetsTableInstance = table;
  setTimeout(renderBudgetsRegionCharts, 200);
  table.on("dataChanged", renderBudgetsRegionCharts);
  return table;
};
// Also render on planning table data change
const origInitPlanningGrid2 = window.planningModule.initPlanningGrid;
window.planningModule.initPlanningGrid = function (rows) {
  const table = origInitPlanningGrid2(rows);
  window.planningRows = rows;
  table.on("dataChanged", renderBudgetsRegionCharts);
  setTimeout(renderBudgetsRegionCharts, 200);
  return table;
};

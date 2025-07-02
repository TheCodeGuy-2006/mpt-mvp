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
    if (hash === "#roi" && typeof updateRoiTotalSpend === "function") {
      setTimeout(updateRoiTotalSpend, 0);
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

  // Initialize reporting total spend
  updateReportTotalSpend();

  // Initialize Annual Budget Plan using budgets module
  window.budgetsModule.initializeAnnualBudgetPlan(budgets);

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
  window.executionModule.syncGridsOnEdit(planningTable, executionTable);
  window.executionModule.syncGridsOnEdit(executionTable, planningTable);
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

// ROI Total Spend and Pipeline Calculation
function updateRoiTotalSpend() {
  // Populate filter dropdowns if not already done
  populateRoiFilters();
  
  // Get filter values
  const regionFilter = document.getElementById("roiRegionFilter")?.value || "";
  const quarterFilter = document.getElementById("roiQuarterFilter")?.value || "";
  
  // Filter data based on selected filters
  let filteredData = [];
  if (window.executionModule.tableInstance) {
    filteredData = window.executionModule.tableInstance.getData().filter(row => {
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

  // Update Total Forecasted Cost value from Planning tab
  let totalForecastedCost = 0;
  if (window.planningModule.tableInstance) {
    const planningData = window.planningModule.tableInstance.getData();
    totalForecastedCost = planningData.reduce((sum, row) => {
      let val = row.forecastedCost;
      if (typeof val === "string") val = Number(val.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(val)) sum += Number(val);
      return sum;
    }, 0);
  }
  
  const forecastedCostEl = document.getElementById("roiTotalForecastedCostValue");
  if (forecastedCostEl) {
    forecastedCostEl.textContent = "$" + totalForecastedCost.toLocaleString();
  }

  // Update ROI Gauge
  updateRoiGauge(roiPercent);
  
  // Update ROI Charts
  renderRoiByRegionChart();
  renderRoiByProgramTypeChart();

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

  // Note: Program Type Breakdown Table removed in favor of chart visualization
  // The table functionality has been replaced with the compact chart format in the grid
}

// Chart functions moved to charts.js

// Chart event handlers
window.addEventListener("hashchange", () => {
  if (location.hash === "#roi") {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
    renderRoiByQuarterChart();
  }
});
if (window.executionModule.tableInstance) {
  window.executionModule.tableInstance.on("dataChanged", () => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
    renderRoiByQuarterChart();
  });
  window.executionModule.tableInstance.on("cellEdited", () => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
    renderRoiByQuarterChart();
  });
}
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
    renderRoiByQuarterChart();
    initRoiTabSwitching(); // Initialize ROI tab functionality
  }, 700);
});

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
      let spendByRegion = {};
      
      // Sum all forecasted costs and pipeline from planning data
      data.forEach(row => {
        // Forecasted Cost
        let cost = row.forecastedCost || 0;
        if (typeof cost === "string") {
          cost = Number(cost.toString().replace(/[^\d.-]/g, ""));
        }
        if (!isNaN(cost)) {
          totalForecastedSpend += Number(cost);
          
          // Aggregate by region for chart
          const region = row.region || "Unknown";
          if (!spendByRegion[region]) {
            spendByRegion[region] = 0;
          }
          spendByRegion[region] += Number(cost);
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
      
      // Create/update the chart
      createReportSpendByRegionChart(spendByRegion);
    })
    .catch(error => {
      console.error('Error loading planning data for reporting:', error);
    });

  // Calculate actual spend, MQL, and SQL from execution data
  if (window.executionModule.tableInstance) {
    const executionData = window.executionModule.tableInstance.getData();
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

// All chart functions moved to charts.js

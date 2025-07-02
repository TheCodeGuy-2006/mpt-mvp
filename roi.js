// roi.js - ROI and Reporting Module
console.log("roi.js loaded");

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

// Populate ROI filter dropdowns
function populateRoiFilters() {
  const regionSelect = document.getElementById("roiRegionFilter");
  const quarterSelect = document.getElementById("roiQuarterFilter");
  
  if (!regionSelect || !quarterSelect) return;
  
  // Get options from planning module constants
  const regionOptions = window.planningModule?.constants?.regionOptions || [];
  const quarterOptions = window.planningModule?.constants?.quarterOptions || [];
  
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

// Setup ROI chart event handlers
function setupRoiChartEventHandlers() {
  // Chart event handlers for hash changes
  window.addEventListener("hashchange", () => {
    if (location.hash === "#roi") {
      renderRoiByRegionChart();
      renderRoiByProgramTypeChart();
      renderRoiByQuarterChart();
    }
  });
  
  // Setup execution table event handlers for ROI chart updates
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
}

// Initialize ROI functionality on DOM content loaded
function initializeRoiFunctionality() {
  setTimeout(() => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
    renderRoiByQuarterChart();
    initRoiTabSwitching(); // Initialize ROI tab functionality
  }, 700);
}

// Handle ROI tab routing logic
function handleRoiTabRouting() {
  const hash = location.hash;
  if (hash === "#roi" && typeof updateRoiTotalSpend === "function") {
    setTimeout(updateRoiTotalSpend, 0);
    setTimeout(initRoiTabSwitching, 100); // Initialize tab switching when ROI tab is viewed
    console.log("[route] Updated ROI total spend");
  }
  if (hash === "#report" && typeof updateReportTotalSpend === "function") {
    setTimeout(updateReportTotalSpend, 0);
    console.log("[route] Updated report total spend");
  }
}

// Module exports
const roiModule = {
  updateRoiTotalSpend,
  populateRoiFilters,
  updateReportTotalSpend,
  setupRoiChartEventHandlers,
  initializeRoiFunctionality,
  handleRoiTabRouting
};

// Export to window for access from other modules
window.roiModule = roiModule;

export default roiModule;

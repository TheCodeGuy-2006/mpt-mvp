// roi.js - ROI and Reporting Module
console.log("roi.js loaded");

// ROI Total Spend and Pipeline Calculation
function updateRoiTotalSpend() {
  // Populate filter dropdowns if not already done
  populateRoiFilters();

  // Get filter values
  const regionFilter = document.getElementById("roiRegionFilter")?.value || "";
  const quarterFilter =
    document.getElementById("roiQuarterFilter")?.value || "";

  // Filter data based on selected filters
  let filteredData = [];
  if (window.executionModule.tableInstance) {
    filteredData = window.executionModule.tableInstance
      .getData()
      .filter((row) => {
        let matchesRegion = !regionFilter || row.region === regionFilter;
        let matchesQuarter = !quarterFilter || row.quarter === quarterFilter;
        return matchesRegion && matchesQuarter;
      });
  }

  let totalSpend = 0;
  let totalPipeline = 0;
  // Debug: log pipelineForecast values
  console.log(
    "[ROI] Filtered data for pipeline calculation:",
    filteredData.map((r) => r.pipelineForecast),
  );
  totalSpend = filteredData.reduce((sum, row) => {
    let val = row.actualCost;
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  totalPipeline = filteredData.reduce((sum, row) => {
    let val = row.pipelineForecast;
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  // Debug: log total pipeline
  console.log("[ROI] Total pipeline calculated:", totalPipeline);

  const spendEl = document.getElementById("roiTotalSpendValue");
  if (spendEl) {
    spendEl.textContent = "$" + totalSpend.toLocaleString();
  }
  // Update pipeline value in existing span if present
  const pipelineValue =
    isNaN(totalPipeline) || totalPipeline === undefined ? 0 : totalPipeline;
  const pipelineEl = document.getElementById("roiTotalPipelineValue");
  if (pipelineEl) {
    pipelineEl.textContent = "$" + pipelineValue.toLocaleString();
  }
  // Update leads/conversions value in existing span if present
  let totalLeads = 0;
  totalLeads = filteredData.reduce((sum, row) => {
    let val = row.actualLeads;
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
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
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
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
      if (typeof val === "string")
        val = Number(val.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(val)) sum += Number(val);
      return sum;
    }, 0);
  }

  const forecastedCostEl = document.getElementById(
    "roiTotalForecastedCostValue",
  );
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
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
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
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
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



// --- ROI FILTER LOGIC UPDATE START ---
// Update ROI Total Spend and Data Table to use all calendar filters
function getRoiFilterValues() {
  return {
    region: document.getElementById("roiRegionFilter")?.value || "",
    quarter: document.getElementById("roiQuarterFilter")?.value || "",
    country: document.getElementById("roiCountryFilter")?.value || "",
    owner: document.getElementById("roiOwnerFilter")?.value || "",
    status: document.getElementById("roiStatusFilter")?.value || "",
    programType: document.getElementById("roiProgramTypeFilter")?.value || "",
    strategicPillars: document.getElementById("roiStrategicPillarsFilter")?.value || "",
    revenuePlay: document.getElementById("roiRevenuePlayFilter")?.value || ""
  };
}

// Patch updateRoiTotalSpend
const _originalUpdateRoiTotalSpend = updateRoiTotalSpend;
updateRoiTotalSpend = function() {
  populateRoiFilters();
  const filters = getRoiFilterValues();
  let filteredData = [];
  if (window.executionModule.tableInstance) {
    filteredData = window.executionModule.tableInstance.getData().filter(row => {
      return (!filters.region || row.region === filters.region)
        && (!filters.quarter || row.quarter === filters.quarter)
        && (!filters.country || row.country === filters.country)
        && (!filters.owner || row.owner === filters.owner)
        && (!filters.status || row.status === filters.status)
        && (!filters.programType || row.programType === filters.programType)
        && (!filters.strategicPillars || row.strategicPillars === filters.strategicPillars)
        && (!filters.revenuePlay || row.revenuePlay === filters.revenuePlay);
    });
  }

  let totalSpend = 0;
  let totalPipeline = 0;
  // Debug: log pipelineForecast values
  console.log(
    "[ROI] Filtered data for pipeline calculation:",
    filteredData.map((r) => r.pipelineForecast),
  );
  totalSpend = filteredData.reduce((sum, row) => {
    let val = row.actualCost;
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  totalPipeline = filteredData.reduce((sum, row) => {
    let val = row.pipelineForecast;
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);
  // Debug: log total pipeline
  console.log("[ROI] Total pipeline calculated:", totalPipeline);

  const spendEl = document.getElementById("roiTotalSpendValue");
  if (spendEl) {
    spendEl.textContent = "$" + totalSpend.toLocaleString();
  }
  // Update pipeline value in existing span if present
  const pipelineValue =
    isNaN(totalPipeline) || totalPipeline === undefined ? 0 : totalPipeline;
  const pipelineEl = document.getElementById("roiTotalPipelineValue");
  if (pipelineEl) {
    pipelineEl.textContent = "$" + pipelineValue.toLocaleString();
  }
  // Update leads/conversions value in existing span if present
  let totalLeads = 0;
  totalLeads = filteredData.reduce((sum, row) => {
    let val = row.actualLeads;
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
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
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
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
      if (typeof val === "string")
        val = Number(val.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(val)) sum += Number(val);
      return sum;
    }, 0);
  }

  const forecastedCostEl = document.getElementById(
    "roiTotalForecastedCostValue",
  );
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
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
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
    if (typeof val === "string")
      val = Number(val.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(val)) sum += Number(val);
    return sum;
  }, 0);

  const oppsEl = document.getElementById("roiTotalOppsValue");
  if (oppsEl) {
    oppsEl.textContent = totalOpps.toLocaleString();
  }

  // Update Remaining Budget (Total Budget - Forecasted Cost, filtered by region only)
  updateRemainingBudget(filters.region);

  // Note: Program Type Breakdown Table removed in favor of chart visualization
  // The table functionality has been replaced with the compact chart format in the grid
};

// Patch updateRoiDataTable
const _originalUpdateRoiDataTable = updateRoiDataTable;
updateRoiDataTable = function() {
  const table = window.roiDataTableInstance;
  if (!table) {
    console.log("ROI Data Table not initialized yet");
    return;
  }
  const filters = getRoiFilterValues();
  const campaigns = getCampaignDataForRoi();
  const filteredCampaigns = campaigns.filter(campaign => {
    return (!filters.region || campaign.region === filters.region)
      && (!filters.quarter || campaign.quarter === filters.quarter)
      && (!filters.country || campaign.country === filters.country)
      && (!filters.owner || campaign.owner === filters.owner)
      && (!filters.status || campaign.status === filters.status)
      && (!filters.programType || campaign.programType === filters.programType)
      && (!filters.strategicPillars || campaign.strategicPillars === filters.strategicPillars)
      && (!filters.revenuePlay || campaign.revenuePlay === filters.revenuePlay);
  });
  table.replaceData(filteredCampaigns);
  console.log(`ROI Data Table updated with ${filteredCampaigns.length} campaigns`);
};
// --- ROI FILTER LOGIC UPDATE END ---

// Populate ROI filter dropdowns
function populateRoiFilters() {
  const regionSelect = document.getElementById("roiRegionFilter");
  const quarterSelect = document.getElementById("roiQuarterFilter");
  const countrySelect = document.getElementById("roiCountryFilter");
  const ownerSelect = document.getElementById("roiOwnerFilter");
  const statusSelect = document.getElementById("roiStatusFilter");
  const programTypeSelect = document.getElementById("roiProgramTypeFilter");
  const strategicPillarsSelect = document.getElementById("roiStrategicPillarsFilter");
  const revenuePlaySelect = document.getElementById("roiRevenuePlayFilter");

  if (!regionSelect || !quarterSelect || !countrySelect || !ownerSelect || !statusSelect || !programTypeSelect || !strategicPillarsSelect || !revenuePlaySelect) return;

  // Get options from planning data
  const planningData = window.planningModule?.tableInstance?.getData() || [];
  const regionOptions = Array.from(new Set(planningData.map(c => c.region).filter(Boolean))).sort();
  const quarterOptions = window.planningModule?.constants?.quarterOptions || [];
  const countryOptions = Array.from(new Set(planningData.map(c => c.country).filter(Boolean))).sort();
  const ownerOptions = Array.from(new Set(planningData.map(c => c.owner).filter(Boolean))).sort();
  const statusOptions = Array.from(new Set(planningData.map(c => c.status).filter(Boolean))).sort();
  const programTypeOptions = Array.from(new Set(planningData.map(c => c.programType).filter(Boolean))).sort();
  const strategicPillarsOptions = Array.from(new Set(planningData.map(c => c.strategicPillars).filter(Boolean))).sort();
  const revenuePlayOptions = Array.from(new Set(planningData.map(c => c.revenuePlay).filter(Boolean))).sort();

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
  if (countrySelect.children.length <= 1) {
    countryOptions.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countrySelect.appendChild(option);
    });
  }
  if (ownerSelect.children.length <= 1) {
    ownerOptions.forEach((owner) => {
      const option = document.createElement("option");
      option.value = owner;
      option.textContent = owner;
      ownerSelect.appendChild(option);
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
    programTypeOptions.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      programTypeSelect.appendChild(option);
    });
  }
  if (strategicPillarsSelect.children.length <= 1) {
    strategicPillarsOptions.forEach((pillar) => {
      const option = document.createElement("option");
      option.value = pillar;
      option.textContent = pillar;
      strategicPillarsSelect.appendChild(option);
    });
  }
  if (revenuePlaySelect.children.length <= 1) {
    revenuePlayOptions.forEach((play) => {
      const option = document.createElement("option");
      option.value = play;
      option.textContent = play;
      revenuePlaySelect.appendChild(option);
    });
  }

  // Set up event listeners for all filters
  [regionSelect, quarterSelect, countrySelect, ownerSelect, statusSelect, programTypeSelect, strategicPillarsSelect, revenuePlaySelect].forEach(select => {
    select.addEventListener("change", () => {
      updateRoiTotalSpend();
      updateRoiDataTable();
    });
  });

  // Clear filters button
  const clearButton = document.getElementById("roiClearFilters");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      regionSelect.value = "";
      quarterSelect.value = "";
      countrySelect.value = "";
      ownerSelect.value = "";
      statusSelect.value = "";
      programTypeSelect.value = "";
      strategicPillarsSelect.value = "";
      revenuePlaySelect.value = "";
      updateRoiTotalSpend();
      updateRoiDataTable();
    });
  }
}

// Reporting Total Spend Calculation
function updateReportTotalSpend() {
  // Calculate forecasted spend and pipeline from planning data
  fetch("data/planning.json")
    .then((response) => response.json())
    .then((data) => {
      let totalForecastedSpend = 0;
      let totalPipelineForecast = 0;
      let spendByRegion = {};

      // Sum all forecasted costs and pipeline from planning data
      data.forEach((row) => {
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
    .catch((error) => {
      console.error("Error loading planning data for reporting:", error);
    });

  // Calculate actual spend, MQL, and SQL from execution data
  if (window.executionModule.tableInstance) {
    const executionData = window.executionModule.tableInstance.getData();
    let totalActualSpend = 0;
    let totalActualMql = 0;
    let totalActualSql = 0;

    // Sum all actual costs, MQLs, and SQLs from execution data
    executionData.forEach((row) => {
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
    const actualSpendEl = document.getElementById(
      "reportTotalActualSpendValue",
    );
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
    
    // Populate ROI filters
    populateRoiFilters();
    
    // Initial remaining budget calculation
    setTimeout(() => {
      updateRemainingBudget("");
    }, 100);
    
    // Initialize data table - wait a bit longer for planning module to load
    setTimeout(() => {
      console.log("Attempting to initialize ROI Data Table...");
      window.roiDataTableInstance = initRoiDataTable();
    }, 500);
  }, 700);
}

// Initialize ROI Data Table
function initRoiDataTable() {
  console.log("Initializing ROI Data Table...");
  
  const tableContainer = document.getElementById("roiDataTable");
  if (!tableContainer) {
    console.error("ROI Data Table container not found");
    return null;
  }
  
  console.log("Table container found:", tableContainer);
  
  if (typeof Tabulator === 'undefined') {
    console.error("Tabulator library not loaded");
    return null;
  }
  
  const campaigns = getCampaignDataForRoi();
  console.log("Campaign data for ROI:", campaigns.length, "campaigns");
   try {
    const table = new Tabulator(tableContainer, {
      data: campaigns,
      layout: "fitDataStretch",
      height: "400px",
      responsiveLayout: "collapse",
      pagination: "local",
      paginationSize: 15,
      paginationSizeSelector: [10, 15, 25, 50],
      movableColumns: true,
      resizableColumns: true,
      tooltips: true,
      tooltipsHeader: true,
      rowHeight: 60,
      headerHeight: 50,
      columns: [
      {
        title: "Campaign Name & Type",
        field: "campaignInfo",
        formatter: (cell) => {
          const data = cell.getData();
          const name = data.campaignName || 'Untitled Campaign';
          const type = data.programType || 'No Type';
          return `
            <div style="line-height: 1.4;">
              <div style="font-weight: bold; color: #1976d2; font-size: 0.95em;">${name}</div>
              <div style="font-size: 0.8em; color: #666; margin-top: 2px;">${type}</div>
            </div>
          `;
        },
        width: 220,
        sorter: (a, b) => {
          const nameA = (a.campaignName || '').toLowerCase();
          const nameB = (b.campaignName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        }
      },
      {
        title: "Forecasted Cost",
        field: "forecastedCost",
        formatter: (cell) => {
          const value = Number(cell.getValue()) || 0;
          return `$${value.toLocaleString()}`;
        },
        width: 130,
        sorter: "number",
        align: "right"
      },
      {
        title: "Actual Cost",
        field: "actualCost",
        formatter: (cell) => {
          const value = Number(cell.getValue()) || 0;
          return `$${value.toLocaleString()}`;
        },
        width: 120,
        sorter: "number",
        align: "right"
      },
      {
        title: "Expected Leads",
        field: "expectedLeads",
        formatter: (cell) => {
          const value = Number(cell.getValue()) || 0;
          return value.toLocaleString();
        },
        width: 120,
        sorter: "number",
        align: "right"
      },
      {
        title: "Actual Leads",
        field: "actualLeads",
        formatter: (cell) => {
          const value = Number(cell.getValue()) || 0;
          return value.toLocaleString();
        },
        width: 110,
        sorter: "number",
        align: "right"
      },
      {
        title: "Pipeline Forecasted",
        field: "pipelineForecast",
        formatter: (cell) => {
          const value = Number(cell.getValue()) || 0;
          return `$${value.toLocaleString()}`;
        },
        width: 150,
        sorter: "number",
        align: "right"
      },
      {
        title: "ROI",
        field: "roi",
        formatter: (cell) => {
          const data = cell.getData();
          const actualCost = Number(data.actualCost) || 0;
          const pipelineForecast = Number(data.pipelineForecast) || 0;
          
          if (actualCost === 0) return "N/A";
          
          const roi = ((pipelineForecast - actualCost) / actualCost * 100);
          const color = roi >= 0 ? "#4caf50" : "#f44336";
          
          return `<span style="color: ${color}; font-weight: bold;">${roi.toFixed(1)}%</span>`;
        },
        width: 100,
        sorter: (a, b) => {
          const getROI = (data) => {
            const actualCost = Number(data.actualCost) || 0;
            const pipelineForecast = Number(data.pipelineForecast) || 0;
            return actualCost === 0 ? 0 : ((pipelineForecast - actualCost) / actualCost * 100);
          };
          return getROI(a) - getROI(b);
        },
        align: "right"
      }
    ],
    pagination: "local",
    paginationSize: 15,
    paginationSizeSelector: [10, 15, 25, 50],
    movableColumns: true,
    resizableColumns: true,
    tooltips: true,
    tooltipsHeader: true
  });

  // Store the table instance globally for updates
  window.roiDataTableInstance = table;
  console.log("ROI Data Table initialized successfully");

  return table;
  
  } catch (error) {
    console.error("Error initializing ROI Data Table:", error);
    return null;
  }
}

// Get campaign data for ROI table
function getCampaignDataForRoi() {
  if (!window.planningModule?.tableInstance) {
    return [];
  }

  const planningData = window.planningModule.tableInstance.getData();
  
  return planningData.map(campaign => ({
    campaignName: campaign.campaignName || 'Untitled Campaign',
    programType: campaign.programType || 'No Type',
    forecastedCost: Number(campaign.forecastedCost) || 0,
    actualCost: Number(campaign.actualCost) || 0,
    expectedLeads: Number(campaign.expectedLeads) || 0,
    actualLeads: Number(campaign.actualLeads) || 0,
    pipelineForecast: Number(campaign.pipelineForecast) || 0,
    region: campaign.region || '',
    quarter: campaign.quarter || '',
    status: campaign.status || '',
    owner: campaign.owner || ''
  }));
}

// Update ROI data table with current filters
function updateRoiDataTable() {
  const table = window.roiDataTableInstance;
  if (!table) {
    console.log("ROI Data Table not initialized yet");
    return;
  }

  // Get filter values from ROI filters
  const regionFilter = document.getElementById("roiRegionFilter")?.value || "";
  const quarterFilter = document.getElementById("roiQuarterFilter")?.value || "";

  // Get fresh data
  const campaigns = getCampaignDataForRoi();
  
  // Apply filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesRegion = !regionFilter || campaign.region === regionFilter;
    const matchesQuarter = !quarterFilter || campaign.quarter === quarterFilter;
    return matchesRegion && matchesQuarter;
  });

  // Update table data
  table.replaceData(filteredCampaigns);
  console.log(`ROI Data Table updated with ${filteredCampaigns.length} campaigns`);
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
  handleRoiTabRouting,
  initRoiDataTable,
  getCampaignDataForRoi,
  updateRoiDataTable,
  updateRemainingBudget,
  loadBudgetsData,
};

// Export to window for access from other modules
window.roiModule = roiModule;

// Remaining Budget Calculation Functions
let budgetsData = null;

// Load budgets data from budgets.json
async function loadBudgetsData() {
  if (budgetsData) return budgetsData;
  
  try {
    const response = await fetch('data/budgets.json');
    budgetsData = await response.json();
    console.log('[ROI] Loaded budgets data:', budgetsData);
    return budgetsData;
  } catch (error) {
    console.error('[ROI] Error loading budgets data:', error);
    return {};
  }
}

// Update remaining budget calculation
async function updateRemainingBudget(regionFilter) {
  console.log('[ROI] Updating remaining budget, region filter:', regionFilter);
  
  try {
    // Load budgets data
    const budgets = await loadBudgetsData();
    console.log('[ROI] Budgets data loaded:', budgets);
    
    // Calculate total budget (filtered by region if specified)
    let totalBudget = 0;
    for (const [region, data] of Object.entries(budgets)) {
      if (!regionFilter || region === regionFilter) {
        totalBudget += data.assignedBudget || 0;
      }
    }
    console.log('[ROI] Total budget calculated:', totalBudget);
    
    // Calculate total actual cost (filtered by region if specified)
    let totalActualCost = 0;
    if (window.planningModule.tableInstance) {
      const planningData = window.planningModule.tableInstance.getData();
      totalActualCost = planningData.reduce((sum, row) => {
        // Only include rows that match the region filter (if specified)
        if (regionFilter && row.region !== regionFilter) return sum;
        
        let val = row.actualCost;
        if (typeof val === "string")
          val = Number(val.toString().replace(/[^\d.-]/g, ""));
        if (!isNaN(val)) sum += Number(val);
        return sum;
      }, 0);
    }
    console.log('[ROI] Total actual cost calculated:', totalActualCost);
    
    // Calculate remaining budget
    const remainingBudget = totalBudget - totalActualCost;
    console.log('[ROI] Remaining budget calculated:', remainingBudget);
    
    // Update the display
    const remainingBudgetEl = document.getElementById("roiRemainingBudgetValue");
    if (remainingBudgetEl) {
      remainingBudgetEl.textContent = "$" + remainingBudget.toLocaleString();
      console.log('[ROI] Updated remaining budget display:', remainingBudgetEl.textContent);
    } else {
      console.error('[ROI] Could not find roiRemainingBudgetValue element');
    }
    
  } catch (error) {
    console.error('[ROI] Error updating remaining budget:', error);
    const remainingBudgetEl = document.getElementById("roiRemainingBudgetValue");
    if (remainingBudgetEl) {
      remainingBudgetEl.textContent = "$0";
    }
  }
}

export default roiModule;

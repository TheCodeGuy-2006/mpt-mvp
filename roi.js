// roi.js - ROI and Reporting Module
import {
  createReportSpendByRegionChart,
  renderRoiByRegionChart,
  renderRoiByProgramTypeChart,
  renderRoiByQuarterChart,
  updateRoiGauge,
  initRoiTabSwitching
} from './charts.js';
// Performance optimization: Cache and debounce
let filterUpdateTimeout = null;
let lastFilterState = null;
let cachedPlanningData = null;
let cachedFilterOptions = null;
let lastChartUpdate = 0;
let isRoiTabActive = false;
let roiInitialized = false;

// Custom multiselect implementation for ROI
function createRoiMultiselect(selectElement) {
  const container = document.createElement('div');
  container.className = 'multiselect-container';
  
  const display = document.createElement('div');
  display.className = 'multiselect-display';
  
  const dropdown = document.createElement('div');
  dropdown.className = 'multiselect-dropdown';
  
  // Get options from original select
  const options = Array.from(selectElement.options).map(option => ({
    value: option.value,
    text: option.textContent,
    selected: option.selected
  }));
  
  let selectedValues = options.filter(opt => opt.selected).map(opt => opt.value);
  
  // Update display content
  function updateDisplay() {
    display.innerHTML = '';
    
    if (selectedValues.length === 0) {
      const placeholder = document.createElement('span');
      placeholder.className = 'multiselect-placeholder';
      placeholder.textContent = `(All ${selectElement.getAttribute('data-placeholder') || 'Options'})`;
      display.appendChild(placeholder);
    } else if (selectedValues.length <= 2) {
      const selectedContainer = document.createElement('div');
      selectedContainer.className = 'multiselect-selected';
      
      selectedValues.forEach(value => {
        const option = options.find(opt => opt.value === value);
        if (option) {
          const tag = document.createElement('span');
          tag.className = 'multiselect-tag';
          tag.innerHTML = `
            <span class="multiselect-tag-text">${option.text}</span>
            <span class="multiselect-tag-remove" data-value="${value}">×</span>
          `;
          selectedContainer.appendChild(tag);
        }
      });
      
      display.appendChild(selectedContainer);
    } else {
      const selectedContainer = document.createElement('div');
      selectedContainer.className = 'multiselect-selected';
      
      // Show first item and count
      const firstOption = options.find(opt => opt.value === selectedValues[0]);
      if (firstOption) {
        const tag = document.createElement('span');
        tag.className = 'multiselect-tag';
        tag.innerHTML = `
          <span class="multiselect-tag-text">${firstOption.text}</span>
          <span class="multiselect-tag-remove" data-value="${firstOption.value}">×</span>
        `;
        selectedContainer.appendChild(tag);
      }
      
      const count = document.createElement('span');
      count.className = 'multiselect-count';
      count.textContent = `+${selectedValues.length - 1}`;
      selectedContainer.appendChild(count);
      
      display.appendChild(selectedContainer);
    }
  }
  
  // Update dropdown content
  function updateDropdown() {
    dropdown.innerHTML = '';
    
    options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'multiselect-option';
      if (selectedValues.includes(option.value)) {
        optionElement.classList.add('selected');
      }
      
      optionElement.innerHTML = `
        <div class="multiselect-checkbox">${selectedValues.includes(option.value) ? '✓' : ''}</div>
        <span>${option.text}</span>
      `;
      
      optionElement.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOption(option.value);
      });
      
      dropdown.appendChild(optionElement);
    });
  }
  
  // Toggle option selection
  function toggleOption(value) {
    const index = selectedValues.indexOf(value);
    if (index === -1) {
      selectedValues.push(value);
    } else {
      selectedValues.splice(index, 1);
    }
    
    // Update original select
    Array.from(selectElement.options).forEach(option => {
      option.selected = selectedValues.includes(option.value);
    });
    
    updateDisplay();
    updateDropdown();
    
    // Trigger change event
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Handle tag removal
  display.addEventListener('click', (e) => {
    if (e.target.classList.contains('multiselect-tag-remove')) {
      e.stopPropagation();
      const value = e.target.getAttribute('data-value');
      toggleOption(value);
    } else {
      // Toggle dropdown
      const isOpen = dropdown.classList.contains('open');
      closeAllRoiMultiselects();
      if (!isOpen) {
        display.classList.add('open');
        dropdown.classList.add('open');
      }
    }
  });
  
  // Setup container
  selectElement.parentNode.insertBefore(container, selectElement);
  container.appendChild(display);
  container.appendChild(dropdown);
  selectElement.classList.add('multiselect-hidden');
  
  // Store reference for cleanup
  selectElement._multiselectContainer = container;
  
  const multiselectAPI = {
    updateDisplay,
    updateDropdown,
    getSelectedValues: () => selectedValues,
    setSelectedValues: (values) => {
      selectedValues = values.slice();
      Array.from(selectElement.options).forEach(option => {
        option.selected = selectedValues.includes(option.value);
      });
      updateDisplay();
      updateDropdown();
    },
    destroy: () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      selectElement.classList.remove('multiselect-hidden');
      delete selectElement._multiselectContainer;
      delete selectElement._multiselectAPI;
    }
  };
  
  // Store API reference
  selectElement._multiselectAPI = multiselectAPI;
  
  // Initial update
  updateDisplay();
  updateDropdown();
  
  return multiselectAPI;
}

// Close all ROI multiselects
function closeAllRoiMultiselects() {
  document.querySelectorAll('#roiFiltersDiv .multiselect-display.open').forEach(display => {
    display.classList.remove('open');
  });
  document.querySelectorAll('#roiFiltersDiv .multiselect-dropdown.open').forEach(dropdown => {
    dropdown.classList.remove('open');
  });
}

// Close multiselects when clicking outside (only for ROI)
document.addEventListener('click', (e) => {
  if (!e.target.closest('#roiFiltersDiv .multiselect-container')) {
    closeAllRoiMultiselects();
  }
});

// Debounced filter update to prevent excessive calls
function debouncedFilterUpdate() {
  clearTimeout(filterUpdateTimeout);
  filterUpdateTimeout = setTimeout(() => {
    updateRoiTotalSpend();
    updateRoiDataTable();
    
    // Only update charts if enough time has passed (throttling)
    const now = Date.now();
    if (now - lastChartUpdate > 300) {
      lastChartUpdate = now;
      updateRoiCharts();
    }
  }, 150); // 150ms debounce delay
}

// Check if filter state has changed to avoid unnecessary updates
function hasFilterStateChanged() {
  const currentState = getFilterState();
  const hasChanged = JSON.stringify(currentState) !== JSON.stringify(lastFilterState);
  lastFilterState = currentState;
  return hasChanged;
}

// Get current filter state
function getFilterState() {
  // Helper function to get selected values from multiselect
  const getSelectedValues = (elementId) => {
    const element = document.getElementById(elementId);
    if (element && element._multiselectContainer) {
      return Array.from(element.selectedOptions).map(option => option.value);
    }
    return [];
  };

  return {
    region: getSelectedValues("roiRegionFilter"),
    quarter: getSelectedValues("roiQuarterFilter"),
    country: getSelectedValues("roiCountryFilter"),
    owner: getSelectedValues("roiOwnerFilter"),
    status: getSelectedValues("roiStatusFilter"),
    programType: getSelectedValues("roiProgramTypeFilter"),
    strategicPillars: getSelectedValues("roiStrategicPillarsFilter"),
    revenuePlay: getSelectedValues("roiRevenuePlayFilter"),
  };
}

// Optimized ROI Total Spend and Pipeline Calculation
function updateRoiTotalSpend() {
  // Only update if ROI tab is active
  if (!isRoiTabActive) {
    return;
  }

  // Skip update if filter state hasn't changed
  if (!hasFilterStateChanged()) {
    return;
  }

  // Populate filter dropdowns if not already done (cached)
  populateRoiFilters();

  // Get filter values once
  const filters = getFilterState();

  // Use cached data if available
  let filteredData = [];
  if (window.executionModule.tableInstance) {
    const allData = window.executionModule.tableInstance.getData();
    
    // Helper function to normalize quarter formats for comparison
    const normalizeQuarter = (quarter) => {
      if (!quarter) return '';
      return quarter.replace(/\s*-\s*/g, ' ').trim();
    };
    
    // Optimized filtering with early returns and array support
    filteredData = allData.filter((row) => {
      // Quarter filter with normalization to handle format differences
      let quarterMatch = filters.quarter.length === 0;
      if (!quarterMatch && row.quarter) {
        quarterMatch = filters.quarter.some(filterQuarter => 
          normalizeQuarter(row.quarter) === normalizeQuarter(filterQuarter)
        );
      }
      
      return (filters.region.length === 0 || filters.region.includes(row.region)) &&
             quarterMatch &&
             (filters.country.length === 0 || filters.country.includes(row.country)) &&
             (filters.owner.length === 0 || filters.owner.includes(row.owner)) &&
             (filters.status.length === 0 || filters.status.includes(row.status)) &&
             (filters.programType.length === 0 || filters.programType.includes(row.programType)) &&
             (filters.strategicPillars.length === 0 || filters.strategicPillars.includes(row.strategicPillars)) &&
             (filters.revenuePlay.length === 0 || filters.revenuePlay.includes(row.revenuePlay));
    });
  }

  // Batch calculations for better performance
  let totalSpend = 0;
  let totalPipeline = 0;
  let totalLeads = 0;
  let totalMql = 0;

  // Single loop for all calculations
  filteredData.forEach((row) => {
    // Total spend calculation
    let spendVal = row.actualCost;
    if (typeof spendVal === "string") {
      spendVal = Number(spendVal.toString().replace(/[^\d.-]/g, ""));
    }
    if (!isNaN(spendVal)) totalSpend += Number(spendVal);

    // Total pipeline calculation
    let pipelineVal = row.pipelineForecast;
    if (typeof pipelineVal === "string") {
      pipelineVal = Number(pipelineVal.toString().replace(/[^\d.-]/g, ""));
    }
    if (!isNaN(pipelineVal)) totalPipeline += Number(pipelineVal);

    // Total leads calculation
    let leadsVal = row.actualLeads;
    if (typeof leadsVal === "string") {
      leadsVal = Number(leadsVal.toString().replace(/[^\d.-]/g, ""));
    }
    if (!isNaN(leadsVal)) totalLeads += Number(leadsVal);

    // Total MQL calculation - use only actual MQLs from execution data
    let mqlVal = row.actualMQLs || 0; // Only use actual MQLs, not forecast
    if (typeof mqlVal === "string") {
      mqlVal = Number(mqlVal.toString().replace(/[^\d.-]/g, ""));
    }
    if (!isNaN(mqlVal)) totalMql += Number(mqlVal);
  });

  // Batch DOM updates
  requestAnimationFrame(() => {
    const spendEl = document.getElementById("roiTotalSpendValue");
    if (spendEl) {
      spendEl.textContent = "$" + totalSpend.toLocaleString();
    }

    const pipelineValue = isNaN(totalPipeline) || totalPipeline === undefined ? 0 : totalPipeline;
    const pipelineEl = document.getElementById("roiTotalPipelineValue");
    if (pipelineEl) {
      pipelineEl.textContent = "$" + pipelineValue.toLocaleString();
    }

    const leadsEl = document.getElementById("roiTotalLeadsValue");
    if (leadsEl) {
      leadsEl.textContent = totalLeads.toLocaleString();
    }

    const mqlEl = document.getElementById("roiTotalMqlValue");
    if (mqlEl) {
      mqlEl.textContent = totalMql.toLocaleString();
    }

    // ROI percentage calculation
    let roiPercent = 0;
    if (totalSpend > 0) {
      roiPercent = (totalPipeline / totalSpend) * 100;
    }
    const roiEl = document.getElementById("roiTotalRoiValue");
    if (roiEl) {
      roiEl.textContent = isNaN(roiPercent) ? "0%" : roiPercent.toFixed(1) + "%";
    }
  });

  // Update Total Forecasted Cost value from Planning tab with filters applied
  let totalForecastedCost = 0;
  if (window.planningModule && window.planningModule.tableInstance) {
    const planningData = window.planningModule.tableInstance.getData();
    
    // Helper function to normalize quarter formats for comparison
    const normalizeQuarter = (quarter) => {
      if (!quarter) return '';
      return quarter.replace(/\s*-\s*/g, ' ').trim();
    };
    
    totalForecastedCost = planningData.reduce((sum, row) => {
      // Apply filters to forecasted cost calculation
      if (filters.region && row.region !== filters.region) return sum;
      if (filters.quarter && normalizeQuarter(row.quarter) !== normalizeQuarter(filters.quarter)) return sum;
      if (filters.country && row.country !== filters.country) return sum;
      if (filters.owner && row.owner !== filters.owner) return sum;
      if (filters.status && row.status !== filters.status) return sum;
      if (filters.programType && row.programType !== filters.programType) return sum;
      if (filters.strategicPillars && row.strategicPillars !== filters.strategicPillars) return sum;
      if (filters.revenuePlay && row.revenuePlay !== filters.revenuePlay) return sum;

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

  // Update Remaining Budget and Forecasted Budget Usage with current filters
  updateRemainingBudget(filters);
  updateForecastedBudgetUsage(filters);

  // Note: Program Type Breakdown Table removed in favor of chart visualization
  // The table functionality has been replaced with the compact chart format in the grid
}

// Throttled chart updates for better performance
function updateRoiCharts() {
  if (!isRoiTabActive) return;
  
  requestAnimationFrame(() => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
    renderRoiByQuarterChart();
  });
}

// --- ROI FILTER LOGIC UPDATE START ---
// Update ROI Total Spend and Data Table to use all calendar filters
// Store universal search filters globally for ROI
const universalRoiSearchFilters = new Map();

function getRoiFilterValues() {
  // Helper function to get selected values from multiselect
  const getSelectedValues = (elementId) => {
    const element = document.getElementById(elementId);
    if (element && element._multiselectContainer) {
      return Array.from(element.selectedOptions).map(option => option.value);
    }
    return [];
  };

  // Get values from dropdown filters
  const dropdownFilterValues = {
    region: getSelectedValues("roiRegionFilter"),
    quarter: getSelectedValues("roiQuarterFilter"),
    country: getSelectedValues("roiCountryFilter"),
    owner: getSelectedValues("roiOwnerFilter"),
    status: getSelectedValues("roiStatusFilter"),
    programType: getSelectedValues("roiProgramTypeFilter"),
    strategicPillars: getSelectedValues("roiStrategicPillarsFilter"),
    revenuePlay: getSelectedValues("roiRevenuePlayFilter"),
  };

  // Combine dropdown filters with universal search filters
  const filterValues = {
    region: [...new Set([...dropdownFilterValues.region, ...(universalRoiSearchFilters.get('region') || [])])],
    quarter: [...new Set([...dropdownFilterValues.quarter, ...(universalRoiSearchFilters.get('quarter') || [])])],
    country: [...new Set([...dropdownFilterValues.country, ...(universalRoiSearchFilters.get('country') || [])])],
    owner: [...new Set([...dropdownFilterValues.owner, ...(universalRoiSearchFilters.get('owner') || [])])],
    status: [...new Set([...dropdownFilterValues.status, ...(universalRoiSearchFilters.get('status') || [])])],
    programType: [...new Set([...dropdownFilterValues.programType, ...(universalRoiSearchFilters.get('programType') || [])])],
    strategicPillars: [...new Set([...dropdownFilterValues.strategicPillars, ...(universalRoiSearchFilters.get('strategicPillars') || [])])],
    revenuePlay: [...new Set([...dropdownFilterValues.revenuePlay, ...(universalRoiSearchFilters.get('revenuePlay') || [])])],
    universalRoiSearchFilters: universalRoiSearchFilters
  };

  if (window.DEBUG_FILTERS) {

  }

  return filterValues;
}

// Patch updateRoiTotalSpend
const _originalUpdateRoiTotalSpend = updateRoiTotalSpend;
updateRoiTotalSpend = function () {
  populateRoiFilters();
  const filters = getRoiFilterValues();
  let filteredData = [];
  if (window.executionModule.tableInstance) {
    // Helper function to normalize quarter formats for comparison
    const normalizeQuarter = (quarter) => {
      if (!quarter) return '';
      return quarter.replace(/\s*-\s*/g, ' ').trim();
    };
    
    filteredData = window.executionModule.tableInstance
      .getData()
      .filter((row) => {
        // Quarter filter with normalization to handle format differences
        let quarterMatch = filters.quarter.length === 0;
        if (!quarterMatch && row.quarter) {
          quarterMatch = filters.quarter.some(filterQuarter => 
            normalizeQuarter(row.quarter) === normalizeQuarter(filterQuarter)
          );
        }
        
        return (
          (filters.region.length === 0 || filters.region.includes(row.region)) &&
          quarterMatch &&
          (filters.country.length === 0 || filters.country.includes(row.country)) &&
          (filters.owner.length === 0 || filters.owner.includes(row.owner)) &&
          (filters.status.length === 0 || filters.status.includes(row.status)) &&
          (filters.programType.length === 0 || filters.programType.includes(row.programType)) &&
          (filters.strategicPillars.length === 0 || filters.strategicPillars.includes(row.strategicPillars)) &&
          (filters.revenuePlay.length === 0 || filters.revenuePlay.includes(row.revenuePlay))
        );
      });
  }

  let totalSpend = 0;
  let totalPipeline = 0;
  
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

  // Update Total MQL value - use only actual MQLs from execution data
  let totalMql = 0;
  totalMql = filteredData.reduce((sum, row) => {
    let val = row.actualMQLs || 0; // Only use actual MQLs, not forecast
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
  if (window.planningModule && window.planningModule.tableInstance) {
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
};

// Patch updateRoiDataTable
const _originalUpdateRoiDataTable = updateRoiDataTable;
updateRoiDataTable = function () {
  const table = window.roiDataTableInstance;
  if (!table) {
    return;
  }
  const filters = getRoiFilterValues();
  const campaigns = getCampaignDataForRoi();
  
  // Helper function to normalize quarter formats for comparison
  const normalizeQuarter = (quarter) => {
    if (!quarter) return '';
    return quarter.replace(/\s*-\s*/g, ' ').trim();
  };
  
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Quarter filter with normalization to handle format differences
    let quarterMatch = filters.quarter.length === 0;
    if (!quarterMatch && campaign.quarter) {
      quarterMatch = filters.quarter.some(filterQuarter => 
        normalizeQuarter(campaign.quarter) === normalizeQuarter(filterQuarter)
      );
    }
    
    return (
      (filters.region.length === 0 || filters.region.includes(campaign.region)) &&
      quarterMatch &&
      (filters.country.length === 0 || filters.country.includes(campaign.country)) &&
      (filters.owner.length === 0 || filters.owner.includes(campaign.owner)) &&
      (filters.status.length === 0 || filters.status.includes(campaign.status)) &&
      (filters.programType.length === 0 || filters.programType.includes(campaign.programType)) &&
      (filters.strategicPillars.length === 0 || filters.strategicPillars.includes(campaign.strategicPillars)) &&
      (filters.revenuePlay.length === 0 || filters.revenuePlay.includes(campaign.revenuePlay))
    );
  });
  table.replaceData(filteredCampaigns);
};
// --- ROI FILTER LOGIC UPDATE END ---

// Populate ROI filter dropdowns with caching
function populateRoiFilters() {
  const regionSelect = document.getElementById("roiRegionFilter");
  const quarterSelect = document.getElementById("roiQuarterFilter");
  const countrySelect = document.getElementById("roiCountryFilter");
  const ownerSelect = document.getElementById("roiOwnerFilter");
  const statusSelect = document.getElementById("roiStatusFilter");
  const programTypeSelect = document.getElementById("roiProgramTypeFilter");
  const strategicPillarsSelect = document.getElementById("roiStrategicPillarsFilter");
  const revenuePlaySelect = document.getElementById("roiRevenuePlayFilter");

  if (!regionSelect || !quarterSelect || !countrySelect || !ownerSelect || 
      !statusSelect || !programTypeSelect || !strategicPillarsSelect || !revenuePlaySelect) {
    return;
  }

  // Use cached planning data if available
  if (!cachedPlanningData) {
    cachedPlanningData = window.planningModule?.tableInstance?.getData() || [];
  }

  // Use cached filter options if available
  if (!cachedFilterOptions) {
    const planningData = cachedPlanningData;
    
    // Use Set for better performance with large datasets
    const regionSet = new Set();
    const countrySet = new Set();
    const ownerSet = new Set();
    const statusSet = new Set();
    const programTypeSet = new Set();
    const strategicPillarsSet = new Set();
    const revenuePlaySet = new Set();

    // Single loop to collect all unique values
    planningData.forEach(campaign => {
      if (campaign.region) regionSet.add(campaign.region);
      if (campaign.country) countrySet.add(campaign.country);
      if (campaign.owner) ownerSet.add(campaign.owner);
      if (campaign.status) statusSet.add(campaign.status);
      if (campaign.programType) programTypeSet.add(campaign.programType);
      if (campaign.strategicPillars) strategicPillarsSet.add(campaign.strategicPillars);
      if (campaign.revenuePlay) revenuePlaySet.add(campaign.revenuePlay);
    });

    cachedFilterOptions = {
      regionOptions: Array.from(regionSet).sort(),
      quarterOptions: window.planningModule?.constants?.quarterOptions || [],
      countryOptions: Array.from(countrySet).sort(),
      ownerOptions: Array.from(ownerSet).sort(),
      statusOptions: Array.from(statusSet).sort(),
      programTypeOptions: Array.from(programTypeSet).sort(),
      strategicPillarsOptions: Array.from(strategicPillarsSet).sort(),
      revenuePlayOptions: Array.from(revenuePlaySet).sort(),
    };
  }

  // Create document fragment for better performance
  function populateSelect(select, options, alreadyPopulated) {
    if (alreadyPopulated) return;
    
    const fragment = document.createDocumentFragment();
    options.forEach(option => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = option;
      fragment.appendChild(optionElement);
    });
    select.appendChild(fragment);
  }

  // Only populate if not already populated
  populateSelect(regionSelect, cachedFilterOptions.regionOptions, regionSelect.children.length > 0);
  populateSelect(quarterSelect, cachedFilterOptions.quarterOptions, quarterSelect.children.length > 0);
  populateSelect(countrySelect, cachedFilterOptions.countryOptions, countrySelect.children.length > 0);
  populateSelect(ownerSelect, cachedFilterOptions.ownerOptions, ownerSelect.children.length > 0);
  populateSelect(statusSelect, cachedFilterOptions.statusOptions, statusSelect.children.length > 0);
  populateSelect(programTypeSelect, cachedFilterOptions.programTypeOptions, programTypeSelect.children.length > 0);
  populateSelect(strategicPillarsSelect, cachedFilterOptions.strategicPillarsOptions, strategicPillarsSelect.children.length > 0);
  populateSelect(revenuePlaySelect, cachedFilterOptions.revenuePlayOptions, revenuePlaySelect.children.length > 0);

  // Initialize custom multiselects if not already done
  const selectElements = [
    regionSelect, quarterSelect, countrySelect, ownerSelect, 
    statusSelect, programTypeSelect, strategicPillarsSelect, revenuePlaySelect
  ];

  selectElements.forEach(select => {
    if (!select._multiselectContainer) {
      createRoiMultiselect(select);
    }
  });

  // Set up event listeners for all filters (only once)
  if (!regionSelect.hasEventListener) {
    selectElements.forEach((select) => {
      select.hasEventListener = true;
      select.addEventListener("change", debouncedFilterUpdate);
    });

    // Clear filters button
    const clearButton = document.getElementById("roiClearFilters");
    if (clearButton && !clearButton.hasEventListener) {
      clearButton.hasEventListener = true;
      clearButton.addEventListener("click", () => {
        // Clear all multiselects using the proper API
        selectElements.forEach(select => {
          // Clear select element
          Array.from(select.options).forEach(option => option.selected = false);
          
          // Update multiselect display if it exists
          if (select._multiselectAPI) {
            // Use the multiselect API to properly clear the values
            select._multiselectAPI.setSelectedValues([]);
          } else if (select._multiselectContainer) {
            // Fallback for older multiselect implementation
            const display = select._multiselectContainer.querySelector('.multiselect-display');
            if (display) {
              const placeholder = document.createElement('span');
              placeholder.className = 'multiselect-placeholder';
              placeholder.textContent = `(All ${select.getAttribute('data-placeholder') || 'Options'})`;
              display.innerHTML = '';
              display.appendChild(placeholder);
            }
            
            // Update checkboxes in dropdown
            const checkboxes = select._multiselectContainer.querySelectorAll('.multiselect-dropdown .multiselect-option');
            checkboxes.forEach(option => {
              option.classList.remove('selected');
              const checkbox = option.querySelector('.multiselect-checkbox');
              if (checkbox) checkbox.textContent = '';
            });
          }
        });
        
        // Clear universal search filters
        universalRoiSearchFilters.clear();
        if (window.roiUniversalSearch) {
          window.roiUniversalSearch.clearAllFilters();
        }
        
        // Reset filter state and force update
        lastFilterState = null;
        debouncedFilterUpdate();
      });
    }
  }
}

// Pre-cache planning data when app loads to improve filter performance
function preCachePlanningData() {
  // Cache planning data if not already cached
  if (!cachedPlanningData && window.planningModule?.tableInstance) {
    cachedPlanningData = window.planningModule.tableInstance.getData();
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

    });

  // Calculate actual spend, MQL, and SQL from execution data
  if (window.executionModule && window.executionModule.tableInstance) {
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
  } else {
    // If execution table is not ready, retry after a short delay (max 5 attempts)
    if (typeof updateReportTotalSpend.retryCount === 'undefined') {
      updateReportTotalSpend.retryCount = 0;
    }
    if (updateReportTotalSpend.retryCount < 5) {
      updateReportTotalSpend.retryCount++;
      setTimeout(updateReportTotalSpend, 200);
    } else {

      updateReportTotalSpend.retryCount = 0;
    }
    return;
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

  // Setup execution table event handlers for ROI chart updates, with guard/retry logic
  function attachExecutionTableHandlers(attempt = 0) {
    if (window.executionModule && window.executionModule.tableInstance) {
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
    } else if (attempt < 5) {
      setTimeout(() => attachExecutionTableHandlers(attempt + 1), 200);
    } else {

    }
  }
  attachExecutionTableHandlers();
}

// Initialize ROI functionality on DOM content loaded
function initializeRoiFunctionality() {
  // Mark ROI tab as active
  isRoiTabActive = true;
  
  // If already initialized, force update all components to ensure visibility
  if (roiInitialized) {
    // Force chart re-rendering
    setTimeout(() => {
      renderRoiByRegionChart();
      renderRoiByProgramTypeChart();
      renderRoiByQuarterChart();
      
      // Ensure tab switching is working
      initRoiTabSwitching();
      
      // Update data components
      if (typeof populateRoiFilters === 'function') populateRoiFilters();
      if (typeof updateRoiTotalSpend === 'function') updateRoiTotalSpend();
      
      // Force budget updates
      updateRemainingBudget({});
      updateForecastedBudgetUsage({});
      
      // Ensure data table is visible if on ROI tab
      if (window.location.hash === '#roi' && typeof ensureRoiDataTableInitialized === 'function') {
        ensureRoiDataTableInitialized();
      }
    }, 50);
    
    return;
  }
  
  roiInitialized = true;
  
  // Initialize universal search
  initializeRoiUniversalSearch();
  
  // Use the new DOM element wait function for more reliable initialization
  setTimeout(() => {
    waitForRoiElementsAndInitialize();

    // Populate ROI filters
    populateRoiFilters();

    // Initial remaining budget calculation
    setTimeout(() => {
      updateRemainingBudget({});
      updateForecastedBudgetUsage({});
    }, 100);

    // Lazy load data table only when ROI tab is actually visible
    // This improves initial page load performance
    if (window.location.hash === '#roi') {
      setTimeout(() => {
        window.roiDataTableInstance = initRoiDataTable();
      }, 300);
    }
  }, 200); // Reduced from 700ms for better responsiveness
}

// Lazy initialization of ROI data table
function ensureRoiDataTableInitialized() {
  // Always try to initialize if table doesn't exist, regardless of tab state
  if (!window.roiDataTableInstance) {
    window.roiDataTableInstance = initRoiDataTable();
  }
  return window.roiDataTableInstance;
}

// Function to mark ROI tab as active/inactive for performance optimization
function setRoiTabActive(active) {
  isRoiTabActive = active;
  
  // Clear caches periodically when tab becomes inactive to free memory
  if (!active) {
    setTimeout(() => {
      if (!isRoiTabActive) {
        cachedPlanningData = null;
        cachedFilterOptions = null;
        lastFilterState = null;
      }
    }, 30000); // Clear cache after 30 seconds of inactivity
  }
}

// Initialize ROI Data Table
function initRoiDataTable() {
  const tableContainer = document.getElementById("roiDataTable");
  if (!tableContainer) {
    console.error('ROI table container not found');
    return null;
  }

  // Prevent duplicate initialization
  if (window.roiDataTableInstance) {
    try {
      window.roiDataTableInstance.destroy();
    } catch (e) {
      console.warn('Error destroying previous ROI table instance:', e);
    }
    window.roiDataTableInstance = null;
  }

  if (typeof Tabulator === "undefined") {
    console.error('Tabulator library not loaded');
    return null;
  }

  const campaigns = getCampaignDataForRoi();
  
  try {
    const table = new Tabulator(tableContainer, {
      data: campaigns,
      layout: "fitColumns", // Back to fitColumns for natural column distribution
      height: "100%", // Use full container height
      responsiveLayout: false, // Disable collapse to allow horizontal scroll
      autoResize: true,
      columnCalcs: false, // CRITICAL: Disable column calculations that add extra columns
      placeholder: "No ROI data available",
      placeholderHeaderFilter: "No matching campaigns...",
      columnHeaderVertAlign: "middle",
      layoutColumnsOnNewData: true,
      pagination: "local",
      paginationSize: 10,
      paginationSizeSelector: [5, 10, 15, 25],
      movableColumns: false, // Disable for stability
      resizableColumns: false, // Disable for consistent widths
      tooltips: false,
      tooltipsHeader: false,
      rowHeight: 60,
      headerHeight: 50,
      virtualDom: true,
      virtualDomBuffer: 10,
      scrollToRowIfVisible: false,
      addRowPos: "bottom", // Prevent header row additions
      history: false, // Disable history that might add columns
      clipboard: false, // Disable clipboard that might add columns
      columnDefaults: {
        headerSort: false, // Disable sorting icons that might add space
        headerFilter: false, // Disable header filters that might add space
        editor: false, // Disable editing that might add columns
      },
      tableBuilt: function() {
        setTimeout(() => {
          try {
            this.redraw(true);
            this.recalc();
          } catch (e) {
            console.warn('ROI table build error:', e);
          }
        }, 200);
      },
      dataLoaded: function() {
        setTimeout(() => {
          try {
            this.redraw(true);
            this.recalc();
          } catch (e) {
            console.warn('ROI table data load error:', e);
          }
        }, 150);
      },
      columns: [
        {
          title: "Campaign Name & Type",
          field: "campaignInfo",
          width: 420,
          minWidth: 420,
          maxWidth: 420,
          resizable: false,
          formatter: (cell) => {
            const data = cell.getData();
            const name = data.displayName || data.programType || "Untitled Program";
            const type = data.programType || "No Type";
            return `
            <div style="line-height: 1.4;">
              <div style="font-weight: bold; color: #1976d2; font-size: 0.9em;">${name}</div>
              <div style="font-size: 0.8em; color: #666; margin-top: 2px;">${type}</div>
            </div>
          `;
          },
          sorter: (a, b) => {
            const nameA = (a.programType || "").toLowerCase();
            const nameB = (b.programType || "").toLowerCase();
            return nameA.localeCompare(nameB);
          },
        },
        {
          title: "Forecasted Cost",
          field: "forecastedCost",
          width: 200,
          minWidth: 200,
          maxWidth: 200,
          resizable: false,
          formatter: (cell) => {
            const value = Number(cell.getValue()) || 0;
            return `$${value.toLocaleString()}`;
          },
          sorter: "number",
          hozAlign: "right",
        },
        {
          title: "Actual Cost",
          field: "actualCost",
          width: 180,
          minWidth: 180,
          maxWidth: 180,
          resizable: false,
          formatter: (cell) => {
            const value = Number(cell.getValue()) || 0;
            return `$${value.toLocaleString()}`;
          },
          sorter: "number",
          hozAlign: "right",
        },
        {
          title: "Expected Leads",
          field: "expectedLeads",
          width: 190,
          minWidth: 190,
          maxWidth: 190,
          resizable: false,
          formatter: (cell) => {
            const value = Number(cell.getValue()) || 0;
            return value.toLocaleString();
          },
          sorter: "number",
          hozAlign: "right",
        },
        {
          title: "Actual Leads",
          field: "actualLeads",
          width: 180,
          minWidth: 180,
          maxWidth: 180,
          resizable: false,
          formatter: (cell) => {
            const raw = cell.getValue();
            if (raw === undefined || raw === null || raw === "" || isNaN(Number(raw))) {
              return '<span style="color:#888;font-style:italic;">No Data Available Yet</span>';
            }
            const value = Number(raw);
            return value.toLocaleString();
          },
          sorter: "number",
          hozAlign: "right",
        },
        {
          title: "Pipeline Forecasted",
          field: "pipelineForecast",
          width: 260,
          minWidth: 260,
          maxWidth: 260,
          resizable: false,
          formatter: (cell) => {
            const raw = cell.getValue();
            if (raw === undefined || raw === null || raw === "" || isNaN(Number(raw))) {
              return '<span style="color:#888;font-style:italic;">No Data Available Yet</span>';
            }
            const value = Number(raw);
            return `$${value.toLocaleString()}`;
          },
          sorter: "number",
          hozAlign: "right",
        },
        {
          title: "ROI",
          field: "roi",
          width: 160,
          minWidth: 160,
          maxWidth: 160,
          resizable: false,
          formatter: (cell) => {
            const data = cell.getData();
            const actualCost = Number(data.actualCost) || 0;
            if (actualCost === 0) return "N/A";
            const roi = Number(cell.getValue()) || 0;
            const color = roi >= 0 ? "#4caf50" : "#f44336";
            return `<span style="color: ${color}; font-weight: bold;">${roi.toFixed(1)}%</span>`;
          },
          sorter: (a, b) => {
            return (Number(a.roi) || 0) - (Number(b.roi) || 0);
          },
          hozAlign: "right",
        },
      ] // Exactly 7 columns, no more!
    });

    // Store the table instance globally for updates
    window.roiDataTableInstance = table;

    // --- ROI Data Table Alignment Fix: Enhanced resize handling ---
    // Force Tabulator redraw on window resize to sync header/columns
    if (!window._roiTableResizeListener) {
      window._roiTableResizeListener = true;
      let resizeTimeout;
      
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (window.roiDataTableInstance && typeof window.roiDataTableInstance.redraw === 'function') {
            try {
              // Force complete recalculation
              window.roiDataTableInstance.recalc();
              window.roiDataTableInstance.redraw(true);
            } catch (e) {
              console.warn('ROI table resize redraw error:', e);
            }
          }
        }, 100);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Also handle tab switching with forced recalculation
      const handleTabChange = () => {
        setTimeout(() => {
          if (window.roiDataTableInstance && typeof window.roiDataTableInstance.redraw === 'function') {
            try {
              // Force column alignment on tab change
              window.roiDataTableInstance.recalc();
              window.roiDataTableInstance.redraw(true);
            } catch (e) {
              console.warn('ROI table tab change redraw error:', e);
            }
          }
        }, 200);
      };
      
      // Listen for tab changes (if using hash routing)
      window.addEventListener('hashchange', handleTabChange);
      
      // Listen for visibility change (when tab becomes visible)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          handleTabChange();
        }
      });
    }

    return table;
  } catch (error) {
    console.error('Error initializing ROI data table:', error);
    return null;
  }
}

// Get campaign data for ROI table
function getCampaignDataForRoi() {
  if (!window.planningModule?.tableInstance) {
    // Try fallback data sources silently
    if (window.planningDataCache && Array.isArray(window.planningDataCache)) {
      return window.planningDataCache.slice(0, 10); // Limit to first 10 for initial display
    }
    
    // Return empty array if no data available yet (normal during initialization)
    return [];
  }

  let planningData = window.planningModule.tableInstance.getData();

  // Apply universal search filters if they exist
  if (window.activeRoiSearchFilters && window.activeRoiSearchFilters.length > 0) {
    planningData = planningData.filter((campaign, index) => {
      return window.activeRoiSearchFilters.some(filterId => {
        // The filterId corresponds to campaign index (1-based)
        return (index + 1).toString() === filterId.toString();
      });
    });
  }

  return planningData.map((campaign, index) => {
    const actualCost = Number(campaign.actualCost) || 0;
    const pipelineForecast = Number(campaign.pipelineForecast) || 0;
    
    // Calculate ROI
    let roi = 0;
    if (actualCost > 0) {
      roi = ((pipelineForecast - actualCost) / actualCost) * 100;
    }

    return {
      campaignName: campaign.programType || "Untitled Program",
      displayName: `${index + 1}. ${campaign.programType || "Untitled Program"}`,
      programType: campaign.programType || "No Type",
      forecastedCost: Number(campaign.forecastedCost) || 0,
      actualCost: actualCost,
      expectedLeads: Number(campaign.expectedLeads) || 0,
      actualLeads: Number(campaign.actualLeads) || 0,
      pipelineForecast: pipelineForecast,
      roi: roi, // Add calculated ROI field
      region: campaign.region || "",
      quarter: campaign.quarter || "",
      status: campaign.status || "",
      owner: campaign.owner || "",
    };
  });
}

// Update ROI data table with current filters
function updateRoiDataTable() {
  // Ensure data table is initialized before trying to update it
  const table = ensureRoiDataTableInitialized();
  if (!table) {

    return;
  }

  // Get filter values from ROI filters
  const regionFilter = document.getElementById("roiRegionFilter")?.value || "";
  const quarterFilter =
    document.getElementById("roiQuarterFilter")?.value || "";

  // Helper function to normalize quarter formats for comparison
  const normalizeQuarter = (quarter) => {
    if (!quarter) return '';
    return quarter.replace(/\s*-\s*/g, ' ').trim();
  };

  // Get fresh data
  const campaigns = getCampaignDataForRoi();

  // Apply filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesRegion = !regionFilter || campaign.region === regionFilter;
    const matchesQuarter = !quarterFilter || normalizeQuarter(campaign.quarter) === normalizeQuarter(quarterFilter);
    return matchesRegion && matchesQuarter;
  });

  // Update table data
  table.replaceData(filteredCampaigns);


}

// Handle ROI tab routing logic
function handleRoiTabRouting() {
  const hash = location.hash;
  if (hash === "#roi" && typeof updateRoiTotalSpend === "function") {
    setTimeout(updateRoiTotalSpend, 0);
    setTimeout(initRoiTabSwitching, 100); // Initialize tab switching when ROI tab is viewed

  }
  if (hash === "#report" && typeof updateReportTotalSpend === "function") {
    setTimeout(updateReportTotalSpend, 0);

  }
}

// Initialize ROI universal search
function initializeRoiUniversalSearch() {

  
  // Check if UniversalSearchFilter class is available
  if (!window.UniversalSearchFilter) {


    return;
  }
  

  
  // Check if container exists
  const container = document.getElementById('roiUniversalSearch');
  if (!container) {


    return;
  }
  


  
  try {
    // Initialize universal search for ROI
    window.roiUniversalSearch = new window.UniversalSearchFilter(
      'roiUniversalSearch',
      {
        onFilterChange: (selectedFilters) => {

          applyRoiSearchFilters(selectedFilters);
        }
      }
    );
    
    console.log("✅ ROI: Universal search initialized successfully!");
    
    // Update search data with current ROI data
    updateRoiSearchData();
    
  } catch (error) {
    console.error("❌ ROI: Error initializing universal search:", error);
    console.error("❌ ROI: Error stack:", error.stack);
  }
}

// Apply search filters to ROI view
function applyRoiSearchFilters(selectedFilters) {
  console.log("🔍 ROI: Applying search filters:", selectedFilters);
  
  // Clear existing universal search filters
  universalRoiSearchFilters.clear();
  
  // selectedFilters is an object with categories as keys and arrays as values
  // e.g., { region: ['SAARC'], status: ['Planning'] }
  if (selectedFilters && typeof selectedFilters === 'object') {
    Object.entries(selectedFilters).forEach(([category, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        universalRoiSearchFilters.set(category, new Set(values));
      }
    });
  }
  
  console.log("🔍 ROI: Universal search filters applied:", universalRoiSearchFilters);
  
  // Trigger ROI filter update using existing system
  debouncedFilterUpdate();
}

// Update ROI search data
function updateRoiSearchData() {
  if (!window.roiUniversalSearch) {
    console.log("🔍 ROI: Universal search not initialized yet");
    return;
  }
  
  try {
    const campaigns = getCampaignDataForRoi();
    console.log(`🔍 ROI: Creating filter options from ${campaigns.length} campaigns`);
    
    // Get filter options from planning module constants
    const regionOptions = window.planningModule?.constants?.regionOptions || [];
    const quarterOptions = window.planningModule?.constants?.quarterOptions || [];
    const statusOptions = window.planningModule?.constants?.statusOptions || [];
    const programTypes = window.planningModule?.constants?.programTypes || [];
    const strategicPillars = window.planningModule?.constants?.strategicPillars || [];
    const revenuePlays = window.planningModule?.constants?.revenuePlays || [];
    const fyOptions = window.planningModule?.constants?.fyOptions || [];
    
    // Get unique values from actual ROI data
    const uniqueOwners = Array.from(
      new Set(campaigns.map((c) => c.owner).filter(Boolean)),
    ).sort();
    
    const uniqueCountries = Array.from(
      new Set(campaigns.map((c) => c.country).filter(Boolean)),
    ).sort();
    
    // Create searchable filter options
    const searchData = [];
    
    // Add region filters
    regionOptions.forEach(region => {
      searchData.push({
        id: `region_${region}`,
        title: region,
        category: 'region',
        value: region,
        description: `Filter by ${region} region`,
        type: 'filter'
      });
    });
    
    // Add quarter filters
    quarterOptions.forEach(quarter => {
      const normalizedQuarter = quarter; // ROI might not need normalization
      searchData.push({
        id: `quarter_${normalizedQuarter}`,
        title: normalizedQuarter,
        category: 'quarter',
        value: normalizedQuarter,
        description: `Filter by ${normalizedQuarter}`,
        type: 'filter'
      });
    });
    
    // Add status filters
    statusOptions.forEach(status => {
      searchData.push({
        id: `status_${status}`,
        title: status,
        category: 'status',
        value: status,
        description: `Filter by ${status} status`,
        type: 'filter'
      });
    });
    
    // Add program type filters
    programTypes.forEach(programType => {
      searchData.push({
        id: `programType_${programType}`,
        title: programType,
        category: 'programType',
        value: programType,
        description: `Filter by ${programType}`,
        type: 'filter'
      });
    });
    
    // Add strategic pillar filters
    strategicPillars.forEach(pillar => {
      searchData.push({
        id: `strategicPillars_${pillar}`,
        title: pillar,
        category: 'strategicPillars',
        value: pillar,
        description: `Filter by ${pillar}`,
        type: 'filter'
      });
    });
    
    // Add revenue play filters
    revenuePlays.forEach(revenuePlay => {
      searchData.push({
        id: `revenuePlay_${revenuePlay}`,
        title: revenuePlay,
        category: 'revenuePlay',
        value: revenuePlay,
        description: `Filter by ${revenuePlay}`,
        type: 'filter'
      });
    });
    
    // Add owner filters (from actual data)
    uniqueOwners.forEach(owner => {
      searchData.push({
        id: `owner_${owner}`,
        title: owner,
        category: 'owner',
        value: owner,
        description: `Filter by ${owner}`,
        type: 'filter'
      });
    });
    
    // Add country filters (from actual data)
    uniqueCountries.forEach(country => {
      searchData.push({
        id: `country_${country}`,
        title: country,
        category: 'country',
        value: country,
        description: `Filter by ${country}`,
        type: 'filter'
      });
    });
    
    // Add fiscal year filters
    fyOptions.forEach(fy => {
      searchData.push({
        id: `fiscalYear_${fy}`,
        title: fy,
        category: 'fiscalYear',
        value: fy,
        description: `Filter by ${fy}`,
        type: 'filter'
      });
    });
    
    window.roiUniversalSearch.updateData(searchData);
    console.log("✅ ROI: Search data updated with", searchData.length, "filter options");
    
  } catch (error) {
    console.error("❌ ROI: Error updating search data:", error);
  }
}

// Module exports
const roiModule = {
  updateRoiTotalSpend,
  populateRoiFilters,
  updateReportTotalSpend,
  setupRoiChartEventHandlers,
  initializeRoiFunctionality,
  initializeRoiUniversalSearch,
  handleRoiTabRouting,
  initRoiDataTable,
  getCampaignDataForRoi,
  updateRoiDataTable,
  updateRemainingBudget,
  updateForecastedBudgetUsage,
  loadBudgetsData,
  setRoiTabActive, // New function for tab activity tracking
  updateRoiCharts,  // New function for throttled chart updates
  preCachePlanningData, // New function for pre-caching data
  ensureRoiDataTableInitialized, // New function for lazy data table initialization
  getFilterState, // Export filter state function for charts
  forceRefreshRoiComponents, // Force refresh function for troubleshooting
  waitForRoiElementsAndInitialize, // Wait for DOM elements before initialization
  debugRoiState, // Debug function to troubleshoot initialization issues
};

// Export to window for access from other modules
window.roiModule = roiModule;

// Make debug function globally accessible
window.debugRoi = debugRoiState;

// Remaining Budget Calculation Functions
let budgetsData = null;

// Load budgets data from budgets.json
async function loadBudgetsData() {
  if (budgetsData) return budgetsData;

  try {
    const response = await fetch("data/budgets.json");
    budgetsData = await response.json();
    return budgetsData;
  } catch (error) {
    console.error("[ROI] Error loading budgets data:", error);
    return {};
  }
}

// Update remaining budget calculation
async function updateRemainingBudget(filters) {
  try {
    // Load budgets data
    const budgets = await loadBudgetsData();

    // Calculate total budget (apply region filter only for budget selection)
    let totalBudget = 0;
    for (const [region, data] of Object.entries(budgets)) {
      // Apply region filter if specified
      if (!filters.region || region === filters.region) {
        totalBudget += data.assignedBudget || 0;
      }
    }

    // Calculate total actual cost from execution data (apply ALL filters)
    let totalActualCost = 0;
    if (window.executionModule && window.executionModule.tableInstance) {
      const executionData = window.executionModule.tableInstance.getData();
      
      // Helper function to normalize quarter formats for comparison
      const normalizeQuarter = (quarter) => {
        if (!quarter) return '';
        return quarter.replace(/\s*-\s*/g, ' ').trim();
      };
      
      totalActualCost = executionData.reduce((sum, row) => {
        // Apply all filters
        if (filters.region && row.region !== filters.region) return sum;
        if (filters.quarter && normalizeQuarter(row.quarter) !== normalizeQuarter(filters.quarter)) return sum;
        if (filters.country && row.country !== filters.country) return sum;
        if (filters.owner && row.owner !== filters.owner) return sum;
        if (filters.status && row.status !== filters.status) return sum;
        if (filters.programType && row.programType !== filters.programType) return sum;
        if (filters.strategicPillars && row.strategicPillars !== filters.strategicPillars) return sum;
        if (filters.revenuePlay && row.revenuePlay !== filters.revenuePlay) return sum;

        let val = row.actualCost;
        if (typeof val === "string")
          val = Number(val.toString().replace(/[^\d.-]/g, ""));
        if (!isNaN(val)) sum += Number(val);
        return sum;
      }, 0);
    }
    console.log("[ROI] Total actual cost calculated:", totalActualCost);

    // Calculate remaining budget
    const remainingBudget = totalBudget - totalActualCost;

    // Create filter description for label
    const activeFilters = [];
    if (filters.region) activeFilters.push(`Region: ${filters.region}`);
    if (filters.quarter) activeFilters.push(`Quarter: ${filters.quarter}`);
    if (filters.country) activeFilters.push(`Country: ${filters.country}`);
    if (filters.owner) activeFilters.push(`Owner: ${filters.owner}`);
    if (filters.status) activeFilters.push(`Status: ${filters.status}`);
    if (filters.programType) activeFilters.push(`Program Type: ${filters.programType}`);
    if (filters.strategicPillars) activeFilters.push(`Strategic Pillars: ${filters.strategicPillars}`);
    if (filters.revenuePlay) activeFilters.push(`Revenue Play: ${filters.revenuePlay}`);
    
    const filterText = activeFilters.length > 0 ? ` (${activeFilters.join(', ')})` : " (All Data)";

    // Update the display
    const remainingBudgetEl = document.getElementById(
      "roiRemainingBudgetValue",
    );
    const remainingBudgetBox = document.getElementById("roiRemainingBudgetBox");
    if (remainingBudgetEl) {
      remainingBudgetEl.textContent = "$" + remainingBudget.toLocaleString();
      console.log(
        "[ROI] Updated remaining budget display:",
        remainingBudgetEl.textContent,
      );

      // Update the label to show what's being calculated
      if (remainingBudgetBox) {
        const labelEl = remainingBudgetBox.querySelector("div:first-child");
        if (labelEl) {
          labelEl.textContent = `Remaining Budget${filterText} (Total Budget - Actual Cost)`;
        }
      }
    } else {
      console.error("[ROI] Could not find roiRemainingBudgetValue element");
    }
  } catch (error) {
    console.error("[ROI] Error updating remaining budget:", error);
    const remainingBudgetEl = document.getElementById(
      "roiRemainingBudgetValue",
    );
    if (remainingBudgetEl) {
      remainingBudgetEl.textContent = "$0";
    }
  }
}

// Update forecasted budget usage calculation
async function updateForecastedBudgetUsage(filters) {
  console.log(
    "[ROI] Updating forecasted budget usage with filters:",
    filters,
  );

  try {
    // Load budgets data
    const budgets = await loadBudgetsData();
    console.log(
      "[ROI] Budgets data loaded for forecasted calculation:",
      budgets,
    );

    // Calculate total budget (apply region filter only for budget selection)
    let totalBudget = 0;
    for (const [region, data] of Object.entries(budgets)) {
      // Apply region filter if specified
      if (!filters.region || region === filters.region) {
        totalBudget += data.assignedBudget || 0;
      }
    }

    // Calculate total forecasted cost from planning data (apply ALL filters)
    let totalForecastedCost = 0;
    if (window.planningModule && window.planningModule.tableInstance) {
      const planningData = window.planningModule.tableInstance.getData();
      
      // Helper function to normalize quarter formats for comparison
      const normalizeQuarter = (quarter) => {
        if (!quarter) return '';
        return quarter.replace(/\s*-\s*/g, ' ').trim();
      };
      
      totalForecastedCost = planningData.reduce((sum, row) => {
        // Apply all filters
        if (filters.region && row.region !== filters.region) return sum;
        if (filters.quarter && normalizeQuarter(row.quarter) !== normalizeQuarter(filters.quarter)) return sum;
        if (filters.country && row.country !== filters.country) return sum;
        if (filters.owner && row.owner !== filters.owner) return sum;
        if (filters.status && row.status !== filters.status) return sum;
        if (filters.programType && row.programType !== filters.programType) return sum;
        if (filters.strategicPillars && row.strategicPillars !== filters.strategicPillars) return sum;
        if (filters.revenuePlay && row.revenuePlay !== filters.revenuePlay) return sum;

        let val = row.forecastedCost;
        if (typeof val === "string")
          val = Number(val.toString().replace(/[^\d.-]/g, ""));
        if (!isNaN(val)) sum += Number(val);
        return sum;
      }, 0);
    }
    console.log("[ROI] Total forecasted cost calculated:", totalForecastedCost);

    // Calculate forecasted budget usage (remaining budget after forecasted costs)
    const forecastedBudgetUsage = totalBudget - totalForecastedCost;
    console.log(
      "[ROI] Forecasted budget usage calculated:",
      forecastedBudgetUsage,
    );

    // Create filter description for label
    const activeFilters = [];
    if (filters.region) activeFilters.push(`Region: ${filters.region}`);
    if (filters.quarter) activeFilters.push(`Quarter: ${filters.quarter}`);
    if (filters.country) activeFilters.push(`Country: ${filters.country}`);
    if (filters.owner) activeFilters.push(`Owner: ${filters.owner}`);
    if (filters.status) activeFilters.push(`Status: ${filters.status}`);
    if (filters.programType) activeFilters.push(`Program Type: ${filters.programType}`);
    if (filters.strategicPillars) activeFilters.push(`Strategic Pillars: ${filters.strategicPillars}`);
    if (filters.revenuePlay) activeFilters.push(`Revenue Play: ${filters.revenuePlay}`);
    
    const filterText = activeFilters.length > 0 ? ` (${activeFilters.join(', ')})` : " (All Data)";

    // Update the display
    const forecastedBudgetEl = document.getElementById(
      "roiForecastedBudgetValue",
    );
    const forecastedBudgetBox = forecastedBudgetEl?.parentElement;
    if (forecastedBudgetEl) {
      forecastedBudgetEl.textContent =
        "$" + forecastedBudgetUsage.toLocaleString();
      console.log(
        "[ROI] Updated forecasted budget display:",
        forecastedBudgetEl.textContent,
      );

      // Update the label to show what's being calculated
      if (forecastedBudgetBox) {
        const labelEl = forecastedBudgetBox.querySelector("div:first-child");
        if (labelEl) {
          labelEl.textContent = `Forecasted Budget Usage${filterText} (Total Budget - Forecasted Cost)`;
        }
      }
    } else {
      console.error("[ROI] Could not find roiForecastedBudgetValue element");
    }
  } catch (error) {
    console.error("[ROI] Error updating forecasted budget usage:", error);
    const forecastedBudgetEl = document.getElementById(
      "roiForecastedBudgetValue",
    );
    if (forecastedBudgetEl) {
      forecastedBudgetEl.textContent = "$0";
    }
  }
}

// Debug function to troubleshoot ROI initialization issues (available as window.debugRoi)
function debugRoiState() {
  console.log('🔍 ROI Debug State:');
  console.log('- roiInitialized:', roiInitialized);
  console.log('- isRoiTabActive:', isRoiTabActive);
  console.log('- Current hash:', window.location.hash);
  
  const elements = [
    'view-roi',
    'roiRegionChart',
    'roiQuarterChart', 
    'roiProgramTypeChartContainer',
    'roiRegionTabBtn',
    'roiProgramTypeTabBtn',
    'roiQuarterTabBtn'
  ];
  
  console.log('🔍 Element Status:');
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const isVisible = element.offsetParent !== null;
      const computed = window.getComputedStyle(element);
      console.log(`- ${id}: exists=${!!element}, visible=${isVisible}, display=${computed.display}, visibility=${computed.visibility}`);
    } else {
      console.log(`- ${id}: NOT FOUND`);
    }
  });
  
  console.log('🔍 Chart Instances:');
  console.log('- roiRegionChartInstance:', !!window.roiRegionChartInstance);
  console.log('- roiQuarterChartInstance:', !!window.roiQuarterChartInstance);
  console.log('- roiDataTableInstance:', !!window.roiDataTableInstance);
  
  return {
    roiInitialized,
    isRoiTabActive,
    currentHash: window.location.hash,
    elements: elements.map(id => ({
      id,
      exists: !!document.getElementById(id),
      visible: document.getElementById(id)?.offsetParent !== null
    }))
  };
}

// Wait for DOM elements to be visible before initializing
function waitForRoiElementsAndInitialize() {
  const requiredElements = [
    'roiRegionChart',
    'roiQuarterChart', 
    'roiProgramTypeChartContainer',
    'roiRegionTabBtn',
    'roiProgramTypeTabBtn',
    'roiQuarterTabBtn'
  ];
  
  const checkElements = () => {
    // First check if the chart tabs container is visible
    const tabsContainer = document.getElementById('roiChartTabsContainer');
    if (!tabsContainer || tabsContainer.style.display === 'none') {
      return false;
    }
    
    const missingElements = requiredElements.filter(id => {
      const element = document.getElementById(id);
      if (!element) {
        return true;
      }
      
      // Check if element is actually visible (not just existing)
      const isVisible = element.offsetParent !== null;
      if (!isVisible) {
        return true;
      }
      
      return false;
    });
    
    if (missingElements.length === 0) {
      // All elements are visible, proceed with initialization
      setTimeout(() => {
        renderRoiByRegionChart();
        renderRoiByProgramTypeChart();
        renderRoiByQuarterChart();
        initRoiTabSwitching();
      }, 50);
      return true;
    } else {
      return false;
    }
  };
  
  // Try immediately
  if (!checkElements()) {
    // If not ready, retry up to 15 times with 200ms intervals (3 seconds total)
    let attempts = 0;
    const maxAttempts = 15;
    
    const retryInterval = setInterval(() => {
      attempts++;
      
      if (checkElements() || attempts >= maxAttempts) {
        clearInterval(retryInterval);
        
        if (attempts >= maxAttempts) {
          // Force show the tabs container one more time
          const tabsContainer = document.getElementById('roiChartTabsContainer');
          if (tabsContainer) {
            tabsContainer.style.display = 'block';
            tabsContainer.style.visibility = 'visible';
          }
          
          renderRoiByRegionChart();
          renderRoiByProgramTypeChart();
          renderRoiByQuarterChart();
          initRoiTabSwitching();
        }
      }
    }, 200);
  }
}

// Force refresh all ROI components (charts, tables, data)
function forceRefreshRoiComponents() {
  return new Promise((resolve) => {
    // Set active flag
    isRoiTabActive = true;
    
    // Ensure ROI section is visible
    const roiSection = document.getElementById('view-roi');
    if (roiSection) {
      roiSection.style.display = 'block';
    }
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      try {
        // Use the wait function for more reliable initialization
        waitForRoiElementsAndInitialize();
        
        // Update all data components
        populateRoiFilters();
        updateRoiTotalSpend();
        updateRemainingBudget({});
        updateForecastedBudgetUsage({});
        
        // Ensure data table is initialized if on ROI tab
        if (window.location.hash === '#roi') {
          ensureRoiDataTableInitialized();
        }
        
        resolve();
      } catch (error) {
        console.error('❌ Error during ROI components force refresh:', error);
        resolve(); // Still resolve to avoid hanging
      }
    });
  });
}

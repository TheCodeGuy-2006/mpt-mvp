// roi.js - ROI and Reporting Module
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
            ${option.text}
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
          ${firstOption.text}
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

    // Total MQL calculation
    let mqlVal = row.actualMQLs || row.mqlForecast;
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
function getRoiFilterValues() {
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
        // Clear all multiselects
        selectElements.forEach(select => {
          // Clear select element
          Array.from(select.options).forEach(option => option.selected = false);
          
          // Update multiselect display if it exists
          if (select._multiselectContainer) {
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
  // Mark ROI tab as active
  isRoiTabActive = true;
  
  // Only initialize once
  if (roiInitialized) {
    // Just update the data if already initialized
    if (typeof populateRoiFilters === 'function') populateRoiFilters();
    if (typeof updateRoiTotalSpend === 'function') updateRoiTotalSpend();
    return;
  }
  
  roiInitialized = true;
  
  setTimeout(() => {
    renderRoiByRegionChart();
    renderRoiByProgramTypeChart();
    renderRoiByQuarterChart();
    initRoiTabSwitching(); // Initialize ROI tab functionality

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
  if (!window.roiDataTableInstance && isRoiTabActive) {
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
    console.error("ROI Data Table container not found");
    return null;
  }

  if (typeof Tabulator === "undefined") {
    console.error("Tabulator library not loaded");
    return null;
  }

  const campaigns = getCampaignDataForRoi();
  
  try {
    const table = new Tabulator(tableContainer, {
      data: campaigns,
      layout: "fitDataStretch",
      height: "400px",
      responsiveLayout: "collapse",
      pagination: "local",
      paginationSize: 10, // Reduced from 15 for faster initial load
      paginationSizeSelector: [5, 10, 15, 25],
      movableColumns: true,
      resizableColumns: true,
      tooltips: false, // Disabled for better performance
      tooltipsHeader: false, // Disabled for better performance
      rowHeight: 60,
      headerHeight: 50,
      virtualDom: true, // Enable virtual DOM for better performance with large datasets
      virtualDomBuffer: 10, // Buffer for smoother scrolling
      columns: [
        {
          title: "Campaign Name & Type",
          field: "campaignInfo",
          formatter: (cell) => {
            const data = cell.getData();
            const name = data.displayName || data.programType || "Untitled Program";
            const type = data.programType || "No Type";
            return `
            <div style="line-height: 1.4;">
              <div style="font-weight: bold; color: #1976d2; font-size: 0.95em;">${name}</div>
              <div style="font-size: 0.8em; color: #666; margin-top: 2px;">${type}</div>
            </div>
          `;
          },
          width: 220,
          sorter: (a, b) => {
            const nameA = (a.programType || "").toLowerCase();
            const nameB = (b.programType || "").toLowerCase();
            return nameA.localeCompare(nameB);
          },
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
          hozAlign: "right",
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
          hozAlign: "right",
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
          hozAlign: "right",
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
          hozAlign: "right",
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
          hozAlign: "right",
        },
        {
          title: "ROI",
          field: "roi",
          formatter: (cell) => {
            const data = cell.getData();
            const actualCost = Number(data.actualCost) || 0;
            
            if (actualCost === 0) return "N/A";
            
            const roi = Number(cell.getValue()) || 0;
            const color = roi >= 0 ? "#4caf50" : "#f44336";

            return `<span style="color: ${color}; font-weight: bold;">${roi.toFixed(1)}%</span>`;
          },
          width: 100,
          sorter: (a, b) => {
            return (Number(a.roi) || 0) - (Number(b.roi) || 0);
          },
          hozAlign: "right",
        },
      ],
      pagination: "local",
      paginationSize: 15,
      paginationSizeSelector: [10, 15, 25, 50],
      movableColumns: true,
      resizableColumns: true,
      tooltips: true,
      tooltipsHeader: true,
    });

    // Store the table instance globally for updates
    window.roiDataTableInstance = table;

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
    console.log("ROI Data Table could not be initialized");
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
  console.log(
    `ROI Data Table updated with ${filteredCampaigns.length} campaigns`,
  );
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
  updateForecastedBudgetUsage,
  loadBudgetsData,
  setRoiTabActive, // New function for tab activity tracking
  updateRoiCharts,  // New function for throttled chart updates
  preCachePlanningData, // New function for pre-caching data
  ensureRoiDataTableInitialized, // New function for lazy data table initialization
  getFilterState, // Export filter state function for charts
};

// Export to window for access from other modules
window.roiModule = roiModule;

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

export default roiModule;

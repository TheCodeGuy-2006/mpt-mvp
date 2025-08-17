// calendar.js - Campaign Calendar Module

// Performance configuration for calendar operations
const CALENDAR_PERFORMANCE_CONFIG = {
  // Debounce timing for different operations
  RENDER_DEBOUNCE: 150,     // Calendar re-render debounce
  FILTER_DEBOUNCE: 250,     // Filter application debounce
  RESIZE_DEBOUNCE: 200,     // Window resize debounce
  
  // Calendar optimization
  BATCH_SIZE: 50,           // Process events in batches
  ANIMATION_DURATION: 150,  // Reduced animation time
  UPDATE_THROTTLE: 100,     // DOM update throttling
};

// Debounce utility for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for high-frequency events
function throttle(func, wait) {
  let lastTime = 0;
  return function executedFunction(...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func.apply(this, args);
    }
  };
}

// CALENDAR FILTER MULTISELECT FUNCTIONALITY

// Custom multiselect implementation for calendar filters
function createCalendarMultiselect(selectElement) {
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
      closeAllCalendarMultiselects();
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

// Close all calendar multiselects
function closeAllCalendarMultiselects() {
  document.querySelectorAll('#calendarFilters .multiselect-display.open').forEach(display => {
    display.classList.remove('open');
  });
  document.querySelectorAll('#calendarFilters .multiselect-dropdown.open').forEach(dropdown => {
    dropdown.classList.remove('open');
  });
}

// Close calendar multiselects when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#calendarFilters .multiselect-container')) {
    closeAllCalendarMultiselects();
  }
});

// Calendar state with performance optimizations
let currentFY = "FY25";
let currentDate = new Date();
let availableFYs = [];
let activeFilters = {
  region: [],
  country: [],
  owner: [],
  status: [],
  programType: [],
  strategicPillars: [],
  revenuePlay: [],
  quarter: [],
};

// Universal search filters for calendar
const universalCalendarSearchFilters = new Map();

// Quarter normalization function to handle format differences ("Q1 July" vs "Q1 - July")
function normalizeQuarter(quarter) {
  if (!quarter || typeof quarter !== 'string') return quarter;
  return quarter.replace(/\s*-\s*/, ' ');
}

// Performance cache for calendar data
const calendarCache = {
  campaigns: null,
  filteredData: new Map(),
  lastUpdate: 0,
  
  // Clear cache when data changes
  invalidate() {
    this.campaigns = null;
    this.filteredData.clear();
    this.lastUpdate = 0;
  },
  
  // Get cached campaigns or fetch fresh data
  getCampaigns() {
    const now = Date.now();
    if (!this.campaigns || (now - this.lastUpdate) > 10000) { // Reduced cache time to 10 seconds for faster updates
      // Try multiple ways to access planning data
      let rawCampaigns = [];
      
      // First try: direct access to planningTableInstance
      if (window.planningTableInstance && typeof window.planningTableInstance.getData === 'function') {
        rawCampaigns = window.planningTableInstance.getData() || [];
        console.log(`Calendar: Got ${rawCampaigns.length} campaigns from planningTableInstance`);
      }
      // Second try: access through planningModule
      else if (window.planningModule?.tableInstance && typeof window.planningModule.tableInstance.getData === 'function') {
        rawCampaigns = window.planningModule.tableInstance.getData() || [];
        console.log(`Calendar: Got ${rawCampaigns.length} campaigns from planningModule.tableInstance`);
      }
      // Fallback: try to load from cached data
      else if (window.planningDataCache && Array.isArray(window.planningDataCache)) {
        rawCampaigns = window.planningDataCache;
        console.log(`Calendar: Got ${rawCampaigns.length} campaigns from planningDataCache`);
      }
      else {
        console.warn('Calendar: No planning data source available - returning empty array for now');
        // Return empty array instead of blocking, skeleton will show
        return this.campaigns || [];
      }
      
      // Add index numbers to campaigns for display
      this.campaigns = rawCampaigns.map((campaign, index) => ({
        ...campaign,
        index: index + 1
      }));
      
      this.lastUpdate = now;
      console.log(`Calendar: Cached ${this.campaigns.length} campaigns with index numbers`);
    }
    return this.campaigns;
  },
  
  // Cache filtered results
  getFilteredCampaigns(cacheKey, filterFn) {
    if (this.filteredData.has(cacheKey)) {
      return this.filteredData.get(cacheKey);
    }
    
    const result = filterFn();
    this.filteredData.set(cacheKey, result);
    return result;
  }
};

// Get campaigns from planning data (cached)
function getCampaignData() {
  let campaigns = calendarCache.getCampaigns();

  // Exclude Contractor/Infrastructure program type from calendar (exact match, case-insensitive, trimmed)
  campaigns = campaigns.filter(campaign => {
    const pt = (campaign.programType || '').toLowerCase().trim();
    return pt !== 'contractor/infrastructure';
  });

  // Apply universal search filters if they exist
  if (window.activeCalendarSearchFilters && window.activeCalendarSearchFilters.length > 0) {
    campaigns = campaigns.filter(campaign => {
      return window.activeCalendarSearchFilters.some(filterId => {
        // The filterId corresponds to campaign index
        return campaign.index && campaign.index.toString() === filterId.toString();
      });
    });
  }

  return campaigns;
}

// Parse quarter to get month and year
function parseQuarterToDate(quarter, fiscalYear) {
  // Normalize quarter format - remove dashes to handle both "Q1 July" and "Q1 - July" formats
  const normalizedQuarter = quarter ? quarter.replace(/\s*-\s*/g, ' ') : '';
  
  const quarterMap = {
    "Q1 July": { month: 6, year: getFYStartYear(fiscalYear) }, // July (month 6, 0-indexed)
    "Q1 August": { month: 7, year: getFYStartYear(fiscalYear) }, // August
    "Q1 September": { month: 8, year: getFYStartYear(fiscalYear) }, // September
    "Q2 October": { month: 9, year: getFYStartYear(fiscalYear) }, // October
    "Q2 November": { month: 10, year: getFYStartYear(fiscalYear) }, // November
    "Q2 December": { month: 11, year: getFYStartYear(fiscalYear) }, // December
    "Q3 January": { month: 0, year: getFYStartYear(fiscalYear) + 1 }, // January (next calendar year)
    "Q3 February": { month: 1, year: getFYStartYear(fiscalYear) + 1 }, // February
    "Q3 March": { month: 2, year: getFYStartYear(fiscalYear) + 1 }, // March
    "Q4 April": { month: 3, year: getFYStartYear(fiscalYear) + 1 }, // April
    "Q4 May": { month: 4, year: getFYStartYear(fiscalYear) + 1 }, // May
    "Q4 June": { month: 5, year: getFYStartYear(fiscalYear) + 1 }, // June
  };

  return (
    quarterMap[normalizedQuarter] || {
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    }
  );
}

// Get the starting calendar year for a fiscal year
function getFYStartYear(fiscalYear) {
  const fyNumber = parseInt(fiscalYear.replace("FY", ""));
  return 2000 + fyNumber - 1; // FY25 starts in 2024
}

// Get all available fiscal years from planning data
function getAvailableFYs() {
  const campaigns = getCampaignData();
  const fys = new Set();
  campaigns.forEach((campaign) => {
    if (campaign.fiscalYear) {
      fys.add(campaign.fiscalYear);
    }
  });
  return Array.from(fys).sort();
}

// Get campaigns for a specific month/year with filtering (internal, non-debounced)
function getCampaignsForMonthInternal(month, year) {
  const campaigns = getCampaignData();
  
  // Early return for empty data
  if (!campaigns.length) return [];
  
  // Use more efficient filtering approach
  const filteredCampaigns = [];
  
  for (let i = 0; i < campaigns.length; i++) {
    const campaign = campaigns[i];
    
    // Quick validation checks first
    if (!campaign.quarter || !campaign.fiscalYear) continue;
    
    // Skip fiscal year filter if "All Years" is selected
    if (currentFY !== "All Years" && campaign.fiscalYear !== currentFY) continue;

    const campaignDate = parseQuarterToDate(campaign.quarter, campaign.fiscalYear);
    if (campaignDate.month !== month || campaignDate.year !== year) continue;

    // Apply active filters with early exit - now working with arrays
    if (activeFilters.region.length > 0 && !activeFilters.region.includes(campaign.region)) continue;
    if (activeFilters.country.length > 0 && !activeFilters.country.includes(campaign.country)) continue;
    if (activeFilters.quarter.length > 0 && !activeFilters.quarter.includes(normalizeQuarter(campaign.quarter))) continue;
    if (activeFilters.owner.length > 0 && !activeFilters.owner.includes(campaign.owner)) continue;
    if (activeFilters.status.length > 0 && !activeFilters.status.includes(campaign.status)) continue;
    if (activeFilters.programType.length > 0 && !activeFilters.programType.includes(campaign.programType)) continue;
    if (activeFilters.strategicPillars.length > 0 && !activeFilters.strategicPillars.includes(campaign.strategicPillars)) continue;
    if (activeFilters.revenuePlay.length > 0 && !activeFilters.revenuePlay.includes(campaign.revenuePlay)) continue;

    filteredCampaigns.push(campaign);
  }
  
  return filteredCampaigns;
}

// Get campaigns for a specific month/year with filtering (optimized, debounced for UI)
const getCampaignsForMonth = debounce((month, year) => {
  return getCampaignsForMonthInternal(month, year);
}, CALENDAR_PERFORMANCE_CONFIG.FILTER_DEBOUNCE);

// Get unique filter options from campaign data
function getFilterOptions() {
  // Filter campaigns based on current FY selection
  const campaigns = currentFY === "All Years" 
    ? getCampaignData() 
    : getCampaignData().filter((c) => c.fiscalYear === currentFY);

  const options = {
    regions: new Set(),
    countries: new Set(),
    owners: new Set(),
    statuses: new Set(),
    programTypes: new Set(),
    strategicPillars: new Set(),
    revenuePlays: new Set(),
    quarters: new Set(),
  };

  campaigns.forEach((campaign) => {
    if (campaign.region) options.regions.add(campaign.region);
    if (campaign.country) options.countries.add(campaign.country);
    if (campaign.owner) options.owners.add(campaign.owner);
    if (campaign.status) options.statuses.add(campaign.status);
    if (campaign.programType) options.programTypes.add(campaign.programType);
    if (campaign.strategicPillars)
      options.strategicPillars.add(campaign.strategicPillars);
    if (campaign.revenuePlay) options.revenuePlays.add(campaign.revenuePlay);
    if (campaign.quarter) options.quarters.add(normalizeQuarter(campaign.quarter));
  });

  return {
    regions: Array.from(options.regions).sort(),
    countries: Array.from(options.countries).sort(),
    owners: Array.from(options.owners).sort(),
    statuses: Array.from(options.statuses).sort(),
    programTypes: Array.from(options.programTypes).sort(),
    strategicPillars: Array.from(options.strategicPillars).sort(),
    revenuePlays: Array.from(options.revenuePlays).sort(),
    quarters: Array.from(options.quarters).sort(),
  };
}

// Get calendar filter values (used by universal search and main filtering)
function getCalendarFilterValues() {
  const filterOptions = getFilterOptions();
  
  return {
    region: filterOptions.regions,
    country: filterOptions.countries,
    owner: filterOptions.owners,
    status: filterOptions.statuses,
    programType: filterOptions.programTypes,
    strategicPillars: filterOptions.strategicPillars,
    revenuePlay: filterOptions.revenuePlays,
    quarter: filterOptions.quarters,
    universalCalendarSearchFilters: universalCalendarSearchFilters
  };
}

// Render filter controls
function renderFilterControls() {
  const filterContainer = document.getElementById("calendarFilters");
  if (!filterContainer) return;

  const filterOptions = getFilterOptions();
  const regionLegend = getRegionColorLegend();

  filterContainer.innerHTML = `
    <div class="filter-container">
      <!-- Region Color Legend -->
      ${regionLegend.length > 0 ? `
        <div style="
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          border-left: 4px solid #1976d2;
        ">
          <h5 style="margin: 0 0 8px 0; color: #0969da; font-size: 14px;">🎨 Region Color Guide:</h5>
          <div style="
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
          ">
            ${regionLegend.map(item => `
              <div style="
                display: flex;
                align-items: center;
                gap: 6px;
                background: white;
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
              ">
                <div style="
                  width: 16px;
                  height: 16px;
                  background: ${item.color};
                  border-radius: 3px;
                  border: 1px solid rgba(0,0,0,0.1);
                "></div>
                <span style="font-size: 13px; font-weight: 500; color: #333;">${item.region}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="filter-row filter-row-main">
        <div class="filter-group">
          <label for="filterRegion">Region</label>
          <select id="filterRegion" class="filter-select" multiple data-placeholder="Regions">
            ${filterOptions.regions
              .map(
                (region) =>
                  `<option value="${region}" ${activeFilters.region.includes(region) ? "selected" : ""}>${region}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterCountry">Country</label>
          <select id="filterCountry" class="filter-select" multiple data-placeholder="Countries">
            ${filterOptions.countries
              .map(
                (country) =>
                  `<option value="${country}" ${activeFilters.country.includes(country) ? "selected" : ""}>${country}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterQuarter">Quarter</label>
          <select id="filterQuarter" class="filter-select" multiple data-placeholder="Quarters">
            ${filterOptions.quarters
              .map(
                (quarter) =>
                  `<option value="${quarter}" ${activeFilters.quarter.includes(quarter) ? "selected" : ""}>${quarter}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterOwner">Owner</label>
          <select id="filterOwner" class="filter-select" multiple data-placeholder="Owners">
            ${filterOptions.owners
              .map(
                (owner) =>
                  `<option value="${owner}" ${activeFilters.owner.includes(owner) ? "selected" : ""}>${owner}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterStatus">Status</label>
          <select id="filterStatus" class="filter-select" multiple data-placeholder="Statuses">
            ${filterOptions.statuses
              .map(
                (status) =>
                  `<option value="${status}" ${activeFilters.status.includes(status) ? "selected" : ""}>${status}</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>
      
      <div class="filter-row filter-row-secondary">
        <div class="filter-group">
          <label for="filterProgramType">Program Type</label>
          <select id="filterProgramType" class="filter-select" multiple data-placeholder="Program Types">
            ${filterOptions.programTypes
              .map(
                (type) =>
                  `<option value="${type}" ${activeFilters.programType.includes(type) ? "selected" : ""}>${type}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterStrategicPillars">Strategic Pillars</label>
          <select id="filterStrategicPillars" class="filter-select" multiple data-placeholder="Strategic Pillars">
            ${filterOptions.strategicPillars
              .map(
                (pillar) =>
                  `<option value="${pillar}" ${activeFilters.strategicPillars.includes(pillar) ? "selected" : ""}>${pillar}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterRevenuePlay">Revenue Play</label>
          <select id="filterRevenuePlay" class="filter-select" multiple data-placeholder="Revenue Plays">
            ${filterOptions.revenuePlays
              .map(
                (play) =>
                  `<option value="${play}" ${activeFilters.revenuePlay.includes(play) ? "selected" : ""}>${play}</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>
      
      <div class="filter-actions">
        <button id="clearFilters" class="filter-btn filter-btn-clear">
          Clear All Filters
        </button>
      </div>
      
      <div id="filterSummary" style="margin-top: 8px; color: #666; font-size: 0.85rem; font-style: italic;"></div>
    </div>
  `;

  // Initialize custom multiselects
  const selectElements = [
    document.getElementById("filterRegion"),
    document.getElementById("filterCountry"),
    document.getElementById("filterQuarter"),
    document.getElementById("filterOwner"),
    document.getElementById("filterStatus"),
    document.getElementById("filterProgramType"),
    document.getElementById("filterStrategicPillars"),
    document.getElementById("filterRevenuePlay")
  ].filter(Boolean);

  selectElements.forEach(select => {
    if (!select._multiselectContainer) {
      createCalendarMultiselect(select);
    }
  });

  // Set up filter event listeners
  setupFilterEventListeners();
  updateFilterSummary();
}

// Set up filter event listeners
function setupFilterEventListeners() {
  const filterIds = [
    "filterRegion",
    "filterCountry",
    "filterQuarter",
    "filterOwner",
    "filterStatus",
    "filterProgramType",
    "filterStrategicPillars",
    "filterRevenuePlay",
  ];

  // Debounced filter application for better performance
  const debouncedApplyFilters = debounce(applyFilters, CALENDAR_PERFORMANCE_CONFIG.FILTER_DEBOUNCE);

  filterIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      // Auto-update on change with debouncing for better performance
      element.addEventListener("change", debouncedApplyFilters);
    }
  });

  // Clear filters button
  const clearBtn = document.getElementById("clearFilters");
  if (clearBtn) {
    clearBtn.addEventListener("click", clearAllFilters);
  }
}

// Update filter summary
function updateFilterSummary() {
  const summary = document.getElementById("filterSummary");
  if (!summary) return;

  const activeCount = Object.values(activeFilters).filter(
    (f) => Array.isArray(f) && f.length > 0,
  ).length;
  
  const campaigns = getCampaignData();
  const totalCampaigns = campaigns.filter(
    (c) => c.fiscalYear === currentFY,
  ).length;

  // Count filtered campaigns
  let filteredCount = 0;
  
  // Only calculate if we have valid fiscal year
  if (currentFY && currentFY !== "") {
    const months = [
      { month: 6, year: getFYStartYear(currentFY) },
      { month: 7, year: getFYStartYear(currentFY) },
      { month: 8, year: getFYStartYear(currentFY) },
      { month: 9, year: getFYStartYear(currentFY) },
      { month: 10, year: getFYStartYear(currentFY) },
      { month: 11, year: getFYStartYear(currentFY) },
      { month: 0, year: getFYStartYear(currentFY) + 1 },
      { month: 1, year: getFYStartYear(currentFY) + 1 },
      { month: 2, year: getFYStartYear(currentFY) + 1 },
      { month: 3, year: getFYStartYear(currentFY) + 1 },
      { month: 4, year: getFYStartYear(currentFY) + 1 },
      { month: 5, year: getFYStartYear(currentFY) + 1 },
    ];

    months.forEach((monthInfo) => {
      try {
        const monthCampaigns = getCampaignsForMonthInternal(
          monthInfo.month,
          monthInfo.year,
        );
        filteredCount += (monthCampaigns && monthCampaigns.length) || 0;
      } catch (error) {
        console.warn('Error getting campaigns for month:', monthInfo, error);
      }
    });
  }

  if (activeCount === 0) {
    summary.textContent = `Showing all ${totalCampaigns} campaigns`;
  } else {
    summary.textContent = `${activeCount} filter${activeCount !== 1 ? "s" : ""} active • Showing ${filteredCount} of ${totalCampaigns} campaigns`;
  }
}

// Apply filters (optimized)
function applyFilters() {
  // Get current filter values from the multiselects
  const regionFilter = document.getElementById("filterRegion");
  const countryFilter = document.getElementById("filterCountry");
  const quarterFilter = document.getElementById("filterQuarter");
  const ownerFilter = document.getElementById("filterOwner");
  const statusFilter = document.getElementById("filterStatus");
  const programTypeFilter = document.getElementById("filterProgramType");
  const strategicPillarsFilter = document.getElementById("filterStrategicPillars");
  const revenuePlayFilter = document.getElementById("filterRevenuePlay");

  // Update activeFilters from multiselect values
  if (regionFilter && regionFilter._multiselectContainer) {
    activeFilters.region = Array.from(regionFilter.selectedOptions).map(option => option.value);
  }
  if (countryFilter && countryFilter._multiselectContainer) {
    activeFilters.country = Array.from(countryFilter.selectedOptions).map(option => option.value);
  }
  if (quarterFilter && quarterFilter._multiselectContainer) {
    activeFilters.quarter = Array.from(quarterFilter.selectedOptions).map(option => option.value);
  }
  if (ownerFilter && ownerFilter._multiselectContainer) {
    activeFilters.owner = Array.from(ownerFilter.selectedOptions).map(option => option.value);
  }
  if (statusFilter && statusFilter._multiselectContainer) {
    activeFilters.status = Array.from(statusFilter.selectedOptions).map(option => option.value);
  }
  if (programTypeFilter && programTypeFilter._multiselectContainer) {
    activeFilters.programType = Array.from(programTypeFilter.selectedOptions).map(option => option.value);
  }
  if (strategicPillarsFilter && strategicPillarsFilter._multiselectContainer) {
    activeFilters.strategicPillars = Array.from(strategicPillarsFilter.selectedOptions).map(option => option.value);
  }
  if (revenuePlayFilter && revenuePlayFilter._multiselectContainer) {
    activeFilters.revenuePlay = Array.from(revenuePlayFilter.selectedOptions).map(option => option.value);
  }

  // Integrate universal search filters
  universalCalendarSearchFilters.forEach((values, category) => {
    if (activeFilters.hasOwnProperty(category)) {
      // Merge universal search filters with existing activeFilters
      const existingValues = new Set(activeFilters[category]);
      values.forEach(value => existingValues.add(value));
      activeFilters[category] = Array.from(existingValues);
    }
  });

  // Use requestAnimationFrame for smooth UI updates
  requestAnimationFrame(() => {
    updateFilterSummary();
    renderCalendar();
  });
}

// Clear all filters
function clearAllFilters() {
  activeFilters = {
    region: [],
    country: [],
    quarter: [],
    owner: [],
    status: [],
    programType: [],
    strategicPillars: [],
    revenuePlay: [],
  };

  // Reset all filter dropdowns and their multiselect displays
  const filterIds = [
    "filterRegion",
    "filterCountry",
    "filterQuarter",
    "filterOwner",
    "filterStatus",
    "filterProgramType",
    "filterStrategicPillars",
    "filterRevenuePlay",
  ];

  filterIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      // Clear select element
      element.value = "";
      Array.from(element.options).forEach(option => option.selected = false);
      
      // Update multiselect display if it exists
      if (element._multiselectContainer) {
        const display = element._multiselectContainer.querySelector('.multiselect-display');
        if (display) {
          display.innerHTML = element.getAttribute('data-placeholder') || 'Select options...';
        }
        
        // Update checkboxes in dropdown
        const checkboxes = element._multiselectContainer.querySelectorAll('.multiselect-dropdown input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
      }
    }
  });

  // Clear universal search filters
  universalCalendarSearchFilters.clear();
  if (window.calendarUniversalSearch) {
    window.calendarUniversalSearch.clearFilters();
  }

  updateFilterSummary();
  renderCalendar();
}

// Get status color
function getStatusColor(status) {
  const colors = {
    Planning: "#ff9800",
    "On Track": "#4caf50",
    Shipped: "#2196f3",
    Cancelled: "#f44336",
  };
  return colors[status] || "#607d8b";
}

// Get region color for campaigns
function getRegionColor(region) {
  const colors = {
    "JP & Korea": "#7db4e8",         // Soft blue - darker but still gentle
    "South APAC": "#7dc67d",         // Soft green - darker but still gentle
    "SAARC": "#e87d7d",              // Soft red/pink - darker but still gentle
    "X APAC Non English": "#b17de8", // Soft purple - darker but still gentle
    "X APAC English": "#ffaa66",     // Soft orange - darker but still gentle
    // Legacy/fallback colors for backward compatibility
    "APAC": "#9ec0e0",               // Medium soft blue
    "EMEA": "#9ed0a8", 
    "Americas": "#e0a0a0",           // Medium soft red
    "Global": "#b8c5d2",             // Medium muted
    "NA": "#ffc999",                 // Medium soft orange
    "LATAM": "#c0a0e0",              // Medium soft purple
    "ANZ": "#a0c8e8",                // Medium soft blue
    "India": "#a8d8a8",              // Medium soft green
    "China": "#e8a8a8",              // Medium soft red
  };
  return colors[region] || "#b8c5d2"; // Medium muted grey for unknown regions
}

// Get region colors for the legend
function getRegionColorLegend() {
  const campaigns = getCampaignData().filter((c) => c.fiscalYear === currentFY);
  const regionsInUse = new Set();
  
  campaigns.forEach((campaign) => {
    if (campaign.region) {
      regionsInUse.add(campaign.region);
    }
  });
  
  const legend = [];
  regionsInUse.forEach((region) => {
    legend.push({
      region: region,
      color: getRegionColor(region)
    });
  });
  
  return legend.sort((a, b) => a.region.localeCompare(b.region));
}

// Render Financial Year tabs
function renderFYTabs() {
  const fyTabsContainer = document.getElementById("fyTabs");
  if (!fyTabsContainer) return;

  // Get available FYs from data
  availableFYs = getAvailableFYs();
  if (availableFYs.length === 0) {
    availableFYs = ["FY25", "FY26"]; // Default fallback
  }

  fyTabsContainer.innerHTML = "";

  // Add "All Years" tab first
  const allYearsTab = document.createElement("button");
  allYearsTab.textContent = "All Years";
  allYearsTab.style.cssText = `
    padding: 8px 16px;
    margin: 0 4px;
    border: 2px solid #1976d2;
    background: ${currentFY === "All Years" ? "#0969da" : "white"};
    color: ${currentFY === "All Years" ? "white" : "#1976d2"};
    border-radius: 4px;
    cursor: pointer;
    font-weight: ${currentFY === "All Years" ? "bold" : "normal"};
    transition: all 0.2s;
  `;

  allYearsTab.addEventListener("click", () => {
    currentFY = "All Years";
    renderCalendar();
  });

  fyTabsContainer.appendChild(allYearsTab);

  // Add individual FY tabs
  availableFYs.forEach((fy) => {
    const tab = document.createElement("button");
    tab.textContent = fy;
    tab.style.cssText = `
      padding: 8px 16px;
      margin: 0 4px;
      border: 2px solid #1976d2;
      background: ${fy === currentFY ? "#0969da" : "white"};
      color: ${fy === currentFY ? "white" : "#1976d2"};
      border-radius: 4px;
      cursor: pointer;
      font-weight: ${fy === currentFY ? "bold" : "normal"};
      transition: all 0.2s;
    `;

    tab.addEventListener("click", () => {
      currentFY = fy;
      renderCalendar();
    });

    fyTabsContainer.appendChild(tab);
  });
}

// Show campaign details in a modal/popup
function showCampaignDetails(
  campaign,
  keepMonthModalOpen = false,
  campaignList = null,
  currentIndex = 0,
) {
  const hasNavigation =
    keepMonthModalOpen && campaignList && campaignList.length > 1;
  const hasPrevious = hasNavigation && currentIndex > 0;
  const hasNext = hasNavigation && currentIndex < campaignList.length - 1;

  const modalHtml = `
    <div id="campaignModal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1100;
    ">
      <div style="
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        ${
          hasNavigation
            ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
            <span style="color: #666; font-size: 14px;">Campaign ${currentIndex + 1} of ${campaignList.length}</span>
            <div style="display: flex; gap: 8px;">
              <button id="prevCampaign" ${!hasPrevious ? "disabled" : ""} class="campaign-nav-btn">‹ Previous</button>
              <button id="nextCampaign" ${!hasNext ? "disabled" : ""} class="campaign-nav-btn">Next ›</button>
            </div>
          </div>
        `
            : ""
        }
        
        <h3 style="margin-top: 0; color: #1976d2; display: flex; align-items: center; gap: 8px;">
          <div style="
            width: 12px;
            height: 12px;
            background: ${getRegionColor(campaign.region)};
            border-radius: 50%;
            border: 1px solid rgba(0,0,0,0.2);
          "></div>
          ${campaign.programType || "Untitled Program"} (#${campaign.index || 1})
        </h3>
        <div style="margin: 12px 0;">
          <strong>Region:</strong> <span style="color: ${getRegionColor(campaign.region)}; font-weight: bold;">${campaign.region || "Not specified"}</span><br>
          <strong>Country:</strong> ${campaign.country || "Not specified"}<br>
          <strong>Owner:</strong> ${campaign.owner || "Unassigned"}<br>
          <strong>Status:</strong> <span style="color: ${getStatusColor(campaign.status)}; font-weight: bold;">${campaign.status || "Planning"}</span><br>
          <strong>Quarter:</strong> ${campaign.quarter || "Not specified"}<br>
          <strong>Program Type:</strong> ${campaign.programType || "Not specified"}<br>
          <strong>Strategic Pillars:</strong> ${campaign.strategicPillars || "Not specified"}<br>
          <strong>Revenue Play:</strong> ${campaign.revenuePlay || "Not specified"}<br>
        </div>
        ${campaign.description ? `<div style="margin: 12px 0;"><strong>Description:</strong><br>${campaign.description}</div>` : ""}
        <div style="margin: 12px 0;">
          <strong>Forecasted Cost:</strong> $${(campaign.forecastedCost || 0).toLocaleString()}<br>
          <strong>Expected Leads:</strong> ${campaign.expectedLeads || 0}<br>
          <strong>Pipeline Forecast:</strong> $${(campaign.pipelineForecast || 0).toLocaleString()}<br>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <button id="closeCampaignModal" style="
            background: #1976d2;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            flex: 1;
          ">${keepMonthModalOpen ? "Back to Month View" : "Close"}</button>
        </div>
      </div>
    </div>
  `;

  // Remove existing campaign modal if any
  const existingModal = document.getElementById("campaignModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add new modal
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Set up close event listener
  const closeBtn = document.getElementById("closeCampaignModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("campaignModal").remove();
    });
  }

  // Set up navigation event listeners
  if (hasNavigation) {
    const prevBtn = document.getElementById("prevCampaign");
    const nextBtn = document.getElementById("nextCampaign");

    if (prevBtn && hasPrevious) {
      prevBtn.addEventListener("click", () => {
        showCampaignDetails(
          campaignList[currentIndex - 1],
          keepMonthModalOpen,
          campaignList,
          currentIndex - 1,
        );
      });
    }

    if (nextBtn && hasNext) {
      nextBtn.addEventListener("click", () => {
        showCampaignDetails(
          campaignList[currentIndex + 1],
          keepMonthModalOpen,
          campaignList,
          currentIndex + 1,
        );
      });
    }

    // Keyboard navigation
    document.addEventListener("keydown", function campaignKeyHandler(event) {
      if (event.key === "ArrowLeft" && hasPrevious) {
        showCampaignDetails(
          campaignList[currentIndex - 1],
          keepMonthModalOpen,
          campaignList,
          currentIndex - 1,
        );
        document.removeEventListener("keydown", campaignKeyHandler);
      } else if (event.key === "ArrowRight" && hasNext) {
        showCampaignDetails(
          campaignList[currentIndex + 1],
          keepMonthModalOpen,
          campaignList,
          currentIndex + 1,
        );
        document.removeEventListener("keydown", campaignKeyHandler);
      } else if (event.key === "Escape") {
        document.getElementById("campaignModal").remove();
        document.removeEventListener("keydown", campaignKeyHandler);
      }
    });
  }

  // Close modal when clicking outside, but only if not keeping month modal open
  const modal = document.getElementById("campaignModal");
  if (modal && !keepMonthModalOpen) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  }
}

// Show month details in full screen
function showMonthDetails(monthInfo, monthCampaigns) {
  const modalHtml = `
    <div id="monthModal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 32px;
        width: 90%;
        max-width: 800px;
        height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #e3f2fd; padding-bottom: 16px;">
          <h2 style="margin: 0; color: #1976d2;">${monthInfo.name} ${monthInfo.year}</h2>
          <button id="closeMonthModal" style="
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
          ">✕</button>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #666; margin: 0;">${monthCampaigns.length} campaign${monthCampaigns.length !== 1 ? "s" : ""} scheduled</h4>
        </div>
        
        <div id="monthCampaignsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px;">
          ${
            monthCampaigns.length === 0
              ? '<div style="grid-column: 1 / -1; text-align: center; color: #999; font-style: italic; padding: 40px;">No campaigns scheduled for this month</div>'
              : monthCampaigns
                  .map(
                    (campaign, index) => `
              <div class="month-campaign-card" data-campaign-index="${index}" style="
                background: ${getRegionColor(campaign.region)};
                color: white;
                padding: 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                border-left: 4px solid ${getStatusColor(campaign.status)};
              ">
                <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                  ${campaign.programType || "Untitled Program"} (#${campaign.index || 1})
                </h4>
                <div style="font-size: 14px; opacity: 0.95; line-height: 1.4;">
                  <div style="margin-bottom: 4px;">📍 ${campaign.region || "No Region"} • ${campaign.country || "No Country"}</div>
                  <div style="margin-bottom: 4px;">👤 ${campaign.owner || "Unassigned"}</div>
                  <div style="margin-bottom: 4px;"><i class="octicon octicon-pulse" aria-hidden="true"></i> ${campaign.status || "Planning"}</div>
                  <div style="margin-bottom: 4px;">💰 $${(campaign.forecastedCost || 0).toLocaleString()}</div>
                  <div style="margin-bottom: 4px;"><i class="octicon octicon-target" aria-hidden="true"></i> ${campaign.expectedLeads || 0} leads</div>
                  <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">Click for full details</div>
                </div>
              </div>
            `,
                  )
                  .join("")
          }
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("monthModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add new modal
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Set up event listeners for the modal
  const closeBtn = document.getElementById("closeMonthModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("monthModal").remove();
    });
  }

  // Set up event listeners for campaign cards
  const campaignCards = document.querySelectorAll(".month-campaign-card");
  campaignCards.forEach((card, index) => {
    card.addEventListener("click", (event) => {
      event.stopPropagation();
      const campaign = monthCampaigns[index];
      if (campaign) {
        // Pass the full campaign list and current index for navigation
        showCampaignDetails(campaign, true, monthCampaigns, index);
      }
    });

    // Add hover effects
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-2px)";
      card.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    });
  });

  // Close modal when clicking outside
  const modal = document.getElementById("monthModal");
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  }
}

// Render the calendar - showing campaigns organized by month (optimized)
const renderCalendar = debounce(() => {
  const calendarGrid = document.getElementById("calendarGrid");
  if (!calendarGrid) return;

  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(() => {
    const startTime = performance.now();
    
    // Update FY tabs
    renderFYTabs();

    // Update filter controls
    renderFilterControls();

    // Clear previous calendar efficiently
    calendarGrid.innerHTML = "";

    // Handle "All Years" vs specific fiscal year
    let months = [];
    
    if (currentFY === "All Years") {
      // For "All Years", create a comprehensive view across all available fiscal years
      const allFYs = getAvailableFYs();
      if (allFYs.length === 0) {
        allFYs.push("FY25"); // Fallback
      }
      
      // Create months for all fiscal years more efficiently
      for (const fy of allFYs) {
        const fyStartYear = getFYStartYear(fy);
        const fyMonths = [
          { name: `July ${fy}`, month: 6, year: fyStartYear, fy: fy },
          { name: `August ${fy}`, month: 7, year: fyStartYear, fy: fy },
          { name: `September ${fy}`, month: 8, year: fyStartYear, fy: fy },
          { name: `October ${fy}`, month: 9, year: fyStartYear, fy: fy },
          { name: `November ${fy}`, month: 10, year: fyStartYear, fy: fy },
          { name: `December ${fy}`, month: 11, year: fyStartYear, fy: fy },
          { name: `January ${fy}`, month: 0, year: fyStartYear + 1, fy: fy },
          { name: `February ${fy}`, month: 1, year: fyStartYear + 1, fy: fy },
          { name: `March ${fy}`, month: 2, year: fyStartYear + 1, fy: fy },
          { name: `April ${fy}`, month: 3, year: fyStartYear + 1, fy: fy },
          { name: `May ${fy}`, month: 4, year: fyStartYear + 1, fy: fy },
          { name: `June ${fy}`, month: 5, year: fyStartYear + 1, fy: fy },
        ];
        months.push(...fyMonths);
      }
    } else {
      // Create a 12-month grid for the specific fiscal year
      const fyStartYear = getFYStartYear(currentFY);
      months = [
        { name: "July", month: 6, year: fyStartYear, fy: currentFY },
        { name: "August", month: 7, year: fyStartYear, fy: currentFY },
        { name: "September", month: 8, year: fyStartYear, fy: currentFY },
        { name: "October", month: 9, year: fyStartYear, fy: currentFY },
        { name: "November", month: 10, year: fyStartYear, fy: currentFY },
        { name: "December", month: 11, year: fyStartYear, fy: currentFY },
        { name: "January", month: 0, year: fyStartYear + 1, fy: currentFY },
        { name: "February", month: 1, year: fyStartYear + 1, fy: currentFY },
        { name: "March", month: 2, year: fyStartYear + 1, fy: currentFY },
        { name: "April", month: 3, year: fyStartYear + 1, fy: currentFY },
        { name: "May", month: 4, year: fyStartYear + 1, fy: currentFY },
        { name: "June", month: 5, year: fyStartYear + 1, fy: currentFY },
    ];
  }

  // Set grid layout - adjust columns based on number of months
  const gridColumns = currentFY === "All Years" && months.length > 12 ? 4 : 3;
  calendarGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(${gridColumns}, 1fr);
    gap: 16px;
    padding: 16px;
  `;

  months.forEach((monthInfo) => {
    const monthCampaigns = getCampaignsForMonthInternal(
      monthInfo.month,
      monthInfo.year,
    );

    const monthDiv = document.createElement("div");
    monthDiv.style.cssText = `
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      background: white;
      height: 300px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // Add hover effect
    monthDiv.addEventListener("mouseenter", () => {
      monthDiv.style.transform = "translateY(-2px)";
      monthDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      monthDiv.style.borderColor = "#1976d2";
    });

    monthDiv.addEventListener("mouseleave", () => {
      monthDiv.style.transform = "translateY(0)";
      monthDiv.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      monthDiv.style.borderColor = "#ddd";
    });

    // Add click handler for full-screen view
    monthDiv.addEventListener("click", () => {
      showMonthDetails(monthInfo, monthCampaigns);
    });

    // Month header
    const monthHeader = document.createElement("h3");
    monthHeader.textContent = `${monthInfo.name} ${monthInfo.year}`;
    monthHeader.style.cssText = `
      margin: 0 0 16px 0;
      color: #1976d2;
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 2px solid #e3f2fd;
      flex-shrink: 0;
    `;
    monthDiv.appendChild(monthHeader);

    // Campaign count
    const countDiv = document.createElement("div");
    countDiv.textContent = `${monthCampaigns.length} campaign${monthCampaigns.length !== 1 ? "s" : ""}`;
    countDiv.style.cssText = `
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
      font-weight: bold;
      text-align: center;
      flex-shrink: 0;
    `;
    monthDiv.appendChild(countDiv);

    // Campaign preview area
    const campaignPreview = document.createElement("div");
    campaignPreview.style.cssText = `
      flex: 1;
      overflow: hidden;
      position: relative;
    `;

    // Show preview of campaigns or message
    if (monthCampaigns.length === 0) {
      const noCampaigns = document.createElement("div");
      noCampaigns.textContent = "No campaigns scheduled";
      noCampaigns.style.cssText = `
        color: #999;
        font-style: italic;
        text-align: center;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      `;
      campaignPreview.appendChild(noCampaigns);
    } else {
      // Show first few campaigns as preview
      const previewCount = Math.min(3, monthCampaigns.length);

      for (let i = 0; i < previewCount; i++) {
        const campaign = monthCampaigns[i];
        const campaignDiv = document.createElement("div");
        campaignDiv.style.cssText = `
          background: ${getRegionColor(campaign.region)};
          color: white;
          padding: 6px 8px;
          margin: 4px 0;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-left: 3px solid ${getStatusColor(campaign.status)};
        `;

        campaignDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 2px;">
            ${campaign.programType || "Untitled Program"} (#${campaign.index || 1})
          </div>
          <div style="font-size: 10px; opacity: 0.9;">
            ${campaign.region || "No Region"} • ${campaign.owner || "Unassigned"}
          </div>
        `;

        campaignPreview.appendChild(campaignDiv);
      }

      // Add "more campaigns" indicator if there are more
      if (monthCampaigns.length > previewCount) {
        const moreIndicator = document.createElement("div");
        moreIndicator.textContent = `+${monthCampaigns.length - previewCount} more campaign${monthCampaigns.length - previewCount !== 1 ? "s" : ""}`;
        moreIndicator.style.cssText = `
          color: #666;
          font-size: 11px;
          font-style: italic;
          text-align: center;
          margin-top: 8px;
          padding: 4px;
          background: #f5f5f5;
          border-radius: 3px;
        `;
        campaignPreview.appendChild(moreIndicator);
      }
    }

    // Add click-to-expand hint
    const clickHint = document.createElement("div");
    clickHint.textContent = "Click to view details";
    clickHint.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: #999;
      background: rgba(255,255,255,0.9);
      padding: 2px 6px;
      border-radius: 3px;
      opacity: 0;
      transition: opacity 0.2s;
    `;
    campaignPreview.appendChild(clickHint);

    // Show hint on hover
    monthDiv.addEventListener("mouseenter", () => {
      clickHint.style.opacity = "1";
    });

    monthDiv.addEventListener("mouseleave", () => {
      clickHint.style.opacity = "0";
    });

    monthDiv.appendChild(campaignPreview);
    calendarGrid.appendChild(monthDiv);
  });
  
  // Performance monitoring
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  console.log(`📊 Calendar rendered in ${renderTime.toFixed(2)}ms`);
  
  if (renderTime > 100) {
    console.warn(`⚠️ Calendar render time exceeded 100ms: ${renderTime.toFixed(2)}ms`);
  }
  
  }); // Close requestAnimationFrame
}, CALENDAR_PERFORMANCE_CONFIG.RENDER_DEBOUNCE); // Close debounce

// Optimized month rendering with batch processing
function renderMonthInBatches(monthData, container) {
  const batchSize = CALENDAR_PERFORMANCE_CONFIG.BATCH_SIZE;
  let currentIndex = 0;
  
  function processBatch() {
    const batch = monthData.slice(currentIndex, currentIndex + batchSize);
    if (batch.length === 0) return;
    
    batch.forEach(item => {
      // Process individual month rendering
      container.appendChild(item);
    });
    
    currentIndex += batchSize;
    
    if (currentIndex < monthData.length) {
      requestAnimationFrame(processBatch);
    }
  }
  
  processBatch();
}

// Pre-populate calendar with skeleton structure for immediate display
function prePopulateCalendar() {
  console.log('🗓️ Pre-populating calendar with skeleton structure...');
  
  const calendarGrid = document.getElementById("calendarGrid");
  if (!calendarGrid) return;
  
  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(() => {
    // Clear any existing content
    calendarGrid.innerHTML = "";
    
    // Create skeleton calendar structure with loading states
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Create skeleton months for current fiscal year
    const skeletonMonths = [
      { name: "July", month: 6, year: currentYear },
      { name: "August", month: 7, year: currentYear },
      { name: "September", month: 8, year: currentYear },
      { name: "October", month: 9, year: currentYear },
      { name: "November", month: 10, year: currentYear },
      { name: "December", month: 11, year: currentYear },
      { name: "January", month: 0, year: currentYear + 1 },
      { name: "February", month: 1, year: currentYear + 1 },
      { name: "March", month: 2, year: currentYear + 1 },
      { name: "April", month: 3, year: currentYear + 1 },
      { name: "May", month: 4, year: currentYear + 1 },
      { name: "June", month: 5, year: currentYear + 1 },
    ];
    
    // Set grid layout
    calendarGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 16px;
    `;
    
    // Create skeleton month cards
    skeletonMonths.forEach((monthInfo) => {
      const monthDiv = document.createElement("div");
      monthDiv.style.cssText = `
        border: 2px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        background: white;
        height: 300px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0.8;
      `;
      
      // Month header
      const monthHeader = document.createElement("h3");
      monthHeader.textContent = `${monthInfo.name} ${monthInfo.year}`;
      monthHeader.style.cssText = `
        margin: 0 0 16px 0;
        color: #1976d2;
        text-align: center;
        padding-bottom: 8px;
        border-bottom: 2px solid #e3f2fd;
        flex-shrink: 0;
      `;
      monthDiv.appendChild(monthHeader);
      
      // Loading indicator
      const loadingDiv = document.createElement("div");
      loadingDiv.textContent = "Loading events...";
      loadingDiv.style.cssText = `
        color: #666;
        font-style: italic;
        text-align: center;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 14px;
      `;
      monthDiv.appendChild(loadingDiv);
      
      calendarGrid.appendChild(monthDiv);
    });
    
    console.log('✅ Calendar skeleton structure pre-populated');
  });
}

// Initialize calendar early with DOM-ready optimization
function initializeCalendarEarly() {
  console.log('🗓️ Early calendar initialization...');
  
  // Pre-populate calendar structure immediately
  prePopulateCalendar();
  
  // Initialize universal search early
  if (typeof initializeCalendarUniversalSearch === 'function') {
    try {
      initializeCalendarUniversalSearch();
    } catch (error) {
      console.warn('Early calendar universal search initialization failed:', error);
    }
  }
}

// Initialize calendar functionality
function initializeCalendar() {
  console.log('🗓️ Initializing calendar...');
  
  // Initialize universal search
  initializeCalendarUniversalSearch();
  
  // Initialize calendar with available fiscal years
  const campaigns = getCampaignData();
  console.log(`Calendar: Found ${campaigns.length} campaigns during initialization`);
  
  if (campaigns.length > 0) {
    const availableFYs = getAvailableFYs();
    console.log(`Calendar: Available fiscal years: ${availableFYs.join(', ')}`);
    if (availableFYs.length > 0 && !availableFYs.includes(currentFY)) {
      currentFY = availableFYs[0];
      console.log(`Calendar: Set current FY to ${currentFY}`);
    }
  } else {
    console.warn('Calendar: No campaigns found during initialization - will retry when planning data loads');
  }

  // Initial render
  renderCalendar();
  
  // Add optimized window resize handler
  const debouncedResize = debounce(() => {
    renderCalendar();
  }, CALENDAR_PERFORMANCE_CONFIG.RESIZE_DEBOUNCE);
  
  window.addEventListener('resize', debouncedResize);
  
  // Add a periodic check for planning data if not available initially
  if (campaigns.length === 0) {
    const dataCheckInterval = setInterval(() => {
      const newCampaigns = getCampaignData();
      if (newCampaigns.length > 0) {
        console.log(`🗓️ Calendar: Planning data now available with ${newCampaigns.length} campaigns - refreshing calendar`);
        clearInterval(dataCheckInterval);
        
        // Update available fiscal years
        const availableFYs = getAvailableFYs();
        if (availableFYs.length > 0 && !availableFYs.includes(currentFY)) {
          currentFY = availableFYs[0];
        }
        
        // Force cache invalidation and re-render with performance monitoring
        calendarCache.invalidate();
        requestAnimationFrame(() => {
          renderCalendar();
        });
      }
    }, 500); // Check every 500ms for faster data detection
    
    // Stop checking after 15 seconds (reduced from 30)
    setTimeout(() => {
      clearInterval(dataCheckInterval);
      console.log('🗓️ Calendar: Stopped waiting for planning data after 15 seconds');
    }, 15000);
  }
}

// Initialize calendar universal search
function initializeCalendarUniversalSearch() {
  console.log("🔍 CALENDAR: Starting universal search initialization...");
  
  // Check if UniversalSearchFilter class is available
  if (!window.UniversalSearchFilter) {
    console.error("❌ CALENDAR: UniversalSearchFilter class not found!");
    console.log("Available on window:", Object.keys(window).filter(k => k.includes('Search') || k.includes('Universal')));
    return;
  }
  
  console.log("✅ CALENDAR: UniversalSearchFilter class found");
  
  // Check if container exists
  const container = document.getElementById('calendarUniversalSearch');
  if (!container) {
    console.error("❌ CALENDAR: Container 'calendarUniversalSearch' not found in DOM!");
    console.log("Available elements with 'calendar' in id:", Array.from(document.querySelectorAll('[id*="calendar"]')).map(el => el.id));
    return;
  }
  
  console.log("✅ CALENDAR: Container found:", container);
  console.log("✅ CALENDAR: Container visible:", container.offsetParent !== null);
  
  try {
    // Initialize universal search for calendar
    window.calendarUniversalSearch = new window.UniversalSearchFilter(
      'calendarUniversalSearch',
      {
        onFilterChange: (selectedFilters) => {
          console.log("🔄 CALENDAR: Search filters changed:", selectedFilters);
          applyCalendarSearchFilters(selectedFilters);
        }
      }
    );
    
    console.log("✅ CALENDAR: Universal search initialized successfully!");
    
    // Update search data with current calendar data
    updateCalendarSearchData();
    
  } catch (error) {
    console.error("❌ CALENDAR: Error initializing universal search:", error);
    console.error("❌ CALENDAR: Error stack:", error.stack);
  }
}

// Apply search filters to calendar view
function applyCalendarSearchFilters(selectedFilters) {
  console.log("🔍 CALENDAR: Applying search filters:", selectedFilters);
  
  // Clear existing universal search filters
  universalCalendarSearchFilters.clear();
  
  // selectedFilters is an object with categories as keys and arrays as values
  // e.g., { region: ['SAARC'], status: ['Planning'] }
  if (selectedFilters && typeof selectedFilters === 'object') {
    Object.entries(selectedFilters).forEach(([category, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        universalCalendarSearchFilters.set(category, new Set(values));
      }
    });
  }
  
  console.log("🔍 CALENDAR: Universal search filters applied:", universalCalendarSearchFilters);
  
  // Trigger calendar filter update using existing system
  applyFilters();
}

// Update calendar search data
function updateCalendarSearchData() {
  if (!window.calendarUniversalSearch) {
    console.log("🔍 CALENDAR: Universal search not initialized yet");
    return;
  }
  
  try {
    const campaigns = getCampaignData();
    console.log(`🔍 CALENDAR: Updating search data with ${campaigns.length} campaigns`);
    
    // Get filter values for calendar
    const filterValues = getCalendarFilterValues();
    
    // Create filter options for universal search
    const filterOptions = [];
    
    // Add each filter category as searchable options
    Object.entries(filterValues).forEach(([category, values]) => {
      if (category !== 'universalCalendarSearchFilters' && Array.isArray(values)) {
        values.forEach(value => {
          if (value && value.trim()) {
            filterOptions.push({
              id: `${category}-${value}`,
              title: value,
              category: category,
              value: value,
              type: 'filter'
            });
          }
        });
      }
    });
    
    console.log(`🔍 CALENDAR: Generated ${filterOptions.length} filter options`);
    window.calendarUniversalSearch.updateData(filterOptions);
    console.log("✅ CALENDAR: Search data updated successfully");
    
  } catch (error) {
    console.error("❌ CALENDAR: Error updating search data:", error);
  }
}

// Handle calendar tab routing
function handleCalendarRouting() {
  const hash = location.hash;
  if (hash === "#calendar") {
    // Pre-populate calendar immediately for better UX
    prePopulateCalendar();
    
    // Then refresh with actual data using requestAnimationFrame
    requestAnimationFrame(() => {
      renderCalendar();
    });
  }
}

// Module exports with performance optimizations
const calendarModule = {
  initializeCalendar,
  initializeCalendarEarly,
  prePopulateCalendar,
  initializeCalendarUniversalSearch,
  handleCalendarRouting,
  renderCalendar,
  showCampaignDetails,
  showMonthDetails,
  getAvailableFYs,
  getCampaignsForMonth,
  renderFilterControls,
  applyFilters,
  clearAllFilters,
  activeFilters,
  
  // Debug functions
  debugCalendarState() {
    console.log('🔍 Calendar Debug State:');
    console.log(`- Current FY: ${currentFY}`);
    console.log(`- Planning table instance:`, window.planningTableInstance);
    console.log(`- Planning module:`, window.planningModule);
    console.log(`- Planning data cache:`, window.planningDataCache);
    
    const campaigns = getCampaignData();
    console.log(`- Campaign count: ${campaigns.length}`);
    if (campaigns.length > 0) {
      console.log(`- Sample campaign:`, campaigns[0]);
      console.log(`- Available fiscal years:`, getAvailableFYs());
      
      // Test getCampaignsForMonthInternal for July 2024 (FY25)
      const julyCampaigns = getCampaignsForMonthInternal(6, 2024);
      console.log(`- July 2024 campaigns: ${julyCampaigns.length}`);
    }
    
    const calendarGrid = document.getElementById("calendarGrid");
    console.log(`- Calendar grid element:`, calendarGrid);
    console.log(`- Calendar grid innerHTML length:`, calendarGrid?.innerHTML?.length || 0);
    
    // Test filter summary
    try {
      updateFilterSummary();
      console.log('- Filter summary update: SUCCESS');
    } catch (error) {
      console.log('- Filter summary update: ERROR', error);
    }
    
    return {
      currentFY,
      campaignCount: campaigns.length,
      availableFYs: getAvailableFYs(),
      hasCalendarGrid: !!calendarGrid,
      planningTableInstance: !!window.planningTableInstance,
      planningModule: !!window.planningModule
    };
  },
  
  // Force refresh function
  forceRefresh() {
    console.log('🔄 Force refreshing calendar...');
    calendarCache.invalidate();
    const campaigns = getCampaignData();
    console.log(`Refreshed: ${campaigns.length} campaigns found`);
    renderCalendar();
  },
  
  // Test month campaigns function
  testMonth(month = 6, year = 2024) {
    console.log(`🧪 Testing month ${month}/${year}:`);
    const campaigns = getCampaignsForMonthInternal(month, year);
    console.log(`Found ${campaigns.length} campaigns:`);
    campaigns.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.programType} (#${c.index}) - ${c.quarter} ${c.fiscalYear}`);
    });
    return campaigns;
  },
  
  // Performance utilities
  debounce,
  throttle,
  PERFORMANCE_CONFIG: CALENDAR_PERFORMANCE_CONFIG,
  
  // Optimized batch rendering
  renderMonthInBatches,
  
  // Cleanup method for memory management
  cleanup() {
    // Remove event listeners
    const debouncedResize = this._resizeHandler;
    if (debouncedResize) {
      window.removeEventListener('resize', debouncedResize);
    }
  }
};

// Export to window for access from other modules
window.calendarModule = calendarModule;

export default calendarModule;

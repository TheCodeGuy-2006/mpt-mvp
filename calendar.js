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

// Calendar state with performance optimizations
let currentFY = "FY25";
let currentDate = new Date();
let availableFYs = [];
let activeFilters = {
  region: "",
  country: "",
  owner: "",
  status: "",
  programType: "",
  strategicPillars: "",
  revenuePlay: "",
};

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
    if (!this.campaigns || (now - this.lastUpdate) > 30000) { // 30 second cache
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
        console.warn('Calendar: No planning data source available');
        rawCampaigns = [];
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
  return calendarCache.getCampaigns();
}

// Parse quarter to get month and year
function parseQuarterToDate(quarter, fiscalYear) {
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
    quarterMap[quarter] || {
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

    // Apply active filters with early exit
    if (activeFilters.region && campaign.region !== activeFilters.region) continue;
    if (activeFilters.country && campaign.country !== activeFilters.country) continue;
    if (activeFilters.owner && campaign.owner !== activeFilters.owner) continue;
    if (activeFilters.status && campaign.status !== activeFilters.status) continue;
    if (activeFilters.programType && campaign.programType !== activeFilters.programType) continue;
    if (activeFilters.strategicPillars && campaign.strategicPillars !== activeFilters.strategicPillars) continue;
    if (activeFilters.revenuePlay && campaign.revenuePlay !== activeFilters.revenuePlay) continue;

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
  });

  return {
    regions: Array.from(options.regions).sort(),
    countries: Array.from(options.countries).sort(),
    owners: Array.from(options.owners).sort(),
    statuses: Array.from(options.statuses).sort(),
    programTypes: Array.from(options.programTypes).sort(),
    strategicPillars: Array.from(options.strategicPillars).sort(),
    revenuePlays: Array.from(options.revenuePlays).sort(),
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
          <h5 style="margin: 0 0 8px 0; color: #1976d2; font-size: 14px;">🎨 Region Color Guide:</h5>
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
          <select id="filterRegion" class="filter-select">
            <option value="">All Regions</option>
            ${filterOptions.regions
              .map(
                (region) =>
                  `<option value="${region}" ${activeFilters.region === region ? "selected" : ""}>${region}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterCountry">Country</label>
          <select id="filterCountry" class="filter-select">
            <option value="">All Countries</option>
            ${filterOptions.countries
              .map(
                (country) =>
                  `<option value="${country}" ${activeFilters.country === country ? "selected" : ""}>${country}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterOwner">Owner</label>
          <select id="filterOwner" class="filter-select">
            <option value="">All Owners</option>
            ${filterOptions.owners
              .map(
                (owner) =>
                  `<option value="${owner}" ${activeFilters.owner === owner ? "selected" : ""}>${owner}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterStatus">Status</label>
          <select id="filterStatus" class="filter-select">
            <option value="">All Statuses</option>
            ${filterOptions.statuses
              .map(
                (status) =>
                  `<option value="${status}" ${activeFilters.status === status ? "selected" : ""}>${status}</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>
      
      <div class="filter-row filter-row-secondary">
        <div class="filter-group">
          <label for="filterProgramType">Program Type</label>
          <select id="filterProgramType" class="filter-select">
            <option value="">All Program Types</option>
            ${filterOptions.programTypes
              .map(
                (type) =>
                  `<option value="${type}" ${activeFilters.programType === type ? "selected" : ""}>${type}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterStrategicPillars">Strategic Pillars</label>
          <select id="filterStrategicPillars" class="filter-select">
            <option value="">All Pillars</option>
            ${filterOptions.strategicPillars
              .map(
                (pillar) =>
                  `<option value="${pillar}" ${activeFilters.strategicPillars === pillar ? "selected" : ""}>${pillar}</option>`,
              )
              .join("")}
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filterRevenuePlay">Revenue Play</label>
          <select id="filterRevenuePlay" class="filter-select">
            <option value="">All Revenue Plays</option>
            ${filterOptions.revenuePlays
              .map(
                (play) =>
                  `<option value="${play}" ${activeFilters.revenuePlay === play ? "selected" : ""}>${play}</option>`,
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

  // Set up filter event listeners
  setupFilterEventListeners();
  updateFilterSummary();
}

// Set up filter event listeners
function setupFilterEventListeners() {
  const filterIds = [
    "filterRegion",
    "filterCountry",
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
    (f) => f !== "",
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
  // Batch filter updates for better performance
  activeFilters.region = document.getElementById("filterRegion")?.value || "";
  activeFilters.country = document.getElementById("filterCountry")?.value || "";
  activeFilters.owner = document.getElementById("filterOwner")?.value || "";
  activeFilters.status = document.getElementById("filterStatus")?.value || "";
  activeFilters.programType = document.getElementById("filterProgramType")?.value || "";
  activeFilters.strategicPillars = document.getElementById("filterStrategicPillars")?.value || "";
  activeFilters.revenuePlay = document.getElementById("filterRevenuePlay")?.value || "";

  // Use requestAnimationFrame for smooth UI updates
  requestAnimationFrame(() => {
    updateFilterSummary();
    renderCalendar();
  });
}

// Clear all filters
function clearAllFilters() {
  activeFilters = {
    region: "",
    country: "",
    owner: "",
    status: "",
    programType: "",
    strategicPillars: "",
    revenuePlay: "",
  };

  // Reset all filter dropdowns
  const filterIds = [
    "filterRegion",
    "filterCountry",
    "filterOwner",
    "filterStatus",
    "filterProgramType",
    "filterStrategicPillars",
    "filterRevenuePlay",
  ];

  filterIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = "";
    }
  });

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
    "APAC": "#1e88e5",      // Blue
    "EMEA": "#43a047",      // Green  
    "Americas": "#f4511e",  // Orange/Red
    "JP & Korea": "#8e24aa", // Purple
    "Global": "#546e7a",    // Blue Grey
    "NA": "#fb8c00",        // Orange
    "LATAM": "#d81b60",     // Pink
    "ANZ": "#00acc1",       // Cyan
    "India": "#7cb342",     // Light Green
    "China": "#ff7043",     // Deep Orange
  };
  return colors[region] || "#757575"; // Default grey for unknown regions
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
    background: ${currentFY === "All Years" ? "#1976d2" : "white"};
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
      background: ${fy === currentFY ? "#1976d2" : "white"};
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
              <button id="prevCampaign" ${!hasPrevious ? "disabled" : ""} style="
                background: ${hasPrevious ? "#1976d2" : "#ccc"};
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: ${hasPrevious ? "pointer" : "not-allowed"};
                font-size: 12px;
              ">‹ Previous</button>
              <button id="nextCampaign" ${!hasNext ? "disabled" : ""} style="
                background: ${hasNext ? "#1976d2" : "#ccc"};
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: ${hasNext ? "pointer" : "not-allowed"};
                font-size: 12px;
              ">Next ›</button>
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
                  <div style="margin-bottom: 4px;">📊 ${campaign.status || "Planning"}</div>
                  <div style="margin-bottom: 4px;">💰 $${(campaign.forecastedCost || 0).toLocaleString()}</div>
                  <div style="margin-bottom: 4px;">🎯 ${campaign.expectedLeads || 0} leads</div>
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

// Initialize calendar functionality
function initializeCalendar() {
  console.log('🗓️ Initializing calendar...');
  
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
        
        // Force cache invalidation and re-render
        calendarCache.invalidate();
        renderCalendar();
      }
    }, 2000); // Check every 2 seconds
    
    // Stop checking after 30 seconds
    setTimeout(() => {
      clearInterval(dataCheckInterval);
    }, 30000);
  }
}

// Handle calendar tab routing
function handleCalendarRouting() {
  const hash = location.hash;
  if (hash === "#calendar") {
    // Refresh calendar when tab is viewed
    setTimeout(() => {
      renderCalendar();
    }, 100);
  }
}

// Module exports with performance optimizations
const calendarModule = {
  initializeCalendar,
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

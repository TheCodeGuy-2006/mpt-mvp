// calendar.js - Campaign Calendar Module
console.log("calendar.js loaded");

// Calendar state
let currentFY = "FY25";
let currentDate = new Date();
let availableFYs = [];
let activeFilters = {
  region: '',
  country: '',
  owner: '',
  status: '',
  programType: '',
  strategicPillars: '',
  revenuePlay: ''
};

// Get campaigns from planning data
function getCampaignData() {
  if (window.planningModule?.tableInstance) {
    return window.planningModule.tableInstance.getData() || [];
  }
  return [];
}

// Parse quarter to get month and year
function parseQuarterToDate(quarter, fiscalYear) {
  const quarterMap = {
    "Q1 July": { month: 6, year: getFYStartYear(fiscalYear) },      // July (month 6, 0-indexed)
    "Q1 August": { month: 7, year: getFYStartYear(fiscalYear) },    // August  
    "Q1 September": { month: 8, year: getFYStartYear(fiscalYear) }, // September
    "Q2 October": { month: 9, year: getFYStartYear(fiscalYear) },   // October
    "Q2 November": { month: 10, year: getFYStartYear(fiscalYear) }, // November
    "Q2 December": { month: 11, year: getFYStartYear(fiscalYear) }, // December
    "Q3 January": { month: 0, year: getFYStartYear(fiscalYear) + 1 }, // January (next calendar year)
    "Q3 February": { month: 1, year: getFYStartYear(fiscalYear) + 1 }, // February
    "Q3 March": { month: 2, year: getFYStartYear(fiscalYear) + 1 },   // March
    "Q4 April": { month: 3, year: getFYStartYear(fiscalYear) + 1 },   // April
    "Q4 May": { month: 4, year: getFYStartYear(fiscalYear) + 1 },     // May
    "Q4 June": { month: 5, year: getFYStartYear(fiscalYear) + 1 }     // June
  };
  
  return quarterMap[quarter] || { month: new Date().getMonth(), year: new Date().getFullYear() };
}

// Get the starting calendar year for a fiscal year
function getFYStartYear(fiscalYear) {
  const fyNumber = parseInt(fiscalYear.replace('FY', ''));
  return 2000 + fyNumber - 1; // FY25 starts in 2024
}

// Get all available fiscal years from planning data
function getAvailableFYs() {
  const campaigns = getCampaignData();
  const fys = new Set();
  campaigns.forEach(campaign => {
    if (campaign.fiscalYear) {
      fys.add(campaign.fiscalYear);
    }
  });
  return Array.from(fys).sort();
}

// Get campaigns for a specific month/year with filtering
function getCampaignsForMonth(month, year) {
  const campaigns = getCampaignData();
  return campaigns.filter(campaign => {
    if (!campaign.quarter || !campaign.fiscalYear) return false;
    if (campaign.fiscalYear !== currentFY) return false;
    
    const campaignDate = parseQuarterToDate(campaign.quarter, campaign.fiscalYear);
    if (campaignDate.month !== month || campaignDate.year !== year) return false;

    // Apply active filters
    if (activeFilters.region && campaign.region !== activeFilters.region) return false;
    if (activeFilters.country && campaign.country !== activeFilters.country) return false;
    if (activeFilters.owner && campaign.owner !== activeFilters.owner) return false;
    if (activeFilters.status && campaign.status !== activeFilters.status) return false;
    if (activeFilters.programType && campaign.programType !== activeFilters.programType) return false;
    if (activeFilters.strategicPillars && campaign.strategicPillars !== activeFilters.strategicPillars) return false;
    if (activeFilters.revenuePlay && campaign.revenuePlay !== activeFilters.revenuePlay) return false;
    
    return true;
  });
}

// Get unique filter options from campaign data
function getFilterOptions() {
  const campaigns = getCampaignData().filter(c => c.fiscalYear === currentFY);
  
  const options = {
    regions: new Set(),
    countries: new Set(),
    owners: new Set(),
    statuses: new Set(),
    programTypes: new Set(),
    strategicPillars: new Set(),
    revenuePlays: new Set()
  };

  campaigns.forEach(campaign => {
    if (campaign.region) options.regions.add(campaign.region);
    if (campaign.country) options.countries.add(campaign.country);
    if (campaign.owner) options.owners.add(campaign.owner);
    if (campaign.status) options.statuses.add(campaign.status);
    if (campaign.programType) options.programTypes.add(campaign.programType);
    if (campaign.strategicPillars) options.strategicPillars.add(campaign.strategicPillars);
    if (campaign.revenuePlay) options.revenuePlays.add(campaign.revenuePlay);
  });

  return {
    regions: Array.from(options.regions).sort(),
    countries: Array.from(options.countries).sort(),
    owners: Array.from(options.owners).sort(),
    statuses: Array.from(options.statuses).sort(),
    programTypes: Array.from(options.programTypes).sort(),
    strategicPillars: Array.from(options.strategicPillars).sort(),
    revenuePlays: Array.from(options.revenuePlays).sort()
  };
}

// Render filter controls
function renderFilterControls() {
  const filterContainer = document.getElementById("calendarFilters");
  if (!filterContainer) return;

  const filterOptions = getFilterOptions();
  
  filterContainer.innerHTML = `
    <div style="
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    ">
      <h4 style="margin: 0 0 16px 0; color: #1976d2; display: flex; align-items: center; gap: 8px;">
        🔍 Filter Campaigns
        <button id="clearFilters" style="
          background: #f44336;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          margin-left: auto;
        ">Clear All</button>
      </h4>
      
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        align-items: end;
      ">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; color: #333;">Region:</label>
          <select id="filterRegion" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Regions</option>
            ${filterOptions.regions.map(region => 
              `<option value="${region}" ${activeFilters.region === region ? 'selected' : ''}>${region}</option>`
            ).join('')}
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; color: #333;">Country:</label>
          <select id="filterCountry" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Countries</option>
            ${filterOptions.countries.map(country => 
              `<option value="${country}" ${activeFilters.country === country ? 'selected' : ''}>${country}</option>`
            ).join('')}
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; color: #333;">Owner:</label>
          <select id="filterOwner" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Owners</option>
            ${filterOptions.owners.map(owner => 
              `<option value="${owner}" ${activeFilters.owner === owner ? 'selected' : ''}>${owner}</option>`
            ).join('')}
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; color: #333;">Status:</label>
          <select id="filterStatus" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Statuses</option>
            ${filterOptions.statuses.map(status => 
              `<option value="${status}" ${activeFilters.status === status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; color: #333;">Program Type:</label>
          <select id="filterProgramType" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Program Types</option>
            ${filterOptions.programTypes.map(type => 
              `<option value="${type}" ${activeFilters.programType === type ? 'selected' : ''}>${type}</option>`
            ).join('')}
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; color: #333;">Strategic Pillars:</label>
          <select id="filterStrategicPillars" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Pillars</option>
            ${filterOptions.strategicPillars.map(pillar => 
              `<option value="${pillar}" ${activeFilters.strategicPillars === pillar ? 'selected' : ''}>${pillar}</option>`
            ).join('')}
          </select>
        </div>
        
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: bold; color: #333;">Revenue Play:</label>
          <select id="filterRevenuePlay" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">All Revenue Plays</option>
            ${filterOptions.revenuePlays.map(play => 
              `<option value="${play}" ${activeFilters.revenuePlay === play ? 'selected' : ''}>${play}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      
      <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div id="filterSummary" style="color: #666; font-size: 14px;"></div>
        <button id="applyFilters" style="
          background: #1976d2;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">Apply Filters</button>
      </div>
    </div>
  `;

  // Set up filter event listeners
  setupFilterEventListeners();
  updateFilterSummary();
}

// Set up filter event listeners
function setupFilterEventListeners() {
  const filterIds = [
    'filterRegion', 'filterCountry', 'filterOwner', 'filterStatus',
    'filterProgramType', 'filterStrategicPillars', 'filterRevenuePlay'
  ];

  filterIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', updateFilterSummary);
    }
  });

  // Apply filters button
  const applyBtn = document.getElementById('applyFilters');
  if (applyBtn) {
    applyBtn.addEventListener('click', applyFilters);
  }

  // Clear filters button
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllFilters);
  }
}

// Update filter summary
function updateFilterSummary() {
  const summary = document.getElementById('filterSummary');
  if (!summary) return;

  const activeCount = Object.values(activeFilters).filter(f => f !== '').length;
  const totalCampaigns = getCampaignData().filter(c => c.fiscalYear === currentFY).length;
  
  // Count filtered campaigns
  let filteredCount = 0;
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
    { month: 5, year: getFYStartYear(currentFY) + 1 }
  ];

  months.forEach(monthInfo => {
    filteredCount += getCampaignsForMonth(monthInfo.month, monthInfo.year).length;
  });

  if (activeCount === 0) {
    summary.textContent = `Showing all ${totalCampaigns} campaigns`;
  } else {
    summary.textContent = `${activeCount} filter${activeCount !== 1 ? 's' : ''} active • Showing ${filteredCount} of ${totalCampaigns} campaigns`;
  }
}

// Apply filters
function applyFilters() {
  activeFilters.region = document.getElementById('filterRegion')?.value || '';
  activeFilters.country = document.getElementById('filterCountry')?.value || '';
  activeFilters.owner = document.getElementById('filterOwner')?.value || '';
  activeFilters.status = document.getElementById('filterStatus')?.value || '';
  activeFilters.programType = document.getElementById('filterProgramType')?.value || '';
  activeFilters.strategicPillars = document.getElementById('filterStrategicPillars')?.value || '';
  activeFilters.revenuePlay = document.getElementById('filterRevenuePlay')?.value || '';

  updateFilterSummary();
  renderCalendar();
}

// Clear all filters
function clearAllFilters() {
  activeFilters = {
    region: '',
    country: '',
    owner: '',
    status: '',
    programType: '',
    strategicPillars: '',
    revenuePlay: ''
  };

  // Reset all filter dropdowns
  const filterIds = [
    'filterRegion', 'filterCountry', 'filterOwner', 'filterStatus',
    'filterProgramType', 'filterStrategicPillars', 'filterRevenuePlay'
  ];

  filterIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.value = '';
    }
  });

  updateFilterSummary();
  renderCalendar();
}

// Get status color
function getStatusColor(status) {
  const colors = {
    'Planning': '#ff9800',
    'On Track': '#4caf50', 
    'Shipped': '#2196f3',
    'Cancelled': '#f44336'
  };
  return colors[status] || '#607d8b';
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

  availableFYs.forEach(fy => {
    const tab = document.createElement("button");
    tab.textContent = fy;
    tab.style.cssText = `
      padding: 8px 16px;
      margin: 0 4px;
      border: 2px solid #1976d2;
      background: ${fy === currentFY ? '#1976d2' : 'white'};
      color: ${fy === currentFY ? 'white' : '#1976d2'};
      border-radius: 4px;
      cursor: pointer;
      font-weight: ${fy === currentFY ? 'bold' : 'normal'};
      transition: all 0.2s;
    `;
    
    tab.addEventListener('click', () => {
      currentFY = fy;
      renderCalendar();
    });
    
    fyTabsContainer.appendChild(tab);
  });
}

// Show campaign details in a modal/popup
function showCampaignDetails(campaign, keepMonthModalOpen = false, campaignList = null, currentIndex = 0) {
  const hasNavigation = keepMonthModalOpen && campaignList && campaignList.length > 1;
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
        ${hasNavigation ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
            <span style="color: #666; font-size: 14px;">Campaign ${currentIndex + 1} of ${campaignList.length}</span>
            <div style="display: flex; gap: 8px;">
              <button id="prevCampaign" ${!hasPrevious ? 'disabled' : ''} style="
                background: ${hasPrevious ? '#1976d2' : '#ccc'};
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: ${hasPrevious ? 'pointer' : 'not-allowed'};
                font-size: 12px;
              ">‹ Previous</button>
              <button id="nextCampaign" ${!hasNext ? 'disabled' : ''} style="
                background: ${hasNext ? '#1976d2' : '#ccc'};
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: ${hasNext ? 'pointer' : 'not-allowed'};
                font-size: 12px;
              ">Next ›</button>
            </div>
          </div>
        ` : ''}
        
        <h3 style="margin-top: 0; color: #1976d2;">${campaign.campaignName || 'Untitled Campaign'}</h3>
        <div style="margin: 12px 0;">
          <strong>Region:</strong> ${campaign.region || 'Not specified'}<br>
          <strong>Country:</strong> ${campaign.country || 'Not specified'}<br>
          <strong>Owner:</strong> ${campaign.owner || 'Unassigned'}<br>
          <strong>Status:</strong> <span style="color: ${getStatusColor(campaign.status)}; font-weight: bold;">${campaign.status || 'Planning'}</span><br>
          <strong>Quarter:</strong> ${campaign.quarter || 'Not specified'}<br>
          <strong>Program Type:</strong> ${campaign.programType || 'Not specified'}<br>
          <strong>Strategic Pillars:</strong> ${campaign.strategicPillars || 'Not specified'}<br>
          <strong>Revenue Play:</strong> ${campaign.revenuePlay || 'Not specified'}<br>
        </div>
        ${campaign.description ? `<div style="margin: 12px 0;"><strong>Description:</strong><br>${campaign.description}</div>` : ''}
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
          ">${keepMonthModalOpen ? 'Back to Month View' : 'Close'}</button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing campaign modal if any
  const existingModal = document.getElementById('campaignModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add new modal
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Set up close event listener
  const closeBtn = document.getElementById('closeCampaignModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('campaignModal').remove();
    });
  }

  // Set up navigation event listeners
  if (hasNavigation) {
    const prevBtn = document.getElementById('prevCampaign');
    const nextBtn = document.getElementById('nextCampaign');
    
    if (prevBtn && hasPrevious) {
      prevBtn.addEventListener('click', () => {
        showCampaignDetails(campaignList[currentIndex - 1], keepMonthModalOpen, campaignList, currentIndex - 1);
      });
    }
    
    if (nextBtn && hasNext) {
      nextBtn.addEventListener('click', () => {
        showCampaignDetails(campaignList[currentIndex + 1], keepMonthModalOpen, campaignList, currentIndex + 1);
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function campaignKeyHandler(event) {
      if (event.key === 'ArrowLeft' && hasPrevious) {
        showCampaignDetails(campaignList[currentIndex - 1], keepMonthModalOpen, campaignList, currentIndex - 1);
        document.removeEventListener('keydown', campaignKeyHandler);
      } else if (event.key === 'ArrowRight' && hasNext) {
        showCampaignDetails(campaignList[currentIndex + 1], keepMonthModalOpen, campaignList, currentIndex + 1);
        document.removeEventListener('keydown', campaignKeyHandler);
      } else if (event.key === 'Escape') {
        document.getElementById('campaignModal').remove();
        document.removeEventListener('keydown', campaignKeyHandler);
      }
    });
  }

  // Close modal when clicking outside, but only if not keeping month modal open
  const modal = document.getElementById('campaignModal');
  if (modal && !keepMonthModalOpen) {
    modal.addEventListener('click', (event) => {
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
          <h4 style="color: #666; margin: 0;">${monthCampaigns.length} campaign${monthCampaigns.length !== 1 ? 's' : ''} scheduled</h4>
        </div>
        
        <div id="monthCampaignsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px;">
          ${monthCampaigns.length === 0 ? 
            '<div style="grid-column: 1 / -1; text-align: center; color: #999; font-style: italic; padding: 40px;">No campaigns scheduled for this month</div>' :
            monthCampaigns.map((campaign, index) => `
              <div class="month-campaign-card" data-campaign-index="${index}" style="
                background: ${getStatusColor(campaign.status)};
                color: white;
                padding: 16px;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
              ">
                <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
                  ${campaign.campaignName || 'Untitled Campaign'}
                </h4>
                <div style="font-size: 14px; opacity: 0.95; line-height: 1.4;">
                  <div style="margin-bottom: 4px;">📍 ${campaign.region || 'No Region'} • ${campaign.country || 'No Country'}</div>
                  <div style="margin-bottom: 4px;">👤 ${campaign.owner || 'Unassigned'}</div>
                  <div style="margin-bottom: 4px;">📊 ${campaign.status || 'Planning'}</div>
                  <div style="margin-bottom: 4px;">💰 $${(campaign.forecastedCost || 0).toLocaleString()}</div>
                  <div style="margin-bottom: 4px;">🎯 ${campaign.expectedLeads || 0} leads</div>
                  <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">Click for full details</div>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('monthModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add new modal
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Set up event listeners for the modal
  const closeBtn = document.getElementById('closeMonthModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('monthModal').remove();
    });
  }

  // Set up event listeners for campaign cards
  const campaignCards = document.querySelectorAll('.month-campaign-card');
  campaignCards.forEach((card, index) => {
    card.addEventListener('click', (event) => {
      event.stopPropagation();
      const campaign = monthCampaigns[index];
      if (campaign) {
        // Pass the full campaign list and current index for navigation
        showCampaignDetails(campaign, true, monthCampaigns, index);
      }
    });

    // Add hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    });
  });

  // Close modal when clicking outside
  const modal = document.getElementById('monthModal');
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  }
}

// Render the calendar - showing campaigns organized by month
function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  if (!calendarGrid) return;

  // Update FY tabs
  renderFYTabs();
  
  // Update filter controls
  renderFilterControls();

  // Clear previous calendar
  calendarGrid.innerHTML = "";

  // Get all campaigns for current FY
  const campaigns = getCampaignData().filter(c => c.fiscalYear === currentFY);
  
  // Create a 12-month grid for the fiscal year
  const months = [
    { name: "July", month: 6, year: getFYStartYear(currentFY) },
    { name: "August", month: 7, year: getFYStartYear(currentFY) },
    { name: "September", month: 8, year: getFYStartYear(currentFY) },
    { name: "October", month: 9, year: getFYStartYear(currentFY) },
    { name: "November", month: 10, year: getFYStartYear(currentFY) },
    { name: "December", month: 11, year: getFYStartYear(currentFY) },
    { name: "January", month: 0, year: getFYStartYear(currentFY) + 1 },
    { name: "February", month: 1, year: getFYStartYear(currentFY) + 1 },
    { name: "March", month: 2, year: getFYStartYear(currentFY) + 1 },
    { name: "April", month: 3, year: getFYStartYear(currentFY) + 1 },
    { name: "May", month: 4, year: getFYStartYear(currentFY) + 1 },
    { name: "June", month: 5, year: getFYStartYear(currentFY) + 1 }
  ];

  // Set grid to 4 columns (3 months per row)
  calendarGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 16px;
  `;

  months.forEach(monthInfo => {
    const monthCampaigns = getCampaignsForMonth(monthInfo.month, monthInfo.year);
    
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
    monthDiv.addEventListener('mouseenter', () => {
      monthDiv.style.transform = 'translateY(-2px)';
      monthDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      monthDiv.style.borderColor = '#1976d2';
    });

    monthDiv.addEventListener('mouseleave', () => {
      monthDiv.style.transform = 'translateY(0)';
      monthDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      monthDiv.style.borderColor = '#ddd';
    });

    // Add click handler for full-screen view
    monthDiv.addEventListener('click', () => {
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
    countDiv.textContent = `${monthCampaigns.length} campaign${monthCampaigns.length !== 1 ? 's' : ''}`;
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
          background: ${getStatusColor(campaign.status)};
          color: white;
          padding: 6px 8px;
          margin: 4px 0;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `;
        
        campaignDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 2px;">
            ${campaign.campaignName || 'Untitled Campaign'}
          </div>
          <div style="font-size: 10px; opacity: 0.9;">
            ${campaign.region || 'No Region'} • ${campaign.owner || 'Unassigned'}
          </div>
        `;
        
        campaignPreview.appendChild(campaignDiv);
      }
      
      // Add "more campaigns" indicator if there are more
      if (monthCampaigns.length > previewCount) {
        const moreIndicator = document.createElement("div");
        moreIndicator.textContent = `+${monthCampaigns.length - previewCount} more campaign${monthCampaigns.length - previewCount !== 1 ? 's' : ''}`;
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
    monthDiv.addEventListener('mouseenter', () => {
      clickHint.style.opacity = '1';
    });

    monthDiv.addEventListener('mouseleave', () => {
      clickHint.style.opacity = '0';
    });

    monthDiv.appendChild(campaignPreview);
    calendarGrid.appendChild(monthDiv);
  });
}

// Initialize calendar functionality
function initializeCalendar() {
  console.log("Initializing campaign calendar...");
  
  // Set default FY if none set
  const campaigns = getCampaignData();
  if (campaigns.length > 0) {
    const availableFYs = getAvailableFYs();
    if (availableFYs.length > 0 && !availableFYs.includes(currentFY)) {
      currentFY = availableFYs[0];
    }
  }

  // Initial render
  renderCalendar();
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

// Module exports
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
  activeFilters
};

// Export to window for access from other modules
window.calendarModule = calendarModule;

export default calendarModule;

// --- MODULAR ARCHITECTURE INTEGRATION ---
// Import new modular planning system (Phase 1)
import('./src/PlanningModule.js').then(module => {
  window.PlanningModuleLoader = module.default;
  console.log('Planning module loader ready');
}).catch(error => {
  console.warn('Planning module not available, using legacy mode:', error);
});

// --- PHASE 2 INTEGRATION - ADVANCED ARCHITECTURE & PERFORMANCE ---
// Import Phase 2 enhancement system (fixed version with fallbacks)
import('./src/Phase2Integration-Fixed.js').then(module => {
  window.Phase2Integration = module.default;
  console.log('Phase 2 integration module loaded (fixed version)');
}).catch(error => {
  console.warn('Phase 2 integration not available:', error);
});

// --- PHASE 3 INTEGRATION - ADVANCED FEATURES & ANALYTICS ---
// Import Phase 3 advanced features system
import('./src/Phase3Integration.js').then(module => {
  window.Phase3Integration = module.default;
  console.log('Phase 3 integration module loaded');
}).catch(error => {
  console.warn('Phase 3 integration not available:', error);
});

// --- Highlight Unsaved Rows in Planning Grid ---
// --- Global Description Tooltip Cleanup ---
function cleanupAllDescriptionTooltips() {
  // Remove any existing tooltips from DOM
  const tooltips = document.querySelectorAll('.desc-hover-tooltip');
  tooltips.forEach(tooltip => tooltip.remove());
  
  // Clean up any attached event listeners and references
  const cells = document.querySelectorAll('.description-hover');
  cells.forEach(cell => {
    cell.classList.remove('description-hover');
    if (cell._descTooltipDiv) {
      cell._descTooltipDiv = null;
    }
    if (cell._descTooltipMove) {
      cell.removeEventListener('mousemove', cell._descTooltipMove);
      cell._descTooltipMove = null;
    }
  });
}

// Add global cleanup on page interactions
document.addEventListener('click', cleanupAllDescriptionTooltips);
document.addEventListener('scroll', cleanupAllDescriptionTooltips);
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    cleanupAllDescriptionTooltips();
  }
});

// --- Inject Description Keyword Search Bar for Planning Tab ---
function injectDescriptionKeywordSearchBar() {
  // Only inject once
  if (document.getElementById('planning-description-search-bar')) return;

  // Find the filters container and the universal search input inside it
  const filtersBox = document.querySelector('#planningFilters');
  let universalSearch = null;
  // ...existing code...
  if (filtersBox) {
    // Find the first input[type="search"] or input with a search placeholder inside the filters box
    universalSearch = filtersBox.querySelector('input[type="search"]');
    if (!universalSearch) universalSearch = Array.from(filtersBox.querySelectorAll('input')).find(i => i.placeholder && i.placeholder.toLowerCase().includes('search'));
  }
  // ...existing code...

  // Create the search bar container with batched style updates
  const container = document.createElement('div');
  container.id = 'planning-description-search-bar';
  container.cssText = 'display: flex; align-items: center; gap: 8px; margin: 18px 0 8px 0;';
  container.title = '';

  // Create the input with batched style updates
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'planning-description-search';
  input.placeholder = 'Search campaign descriptions...';
  input.style.cssText = 'flex: 1; padding: 8px 12px; border: 2px solid #d39e00; border-radius: 7px; font-size: 1em; background: #fffbe6;';

  // Create the button with batched style updates
  const button = document.createElement('button');
  button.id = 'planning-description-search-btn';
  button.textContent = 'Search';
  button.style.cssText = 'padding: 8px 18px; background: #1976d2; color: #fff; border: 2px solid #d39e00; border-radius: 7px; cursor: pointer;';
  button.style.borderRadius = '7px';
  button.style.fontWeight = 'bold';
  button.style.fontSize = '1em';
  button.style.cursor = 'pointer';

  container.appendChild(input);
  container.appendChild(button);

  // --- Filtering Logic ---
  function handleDescriptionSearch() {
    const value = input.value.trim();
    // Split by spaces, remove empty, lowercase
    const keywords = value.length > 0 ? value.split(/\s+/).filter(Boolean) : [];
    // Compose filters object for PlanningDataStore
    const filters = {};
    if (keywords.length > 0) {
      filters.descriptionKeyword = keywords;
    } else {
      filters.descriptionKeyword = [];
    }
    // Preserve other filters if needed (future-proof)
    // Apply filter using planningDataStore
    if (window.planningDataStore && typeof window.planningDataStore.applyFilters === 'function') {
      const filtered = window.planningDataStore.applyFilters(filters);
      // Update grid if available
      if (window.planningTableInstance && typeof window.planningTableInstance.replaceData === 'function') {
        window.planningTableInstance.replaceData(filtered);
      }
    } else {
      // Fallback: filter main data cache
      if (window.planningDataCache && Array.isArray(window.planningDataCache)) {
        const filtered = window.planningDataCache.filter(row => {
          if (!row.description) return false;
          const desc = row.description.toLowerCase();
          return keywords.every(kw => desc.includes(kw.toLowerCase()));
        });
        if (window.planningTableInstance && typeof window.planningTableInstance.replaceData === 'function') {
          window.planningTableInstance.replaceData(filtered);
        }
      }
    }
  }

  // Listen for button click and Enter key
  button.addEventListener('click', handleDescriptionSearch);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDescriptionSearch();
    }
  });

  // Optional: clear filter on empty input
  input.addEventListener('input', function() {
    if (input.value.trim() === '') {
      handleDescriptionSearch();
    }
  });

  // Insert the search bar into the DOM, always after the filters box
  let injected = false;
  if (filtersBox && filtersBox.parentNode) {
    if (filtersBox.nextSibling) {
      filtersBox.parentNode.insertBefore(container, filtersBox.nextSibling);
    } else {
      filtersBox.parentNode.appendChild(container);
    }
    injected = true;
  } else {
    // Fallback: append to body, fixed at top for debug
    // ...existing code...
    document.body.appendChild(container);
    injected = false;
    // ...existing code...
  }
  // ...existing code...
}

// Inject on DOMContentLoaded and after a short delay to ensure placement
function tryInjectDescriptionKeywordSearchBar() {
  injectDescriptionKeywordSearchBar();
  setTimeout(injectDescriptionKeywordSearchBar, 500);
  setTimeout(injectDescriptionKeywordSearchBar, 1500);
  setTimeout(injectDescriptionKeywordSearchBar, 3000);
  setTimeout(injectDescriptionKeywordSearchBar, 5000);
}

// Pre-populate filters as soon as DOM is ready for faster initial load
function initializeFiltersEarly() {
  const attemptPrePopulation = () => {
    if (window.planningModule?.prePopulatePlanningFilters) {
      window.planningModule.prePopulatePlanningFilters();
    } else {
      // Module not ready yet, try again soon
      setTimeout(attemptPrePopulation, 50);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(attemptPrePopulation, 50); // Small delay to ensure elements exist
    });
  } else {
    // DOM already loaded
    setTimeout(attemptPrePopulation, 50);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInjectDescriptionKeywordSearchBar);
} else {
  tryInjectDescriptionKeywordSearchBar();
}

// Initialize filters early for better performance
initializeFiltersEarly();
function highlightUnsavedRows() {
  if (!window.planningTableInstance) return;
  
  // Use requestAnimationFrame to batch DOM operations and prevent forced reflows
  requestAnimationFrame(() => {
    const rows = window.planningTableInstance.getRows();
    const modifiedRows = [];
    const normalRows = [];
    
    // First pass: collect rows by state without touching DOM
    rows.forEach(row => {
      const data = row.getData();
      if (data.__modified === true) {
        modifiedRows.push(row);
      } else {
        normalRows.push(row);
      }
    });
    
    // Second pass: batch DOM updates
    modifiedRows.forEach(row => {
      row.getElement().classList.add('unsaved-row-highlight');
    });
    normalRows.forEach(row => {
      row.getElement().classList.remove('unsaved-row-highlight');
    });
  });
}

// Add CSS for subtle green highlight
if (!document.getElementById('unsaved-row-highlight-style')) {
  const style = document.createElement('style');
  style.id = 'unsaved-row-highlight-style';
  style.textContent = `
    .unsaved-row-highlight {
      background: linear-gradient(90deg, #e6f9ed 80%, #d0f5e3 100%) !important;
      transition: background 0.3s;
    }
  `;
  document.head.appendChild(style);
}
window.highlightUnsavedRows = highlightUnsavedRows;
// --- Unsaved Changes Flag for Planning Tab ---
window.hasUnsavedPlanningChanges = false;
// Call this function after importing campaigns to trigger the unsaved changes warning on refresh/close
window.setPlanningImportedUnsaved = function() {
  window.hasUnsavedPlanningChanges = true;};
// --- Unsaved Changes Warning Banner for Planning Tab ---
// --- Warn on Tab Close/Reload if Unsaved Changes in Planning Tab ---
window.addEventListener('beforeunload', function (e) {
  if (window.hasUnsavedPlanningChanges) {
    // Show a warning if there are unsaved changes, including imported campaigns
    const msg = 'You have unsaved changes in the Planning tab (including imported campaigns). Are you sure you want to leave?';
    e.preventDefault();
    e.returnValue = msg;
    return msg;
  }
});
// --- Description Cell Hover Enlargement CSS (smaller, smarter, avoids cutoff) ---
function injectDescriptionHoverCSS() {
  if (document.getElementById('desc-hover-style')) return;
  const style = document.createElement('style');
  style.id = 'desc-hover-style';
  style.textContent = `
    .tabulator-cell.description-hover {
      transition: z-index 0s, box-shadow 0.18s, transform 0.18s, background 0.18s;
      position: relative;
      z-index: 1;
      background: inherit;
    }
    .tabulator-cell.description-hover:hover {
      z-index: 1000 !important;
      background: #fff !important;
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.13), 0 1px 3px 0 rgba(0,0,0,0.08);
      /* No absolute/fixed positioning here, revert to normal */
      white-space: pre-line !important;
      overflow: visible !important;
      word-break: break-word;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}
injectDescriptionHoverCSS();
import { kpis, calculatePipeline } from "./src/calc.js";

// Make calculatePipeline available globally for debugging
window.calculatePipeline = calculatePipeline;

// Utility function for safe table scrolling
function safeScrollToRow(table, rowIdentifier, position = "top", ifVisible = false) {
  if (!table || typeof table.scrollToRow !== 'function') {
    console.warn("Invalid table instance for scrolling");
    return false;
  }
  
  try {
    // Check if table is properly initialized
    if (!table.element || !table.element.offsetParent) {
      console.warn("Table not yet visible, skipping scroll");
      return false;
    }
    
    // Get current table data
    const data = table.getData ? table.getData() : [];
    if (!data || data.length === 0) {
      console.warn("No data available for scrolling");
      return false;
    }
    
    // More robust row identification
    let targetRow = rowIdentifier;
    if (typeof rowIdentifier === 'number') {
      // Validate the index is within bounds
      if (rowIdentifier <= data.length && rowIdentifier > 0) {
        targetRow = data[rowIdentifier - 1]; // Convert to 0-based index
      } else {
        // Fallback to first row if index is out of bounds
        targetRow = data[0];
      }
    }
    
    // Verify the target row still exists
    if (!targetRow || typeof targetRow !== 'object') {
      console.warn("Invalid target row, using first available row");
      targetRow = data[0];
    }
    
    // Check if the row actually exists in the current table state
    const tableRows = table.getRows();
    const rowExists = tableRows.some(row => {
      try {
        const rowData = row.getData();
        return rowData === targetRow;
      } catch (e) {
        return false;
      }
    });
    
    if (!rowExists) {
      // Only log in debug mode to reduce console noise
      if (window.DEBUG_MODE) {
        console.warn("Target row no longer exists in table, scrolling to top");
      }
      if (typeof table.scrollToPosition === 'function') {
        table.scrollToPosition(0, 0, false);
        return true;
      }
      return false;
    }
    
    // Perform the scroll operation
    table.scrollToRow(targetRow, position, ifVisible);
    return true;
    
  } catch (scrollError) {
    console.warn("Scroll operation failed:", scrollError.message);
    
    // Fallback to position-based scrolling
    try {
      if (typeof table.scrollToPosition === 'function') {

// --- DM Badge for Digital Motions Campaigns in Execution Details ---
function injectDMBadgeCSS() {
  if (document.getElementById('dm-badge-style')) return;
  const style = document.createElement('style');
  style.id = 'dm-badge-style';
  style.textContent = `
    .dm-badge {
      position: absolute;
      top: 10px;
      right: 12px;
      background: #1976d2;
      color: #fff;
      font-weight: bold;
      font-size: 0.95em;
      padding: 2px 8px 2px 8px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(25,118,210,0.08);
      z-index: 10;
      letter-spacing: 0.04em;
      user-select: none;
      pointer-events: none;
      display: inline-block;
    }
    .details-box-dm {
      position: relative !important;
    }
  `;
  document.head.appendChild(style);
}
injectDMBadgeCSS();

// Call this after rendering the campaign details box in the Execution tab
function addDMBadgeToDetailsBox(detailsBoxElem, campaignData) {
  if (!detailsBoxElem || !campaignData) return;
  // Only add if digitalMotions is true (boolean or string 'true')
  if (campaignData.digitalMotions === true || campaignData.digitalMotions === 'true') {
    detailsBoxElem.classList.add('details-box-dm');
    // Prevent duplicate badge
    if (!detailsBoxElem.querySelector('.dm-badge')) {
      const badge = document.createElement('span');
      badge.className = 'dm-badge';
      badge.textContent = 'DM';
      detailsBoxElem.appendChild(badge);
    }
  } else {
    // Remove badge if present
    const badge = detailsBoxElem.querySelector('.dm-badge');
    if (badge) badge.remove();
    detailsBoxElem.classList.remove('details-box-dm');
  }
}

// Example usage (to be called wherever the details box is rendered/refreshed):
//   addDMBadgeToDetailsBox(detailsBoxElem, campaignData);
// Where detailsBoxElem is the DOM node for the details box, and campaignData is the campaign's data object.

// --- Auto-inject DM badge for all digital motions campaigns in Execution tab ---
function autoInjectDMBadgesOnExecutionTab() {
  // Helper: get all visible campaign details boxes
  function getDetailsBoxes() {
    // Try common selectors; adjust as needed for your app
    return Array.from(document.querySelectorAll('.campaign-details-box, .details-box, .execution-details, .execution-campaign-details'));
  }

  // Helper: get campaign data from DOM node (assumes data is attached or accessible)
  function getCampaignDataFromBox(box) {
    // Try to get data from a property or dataset; adjust as needed for your app
    if (box.campaignData) return box.campaignData;
    if (box.dataset && box.dataset.campaigndata) {
      try { return JSON.parse(box.dataset.campaigndata); } catch (e) { return null; }
    }
    // Fallback: try to find a global or parent data object
    return null;
  }

  // Main logic: add badge to all boxes with digitalMotions true
  function updateAllBadges() {
    getDetailsBoxes().forEach(box => {
      const data = getCampaignDataFromBox(box);
      if (data && (data.digitalMotions === true || data.digitalMotions === 'true')) {
        addDMBadgeToDetailsBox(box, data);
      } else {
        // Remove badge if present
        const badge = box.querySelector && box.querySelector('.dm-badge');
        if (badge) badge.remove();
        box.classList && box.classList.remove('details-box-dm');
      }
    });
  }

  // Observe DOM changes to auto-update badges
  const observer = new MutationObserver(() => {
    if (window.location.hash.includes('#execution')) {
      updateAllBadges();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also update on hash change (tab switch)
  window.addEventListener('hashchange', () => {
    if (window.location.hash.includes('#execution')) {
      setTimeout(updateAllBadges, 100);
    }
  });

  // Initial run if already on execution tab
  if (window.location.hash.includes('#execution')) {
    setTimeout(updateAllBadges, 100);
  }
}
autoInjectDMBadgesOnExecutionTab();
        table.scrollToPosition(0, 0, false);
        return true;
      }
    } catch (fallbackError) {
      console.warn("Fallback scroll also failed:", fallbackError.message);
    }
    
    return false;
  }
}

// PLANNING TAB CONSTANTS AND DATA
// Quarter normalization function to handle format differences ("Q1 July" vs "Q1 - July")
function normalizeQuarter(quarter) {
  if (!quarter || typeof quarter !== 'string') return quarter;
  return quarter.replace(/\s*-\s*/, ' ');
}

// Simplified performance monitoring
const planningPerformance = {
  startTime: null,
  endTime: null,
  
  start(operation) {
    this.startTime = performance.now();
  },
  
  end(operation) {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    
    // Only warn for very slow operations
    if (duration > 5000) {
      console.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
};

const programTypes = [
  "User Groups",
  "Targeted Paid Ads & Content Syndication",
  "Flagship Events (Galaxy, Universe Recaps) 1:Many",
  "3P Sponsored Events",
  "Webinars",
  "Microsoft",
  "Lunch & Learns and Workshops (1:few)",
  "Localized Programs",
  "CxO Events (1:Few)",
  "Exec Engagement Programs",
  "In-Account Events (1:1)",
  "Contractor/Infrastructure",
  "Paid ads",
  "Operational/Infrastructure/Swag",
];

const strategicPillars = [
  "Account Growth and Product Adoption",
  "Pipeline Acceleration & Executive Engagement",
  "Brand Awareness & Top of Funnel Demand Generation",
  "New Logo Acquisition",
];

const revenuePlayOptions = [
  "New Logo Acquisition",
  "Account Expansion",
  "Customer Retention",
  "Cross-sell/Upsell",
  "Market Development",
  "Partner Channel",
];

const countryOptions = [
  "Afghanistan", "Australia", "Bangladesh", "Bhutan", "Brunei Darussalam", 
  "Cambodia", "China", "Hong Kong", "India", "Indonesia", "Japan", 
  "Lao People's Democratic Republic", "Malaysia", "Maldives", "Myanmar", 
  "Nepal", "New Zealand", "Pakistan", "Philippines", "Singapore", 
  "South Korea", "Sri Lanka", "Taiwan", "Thailand", "Vietnam"
];

const names = [
  "Shruti Narang",
  "Beverly Leung",
  "Giorgia Parham",
  "Tomoko Tanaka",
];

const revenuePlays = ["New Business", "Expansion", "Retention"];
const fyOptions = ["FY25", "FY24", "FY23"];

const quarterOptions = [
  "Q1 July",
  "Q1 August",
  "Q1 September",
  "Q2 October",
  "Q2 November",
  "Q2 December",
  "Q3 January",
  "Q3 February",
  "Q3 March",
  "Q4 April",
  "Q4 May",
  "Q4 June",
];

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

const regionOptions = ["JP & Korea", "South APAC", "SAARC", "X APAC Non English", "X APAC English"];

const statusOptions = ["Planning", "On Track", "Shipped", "Cancelled"];
const yesNo = ["(Clear)", "Yes", "No"];

// Country options by region (partial mapping)
const countryOptionsByRegion = {
  ASEAN: [
    "Brunei Darussalam",
    "Cambodia",
    "Indonesia",
    "Lao People's Democratic Republic",
    "Malaysia",
    "Myanmar",
    "Philippines",
    "Singapore",
    "Thailand",
    "Vietnam",
  ],
  ANZ: ["Australia", "New Zealand"],
  GCR: ["China", "Hong Kong", "Taiwan"],
  "South APAC": [
    "Brunei Darussalam",
    "Cambodia",
    "Indonesia",
    "Lao People's Democratic Republic",
    "Malaysia",
    "Myanmar",
    "Philippines",
    "Singapore",
    "Thailand",
    "Vietnam",
    "Australia",
    "New Zealand",
    "China",
    "Hong Kong",
    "Taiwan",
  ],
  "North APAC": ["Japan", "South Korea"],
  SAARC: [
    "Afghanistan",
    "Bangladesh",
    "Bhutan",
    "India",
    "Maldives",
    "Nepal",
    "Pakistan",
    "Sri Lanka",
  ],
  // ...other regions to be filled in as provided...
};

// Ensure all country dropdowns have at least an empty option if no region is selected
Object.keys(countryOptionsByRegion).forEach((region) => {
  if (
    !Array.isArray(countryOptionsByRegion[region]) ||
    countryOptionsByRegion[region].length === 0
  ) {
    countryOptionsByRegion[region] = [""];
  }
});

// Utility: Get all unique countries from all regions (cached for performance)
let allCountriesCache = null;
function getAllCountries() {
  if (allCountriesCache) {
    return allCountriesCache;
  }
  
  const all = [];
  Object.values(countryOptionsByRegion).forEach((arr) => {
    if (Array.isArray(arr)) all.push(...arr);
  });
  // Remove duplicates and cache result
  allCountriesCache = Array.from(new Set(all));
  return allCountriesCache;
}

// Patch: For now, allow all countries for any region
function getCountryOptionsForRegion(region) {
  const allCountries = getAllCountries();
  return allCountries.length > 0 ? allCountries : ["(No countries available)"];
}

// PLANNING DATA LOADING
// Web Worker for heavy data processing
let planningWorker = null;

function initPlanningWorker() {
  if (!planningWorker) {
    try {
      planningWorker = new Worker('workers/planning-worker.js');
      
      planningWorker.onmessage = function(e) {
        const { type, data, progress, error } = e.data;
        
        switch (type) {
          case 'PROGRESS':
            showLoadingIndicator(`Processing... ${progress}%`);
            break;
          case 'PROCESS_PLANNING_DATA_COMPLETE':
            planningDataCache = data;
            isDataLoading = false;
            hideLoadingIndicator();
            break;
          case 'APPLY_FILTERS_COMPLETE':
            if (planningTableInstance) {
              // Clean data to ensure no conflicting row number fields
              const cleanedData = data.map(row => {
                const cleanRow = { ...row };
                // Remove any existing row number fields that might conflict
                delete cleanRow.rowNumber;
                delete cleanRow.sequentialNumber;
                delete cleanRow.rowNum;
                delete cleanRow['#'];
                return cleanRow;
              });
              planningTableInstance.setData(cleanedData);
            }
            hideLoadingIndicator();
            break;
          case 'ERROR':
            console.error("Worker error:", error);
            isDataLoading = false;
            hideLoadingIndicator();
            break;
        }
      };
      
      planningWorker.onerror = function(error) {
        console.error("Worker error:", error);
        planningWorker = null;
      };
      
    } catch (error) {
      planningWorker = null;
    }
  }
  
  return planningWorker;
}

function cleanupPlanningWorker() {
  if (planningWorker) {
    planningWorker.terminate();
    planningWorker = null;
  }
}

// Debounce utility for performance optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
      // Highlight unsaved rows after any debounced update
      if (window.highlightUnsavedRows) setTimeout(window.highlightUnsavedRows, 100);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Batch processing utility for large datasets
function processRowsInBatches(rows, batchSize = 15, callback) {
  // Reduce batch size for more frequent yielding
  batchSize = 5;
  return new Promise((resolve) => {
    let index = 0;
    async function processBatch() {
      const batch = rows.slice(index, index + batchSize);
      if (batch.length === 0) {
        resolve();
        return;
      }
      // Process batch with micro-yields for very small batches
      for (let i = 0; i < batch.length; i++) {
        callback(batch[i], index + i);
        // Yield control every 2 items within the batch
        if (i > 0 && i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      index += batchSize;
      // Yield control between batches
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            processBatch().then(resolve);
          }, 0);
        });
      });
    }
    processBatch();
  });
}

// Ensure planning UI is functional even with empty data
function ensurePlanningUIFunctional() {
  // Wire up buttons even if table isn't ready
  const addBtn = document.getElementById("addPlanningRow");
  if (addBtn && !addBtn.onclick) {
    addBtn.onclick = () => showAddRowModal();
  }

  const delBtn = document.getElementById("deletePlanningRow");
  if (delBtn && !delBtn.onclick) {
    delBtn.textContent = "Delete Highlighted Rows";
    delBtn.onclick = () => {if (!planningTableInstance) {
        alert("No campaigns to delete.");
        return;
      }
      const selectedRows = planningTableInstance.getSelectedRows();
      if (selectedRows.length === 0) {
        alert("No rows selected for deletion.");
        return;
      }
      if (!confirm(`Are you sure you want to delete ${selectedRows.length} selected row(s)?`)) return;
      
      // Use master dataset delete instead of table row delete
      const deletedIds = [];
      selectedRows.forEach(row => {
        const rowData = row.getData();
        if (rowData && rowData.id) {
          // Mark as deleted in master dataset (soft delete)
          planningDataStore.deleteRow(rowData.id);
          deletedIds.push(rowData.id);}
        // Also remove from table display
        row.delete();
      });window.hasUnsavedPlanningChanges = true;};
  }

  // Wire up Delete All Rows button
  const deleteAllBtn = document.getElementById("deleteAllPlanningRows");
  if (deleteAllBtn) {
    // Clear any existing handlers
    deleteAllBtn.onclick = null;
    deleteAllBtn.removeEventListener('click', deleteAllBtn._deleteAllHandler);
    
    // Create the handler function
    const deleteAllHandler = function(event) {
      event.preventDefault();
      event.stopPropagation();if (!window.planningTableInstance) {
        alert("No table instance found. Please reload the page and try again.");
        return;
      }
      
      // Get count from master dataset instead of table
      const masterData = planningDataStore.getData(); // Active data (not deleted)
      const totalRows = masterData.length;
      
      if (totalRows === 0) {
        alert("No rows to delete.");
        return;
      }
      
      const confirmed = confirm(`Are you sure you want to delete ALL ${totalRows} rows? This action cannot be undone.`);
      if (!confirmed) return;
      
      try {
        // Clear the table display
        window.planningTableInstance.clearData();
        
        // Use master dataset to mark all rows as deleted
        const deletedIds = [];
        masterData.forEach(row => {
          if (row && row.id) {
            planningDataStore.deleteRow(row.id);
            deletedIds.push(row.id);
          }
        });window.hasUnsavedPlanningChanges = true;
        alert("All rows have been deleted successfully!");
        
      } catch (error) {
        console.error("Error during deletion:", error);
        alert("Error during deletion: " + error.message);
      }
    };
    
    deleteAllBtn._deleteAllHandler = deleteAllHandler;
    deleteAllBtn.addEventListener('click', deleteAllHandler);
  }
}

// Call during loading to handle empty data case
async function loadPlanning(retryCount = 0, useCache = true) {
  // Return cached data if available
  if (useCache && planningDataCache && planningDataCache.length > 0) {
    return planningDataCache;
  }

  // Prevent multiple simultaneous loads
  if (isDataLoading) {
    while (isDataLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return planningDataCache || [];
  }

  isDataLoading = true;
  planningPerformance.start('data loading');
  
  try {
    let rows;

    // Try using new modular architecture first
    try {
      const planningSystem = await planningSystemPromise;
      if (planningSystem.service) {
        console.log('Loading data via modular planning service...');
        rows = await planningSystem.service.loadData({
          url: window.cloudflareSyncModule?.getWorkerEndpoint() + '/data/planning' || 
               'https://mpt-mvp-sync.jordanradford.workers.dev/data/planning'
        });
        
        if (rows && rows.length > 0) {
          await planningSystem.controller.loadData(rows);
          planningDataCache = rows;
          return rows;
        }
      }
    } catch (moduleError) {
      console.warn('Modular service failed, falling back to legacy:', moduleError);
    }

    try {
      // Use Worker API endpoint
      const workerEndpoint =
        window.cloudflareSyncModule?.getWorkerEndpoint() ||
        "https://mpt-mvp-sync.jordanradford.workers.dev";
      const workerUrl = `${workerEndpoint}/data/planning`;

      const response = await fetch(workerUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        rows = result.data;

        if (!rows || rows.length === 0) {
          if (retryCount < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, (retryCount + 1) * 2000),
            );
            return loadPlanning(retryCount + 1);
          }
        }
      } else {
        throw new Error(`Worker API failed: ${response.status} ${response.statusText}`);
      }
    } catch (workerError) {
      // Fallback: Try local file
      try {
        const r = await fetch("data/planning.json");
        if (!r.ok) throw new Error("Failed to fetch planning.json");
        rows = await r.json();
      } catch (localError) {
        console.error("Local file also failed:", localError.message);
        rows = [];
      }
    }
    
    // Handle empty data gracefully
    if (!rows || !Array.isArray(rows)) {
      rows = [];
    }
    
    if (rows.length === 0) {
      planningDataCache = [];
      isDataLoading = false;
      hideLoadingIndicator();
      
      // Ensure UI is functional even with no data
      setTimeout(() => {
        ensurePlanningUIFunctional();
      }, 100);
      
      // Initialize empty grid immediately
      if (!isGridInitialized) {
        setTimeout(() => {
          initPlanningGrid([]);
        }, 200);
      }
      
      return [];
    }
    
    // Show loading indicator for medium to large datasets
    if (rows.length > 100) {
      showLoadingIndicator("Processing " + rows.length + " campaigns...");
    }
    
    // Use Web Worker for heavy processing if available for almost any dataset size
    if (rows.length > 15 && initPlanningWorker()) {
      return new Promise((resolve) => {
        const handleWorkerMessage = (e) => {
          if (e.data.type === 'PROCESS_PLANNING_DATA_COMPLETE') {
            planningWorker.removeEventListener('message', handleWorkerMessage);
            planningDataCache = e.data.data;
            isDataLoading = false;
            planningPerformance.end('data processing');
            resolve(e.data.data);
          }
        };
        planningWorker.addEventListener('message', handleWorkerMessage);
        planningWorker.postMessage({
          type: 'PROCESS_PLANNING_DATA',
          data: rows,
          options: { batchSize: 10 } // Reduce batch size for worker as well
        });
      });
    } else {
      // Fallback to main thread processing for smaller datasets
      await processRowsInBatches(rows, 5, (row, i) => {
        if (typeof row.expectedLeads === "number") {
          // Only set the fields we actually use (no SQL/Opps since columns removed)
          row.mqlForecast = Math.round(row.expectedLeads * 0.1);
          row.pipelineForecast = calculatePipeline(row.expectedLeads);
        }
        if (!row.id) {
          row.id = `row_${i}_${Date.now()}`;
        }
      });
    }
    
    hideLoadingIndicator();
    planningPerformance.end('data processing');
    
    planningDataCache = rows;
    isDataLoading = false;
    
    return rows;
  } catch (e) {
    console.error("❌ Error in loadPlanning:", e);isDataLoading = false;
    hideLoadingIndicator();
    // Return empty array instead of cached data when there's an error
    planningDataCache = [];
    return [];
  } finally {
    // Ensure isDataLoading is always reset
    if (isDataLoading) {
      isDataLoading = false;
    }
  }
}

// Make globally accessible for data refreshing
window.planningTableInstance = null;
window.loadPlanning = loadPlanning;
let planningDataCache = null;
let isGridInitialized = false;
let isDataLoading = false;

// Enhanced data store with master dataset management for faster operations
class PlanningDataStore {
  constructor() {
    this.masterData = [];           // Complete dataset - source of truth
    this.filteredData = [];         // Currently filtered view
    this.deletedRows = new Set();   // Track deleted row IDs for soft delete
    this.pendingUpdates = new Map();
    this.updateQueue = [];
    this.changeLog = [];            // Track all changes for debugging
  }
  
  // Set the master dataset (called when loading from server/file)
  setData(data) {
    if (!Array.isArray(data)) {
      console.warn('PlanningDataStore.setData: Invalid data provided, expected array');
      data = [];
    }
    
    // Clear __modified on all rows when loading new data
    data.forEach(row => { 
      if (row && typeof row === 'object') {
        row.__modified = false;
        // Ensure each row has an ID
        if (!row.id) {
          row.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      }
    });
    
    this.masterData = [...data];  // Deep copy to prevent external mutation
    this.filteredData = [...data];
    this.deletedRows.clear();
    this.changeLog = [];}
  
  // Get master dataset (unfiltered, including soft-deleted rows)
  getMasterData() {
    return this.masterData;
  }
  
  // Get active dataset (master minus deleted rows)
  getData() {
    return this.masterData.filter(row => !this.deletedRows.has(row.id));
  }
  
  // Get currently filtered data (for table display)
  getFilteredData() {
    return this.filteredData;
  }
  
  // Add new row to master dataset
  addRow(rowData) {
    if (!rowData.id) {
      rowData.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    rowData.__modified = true;
    this.masterData.push(rowData);
    
    this.logChange('add', rowData.id, rowData);return rowData;
  }
  
  // Update row in master dataset
  updateRow(rowId, updates) {
    const rowIndex = this.masterData.findIndex(r => r.id === rowId);
    if (rowIndex === -1) {
      console.warn(`Row not found in master dataset: ${rowId}`);
      return false;
    }
    
    const oldData = { ...this.masterData[rowIndex] };
    Object.assign(this.masterData[rowIndex], updates, { __modified: true });
    
    this.logChange('update', rowId, this.masterData[rowIndex], oldData);
    return true;
  }
  
  // Soft delete row (keeps in master but marks as deleted)
  deleteRow(rowId) {
    const row = this.masterData.find(r => r.id === rowId);
    if (!row) {
      console.warn(`Row not found in master dataset for deletion: ${rowId}`);
      return false;
    }
    
    this.deletedRows.add(rowId);
    this.logChange('delete', rowId, row);return true;
  }
  
  // Hard delete row (permanently removes from master)
  permanentlyDeleteRow(rowId) {
    const rowIndex = this.masterData.findIndex(r => r.id === rowId);
    if (rowIndex === -1) {
      console.warn(`Row not found in master dataset for permanent deletion: ${rowId}`);
      return false;
    }
    
    const deletedRow = this.masterData.splice(rowIndex, 1)[0];
    this.deletedRows.delete(rowId);
    
    this.logChange('permanent_delete', rowId, deletedRow);return true;
  }
  
  // Restore soft-deleted row
  restoreRow(rowId) {
    if (!this.deletedRows.has(rowId)) {
      console.warn(`Row not in deleted set: ${rowId}`);
      return false;
    }
    
    this.deletedRows.delete(rowId);
    const row = this.masterData.find(r => r.id === rowId);
    
    this.logChange('restore', rowId, row);return true;
  }
  
  // Get deleted rows (for recovery/undo functionality)
  getDeletedRows() {
    return this.masterData.filter(row => this.deletedRows.has(row.id));
  }
  
  // Clear all deleted rows permanently
  clearDeletedRows() {
    const deletedCount = this.deletedRows.size;
    this.masterData = this.masterData.filter(row => !this.deletedRows.has(row.id));
    this.deletedRows.clear();return deletedCount;
  }
  
  // Queue updates to reduce immediate DOM operations
  queueUpdate(rowId, updates) {
    this.pendingUpdates.set(rowId, { ...this.pendingUpdates.get(rowId), ...updates });
    
    // Process queue after short delay
    clearTimeout(this.queueTimer);
    this.queueTimer = setTimeout(() => this.processUpdateQueue(), 100);
  }
  
  processUpdateQueue() {
    if (this.pendingUpdates.size === 0) return;
    
    // Apply all pending updates to master dataset
    this.pendingUpdates.forEach((updates, rowId) => {
      this.updateRow(rowId, updates);
    });
    
    this.pendingUpdates.clear();
    
    // Update table if it exists with current filtered view
    if (planningTableInstance && this.getData().length > 0) {
      planningTableInstance.replaceData(this.getFilteredData());
    }
  }

  applyFilters(filters) {
    const startTime = performance.now();
    
    // Early return optimization: if no filters are active, return all active data
    const hasActiveFilters = filters.digitalMotions || 
      (Array.isArray(filters.descriptionKeyword) && filters.descriptionKeyword.length > 0) ||
      ['region', 'quarter', 'status', 'programType', 'strategicPillars', 'owner', 'revenuePlay', 'country']
        .some(field => Array.isArray(filters[field]) && filters[field].length > 0);
    
    // Start with active data (master minus deleted)
    const activeData = this.getData();
    
    if (!hasActiveFilters) {
      this.filteredData = activeData;
      const duration = performance.now() - startTime;
      if (window.DEBUG_FILTERS) {}
      return this.filteredData;
    }
    
    // Pre-compute filter optimizations
    const normalizedQuarterFilters = filters.quarter && Array.isArray(filters.quarter) 
      ? filters.quarter.map(normalizeQuarter) 
      : null;
    
    // Pre-compute case-insensitive filter sets for performance
    const programTypeFilters = filters.programType && Array.isArray(filters.programType)
      ? new Set(filters.programType.map(val => (val || '').toLowerCase().trim()))
      : null;
    
    const strategicPillarsFilters = filters.strategicPillars && Array.isArray(filters.strategicPillars)
      ? new Set(filters.strategicPillars.map(val => (val || '').toLowerCase().trim()))
      : null;
    
    // Pre-compute description keywords for case-insensitive matching
    const descriptionKeywords = Array.isArray(filters.descriptionKeyword) && filters.descriptionKeyword.length > 0
      ? filters.descriptionKeyword.map(kw => kw.toLowerCase())
      : null;
    
    this.filteredData = activeData.filter(row => {
      // Digital Motions filter (optimized boolean check)
      if (filters.digitalMotions && !(row.digitalMotions === true || row.digitalMotions === 'true')) {
        return false;
      }

      // Description keyword filter (optimized with pre-computed keywords)
      if (descriptionKeywords) {
        const desc = (row.description || '').toLowerCase();
        if (!descriptionKeywords.every(kw => desc.includes(kw))) {
          return false;
        }
      }

      // Multiselect filters - check if row value is in the selected array
      const multiselectFields = ['region', 'quarter', 'status', 'programType', 'strategicPillars', 'owner', 'revenuePlay', 'country'];
      for (const field of multiselectFields) {
        const filterValues = filters[field];
        if (filterValues && Array.isArray(filterValues) && filterValues.length > 0) {
          // Get the correct row value for this field
          let rowValue = row[field];

          // Apply field-specific optimizations
          if (field === 'quarter') {
            rowValue = normalizeQuarter(rowValue);
            if (!normalizedQuarterFilters.includes(rowValue)) {
              return false;
            }
          } else if (field === 'programType') {
            // Use pre-computed Set for faster lookup
            const rowValueLower = (rowValue || '').toLowerCase().trim();
            if (!programTypeFilters.has(rowValueLower)) {
              return false;
            }
          } else if (field === 'strategicPillars') {
            // Use pre-computed Set for faster lookup
            const rowValueLower = (rowValue || '').toLowerCase().trim();
            if (!strategicPillarsFilters.has(rowValueLower)) {
              return false;
            }
          } else {
            // Direct array includes for exact matches (fastest for other fields)
            if (!filterValues.includes(rowValue)) {
              return false;
            }
          }
        }
      }

      return true;
    });
    
    const duration = performance.now() - startTime;
    if (window.DEBUG_FILTERS) {}
    
    return this.filteredData;
  }
  
  // Clear all data (including deleted rows)
  clearAllData() {
    this.masterData = [];
    this.filteredData = [];
    this.deletedRows.clear();
    this.pendingUpdates.clear();
    this.updateQueue = [];
    this.changeLog = [];
    console.log("All planning data cleared from data store");
  }
  
  // Log changes for debugging and potential undo functionality
  logChange(action, rowId, newData, oldData = null) {
    this.changeLog.push({
      timestamp: new Date().toISOString(),
      action,
      rowId,
      newData: newData ? { ...newData } : null,
      oldData: oldData ? { ...oldData } : null
    });
    
    // Keep only last 100 changes to prevent memory bloat
    if (this.changeLog.length > 100) {
      this.changeLog.shift();
    }
  }
  
  // Get change history for debugging
  getChangeLog() {
    return this.changeLog;
  }
  
  // Get statistics about the dataset
  getStats() {
    return {
      masterDataCount: this.masterData.length,
      activeDataCount: this.getData().length,
      filteredDataCount: this.filteredData.length,
      deletedCount: this.deletedRows.size,
      pendingUpdates: this.pendingUpdates.size,
      changeLogEntries: this.changeLog.length
    };
  }
}

// --- MODULAR ARCHITECTURE INITIALIZATION ---
// Initialize with new modular architecture when available, fallback to legacy
async function initializePlanningSystem() {
  try {
    let planningModule = null;
    
    // Phase 1: Initialize modular architecture
    if (window.PlanningModuleLoader) {
      console.log('Initializing with modular architecture...');
      planningModule = await window.PlanningModuleLoader.initializePlanningModule();
      
      // Maintain backward compatibility
      window.planningDataStore = planningModule.controller.model;
      window.planningController = planningModule.controller;
    } else {
      // Fallback to legacy architecture
      console.log('Using legacy planning data store...');
      const planningDataStore = new PlanningDataStore();
      window.planningDataStore = planningDataStore;
      planningModule = { controller: { model: planningDataStore } };
    }
    
    // Phase 2: Initialize advanced architecture and performance enhancements
    if (window.Phase2Integration) {
      try {
        console.log('🚀 Initializing Phase 2: Advanced Architecture & Performance...');
        
        const phase2System = await window.Phase2Integration.initializePhase2({
          enablePerformanceMonitoring: true,
          enableDataOptimization: true,
          enableVirtualScrolling: true,
          enableComponentSystem: true,
          performanceThresholds: {
            renderTime: 16,
            dataOperation: 50,
            networkRequest: 1000,
            memoryUsage: 50,
            domNodes: 1000
          }
        });
        
        // Enhance the planning controller with Phase 2 optimizations
        if (window.planningController) {
          window.planningController = window.Phase2Integration.enhancePlanningController(window.planningController);
        }
        
        // Store Phase 2 system globally
        window.phase2System = phase2System;
        
        console.log('✅ Phase 2 system successfully integrated');
        
        // Add Phase 2 to planning module
        if (planningModule) {
          planningModule.phase2 = phase2System;
        }
        
      } catch (error) {
        console.warn('⚠️ Phase 2 initialization failed, continuing with Phase 1:', error);
      }
    } else {
      console.log('Phase 2 not available, using Phase 1 only');
    }
    
    // Phase 3: Initialize advanced features and analytics
    if (window.Phase3Integration) {
      try {
        console.log('🧠 Initializing Phase 3: Advanced Features & Analytics...');
        
        const phase3System = await window.Phase3Integration.initializePhase3({
          enableAnalytics: true,
          enablePredictions: true,
          analyticsConfig: {
            enablePredictions: true,
            enableTrendAnalysis: true,
            enableAnomalyDetection: true,
            confidenceThreshold: 0.7
          },
          predictiveConfig: {
            predictionHorizon: 90,
            confidenceThreshold: 0.6,
            enableSeasonality: true
          }
        });
        
        // Enhance controllers with Phase 3 capabilities
        if (phase3System && window.planningController) {
          phase3System.enhanceExistingControllers();
        }
        
        // Store Phase 3 system globally
        window.phase3System = phase3System;
        
        console.log('✅ Phase 3 system successfully integrated');
        
        // Add Phase 3 to planning module
        if (planningModule) {
          planningModule.phase3 = phase3System;
        }
        
      } catch (error) {
        console.warn('⚠️ Phase 3 initialization failed, continuing with Phase 2:', error);
      }
    } else {
      console.log('Phase 3 not available, using Phase 2 only');
    }
    
    return planningModule;
    
  } catch (error) {
    console.warn('Failed to initialize modular architecture, using legacy:', error);
    const planningDataStore = new PlanningDataStore();
    window.planningDataStore = planningDataStore;
    return { controller: { model: planningDataStore } };
  }
}

// Initialize the system
let planningSystemPromise = initializePlanningSystem();

// Legacy instantiation for immediate compatibility
const planningDataStore = new PlanningDataStore();
window.planningDataStore = planningDataStore;

// Debug utilities for testing master dataset functionality
window.planningDebug = {
  // Test the master dataset functionality
  testMasterDataset() {
    console.log('=== Testing Master Dataset Functionality ===');
    const stats = planningDataStore.getStats();
    console.log('Current stats:', stats);
    console.log('Master data sample:', planningDataStore.getMasterData().slice(0, 3));
    console.log('Active data count:', planningDataStore.getData().length);
    console.log('Filtered data count:', planningDataStore.getFilteredData().length);
    console.log('Deleted rows:', planningDataStore.getDeletedRows().length);
    return stats;
  },
  
  // Phase 2 Testing
  async testPhase2System() {
    console.log('🧪 Testing Phase 2 System...');
    
    if (!window.phase2System) {
      console.warn('⚠️ Phase 2 system not available');
      return false;
    }
    
    try {
      // Test performance monitoring
      const health = window.phase2System.getSystemHealth();
      console.log('📊 System Health:', health);
      
      // Test data optimization
      const data = window.planningController?.getData() || [];
      if (data.length > 0) {
        const optimizedData = await window.phase2System.optimizeDataset(data, {
          indexFields: ['region', 'quarter', 'status'],
          precomputeAggregations: true
        });
        console.log('🚀 Data optimization test:', optimizedData ? 'PASSED' : 'FAILED');
      }
      
      // Test performance stats
      const stats = window.phase2System.getPerformanceStats();
      console.log('📈 Performance Stats:', stats);
      
      // Run built-in tests if available
      if (window.Phase2Integration && window.Phase2Integration.createPhase2Tests) {
        const testSuite = window.Phase2Integration.createPhase2Tests();
        const testResults = await testSuite.runAllTests();
        console.log('🧪 Phase 2 Test Results:', testResults);
        return testResults.passed;
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Phase 2 test failed:', error);
      return false;
    }
  },
  
  // Test filter optimization
  async testOptimizedFiltering() {
    console.log('🔍 Testing Optimized Filtering...');
    
    if (!window.phase2System) {
      console.warn('⚠️ Phase 2 system not available');
      return false;
    }
    
    const data = window.planningController?.getData() || [];
    if (data.length === 0) {
      console.warn('No data available for filtering test');
      return false;
    }
    
    // Test regular vs optimized filtering performance
    const filters = { 
      region: ['North America', 'Europe'],
      status: ['Active', 'Planning']
    };
    
    // Regular filtering
    const startTime = performance.now();
    const regularResult = data.filter(row => {
      return (!filters.region || filters.region.includes(row.region)) &&
             (!filters.status || filters.status.includes(row.status));
    });
    const regularTime = performance.now() - startTime;
    
    // Optimized filtering
    const optimizedStartTime = performance.now();
    const optimizedResult = window.phase2System.createOptimizedFilter(data, filters);
    const optimizedTime = performance.now() - optimizedStartTime;
    
    console.log(`📊 Regular filtering: ${regularResult.length} results in ${regularTime.toFixed(2)}ms`);
    console.log(`🚀 Optimized filtering: ${optimizedResult.length} results in ${optimizedTime.toFixed(2)}ms`);
    console.log(`⚡ Performance gain: ${((regularTime - optimizedTime) / regularTime * 100).toFixed(1)}%`);
    
    return optimizedResult.length === regularResult.length;
  },
  
  // Test virtual scrolling
  testVirtualScrolling() {
    console.log('📜 Testing Virtual Scrolling...');
    
    if (!window.phase2System) {
      console.warn('⚠️ Phase 2 system not available');
      return false;
    }
    
    const table = document.querySelector('#planningTable');
    if (!table) {
      console.warn('Planning table not found');
      return false;
    }
    
    const data = window.planningController?.getData() || [];
    console.log(`📊 Data count: ${data.length}`);
    
    if (data.length > 1000) {
      console.log('🔧 Large dataset detected, virtual scrolling should be active');
      
      // Check if virtual scrolling is active
      const tbody = table.querySelector('tbody');
      const virtualizationMarkers = tbody?.querySelectorAll('[data-virtual-index]');
      
      if (virtualizationMarkers && virtualizationMarkers.length > 0) {
        console.log('✅ Virtual scrolling is active');
        return true;
      } else {
        console.log('⚠️ Virtual scrolling not detected');
        return false;
      }
    } else {
      console.log('📊 Dataset too small for virtual scrolling');
      return true;
    }
  },
  
  // Test soft delete functionality
  testSoftDelete(rowId) {
    if (!rowId) {
      const activeData = planningDataStore.getData();
      if (activeData.length === 0) {
        console.log('No rows available to delete');
        return false;
      }
      rowId = activeData[0].id;
    }
    
    console.log(`Testing soft delete for row: ${rowId}`);
    const beforeStats = planningDataStore.getStats();
    const success = planningDataStore.deleteRow(rowId);
    const afterStats = planningDataStore.getStats();
    
    console.log('Before:', beforeStats);
    console.log('After:', afterStats);
    console.log('Delete successful:', success);
    
    return success;
  },
  
  // Test restore functionality
  testRestore(rowId) {
    if (!rowId) {
      const deletedRows = planningDataStore.getDeletedRows();
      if (deletedRows.length === 0) {
        console.log('No deleted rows available to restore');
        return false;
      }
      rowId = deletedRows[0].id;
    }
    
    console.log(`Testing restore for row: ${rowId}`);
    const beforeStats = planningDataStore.getStats();
    const success = planningDataStore.restoreRow(rowId);
    const afterStats = planningDataStore.getStats();
    
    console.log('Before:', beforeStats);
    console.log('After:', afterStats);
    console.log('Restore successful:', success);
    
    return success;
  },
  
  // View change log
  viewChangeLog() {
    const log = planningDataStore.getChangeLog();
    console.log('=== Change Log ===');
    log.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.timestamp} - ${entry.action} - Row: ${entry.rowId}`);
    });
    return log;
  }
};

// Loading indicator functions for large dataset processing
function showLoadingIndicator(message = "Loading...") {
  const existing = document.getElementById("planningLoadingIndicator");
  if (existing) existing.remove();
  
  const indicator = document.createElement("div");
  indicator.id = "planningLoadingIndicator";
  indicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px 30px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  indicator.innerHTML = `
    <div style="
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff40;
      border-top: 2px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
    ${message}
  `;
  
  // Add CSS animation if not already present
  if (!document.querySelector("#loadingSpinnerCSS")) {
    const style = document.createElement("style");
    style.id = "loadingSpinnerCSS";
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(indicator);
}

function hideLoadingIndicator() {const indicator = document.getElementById("planningLoadingIndicator");
  if (indicator) {
    indicator.remove();
    console.log("✅ Loading indicator removed");
  } else {}
}

// Lazy initialization function for planning grid
async function initPlanningGridLazy() {
  if (isGridInitialized && planningTableInstance) {
    return planningTableInstance;
  }
  
  const perfTracker = window.performanceMonitor?.startTracking('planning-grid-init');
  
  try {
    // Load data first
    const rows = await loadPlanning();
    
    // Initialize grid with data (now returns a Promise)
    const table = await initPlanningGrid(rows);
    isGridInitialized = true;
    
    return table;
  } catch (error) {
    console.error("Failed to initialize planning grid:", error);
    throw error;
  } finally {
    perfTracker?.end();
  }
}

function initPlanningGrid(rows) {
  planningPerformance.start('grid initialization');
  
  // Handle empty data gracefully
  if (!rows || !Array.isArray(rows)) {
    rows = [];
  }
  
  // Clean data to ensure no conflicting row number fields
  const cleanedRows = rows.map(row => {
    const cleanRow = { ...row };
    // Remove any existing row number fields that might conflict
    delete cleanRow.rowNumber;
    delete cleanRow.sequentialNumber;
    delete cleanRow.rowNum;
    delete cleanRow['#'];
    return cleanRow;
  });
  
  // Initialize data store
  planningDataStore.setData(cleanedRows);
  
  // Notify other modules that planning data is ready
  if (rows && rows.length > 0) {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('planningDataReady', { 
        detail: { rowCount: rows.length, source: 'planning' }
      }));
    }, 100);
  }
  
  return new Promise((resolve) => {
    // Break up the initialization into smaller chunks to prevent long tasks
    const initializeInChunks = async () => {
      
      // More aggressive yielding function for better responsiveness
      const yieldToMain = () => new Promise(resolve => {
        // Use requestIdleCallback if available, otherwise setTimeout
        if (window.requestIdleCallback) {
          requestIdleCallback(resolve, { timeout: 5 }); // Much shorter timeout
        } else {
          setTimeout(resolve, 5); // Much shorter timeout for immediate yielding
        }
      });
      
      // Chunk 1: Performance config (small task)
      const performanceConfig = {
        // Use pagination for better performance (conflicts resolved)
        pagination: "local",
        paginationSize: 50,
        paginationSizeSelector: [25, 50, 100],
        paginationCounter: "rows",
        
        // Disable conflicting features - cannot use virtualDom AND pagination AND progressiveLoad together
        virtualDom: false,
        progressiveLoad: false,
        
        // Use basic rendering to avoid scroll violations and improve performance
        renderHorizontal: "basic",
        renderVertical: "basic",
        
        // Performance optimizations
        autoResize: true, // Re-enable for proper sizing
        responsiveLayout: false, // Keep disabled to allow horizontal scrolling
        invalidOptionWarnings: false,
        
        // Fix scroll performance issues - disable problematic scroll features
        scrollToRowPosition: "top",
        scrollToColumnPosition: "left", 
        scrollToRowIfVisible: false,
        
        // Disable wheel event handling that causes passive listener warnings
        wheelScrollSpeed: 0, // Disable wheel scrolling in tabulator
        
        // Enable proper data loading indicators
        dataLoaderLoading: "<div style='padding:20px; text-align:center;'>Loading...</div>",
        dataLoaderError: "<div style='padding:20px; text-align:center; color:red;'>Error loading data</div>",
        
        // Reduce column calculations only if not needed
        columnCalcs: false,
        
        // Optimized scroll handling - single configuration
        scrollToRowPosition: "top",
        scrollToColumnPosition: "left",
        scrollToRowIfVisible: false,
        
        // Debounced data updates with reasonable delay
        dataChanged: debounce(() => {
          console.log("Planning data changed");
          window.hasUnsavedPlanningChanges = true;
          console.log("[Planning] Unsaved changes set to true (dataChanged)");
        }, 500), // Shorter debounce for better responsiveness
        
        // Add pagination callback to prevent scroll errors
        pageLoaded: function(pageno) {
          // Ensure we don't try to scroll to invalid positions after page changes
          console.log(`Planning grid page ${pageno} loaded`);
        },
      };
      
      // Yield control back to the browser with new aggressive yielding
      await yieldToMain();
      
      // Chunk 2: Create table with basic config (medium task)
      planningTableInstance = new Tabulator("#planningGrid", {
        data: cleanedRows,
        reactiveData: true,
        selectableRows: true, // Allow multi-row selection
        layout: "fitData", // Back to basic fitData for natural column sizing
        // No initialSort: preserve data order for sequential numbering
        ...performanceConfig,
        scrollToRowPosition: "top",
        scrollToColumnPosition: "left",
        scrollToRowIfVisible: false,
        // Handle empty data state
        placeholder: rows.length === 0 ? 
          "<div style='padding: 60px; text-align: center; color: #444; font-size: 1.2em; background: #f8f9fa; border-radius: 8px; margin: 20px;'>" +
          "<h3 style='margin: 0 0 15px 0; color: #333;'>📊 No campaigns currently</h3>" +
          "<p style='margin: 0 0 20px 0; font-size: 1em; color: #666;'>Get started by adding campaigns through:</p>" +
          "<div style='display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;'>" +
          "<button onclick='document.getElementById(\"addPlanningRow\").click()' style='padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;'>➕ Add Campaign</button>" +
          "<button onclick='document.getElementById(\"importCSVBtn\").click()' style='padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;'>📁 Import Campaigns</button>" +
          "</div>" +
          "</div>" : 
          "No Data Available",
        tableBuilt: function() {
          // Wire up button functionality now that table is built
          ensurePlanningUIFunctional();
          
          // Use optimized redraw scheduling to prevent performance violations
          requestAnimationFrame(() => {
            try {
              this.redraw(false); // Use false for non-blocking redraw
              
              // Schedule scroll in next frame to prevent layout thrashing
              requestAnimationFrame(() => {
                if (this.getData().length > 0 && this.element && this.element.offsetParent) {
                  safeScrollToRow(this, 1, "top", false);
                }
              });
            } catch (e) {
              console.warn("Error in tableBuilt callback:", e.message);
            }
          });
        },
        dataLoaded: function(data) {
          // Use requestAnimationFrame for consistent performance
          requestAnimationFrame(() => {
            this.redraw(false);
          });
        },
        columns: []
      });
      
      // Yield control back to the browser with new aggressive yielding
      await yieldToMain();
      
      // Create debounced autosave function before columns are defined
      const debouncedAutosave = debounce(() => {
        triggerPlanningAutosave(planningTableInstance);
      }, 3000);
      
      // Chunk 3: Add columns in smaller batches to prevent blocking
      const addColumnsInBatches = async () => {
        const allColumns = [
          // Hidden column for unsaved row priority
          {
            title: '',
            field: "__unsavedPriority",
            visible: false,
            headerSort: false,
            width: 1,
            cssClass: 'hidden-col',
            mutator: function(value, data) {
              // Always return 1 for unsaved, 0 otherwise
              return data.__unsavedPriority || 0;
            },
          },
          // Sequential number column
          {
            title: "#",
            field: "sequentialNumber", // Use a different field name to avoid conflicts
            formatter: function (cell) {
              const row = cell.getRow();
              const table = row.getTable();
              const allRows = table.getRows("visible"); // Only count visible rows
              let index = -1;
              // Find the actual index of this row
              for (let i = 0; i < allRows.length; i++) {
                if (allRows[i] === row) {
                  index = i;
                  break;
                }
              }
              return index + 1;
            },
            width: 50,
            hozAlign: "center",
            headerSort: false,
            frozen: true,
            download: false, // Don't include in CSV exports
            cellClick: false, // Disable cell editing
            editor: false, // Disable editing
          },
          // Select row button (circle)
          {
            title: "",
            field: "select",
            formatter: function (cell) {
              const row = cell.getRow();
              const selected = row.getElement().classList.contains("row-selected");
              return `<span class="select-circle" style="display:inline-block;width:18px;height:18px;border-radius:50%;border:2px solid #888;background:${selected ? "#0969da" : "transparent"};cursor:pointer;"></span>`;
            },
            width: 40,
            hozAlign: "center",
            cellClick: function (e, cell) {
              const row = cell.getRow();
              row.getElement().classList.toggle("row-selected");
              // Use non-blocking redraw
              if (window.requestIdleCallback) {
                requestIdleCallback(() => {
                  cell.getTable().redraw(false);
                }, { timeout: 50 });
              } else {
                setTimeout(() => {
                  cell.getTable().redraw(false);
                }, 10);
              }
            },
            headerSort: false,
          },
          {
            title: "Program Type",
            field: "programType",
            editor: "list",
            editorParams: { values: programTypes },
            width: 200,
            cellEdited: debounce((cell) => {
              const r = cell.getRow();
              const rowData = r.getData();

              if (cell.getValue() === "In-Account Events (1:1)") {
                r.update({
                  expectedLeads: 0,
                  mqlForecast: 0,
                  pipelineForecast: rowData.forecastedCost ? Number(rowData.forecastedCost) * 20 : 0,
                });
              } else {
                if (typeof rowData.expectedLeads === "number" && rowData.expectedLeads > 0) {
                  r.update({
                    mqlForecast: Math.round(rowData.expectedLeads * 0.1),
                    pipelineForecast: calculatePipeline(rowData.expectedLeads),
                  });
                }
              }
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Program Type)");
              debouncedAutosave();
            }, 1000),
          },
          {
            title: "Strategic Pillar",
            field: "strategicPillars",
            editor: "list",
            editorParams: { values: strategicPillars },
            width: 220,
            cellEdited: debounce((cell) => {
              const rowData = cell.getRow().getData();
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Strategic Pillar)");
              debouncedAutosave();
            }, 1000),
          },
          {
            title: "Description",
            field: "description",
            editor: "input",
            width: 180,
            formatter: function(cell) {
              // Wrap in span for hover effect
              const val = cell.getValue() || '';
              return `<span class="desc-hover-span">${val.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
            },
            cellClick: function (e, cell) {
              // Remove any existing tooltip when clicking to edit
              cleanupAllDescriptionTooltips();
              
              // Start editing the cell normally
              cell.edit();
            },
            cellMouseOver: function(e, cell) {
              const el = cell.getElement();
              
              // Don't show tooltip if cell is being edited
              if (el.querySelector('input') || el.querySelector('textarea')) {
                return;
              }
              
              // Clean up any existing tooltips first
              cleanupAllDescriptionTooltips();
              
              el.classList.add('description-hover');
              // Create floating tooltip
              let tooltip = document.createElement('div');
              tooltip.className = 'desc-hover-tooltip';
              tooltip.textContent = cell.getValue() || '';
              document.body.appendChild(tooltip);
              // Style the tooltip (larger text and box)
              Object.assign(tooltip.style, {
                position: 'fixed',
                zIndex: 99999,
                background: '#fff',
                color: '#222',
                boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18), 0 1px 6px 0 rgba(0,0,0,0.10)',
                borderRadius: '10px',
                padding: '18px 28px',
                maxWidth: '70vw',
                minWidth: '220px',
                fontSize: '1.25em',
                lineHeight: '1.6',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
                pointerEvents: 'none',
                top: '0',
                left: '0',
                transition: 'opacity 0.12s',
                opacity: '0',
              });
              // Position near mouse with optimized reflow prevention
              function moveTooltip(ev) {
                const margin = 18;
                let x = ev.clientX + margin;
                let y = ev.clientY + margin;
                
                // Use requestAnimationFrame to batch DOM reads and writes
                requestAnimationFrame(() => {
                  // Batch read operations
                  const rect = tooltip.getBoundingClientRect();
                  const viewportWidth = window.innerWidth;
                  const viewportHeight = window.innerHeight;
                  
                  // Calculate positions
                  if (x + rect.width > viewportWidth) x = viewportWidth - rect.width - margin;
                  if (y + rect.height > viewportHeight) y = viewportHeight - rect.height - margin;
                  
                  // Batch write operations
                  tooltip.style.cssText += `left: ${x}px; top: ${y}px; opacity: 1;`;
                });
              }
              moveTooltip(e);
              el._descTooltipMove = moveTooltip;
              el._descTooltipDiv = tooltip;
              el.addEventListener('mousemove', moveTooltip);
              
              // Auto-cleanup after 10 seconds as a failsafe
              setTimeout(() => {
                if (tooltip && tooltip.parentNode) {
                  tooltip.remove();
                }
                if (el._descTooltipMove) {
                  el.removeEventListener('mousemove', el._descTooltipMove);
                  el._descTooltipMove = null;
                }
                if (el._descTooltipDiv) {
                  el._descTooltipDiv = null;
                }
                el.classList.remove('description-hover');
              }, 10000);
            },
            cellMouseOut: function(e, cell) {
              const el = cell.getElement();
              el.classList.remove('description-hover');
              if (el._descTooltipDiv) {
                el._descTooltipDiv.remove();
                el._descTooltipDiv = null;
              }
              if (el._descTooltipMove) {
                el.removeEventListener('mousemove', el._descTooltipMove);
                el._descTooltipMove = null;
              }
            },
            cellEdited: function(cell) {
              // Trigger autosave when description is edited
              setTimeout(() => {
                debouncedAutosave();
              }, 100);
            }
          },
          {
            title: "Owner",
            field: "owner",
            editor: "list",
            editorParams: { values: names },
            width: 140,
          },
          {
            title: "Quarter",
            field: "quarter",
            editor: "list",
            editorParams: { values: quarterOptions },
            width: 120,
          },
          {
            title: "Region",
            field: "region",
            editor: "list",
            editorParams: { values: regionOptions },
            width: 120,
          },
          {
            title: "Fiscal Year",
            field: "fiscalYear",
            editor: "list",
            editorParams: { values: ["FY25", "FY26", "FY27"] },
            width: 100,
          },
          {
            title: "Country",
            field: "country",
            editor: "list",
            editorParams: {
              values: getAllCountries(),
            },
            width: 130,
          },
          {
            title: "Forecasted Cost",
            field: "forecastedCost",
            editor: "number",
            width: 200,
            formatter: function (cell) {
              const v = cell.getValue();
              if (v === null || v === undefined || v === "") return "";
              return "$" + Number(v).toLocaleString();
            },
            cellEdited: debounce((cell) => {
              const r = cell.getRow();
              const rowData = r.getData();

              if (rowData.programType === "In-Account Events (1:1)") {
                r.update({
                  expectedLeads: 0,
                  mqlForecast: 0,
                  pipelineForecast: cell.getValue() ? Number(cell.getValue()) * 20 : 0,
                });
              }
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Forecasted Cost)");
              debouncedAutosave();
            }, 1000),
          },
          {
            title: "Expected Leads",
            field: "expectedLeads",
            editor: "number",
            width: 150,
            cellEdited: debounce((cell) => {
              const r = cell.getRow();
              const rowData = r.getData();

              if (rowData.programType === "In-Account Events (1:1)") {
                r.update({
                  expectedLeads: 0,
                  mqlForecast: 0,
                  pipelineForecast: rowData.forecastedCost ? Number(rowData.forecastedCost) * 20 : 0,
                });
              } else {
                r.update({
                  mqlForecast: Math.round(cell.getValue() * 0.1),
                  pipelineForecast: calculatePipeline(cell.getValue()),
                });
              }
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Expected Leads)");
              debouncedAutosave();
            }, 1000),
          },
          { title: "Forecasted MQL", field: "mqlForecast", editable: false, width: 150, headerSort: true, headerVertical: false, headerWordWrap: false },
          // Removed SQL and Opps columns
          {
            title: "Forecasted Pipeline",
            field: "pipelineForecast",
            editable: false,
            width: 170,
            headerSort: true,
            headerVertical: false,
            headerWordWrap: false,
            formatter: function (cell) {
              const v = cell.getValue();
              if (v === null || v === undefined || v === "") return "";
              return "$" + Number(v).toLocaleString();
            },
          },
          // Added Issue Link column
          {
            title: 'Issue Link',
            field: 'issueLink',
            formatter: function(cell) {
              const val = cell.getValue();
              if (!val) return '';
              // Always show 'Issue Link' for any valid URL, regardless of original anchor text
              if (/^https?:\/\//.test(val)) {
                return `<a href="${val}" target="_blank" rel="noopener" style="font-family: 'Mona Sans', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif; font-weight: 600; font-size: 1em; color: #1976d2; text-decoration: underline;">Issue Link</a>`;
              }
              return `<span style="font-family: 'Mona Sans', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif; font-weight: 600; font-size: 1em; color: #1976d2;">${val}</span>`;
            },
            editor: 'input',
            headerTooltip: 'Paste a GitHub or Jira issue link for this row',
            width: 140
          },
          {
            title: "Revenue Play",
            field: "revenuePlay",
            editor: "list",
            editorParams: { values: revenuePlays },
            width: 140,
          },
          {
            title: "Status",
            field: "status",
            editor: "list",
            editorParams: { values: statusOptions },
            width: 130,
            cellEdited: debounce((cell) => {
              const rowData = cell.getRow().getData();
              rowData.__modified = true;
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (cellEdited: Status)");
              debouncedAutosave();
            }, 1000),
          },
          {
            title: "PO Raised",
            field: "poRaised",
            editor: "list",
            editorParams: { values: yesNo },
            width: 110,
            cellEdited: function(cell) {
              if (cell.getValue() === "(Clear)") {
                cell.setValue("");
              }
            },
            formatter: function(cell) {
              const value = cell.getValue();
              return value === "" || value === null || value === undefined ? "(Clear)" : value;
            },
          },
          // Digital Motions toggle - moved to second-to-last position
          {
            title: "Digital Motions",
            field: "digitalMotions",
            formatter: function (cell) {
              const value = cell.getValue();
              return `<input type='checkbox' ${value ? "checked" : ""} style='transform:scale(1.3); cursor:pointer;' />`;
            },
            width: 120,
            hozAlign: "center",
            cellClick: function (e, cell) {
              const current = !!cell.getValue();
              cell.setValue(!current);

              setTimeout(() => {
                if (
                  window.executionModule &&
                  typeof window.executionModule.syncDigitalMotionsFromPlanning ===
                    "function"
                ) {
                  window.executionModule.syncDigitalMotionsFromPlanning();
                  console.log(
                    "[Planning] Synced Digital Motions change to execution table",
                  );
                }
              }, 50);

              setTimeout(() => {
                if (
                  window.roiModule &&
                  typeof window.roiModule.updateRemainingBudget === "function"
                ) {
                  const regionFilter =
                    document.getElementById("roiRegionFilter")?.value || "";
                  window.roiModule.updateRemainingBudget(regionFilter);
                  window.roiModule.updateForecastedBudgetUsage(regionFilter);
                  console.log(
                    "[Planning] Triggered ROI budget updates after Digital Motions toggle",
                  );
                }
              }, 100);
            },
            headerSort: false,
          },
          // Bin icon (delete) - kept as last column
          {
            title: "",
            field: "delete",
            formatter: function () {
              return '<button class="delete-row-btn" title="Delete Row" style="color: #d1242f; font-size: 16px; display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H13v8.25A1.75 1.75 0 0 1 11.25 14H4.75A1.75 1.75 0 0 1 3 12.75V4.5h-.25a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.5 4.5v8a.25.25 0 0 0 .25.25h6.5a.25.25 0 0 0 .25-.25v-8H4.5z"/></svg></button>';
            },
            width: 50,
            hozAlign: "center",
            cellClick: function (e, cell) {
              console.log("=== PHASE 3: Individual Row Delete Using Master Dataset ===");
              
              const rowData = cell.getRow().getData();
              if (rowData && rowData.id) {
                // Soft delete from master dataset
                planningDataStore.deleteRow(rowData.id);
                console.log(`Phase 3: Soft deleted row ID: ${rowData.id} from master dataset`);
              }
              
              // Also remove from table display
              cell.getRow().delete();
              window.hasUnsavedPlanningChanges = true;
              console.log("[Planning] Unsaved changes set to true (row delete)");
            },
            headerSort: false,
          },
        ];
        
        // Add columns in even smaller batches to prevent long tasks
        const batchSize = 1; // Reduce to 1 for maximum responsiveness
        for (let i = 0; i < allColumns.length; i += batchSize) {
          const batch = allColumns.slice(i, i + batchSize);
          // Add this batch of columns
          batch.forEach(column => {
            planningTableInstance.addColumn(column);
          });
          // Yield after each column
          await new Promise(resolve => {
            if (window.requestIdleCallback) {
              requestIdleCallback(resolve, { timeout: 5 });
            } else {
              setTimeout(resolve, 2);
            }
          });
        }
      };
      
      await addColumnsInBatches();
      
      // Chunk 4: Setup remaining functionality with yielding
      await yieldToMain();
      
      // debouncedAutosave function already created above before columns

      await yieldToMain(); // Yield before setting up buttons

      // Wire up buttons
      const addBtn = document.getElementById("addPlanningRow");
      if (addBtn) {
        addBtn.onclick = () => showAddRowModal();
      }

      await yieldToMain(); // Yield between button setups

      const delBtn = document.getElementById("deletePlanningRow");
      if (delBtn) {
        delBtn.textContent = "Delete Highlighted Rows";
        delBtn.onclick = () => {
          console.log("=== PHASE 3: Using Master Dataset for Delete (Alternative Handler) ===");
          
          const selectedRows = planningTableInstance.getSelectedRows();
          if (selectedRows.length === 0) {
            alert("No rows selected for deletion.");
            return;
          }
          if (!confirm(`Are you sure you want to delete ${selectedRows.length} selected row(s)?`)) return;
          
          // Use master dataset delete instead of just table row delete
          const deletedIds = [];
          selectedRows.forEach(row => {
            const rowData = row.getData();
            if (rowData && rowData.id) {
              // Mark as deleted in master dataset (soft delete)
              planningDataStore.deleteRow(rowData.id);
              deletedIds.push(rowData.id);}
            // Also remove from table display
            row.delete();
          });
          
          console.log(`Phase 3: Deleted ${deletedIds.length} rows from master dataset (alternative handler)`);
          window.hasUnsavedPlanningChanges = true;};
      }

      setupPlanningSave(planningTableInstance, rows);

      // Update global reference
      window.planningTableInstance = planningTableInstance;
      
      // Wire up button functionality now that table is createdensurePlanningUIFunctional();

      // Add event handlers
      const resizeHandler = debounce(() => {
        if (planningTableInstance) {
          // Use non-blocking redraw for resize events
          if (window.requestIdleCallback) {
            requestIdleCallback(() => {
              planningTableInstance.redraw(false);
            }, { timeout: 100 });
          } else {
            setTimeout(() => {
              planningTableInstance.redraw(false);
            }, 50);
          }
        }
      }, 250);
      
      window.addEventListener('resize', resizeHandler);
      
      const visibilityHandler = () => {
        if (!document.hidden && planningTableInstance) {
          // Use requestIdleCallback to prevent blocking
          if (window.requestIdleCallback) {
            requestIdleCallback(() => {
              planningTableInstance.redraw(false); // Non-blocking redraw
            }, { timeout: 100 });
          } else {
            setTimeout(() => {
              planningTableInstance.redraw(false);
            }, 50);
          }
        }
      };
      
      document.addEventListener('visibilitychange', visibilityHandler);
      
      planningTableInstance._cleanup = () => {
        window.removeEventListener('resize', resizeHandler);
        document.removeEventListener('visibilitychange', visibilityHandler);
      };

      planningPerformance.end('grid initialization');
      
      // Yield before applying sort to prevent blocking
      await yieldToMain();
      
      // // Apply initial sort after all columns are added (COMMENTED OUT FOR TESTING)
      // try {
      //   if (planningTableInstance && planningTableInstance.getColumns().length > 0) {
      //     // Use requestIdleCallback for non-blocking sort
      //     if (window.requestIdleCallback) {
      //       requestIdleCallback(() => {
      //         planningTableInstance.setSort([{ column: "quarter", dir: "asc" }]);
      //         console.log("✅ Planning grid: Initial sort applied");
      //       }, { timeout: 100 });
      //     } else {
      //       setTimeout(() => {
      //         planningTableInstance.setSort([{ column: "quarter", dir: "asc" }]);
      //         console.log("✅ Planning grid: Initial sort applied");
      //       }, 25);
      //     }
      //   }
      // } catch (e) {
      //   console.warn("Planning grid: Could not apply initial sort:", e.message);
      // }
      
      resolve(planningTableInstance);
    };
    
    // Start the chunked initialization
    initializeInChunks().catch(error => {
      console.error("Error in chunked initialization:", error);
      resolve(null);
    });
  });
}

// Show Add Row Modal
function showAddRowModal() {
  // Remove existing modal if any
  const existingModal = document.getElementById("addRowModal");
  if (existingModal) {
    existingModal.remove();
  }

  const modalHtml = `
    <div id="addRowModal" style="
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
      overflow-y: auto;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 32px;
        width: 90%;
        max-width: 800px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        margin: 20px;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #21262d 0%, #30363d 100%);
          border-bottom: 2px solid #21262d;
          padding: 20px 24px;
          border-radius: 12px 12px 0 0;
          margin: -32px -32px 24px -32px;
        ">
          <h2 style="margin: 0; color: #f0f6fc; display: flex; align-items: center; gap: 8px;">
            <i class="octicon octicon-plus" style="font-size: 20px; color: #f0f6fc;" aria-hidden="true"></i>
            Add New Campaign
          </h2>
          <button id="closeAddRowModal" class="modal-close-btn" style="color: #f0f6fc;">✕</button>
        </div>
        
        <form id="addRowForm" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        ">
          <!-- Row 1: Basic Info -->
          <div style="grid-column: 1 / -1;">
            <h3 style="margin: 0 0 16px 0; color: #f0f6fc; background: linear-gradient(135deg, #21262d 0%, #30363d 100%); border-bottom: 1px solid #21262d; padding: 12px 16px; border-radius: 8px;">
              <i class="octicon octicon-info" aria-hidden="true"></i>
              Basic Information
            </h3>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #24292e;">
              Program Type <span style="color: #d1242f;">*</span>
            </label>
            <select id="programType" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select program type...</option>
              ${programTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Strategic Pillar
            </label>
            <select id="strategicPillars" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            ">
              <option value="">Select strategic pillar...</option>
              ${strategicPillars.map(pillar => `<option value="${pillar}">${pillar}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Owner <span style="color: red;">*</span>
            </label>
            <select id="owner" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select owner...</option>
              ${names.map(name => `<option value="${name}">${name}</option>`).join('')}
            </select>
          </div>
          
          <!-- Row 2: Scheduling -->
          <div style="grid-column: 1 / -1; margin-top: 20px;">
            <h3 style="margin: 0 0 16px 0; color: #f0f6fc; background: linear-gradient(135deg, #21262d 0%, #30363d 100%); border-bottom: 1px solid #21262d; padding: 12px 16px; border-radius: 8px;">
              <i class="octicon octicon-calendar" aria-hidden="true"></i>
              Scheduling & Location
            </h3>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Quarter <span style="color: red;">*</span>
            </label>
            <select id="quarter" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select quarter...</option>
              ${quarterOptions.map(quarter => `<option value="${quarter}">${quarter}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Fiscal Year <span style="color: red;">*</span>
            </label>
            <select id="fiscalYear" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select fiscal year...</option>
              <option value="FY25">FY25</option>
              <option value="FY26">FY26</option>
              <option value="FY27">FY27</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Region <span style="color: red;">*</span>
            </label>
            <select id="region" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " required>
              <option value="">Select region...</option>
              ${regionOptions.map(region => `<option value="${region}">${region}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Country
            </label>
            <select id="country" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            ">
              <option value="">Select country...</option>
              ${getAllCountries().map(country => `<option value="${country}">${country}</option>`).join('')}
            </select>
          </div>
          
          <!-- Row 3: Financial & Goals -->
          <div style="grid-column: 1 / -1; margin-top: 20px;">
            <h3 style="margin: 0 0 16px 0; color: #f0f6fc; background: linear-gradient(135deg, #21262d 0%, #30363d 100%); border-bottom: 1px solid #21262d; padding: 12px 16px; border-radius: 8px;">
              <i class="octicon octicon-currency-dollar" aria-hidden="true"></i>
              Financial & Goals
            </h3>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Forecasted Cost ($)
            </label>
            <input type="number" id="forecastedCost" min="0" step="0.01" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " placeholder="Enter forecasted cost..." />
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Expected Leads
            </label>
            <input type="number" id="expectedLeads" min="0" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            " placeholder="Enter expected leads..." />
            <small style="color: #666; font-style: italic;">
              KPIs will be calculated automatically based on this value
            </small>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Revenue Play
            </label>
            <select id="revenuePlay" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            ">
              <option value="">Select revenue play...</option>
              ${revenuePlays.map(play => `<option value="${play}">${play}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Status
            </label>
            <select id="status" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            ">
              ${statusOptions.map(status => `<option value="${status}" ${status === 'Planning' ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
          </div>
          
          <!-- Description -->
          <div style="grid-column: 1 / -1; margin-top: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: bold; color: #333;">
              Description
            </label>
            <textarea id="description" rows="3" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #ddd;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
              resize: vertical;
            " placeholder="Enter campaign description..."></textarea>
          </div>
          
          <!-- Buttons -->
          <div style="grid-column: 1 / -1; margin-top: 30px; display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" id="cancelAddRow" class="modal-btn-cancel" style="padding: 12px 24px;">Cancel</button>
            <button type="submit" id="confirmAddRow" class="modal-btn-confirm" style="padding: 12px 24px;">✓ Add Campaign</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // Set up event listeners
  setupAddRowModalEvents();
}

// Setup event listeners for add row modal
function setupAddRowModalEvents() {
  const modal = document.getElementById("addRowModal");
  const form = document.getElementById("addRowForm");
  const closeBtn = document.getElementById("closeAddRowModal");
  const cancelBtn = document.getElementById("cancelAddRow");

  // Close modal events
  const closeModal = () => {
    if (modal) modal.remove();
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  document.addEventListener("keydown", function escapeHandler(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", escapeHandler);
    }
  });

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Get form data
    window.hasUnsavedPlanningChanges = true;
    console.log("[Planning] Unsaved changes set to true (add row modal submit)");
    const formData = {
      id: `program-${Date.now()}`,
      programType: document.getElementById("programType").value,
      strategicPillars: document.getElementById("strategicPillars").value,
      owner: document.getElementById("owner").value,
      quarter: document.getElementById("quarter").value,
      fiscalYear: document.getElementById("fiscalYear").value,
      region: document.getElementById("region").value,
      country: document.getElementById("country").value,
      forecastedCost: document.getElementById("forecastedCost").value ? Number(document.getElementById("forecastedCost").value) : 0,
      expectedLeads: document.getElementById("expectedLeads").value ? Number(document.getElementById("expectedLeads").value) : 0,
      revenuePlay: document.getElementById("revenuePlay").value,
      status: document.getElementById("status").value || "Planning",
      description: document.getElementById("description").value,
      __modified: true,
      __unsavedPriority: 1, // Mark as unsaved for top placement
    };

    // Validate required fields
    const requiredFields = ['programType', 'owner', 'quarter', 'fiscalYear', 'region'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Calculate KPIs based on program type
    if (formData.programType === "In-Account Events (1:1)") {
      formData.expectedLeads = 0;
      formData.mqlForecast = 0;
      formData.pipelineForecast = formData.forecastedCost * 20;
    } else if (formData.expectedLeads > 0) {
      formData.mqlForecast = Math.round(formData.expectedLeads * 0.1);
      formData.pipelineForecast = calculatePipeline(formData.expectedLeads);
    }

    // Add row to master dataset first
    planningDataStore.addRow(formData);
    console.log(`Phase 3: Added new row to master dataset: ${formData.id}`);

    // Add row to table and force unsaved to top
    let newRow;
    if (planningTableInstance && typeof planningTableInstance.addRow === 'function') {
      // Remove any existing row with this id (shouldn't happen, but for safety)
      const existing = planningTableInstance.getRows().find(r => r.getData().id === formData.id);
      if (existing) {
        // Also remove from master dataset if it exists
        const existingData = existing.getData();
        if (existingData && existingData.id) {
          planningDataStore.deleteRow(existingData.id);
          console.log(`Phase 3: Removed duplicate from master dataset: ${existingData.id}`);
        }
        existing.delete();
      }

      // Insert at the top by updating the data array directly
      let data = planningTableInstance.getData();
      // Remove any other unsaved priority flags (should only be one unsaved at a time)
      data.forEach(row => { if (row.__unsavedPriority) row.__unsavedPriority = 0; });
      data = [formData, ...data];
      planningTableInstance.replaceData(data);

      // Sort by __unsavedPriority desc, then by quarter asc (or any other field as needed)
      setTimeout(() => {
        planningTableInstance.setSort([
          { column: "__unsavedPriority", dir: "desc" },
          // Optionally add more sort fields here
        ]);
        const rows = planningTableInstance.getRows();
        newRow = rows.length > 0 ? rows[0] : null;
        highlightUnsavedRows();
        if (newRow && typeof newRow.scrollTo === 'function') {
          try {
            newRow.scrollTo();
            const el = newRow.getElement();
            el.classList.add('unsaved-row-highlight');
            el.style.transition = 'background 0.3s, box-shadow 0.3s';
            el.style.boxShadow = '0 0 0 3px #28a74580';
            setTimeout(() => {
              el.style.boxShadow = '';
            }, 1200);
          } catch (e) {
            console.warn("Could not scroll to new row:", e);
          }
        }
      }, 120);
    }
    // Highlight unsaved rows
    setTimeout(() => {
      highlightUnsavedRows();
      if (newRow && typeof newRow.scrollTo === 'function') {
        try {
          newRow.scrollTo();
          console.log("Scrolled to new planning row");
        } catch (e) {
          console.warn("Could not scroll to new row:", e);
        }
      }
    }, 100);

    // Trigger autosave
    triggerPlanningAutosave(planningTableInstance);

    // Close modal
    closeModal();

    // Show success message
    const successMsg = document.createElement("div");
    successMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 1200;
      font-weight: bold;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `;
    successMsg.textContent = `✓ Campaign "${formData.programType}" added successfully!`;
    document.body.appendChild(successMsg);

    setTimeout(() => {
      if (successMsg.parentNode) {
        successMsg.remove();
      }
    }, 3000);
  });
}

// PLANNING SAVE AND DOWNLOAD FUNCTIONS
// Save Changes for Planning Grid
function setupPlanningSave(table, rows) {
  // Use the correct button ID from your HTML
  const saveBtn = document.getElementById("savePlanningRows");
  if (!saveBtn) return;
  saveBtn.onclick = async () => {
    console.log("=== PHASE 2: Using Master Dataset for Save ===");
    
    // Get the complete dataset from master data store (not filtered table data)
    const masterData = planningDataStore.getData(); // Gets active data (master minus deleted)
    console.log(`Saving master dataset: ${masterData.length} rows (vs table: ${table.getData().length} visible)`);
    
    if (masterData.length === 0) {
      alert("No data to save.");
      return;
    }
    
    // Recalculate KPIs for ALL rows in master dataset before saving
    const allRows = [...masterData]; // Work with a copy to avoid mutation
    
    // Process KPI calculations in very small batches to prevent long tasks
    for (let i = 0; i < allRows.length; i += 8) {
      const batch = allRows.slice(i, i + 8);
      
      batch.forEach((row) => {
        if (typeof row.expectedLeads === "number") {
          let changed = false;
          
          // Check for special program types that use different calculation methods
          if (row.programType === "In-Account Events (1:1)") {
            // For In-Account Events (1:1): no leads, pipeline = 20x forecasted cost
            const newLeads = 0;
            const newMql = 0;
            const newPipeline = row.forecastedCost ? Number(row.forecastedCost) * 20 : 0;
            
            if (row.expectedLeads !== newLeads) {
              row.expectedLeads = newLeads;
              changed = true;
            }
            if (row.mqlForecast !== newMql) {
              row.mqlForecast = newMql;
              changed = true;
            }
            if (row.pipelineForecast !== newPipeline) {
              row.pipelineForecast = newPipeline;
              changed = true;
            }
          } else {
            // For regular programs: use leads-based calculation
            const newMql = Math.round(row.expectedLeads * 0.1);
            if (row.mqlForecast !== newMql) {
              row.mqlForecast = newMql;
              changed = true;
            }
            
            // Calculate Pipeline directly
            const newPipeline = calculatePipeline(row.expectedLeads);
            if (row.pipelineForecast !== newPipeline) {
              row.pipelineForecast = newPipeline;
              changed = true;
            }
          }
          
          if (changed) {
            row.__modified = true;
            // Update the master dataset with calculated values
            planningDataStore.updateRow(row.id, {
              expectedLeads: row.expectedLeads,
              mqlForecast: row.mqlForecast,
              pipelineForecast: row.pipelineForecast,
              __modified: true
            });
          }
        }
      });
      
      // Yield control after each batch
      if (i + 8 < allRows.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Use the updated master dataset for saving
    const data = planningDataStore.getData();
    
    // Clear __modified and __unsavedPriority on all rows in master dataset after save preparation
    data.forEach(row => { 
      row.__modified = false; 
      row.__unsavedPriority = 0; 
    });
    
    // Update the master dataset with cleared flags
    data.forEach(row => {
      planningDataStore.updateRow(row.id, {
        __modified: false,
        __unsavedPriority: 0
      });
    });
    
    setTimeout(() => {
      highlightUnsavedRows();
      // Remove unsaved sort, optionally restore default sort here
      if (table && typeof table.setSort === 'function') {
        table.setSort([]); // Remove sort, or set to your default
      }
    }, 200); // Remove highlight after save

    console.log("Saving planning data:", data.length, "rows");

    // Try Worker first, then backend fallback
    if (window.cloudflareSyncModule) {
      // Primary: Save to Worker
      window.cloudflareSyncModule
        .saveToWorker("planning", data, { source: "manual-save" })
        .then((result) => {
          console.log("Worker save successful:", result);
          alert(
            "✅ Planning data saved to GitHub!\n\n💡 Note: It may take 1-2 minutes for changes from other users to appear due to GitHub's caching. Use the 'Refresh Data' button in GitHub Sync if needed."
          );

          // Reset unsaved changes flag
          console.log("[Planning] (Worker) About to set unsaved flag to false. Current:", window.hasUnsavedPlanningChanges);
          window.hasUnsavedPlanningChanges = false;
          console.log("[Planning] Unsaved changes set to false (after successful save to Worker). Now:", window.hasUnsavedPlanningChanges);

          // Refresh the table display with updated data from data store
          console.log("🔄 PLANNING: Refreshing table display after save...");
          const currentData = planningDataStore.getFilteredData();
          if (table && typeof table.replaceData === 'function') {
            table.replaceData(currentData);
            console.log("✅ PLANNING: Table display refreshed with", currentData.length, "rows");
            
            // Reapply current filters after data refresh
            setTimeout(() => {
              if (typeof applyPlanningFilters === 'function') {
                applyPlanningFilters();
                console.log("✅ PLANNING: Filters reapplied after save");
              }
            }, 100);
          }

          // Don't call refreshDataAfterSave for manual saves - it can override local changes with stale GitHub cache
          // if (window.cloudflareSyncModule.refreshDataAfterSave) {
          //   window.cloudflareSyncModule.refreshDataAfterSave("planning");
          // }

          // Update ROI metrics
          if (typeof window.roiModule?.updateRoiTotalSpend === "function") {
            window.roiModule.updateRoiTotalSpend();
          }
        })
        .catch((error) => {
          console.warn("Worker save failed, trying backend:", error);

          // Fallback: Save to backend
          fetch("http://localhost:3000/save-planning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data }),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.success) {
                alert(
                  "✅ Planning data saved to backend (Worker unavailable)!"
                );
                // Reset unsaved changes flag
                console.log("[Planning] (Backend fallback) About to set unsaved flag to false. Current:", window.hasUnsavedPlanningChanges);
                window.hasUnsavedPlanningChanges = false;
                console.log("[Planning] Unsaved changes set to false (after successful save to backend fallback). Now:", window.hasUnsavedPlanningChanges);
                
                // Refresh the table display with updated data from data store
                console.log("🔄 PLANNING: Refreshing table display after fallback save...");
                const currentData = planningDataStore.getFilteredData();
                if (table && typeof table.replaceData === 'function') {
                  table.replaceData(currentData);
                  console.log("✅ PLANNING: Table display refreshed with", currentData.length, "rows");
                  
                  // Reapply current filters after data refresh
                  setTimeout(() => {
                    if (typeof applyPlanningFilters === 'function') {
                      applyPlanningFilters();
                      console.log("✅ PLANNING: Filters reapplied after fallback save");
                    }
                  }, 100);
                }
              } else {
                alert(
                  "❌ Failed to save: " + (result.error || "Unknown error")
                );
              }
            })
            .catch((err) => {
              alert("❌ Save failed: " + err.message);
            });
        });
    } else {
      // No Worker configured, use backend only
      fetch("http://localhost:3000/save-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            alert("✅ Planning data saved to backend!");
            // Reset unsaved changes flag
            console.log("[Planning] (Backend) About to set unsaved flag to false. Current:", window.hasUnsavedPlanningChanges);
            window.hasUnsavedPlanningChanges = false;
            console.log("[Planning] Unsaved changes set to false (after successful save to backend). Now:", window.hasUnsavedPlanningChanges);

            // Refresh the table display with updated data from data store
            console.log("🔄 PLANNING: Refreshing table display after backend save...");
            const currentData = planningDataStore.getFilteredData();
            if (table && typeof table.replaceData === 'function') {
              table.replaceData(currentData);
              console.log("✅ PLANNING: Table display refreshed with", currentData.length, "rows");
              
              // Reapply current filters after data refresh
              setTimeout(() => {
                if (typeof applyPlanningFilters === 'function') {
                  applyPlanningFilters();
                  console.log("✅ PLANNING: Filters reapplied after backend save");
                }
              }, 100);
            }

            // Update ROI metrics
            if (typeof window.roiModule?.updateRoiTotalSpend === "function") {
              window.roiModule.updateRoiTotalSpend();
            }
          } else {
            alert("❌ Failed to save: " + (result.error || "Unknown error"));
          }
        })
        .catch((err) => {
          alert("❌ Save failed: " + err.message);
        });
    }
  };
}

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

// CSV IMPORT FUNCTIONALITY FOR PLANNING
// CSV Import functionality
document.getElementById("importCSVBtn").addEventListener("click", () => {
  document.getElementById("csvFileInput").click();
});

document
  .getElementById("csvFileInput")
  .addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show loading indicator for large files
    if (file.size > 100000) { // 100KB threshold
      showLoadingIndicator("Processing CSV file...");
    }
    
    const reader = new FileReader();
    reader.onload = async function (event) {
      try {
        const csv = event.target.result;
        
        // Use Tabulator's built-in CSV parser if available, else fallback
        let rows;
        if (Tabulator.prototype.parseCSV) {
          rows = Tabulator.prototype.parseCSV(csv);
        } else {
          rows = csvToObj(csv);
        }
        
        if (!rows || rows.length === 0) {
          alert('No data found in CSV file. Please check the file format.');
          return;
        }
        
        // Show progress for large imports
        if (rows.length > 100) {
          showLoadingIndicator(`Analyzing ${rows.length} rows...`);
        }
        
        // Initialize smart mapper
        const smartMapper = new SmartCSVMapper();
        
        // Get CSV headers (first row keys)
        const csvHeaders = Object.keys(rows[0] || {});
        
        if (csvHeaders.length === 0) {
          alert('No columns found in CSV file. Please ensure the file has headers.');
          return;
        }
        
        // Analyze headers and create intelligent mapping
        const analysisResult = smartMapper.analyzeCSVHeaders(csvHeaders);
        
        // Show mapping preview to user
        const previewHTML = smartMapper.showMappingPreview(csvHeaders, analysisResult);
        
        // Create modal for preview
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.5); z-index: 10000; display: flex;
          align-items: center; justify-content: center;
        `;
        modal.innerHTML = `<div style="background: white; border-radius: 10px; max-height: 90vh; overflow-y: auto;">${previewHTML}</div>`;
        
        document.body.appendChild(modal);
        
        // Handle user decision
        modal.querySelector('#confirmImport').onclick = async () => {
          document.body.removeChild(modal);
          await processImportWithMapping(rows, analysisResult.mapping, analysisResult.combinedColumnMappings, smartMapper);
        };
        
        modal.querySelector('#cancelImport').onclick = () => {
          document.body.removeChild(modal);
          hideLoadingIndicator();
        };
        
      } catch (error) {
        console.error('CSV Import Error:', error);
        alert('Error processing CSV file: ' + error.message);
        hideLoadingIndicator();
      }
    };
    
    // Function to process the import with confirmed mapping
    async function processImportWithMapping(rows, mapping, combinedColumnMappings, smartMapper) {
      try {
        showLoadingIndicator(`Processing ${rows.length} rows with smart mapping...`);
        
        // Map CSV rows to table format using smart mapper
        const mappedRows = [];
        
        await processRowsInBatches(rows, 15, (row) => {
          // Use smart mapper to process each row with combined column support
          const mappedRow = smartMapper.processRow(row, mapping, combinedColumnMappings);
          mappedRows.push(mappedRow);
        });

        // Process calculated fields in batches
        await processRowsInBatches(mappedRows, 15, (row) => {
          // Debug: Log the first few rows to understand data structure
          if (mappedRows.indexOf(row) < 3) {
            console.log(`[CSV Import Debug] Row ${mappedRows.indexOf(row) + 1}:`, {
              programType: row.programType,
              expectedLeads: row.expectedLeads,
              forecastedCost: row.forecastedCost,
              leadType: typeof row.expectedLeads,
              costType: typeof row.forecastedCost
            });
          }
          
          // IMPORTANT: Preserve imported values, don't override them with calculations
          // Check if expectedLeads and mqlForecast were imported from CSV
          const hasImportedLeads = row.expectedLeads !== undefined && row.expectedLeads !== null && row.expectedLeads !== '';
          const hasImportedMql = row.mqlForecast !== undefined && row.mqlForecast !== null && row.mqlForecast !== '';
          
          if (hasImportedLeads || hasImportedMql) {
            // Preserve imported values - this overrides any automatic logic
            console.log(`[CSV Import] Preserving imported values for row ${mappedRows.indexOf(row) + 1}: leads=${row.expectedLeads}, mql=${row.mqlForecast}`);
            
            // Ensure they're numbers
            if (hasImportedLeads) row.expectedLeads = Number(row.expectedLeads) || 0;
            if (hasImportedMql) row.mqlForecast = Number(row.mqlForecast) || 0;
            
            // Calculate pipeline based on program type
            if (row.programType === "In-Account Events (1:1)") {
              row.pipelineForecast = row.forecastedCost ? Number(row.forecastedCost) * 20 : 0;
            } else {
              row.pipelineForecast = calculatePipeline(Number(row.expectedLeads) || 0);
            }
          } else {
            // No imported leads/MQL values, use automatic calculation
            if (row.programType === "In-Account Events (1:1)") {
              row.expectedLeads = 0;
              row.mqlForecast = 0;
              row.pipelineForecast = row.forecastedCost ? Number(row.forecastedCost) * 20 : 0;
            } else if (row.forecastedCost && Number(row.forecastedCost) > 0) {
              // Auto-calculate from cost for regular programs
              const leadCount = Math.round(Number(row.forecastedCost) / 24);
              row.expectedLeads = leadCount;
              row.mqlForecast = Math.round(leadCount * 0.1);
              row.pipelineForecast = calculatePipeline(leadCount);
            }
          }
          
          if (mappedRows.indexOf(row) < 3) {
            console.log(`[CSV Import Debug] Final values for row ${mappedRows.indexOf(row) + 1}:`, {
              leads: row.expectedLeads,
              mql: row.mqlForecast,
              pipeline: row.pipelineForecast,
              preserved: hasImportedLeads || hasImportedMql
            });
          }
        });
        
        if (planningTableInstance) {
          // Add data progressively for better UX
          const batchSize = 100;
          for (let i = 0; i < mappedRows.length; i += batchSize) {
            const batch = mappedRows.slice(i, i + batchSize);
            
            // Add each row to master dataset first, then to table
            batch.forEach(row => {
              if (planningDataStore && typeof planningDataStore.addRow === 'function') {
                planningDataStore.addRow(row);
                console.log(`CSV Import: Added row to master dataset: ${row.id}`);
              }
            });
            
            planningTableInstance.addData(batch);
            // Update progress
            if (mappedRows.length > 100) {
              const progress = Math.round(((i + batch.length) / mappedRows.length) * 100);
              showLoadingIndicator(`Importing... ${progress}%`);
            }
            // Small delay to prevent UI freezing
            if (i + batchSize < mappedRows.length) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
          // Update ROI metrics to reflect newly imported forecasted costs
          if (typeof window.roiModule?.updateRoiTotalSpend === "function") {
            setTimeout(window.roiModule.updateRoiTotalSpend, 100); // Small delay to ensure data is fully loaded
          }
          // Set unsaved changes flag so beforeunload warning is triggered
          if (typeof window.setPlanningImportedUnsaved === 'function') {
            window.setPlanningImportedUnsaved();
          }
        }
        
        console.log(`Successfully imported ${mappedRows.length} campaigns with smart mapping!`);
        
        hideLoadingIndicator();
        
        // Show success message
        const successMsg = document.createElement("div");
        successMsg.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          z-index: 1200;
          font-weight: bold;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        `;
        successMsg.textContent = `✓ Successfully imported ${mappedRows.length} campaigns with smart column mapping!`;
        document.body.appendChild(successMsg);

        setTimeout(() => {
          if (successMsg.parentNode) {
            successMsg.remove();
          }
        }, 3000);
        
      } catch (error) {
        hideLoadingIndicator();
        console.error("Smart CSV import error:", error);
        alert("Failed to import CSV with smart mapping: " + error.message);
      } finally {
        // Reset the file input so the same file can be imported again
        e.target.value = '';
      }
    }
    
    reader.readAsText(file);
  });

// Simple CSV to object parser (fallback)
function csvToObj(csv) {
  const lines = csv.trim().split("\n");
  const headers = lines[0]
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim());

  return lines.slice(1).map((line) => {
    // Handle CSV parsing more carefully to deal with quoted values containing commas
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Don't forget the last value

    const obj = {};
    headers.forEach((h, i) => {
      const value = values[i] || "";
      obj[h] = value.replace(/^"|"$/g, ""); // Remove surrounding quotes
    });
    return obj;
  });
}

// PLANNING FILTER FUNCTIONALITY

// Custom multiselect implementation
function createMultiselect(selectElement) {
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
      closeAllMultiselects();
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

// Close all multiselects
function closeAllMultiselects() {
  document.querySelectorAll('.multiselect-display.open').forEach(display => {
    display.classList.remove('open');
  });
  document.querySelectorAll('.multiselect-dropdown.open').forEach(dropdown => {
    dropdown.classList.remove('open');
  });
}

// Close multiselects when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.multiselect-container')) {
    closeAllMultiselects();
  }
});

function updateDigitalMotionsButtonVisual(button) {
  const isActive = button.dataset.active === "true";
  if (isActive) {
    button.style.background = "#1a7f37";
    button.style.borderColor = "#1a7f37";
    button.style.color = "white";
    button.innerHTML = '<i class="octicon octicon-rocket" aria-hidden="true"></i> Digital Motions <i class="octicon octicon-check" aria-hidden="true"></i>';
  } else {
    button.style.background = "#2da44e";
    button.style.borderColor = "#2da44e";
    button.style.color = "white";
    button.innerHTML = '<i class="octicon octicon-rocket" aria-hidden="true"></i> Digital Motions';
  }
}

// Function to ensure planning grid is properly rendered and visible
function ensurePlanningGridVisible() {
  if (!planningTableInstance) return;
  
  // Simplified performance-optimized approach
  const performOptimizedUpdate = () => {
    // Batch DOM operations to prevent forced reflows
    requestAnimationFrame(() => {
      try {
        // Perform all table operations in sequence without nested callbacks
        planningTableInstance.recalc();
        planningTableInstance.redraw(false);
        
        // Check for data and scroll in next frame to prevent layout thrashing
        requestAnimationFrame(() => {
          const data = planningTableInstance.getData();
          if (data && data.length > 0) {
            safeScrollToRow(planningTableInstance, 1, "top", false);
          }
        });
      } catch (error) {
        console.warn("Planning grid update error:", error);
      }
    });
  };
  
  // Use requestIdleCallback only if available, with fallback to immediate execution
  if (window.requestIdleCallback) {
    requestIdleCallback(performOptimizedUpdate, { timeout: 100 });
  } else {
    performOptimizedUpdate();
  }
}

// Add state tracking to prevent unnecessary re-population
let planningFiltersPopulated = false;

function populatePlanningFilters() {
  const regionSelect = document.getElementById("planningRegionFilter");
  const quarterSelect = document.getElementById("planningQuarterFilter");
  const statusSelect = document.getElementById("planningStatusFilter");
  const programTypeSelect = document.getElementById("planningProgramTypeFilter");
  const strategicPillarSelect = document.getElementById("planningStrategicPillarFilter");
  const ownerSelect = document.getElementById("planningOwnerFilter");
  const revenuePlaySelect = document.getElementById("planningRevenuePlayFilter");
  const countrySelect = document.getElementById("planningCountryFilter");
  const digitalMotionsButton = document.getElementById("planningDigitalMotionsFilter");

  if (!regionSelect || !quarterSelect || !statusSelect || 
      !programTypeSelect || !strategicPillarSelect || !ownerSelect || 
      !revenuePlaySelect || !countrySelect || !digitalMotionsButton) {
    setTimeout(populatePlanningFilters, 100);
    return;
  }

  // Prevent redundant population if already done and no new data
  if (planningFiltersPopulated && 
      regionSelect.children.length > 0 && 
      revenuePlaySelect.children.length > 0 && 
      countrySelect.children.length > 0) {
    return;
  }

  // Initialize Digital Motions button state
  if (!digitalMotionsButton.hasAttribute("data-active")) {
    digitalMotionsButton.dataset.active = "false";
  }

  updateDigitalMotionsButtonVisual(digitalMotionsButton);

  // Get options from planning data - handle empty data gracefully
  const planningData = planningTableInstance?.getData() || [];
  
  // If there's no data, still set up the filters but with empty options
  const uniqueRegions = planningData.length > 0 ? 
    Array.from(new Set(planningData.map((c) => c.region).filter(Boolean))).sort() : 
    [];
  const uniqueOwners = planningData.length > 0 ? 
    Array.from(new Set(planningData.map((c) => c.owner).filter(Boolean))).sort() : 
    [];
  const uniqueRevenuePlays = planningData.length > 0 ? 
    Array.from(new Set(planningData.map((c) => c.revenuePlay).filter(Boolean))).sort() : 
    [];
  const uniqueCountries = planningData.length > 0 ? 
    Array.from(new Set(planningData.map((c) => c.country).filter(Boolean))).sort() : 
    [];

  // Set placeholder attributes for custom multiselects with visual feedback
  regionSelect.setAttribute('data-placeholder', 'Regions');
  quarterSelect.setAttribute('data-placeholder', 'Quarters');
  statusSelect.setAttribute('data-placeholder', 'Statuses');
  programTypeSelect.setAttribute('data-placeholder', 'Program Types');
  strategicPillarSelect.setAttribute('data-placeholder', 'Strategic Pillars');
  ownerSelect.setAttribute('data-placeholder', 'Owners');
  revenuePlaySelect.setAttribute('data-placeholder', 'Revenue Plays');
  countrySelect.setAttribute('data-placeholder', 'Countries');

  // Add loading state visual feedback during filter population
  const showFilterLoadingState = (select) => {
    if (select.children.length === 0) {
      const loadingOption = document.createElement("option");
      loadingOption.value = "";
      loadingOption.textContent = "Loading...";
      loadingOption.disabled = true;
      select.appendChild(loadingOption);
    }
  };

  // Show loading state for empty filters
  [regionSelect, quarterSelect, statusSelect, programTypeSelect, strategicPillarSelect, ownerSelect, revenuePlaySelect, countrySelect].forEach(showFilterLoadingState);

  // Use requestAnimationFrame to populate filters without blocking
  requestAnimationFrame(() => {
    // Optimized population function using document fragments for better performance
    const populateSelect = (select, options, clearFirst = true) => {
      if (clearFirst && select.children.length > 0) {
        select.innerHTML = '';
      }
      
      if (select.children.length === 0) {
        // Use document fragment for better performance with many options
        const fragment = document.createDocumentFragment();
        options.forEach((optionValue) => {
          const option = document.createElement("option");
          option.value = optionValue;
          option.textContent = optionValue;
          fragment.appendChild(option);
        });
        select.appendChild(fragment);
      }
    };

    // Prioritize Revenue Play and Country filters first for user experience
    const criticalFilters = [
      [revenuePlaySelect, uniqueRevenuePlays.length > 0 ? uniqueRevenuePlays : revenuePlayOptions],
      [countrySelect, uniqueCountries.length > 0 ? uniqueCountries : countryOptions]
    ];

    // Populate critical filters immediately
    criticalFilters.forEach(([select, options]) => {
      populateSelect(select, options, true);
    });

    // Populate remaining filters in next frame to spread load
    requestAnimationFrame(() => {
      populateSelect(regionSelect, uniqueRegions.length > 0 ? uniqueRegions : regionOptions, true);
      populateSelect(quarterSelect, quarterOptions.map(normalizeQuarter), true);
      populateSelect(statusSelect, statusOptions, true);
      populateSelect(programTypeSelect, programTypes, true);
      populateSelect(strategicPillarSelect, strategicPillars, true);
      populateSelect(ownerSelect, uniqueOwners.length > 0 ? uniqueOwners : names, true);
      
      // Mark as populated after successful completion
      planningFiltersPopulated = true;
    });

    // Initialize custom multiselects if not already done
    // Prioritized multiselect creation - handle critical filters first
    const criticalSelects = [revenuePlaySelect, countrySelect];
    const otherSelects = [regionSelect, quarterSelect, statusSelect, programTypeSelect, strategicPillarSelect, ownerSelect];

    // Create multiselects for critical filters immediately
    criticalSelects.forEach(select => {
      if (!select._multiselectContainer) {
        try {
          createMultiselect(select);
        } catch (e) {
          console.warn("Failed to create multiselect for", select.id, e);
        }
      }
    });

    // Create multiselects for other filters in next frame
    requestAnimationFrame(() => {
      otherSelects.forEach(select => {
        if (!select._multiselectContainer) {
          try {
            createMultiselect(select);
          } catch (e) {
            console.warn("Failed to create multiselect for", select.id, e);
          }
        }
      });
    });

    // Set up event listeners for all filters
    const allSelects = [...criticalSelects, ...otherSelects];
    allSelects.forEach((select) => {
      if (!select.hasAttribute("data-listener-attached")) {
        select.addEventListener("change", applyPlanningFilters);
        select.setAttribute("data-listener-attached", "true");
      }
    });
  }); // Close requestAnimationFrame callback

  // Digital Motions filter button toggle (only attach once)
  if (!digitalMotionsButton.hasAttribute("data-listener-attached")) {
    digitalMotionsButton.addEventListener("click", () => {
      const currentState = digitalMotionsButton.dataset.active;
      const isActive = currentState === "true";
      const newState = !isActive;

      digitalMotionsButton.dataset.active = newState.toString();
      updateDigitalMotionsButtonVisual(digitalMotionsButton);

      applyPlanningFilters();
    });
    digitalMotionsButton.setAttribute("data-listener-attached", "true");
  }

  // Clear filters button
  const clearButton = document.getElementById("planningClearFilters");
  if (clearButton && !clearButton.hasAttribute("data-listener-attached")) {
    clearButton.addEventListener("click", () => {
      // Add visual feedback immediately
      clearButton.disabled = true;
      clearButton.style.opacity = '0.7';
      clearButton.textContent = 'Clearing...';
      
      // Use requestAnimationFrame to ensure UI updates before heavy operations
      requestAnimationFrame(() => {
        try {
          // Batch DOM operations for better performance
          const selectElementIds = [
            "planningRegionFilter", "planningQuarterFilter", "planningStatusFilter", 
            "planningProgramTypeFilter", "planningStrategicPillarFilter", "planningOwnerFilter",
            "planningRevenuePlayFilter", "planningCountryFilter"
          ];
          
          // Use a single query selector to get all elements at once
          const selectElements = selectElementIds.map(id => document.getElementById(id)).filter(Boolean);
          
          // Batch clear all multiselect values efficiently
          selectElements.forEach(select => {
            if (select && select.multiple) {
              // More efficient: set selectedIndex to -1 instead of looping through options
              select.selectedIndex = -1;
              
              // Clear custom multiselect displays efficiently
              if (select._multiselectContainer) {
                const multiselectAPI = select._multiselectAPI;
                if (multiselectAPI && typeof multiselectAPI.setSelectedValues === 'function') {
                  multiselectAPI.setSelectedValues([]);
                }
              }
            } else if (select) {
              select.value = "";
            }
          });
          
          // Reset Digital Motions button
          if (digitalMotionsButton) {
            digitalMotionsButton.dataset.active = "false";
            updateDigitalMotionsButtonVisual(digitalMotionsButton);
          }
          
          // Clear universal search filters (batch operation)
          universalSearchFilters = {
            region: [],
            quarter: [],
            status: [],
            programType: [],
            strategicPillars: [],
            owner: [],
            revenuePlay: [],
            country: [],
            fiscalYear: [],
            digitalMotions: false
          };
          
          // Clear universal search display if it exists
          if (window.planningUniversalSearch && typeof window.planningUniversalSearch.clearAllFilters === 'function') {
            window.planningUniversalSearch.clearAllFilters();
          }
          
          // Clear description keyword search input efficiently
          const descriptionSearchInput = document.getElementById('planning-description-search');
          if (descriptionSearchInput && descriptionSearchInput.value) {
            descriptionSearchInput.value = '';
            // Use a more efficient event dispatch
            descriptionSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          // Apply filters (which will show all data since no filters are selected)
          // Use a timeout to allow DOM updates to complete first
          setTimeout(() => {
            applyPlanningFilters();
            
            // Restore button state
            clearButton.disabled = false;
            clearButton.style.opacity = '1';
            clearButton.textContent = 'Clear All Filters';
          }, 10);
          
        } catch (error) {
          console.error('Error clearing filters:', error);
          // Restore button state on error
          clearButton.disabled = false;
          clearButton.style.opacity = '1';
          clearButton.textContent = 'Clear All Filters';
        }
      });
    });
    clearButton.setAttribute("data-listener-attached", "true");
  }

  // Reapply filters if any are currently active (after multiselects are initialized)
  const currentFilters = getPlanningFilterValues();
  const hasActiveFilters = (currentFilters.region && currentFilters.region.length > 0) || 
    (currentFilters.quarter && currentFilters.quarter.length > 0) || 
    (currentFilters.status && currentFilters.status.length > 0) || 
    (currentFilters.programType && currentFilters.programType.length > 0) || 
    (currentFilters.strategicPillars && currentFilters.strategicPillars.length > 0) || 
    (currentFilters.owner && currentFilters.owner.length > 0) || 
    (currentFilters.revenuePlay && currentFilters.revenuePlay.length > 0) || 
    (currentFilters.country && currentFilters.country.length > 0) || 
    currentFilters.digitalMotions;

  if (hasActiveFilters) {
    applyPlanningFilters();
  }
}

// Store universal search filters globally
let universalSearchFilters = {
  region: [],
  quarter: [],
  status: [],
  programType: [],
  strategicPillars: [],
  owner: [],
  revenuePlay: [],
  country: [],
  fiscalYear: [],
  digitalMotions: false
};

function getPlanningFilterValues() {
  const digitalMotionsButton = document.getElementById(
    "planningDigitalMotionsFilter",
  );
  const digitalMotionsActive = digitalMotionsButton?.dataset.active === "true";

  // Helper function to get selected values from multiselect
  const getSelectedValues = (elementId) => {
    const element = document.getElementById(elementId);
    if (!element) return [];
    
    if (element.multiple) {
      return Array.from(element.selectedOptions).map(option => option.value).filter(value => value !== "");
    } else {
      const value = element.value;
      return value ? [value] : [];
    }
  };

  // Get values from dropdown filters
  const dropdownFilterValues = {
    region: getSelectedValues("planningRegionFilter"),
    quarter: getSelectedValues("planningQuarterFilter"),
    status: getSelectedValues("planningStatusFilter"),
    programType: getSelectedValues("planningProgramTypeFilter"),
    strategicPillars: getSelectedValues("planningStrategicPillarFilter"),
    owner: getSelectedValues("planningOwnerFilter"),
    revenuePlay: getSelectedValues("planningRevenuePlayFilter"),
    country: getSelectedValues("planningCountryFilter"),
    digitalMotions: digitalMotionsActive,
  };

  // Combine dropdown filters with universal search filters
  const filterValues = {
    region: [...new Set([...dropdownFilterValues.region, ...(Array.isArray(universalSearchFilters.region) ? universalSearchFilters.region : [])])],
    quarter: [...new Set([...dropdownFilterValues.quarter, ...(Array.isArray(universalSearchFilters.quarter) ? universalSearchFilters.quarter : [])])],
    status: [...new Set([...dropdownFilterValues.status, ...(Array.isArray(universalSearchFilters.status) ? universalSearchFilters.status : [])])],
    programType: [...new Set([...dropdownFilterValues.programType, ...(Array.isArray(universalSearchFilters.programType) ? universalSearchFilters.programType : [])])],
    strategicPillars: [...new Set([...dropdownFilterValues.strategicPillars, ...(Array.isArray(universalSearchFilters.strategicPillars) ? universalSearchFilters.strategicPillars : [])])],
    owner: [...new Set([...dropdownFilterValues.owner, ...(Array.isArray(universalSearchFilters.owner) ? universalSearchFilters.owner : [])])],
    revenuePlay: [...new Set([...dropdownFilterValues.revenuePlay, ...(Array.isArray(universalSearchFilters.revenuePlay) ? universalSearchFilters.revenuePlay : [])])],
    country: [...new Set([...dropdownFilterValues.country, ...(Array.isArray(universalSearchFilters.country) ? universalSearchFilters.country : [])])],
    digitalMotions: digitalMotionsActive || !!universalSearchFilters.digitalMotions,
  };

  // Only log filter values in debug mode (reduced console noise)
  if (window.DEBUG_FILTERS) {
    console.log(
      "[Planning] getPlanningFilterValues - Digital Motions button state:",
      {
        element: !!digitalMotionsButton,
        datasetActive: digitalMotionsButton?.dataset.active,
        digitalMotionsActive,
      },
    );
    console.log("[Planning] Combined filters (dropdown + universal search):", filterValues);
  }

  return filterValues;
}

function applyPlanningFilters() {
  if (!planningTableInstance) {
    console.warn(
      "[Planning] Table instance not available, cannot apply filters",
    );
    return;
  }

  const filters = getPlanningFilterValues();
  
  // Only log in debug mode to reduce console noise
  if (window.DEBUG_FILTERS) {
    console.log("[Planning] Applying filters:", filters);
  }

  // Use data store for faster filtering
  const filteredData = planningDataStore.applyFilters(filters);
  
  // Update table with filtered data more efficiently
  // Use replaceData instead of setData for better performance with large datasets
  if (filteredData.length > 0) {
    planningTableInstance.replaceData(filteredData);
  } else {
    planningTableInstance.clearData();
  }

  // Only log in debug mode to reduce console noise
  if (window.DEBUG_FILTERS) {
    console.log("[Planning] Filters applied, showing", filteredData.length, "rows");
  }

  // Update filter summary display (debounced for performance)
  clearTimeout(window._filterSummaryTimeout);
  window._filterSummaryTimeout = setTimeout(() => {
    updatePlanningFilterSummary(filters, filteredData.length);
  }, 50);

  // Show helpful message when Digital Motions filter is active (debug only)
  if (filters.digitalMotions && window.DEBUG_FILTERS) {
    console.log(
      "[Planning] Digital Motions filter active - showing only campaigns with digitalMotions: true",
    );
  }
}

function updatePlanningFilterSummary(filters, resultCount) {
  // Count active filters
  let activeFilters = 0;
  let filterDetails = [];
  
  Object.keys(filters).forEach(key => {
    if (key === 'digitalMotions') {
      if (filters[key]) {
        activeFilters++;
        filterDetails.push('Digital Motions');
      }
    } else if (Array.isArray(filters[key]) && filters[key].length > 0) {
      activeFilters++;
      const count = filters[key].length;
      const keyName = key.charAt(0).toUpperCase() + key.slice(1);
      filterDetails.push(`${keyName} (${count})`);
    }
  });
  
  // Update or create filter summary element
  let summaryElement = document.getElementById('planningFilterSummary');
  if (!summaryElement) {
    summaryElement = document.createElement('div');
    summaryElement.id = 'planningFilterSummary';
    summaryElement.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #666;
      border-left: 3px solid #1976d2;
    `;
    
    const filtersContainer = document.getElementById('planningFilters');
    if (filtersContainer) {
      filtersContainer.appendChild(summaryElement);
    }
  }
  
  if (activeFilters === 0) {
    summaryElement.textContent = `Showing all ${resultCount} campaigns`;
  } else {
    const filterText = filterDetails.join(', ');
    summaryElement.textContent = `Showing ${resultCount} campaigns filtered by: ${filterText}`;
  }
}

// Pre-populate planning filters with static data for immediate display
function prePopulatePlanningFilters() {
  
  // Use requestAnimationFrame to avoid blocking initial page load
  requestAnimationFrame(() => {
    const regionSelect = document.getElementById("planningRegionFilter");
    const quarterSelect = document.getElementById("planningQuarterFilter");
    const statusSelect = document.getElementById("planningStatusFilter");
    const programTypeSelect = document.getElementById("planningProgramTypeFilter");
    const strategicPillarSelect = document.getElementById("planningStrategicPillarFilter");
    const ownerSelect = document.getElementById("planningOwnerFilter");
    const revenuePlaySelect = document.getElementById("planningRevenuePlayFilter");
    const countrySelect = document.getElementById("planningCountryFilter");
    const digitalMotionsButton = document.getElementById("planningDigitalMotionsFilter");

    if (!regionSelect || !quarterSelect || !statusSelect || 
        !programTypeSelect || !strategicPillarSelect || !ownerSelect || 
        !revenuePlaySelect || !countrySelect || !digitalMotionsButton) {
      return;
    }

    // Pre-populate with static data immediately for better UX
    const populateSelectFast = (select, options, placeholder) => {
      if (select.children.length === 0) {
        select.setAttribute('data-placeholder', placeholder);
        options.forEach((optionValue) => {
          const option = document.createElement("option");
          option.value = optionValue;
          option.textContent = optionValue;
          select.appendChild(option);
        });
      }
    };

    // Populate with static data for immediate display
    populateSelectFast(regionSelect, regionOptions, 'Regions');
    populateSelectFast(quarterSelect, quarterOptions.map(normalizeQuarter), 'Quarters');
    populateSelectFast(statusSelect, statusOptions, 'Statuses');
    populateSelectFast(programTypeSelect, programTypes, 'Program Types');
    populateSelectFast(strategicPillarSelect, strategicPillars, 'Strategic Pillars');
    populateSelectFast(ownerSelect, names, 'Owners');
    populateSelectFast(revenuePlaySelect, revenuePlayOptions, 'Revenue Plays');
    populateSelectFast(countrySelect, countryOptions, 'Countries');

    // Initialize Digital Motions button
    if (!digitalMotionsButton.hasAttribute("data-active")) {
      digitalMotionsButton.dataset.active = "false";
      updateDigitalMotionsButtonVisual(digitalMotionsButton);
    }

    // Initialize multiselects immediately
    const selectElements = [
      regionSelect, quarterSelect, statusSelect, 
      programTypeSelect, strategicPillarSelect, ownerSelect,
      revenuePlaySelect, countrySelect
    ];

    selectElements.forEach(select => {
      if (!select._multiselectContainer) {
        try {
          createMultiselect(select);
        } catch (e) {
          console.warn("Failed to initialize multiselect for", select.id, e);
        }
      }
    });
  });
}

// Initialize planning filters when planning grid is ready
function initializePlanningFilters() {
  // Wait a bit for the planning grid to be initialized
  setTimeout(() => {
    populatePlanningFilters();
  }, 500);
}

// EXPORT PLANNING MODULE FUNCTIONS
window.planningModule = {
  loadPlanning,
  initPlanningGrid,
  initPlanningGridLazy,
  setupPlanningSave,
  getAllCountries,
  getCountryOptionsForRegion,
  populatePlanningFilters,
  prePopulatePlanningFilters, // Add pre-population function
  applyPlanningFilters,
  initializePlanningFilters,
  createMultiselect, // Export multiselect function for use by execution
  cleanupPlanningGrid,
  clearPlanningCache,
  ensurePlanningGridVisible, // Add grid visibility function
  ensurePlanningUIFunctional, // Add UI functionality function
  initPlanningWorker,
  cleanupPlanningWorker,
  initializePlanningUniversalSearch,
  updatePlanningSearchData,
  // Master dataset management utilities
  getDataStore: () => planningDataStore,
  getMasterData: () => planningDataStore.getMasterData(),
  getActiveData: () => planningDataStore.getData(),
  getDeletedRows: () => planningDataStore.getDeletedRows(),
  getDataStats: () => planningDataStore.getStats(),
  restoreDeletedRow: (rowId) => planningDataStore.restoreRow(rowId),
  permanentlyDeleteRow: (rowId) => planningDataStore.permanentlyDeleteRow(rowId),
  // State getters
  getIsInitialized: () => isGridInitialized,
  getIsLoading: () => isDataLoading,
  getCacheSize: () => planningDataCache ? planningDataCache.length : 0,
  // Export constants for use by other modules
  constants: {
    programTypes,
    strategicPillars,
    names,
    revenuePlayOptions,
    countryOptions,
    fyOptions,
    quarterOptions,
    monthOptions,
    regionOptions,
    statusOptions,
    yesNo,
    countryOptionsByRegion,
  },
};

// Register with tab manager if available
if (window.tabManager) {
  if (window.DEBUG_MODE) {
    console.log("🎯 TabManager found, registering planning tab...");
  }
  window.tabManager.registerTab(
    'planning',
    async () => {
      // Tab initialization callback
      console.log("🎯 ENTER: Planning tab initialization via TabManager");
      
      // Always ensure UI is functional first
      console.log("🎛️ Step 1: Ensuring UI functionality...");
      ensurePlanningUIFunctional();
      
      try {
        console.log("🏗️ Step 2: Initializing planning grid...");
        await initPlanningGridLazy();
        
        console.log("🔧 Step 3: Populating filters...");
        populatePlanningFilters();
        
        // Add a small delay to ensure DOM is ready
        console.log("🔍 Step 4: Scheduling universal search initialization...");
        setTimeout(() => {
          console.log("🔍 Initializing universal search...");
          initializePlanningUniversalSearch();
        }, 100);
        
        // Hide loading indicator if still showing
        console.log("⚡ Step 5: Hiding loading indicator...");
        hideLoadingIndicator();
        
        console.log("✅ Planning tab initialization COMPLETE");
      } catch (error) {
        console.error("❌ Failed to initialize planning tab:", error);
        hideLoadingIndicator();
        // Still ensure UI is functional even if grid fails
        console.log("🔧 Fallback: Ensuring UI functionality after error...");
        ensurePlanningUIFunctional();
      }
    },
    async () => {
      // Tab cleanup callback
      console.log("🧹 Cleaning up planning tab via TabManager");
      cleanupPlanningGrid();
    }
  );
  if (window.DEBUG_MODE) {
    console.log("✅ Planning tab registered with TabManager");
  }
} else {
  console.log("⚠️ TabManager not available, setting up fallback initialization");
  // Fallback: Initialize when explicitly needed
  console.log("🎯 TabManager not available, planning will initialize on demand");
  
  // Store fallback initialization function for later use
  window.planningModule.initializeFallback = async () => {
    try {
      console.log("🎯 ENTER: Planning fallback initialization");
      // Always ensure UI is functional first
      ensurePlanningUIFunctional();
      
      await initPlanningGridLazy();
      populatePlanningFilters();
      
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        initializePlanningUniversalSearch();
      }, 100);
      
      // Hide loading indicator if still showing
      hideLoadingIndicator();
      console.log("✅ Planning tab initialized via fallback");
    } catch (error) {
      console.error("❌ Failed to initialize planning tab:", error);
      hideLoadingIndicator();
      // Still ensure UI is functional even if grid fails
      ensurePlanningUIFunctional();
    }
  };
}

// Memory management and cleanup functions
function cleanupPlanningGrid() {
  console.log("🧹 Cleaning up planning grid...");
  
  // Clean up custom multiselects
  const multiselects = document.querySelectorAll('.filter-select[multiple]');
  multiselects.forEach(select => {
    if (select._multiselectAPI) {
      select._multiselectAPI.destroy();
    }
  });
  
  if (planningTableInstance) {
    try {
      // Clear any pending timeouts
      const data = planningTableInstance.getData();
      data.forEach(row => {
        if (row._updateTimeout) {
          clearTimeout(row._updateTimeout);
          delete row._updateTimeout;
        }
      });
      
      // Destroy the table instance
      planningTableInstance.destroy();
      planningTableInstance = null;
      isGridInitialized = false;
      
      console.log("✅ Planning grid cleaned up successfully");
    } catch (error) {
      console.warn("⚠️ Error during planning grid cleanup:", error);
    }
  }
  
  // Clean up worker
  cleanupPlanningWorker();
  
  // Clean up loading indicators
  hideLoadingIndicator();
  
  // Remove tooltips
  const tooltips = document.querySelectorAll(".desc-tooltip");
  tooltips.forEach((t) => t.remove());
}

// Clear cache function
function clearPlanningCache() {
  console.log("🗑️ Clearing planning data cache...");
  planningDataCache = null;
}

// Export the planning table instance getter
Object.defineProperty(window.planningModule, "tableInstance", {
  get: function () {
    return planningTableInstance;
  },
});

if (window.DEBUG_MODE) {
  console.log(
    "Planning module initialized and exported to window.planningModule",
  );
}

// Autosave functionality for planning - optimized for large datasets
function triggerPlanningAutosave(table) {
  if (!window.cloudflareSyncModule) {
    console.log("Cloudflare sync module not available");
    return;
  }

  // Get data from master dataset instead of filtered table
  const allData = planningDataStore.getData(); // Uses master dataset (excluding deleted)
  const modifiedData = allData.filter(row => row.__modified);
  
  console.log(`Autosave: Using master dataset - ${allData.length} total rows, ${modifiedData.length} modified`);
  
  // For large datasets, prioritize saving modified rows
  if (allData.length > 1000 && modifiedData.length < allData.length * 0.1) {
    console.log(`Autosave: Only ${modifiedData.length} of ${allData.length} rows modified, saving all data`);
  }
  
  window.cloudflareSyncModule.scheduleSave("planning", allData, {
    source: "planning-autosave",
    modifiedCount: modifiedData.length,
    totalCount: allData.length,
  });
}

// Universal Search Filter Implementation

function initializePlanningUniversalSearch() {
  // Check if UniversalSearchFilter class is available
  if (!window.UniversalSearchFilter) {
    return;
  }
  
  // Check if container exists
  const container = document.getElementById('planningUniversalSearch');
  if (!container) {
    return;
  }
  
  try {
    // Initialize universal search for planning
    window.planningUniversalSearch = new window.UniversalSearchFilter(
      'planningUniversalSearch',
      {
        onFilterChange: (selectedFilters) => {
          applyPlanningSearchFilters(selectedFilters);
        }
      }
    );
    
    // Update search data with current planning data
    updatePlanningSearchData();
    
  } catch (error) {
    console.error("Error initializing planning universal search:", error);
  }
}

function updatePlanningSearchData() {
  if (!window.planningUniversalSearch) {
    return;
  }
  
  if (!planningTableInstance) {
    return;
  }
  
  try {
    const planningData = planningTableInstance.getData();
    
    // Get unique values from actual data
    const uniqueOwners = Array.from(
      new Set(planningData.map((c) => c.owner).filter(Boolean)),
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
      const normalizedQuarter = normalizeQuarter(quarter);
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

    // Add revenue play filters
    const uniqueRevenuePlays = Array.from(
      new Set(planningData.map((c) => c.revenuePlay).filter(Boolean)),
    ).sort();
    
    uniqueRevenuePlays.forEach(revenuePlay => {
      searchData.push({
        id: `revenuePlay_${revenuePlay}`,
        title: revenuePlay,
        category: 'revenuePlay',
        value: revenuePlay,
        description: `Filter by ${revenuePlay} revenue play`,
        type: 'filter'
      });
    });

    // Add country filters
    const uniqueCountries = Array.from(
      new Set(planningData.map((c) => c.country).filter(Boolean)),
    ).sort();
    
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

    // Add Digital Motions filter in the same group as other filters
    searchData.push({
      id: 'digitalMotions_true',
      title: 'Digital Motions',
      category: 'digitalMotions',
      value: 'true',
      displayValue: 'Digital Motions',
      description: 'Show only Digital Motions campaigns',
      type: 'filter',
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

    window.planningUniversalSearch.updateData(searchData);
    
  } catch (error) {
    console.error("Error updating planning search data:", error);
  }
}

function applyPlanningSearchFilters(selectedFilters) {
  if (!planningTableInstance) {
    return;
  }
  
  try {
    // Reset universal search filters (must include digitalMotions property)
    universalSearchFilters = {
      region: [],
      quarter: [],
      status: [],
      programType: [],
      strategicPillars: [],
      owner: [],
      revenuePlay: [],
      country: [],
      fiscalYear: [],
      digitalMotions: false
    };
    
    // selectedFilters is an object with categories as keys and arrays as values
    // e.g., { region: ['SAARC'], status: ['Planning'] }
    if (selectedFilters && typeof selectedFilters === 'object') {
      Object.entries(selectedFilters).forEach(([category, values]) => {
        if (category === 'digitalMotions') {
          // If Digital Motions filter is present, set boolean (accept true or 'true')
          universalSearchFilters.digitalMotions = Array.isArray(values) && (values.includes(true) || values.includes('true'));
        } else if (universalSearchFilters.hasOwnProperty(category) && Array.isArray(values)) {
          universalSearchFilters[category] = [...values];
        }
      });
    }

    console.log("🔍 PLANNING: Universal search filters updated:", universalSearchFilters);

    // Apply filters using the main planning filter system
    applyPlanningFilters();
    
  } catch (error) {
    console.error("❌ PLANNING: Error applying search filters:", error);
  }
}

// Debug function to test the Delete All button - can be called from console (optimized)
window.testDeleteAllButton = function() {
  if (!window.DEBUG_MODE) return; // Only run in debug mode
  
  console.log("🧪 === TESTING DELETE ALL BUTTON ===");
  const btn = document.getElementById("deleteAllPlanningRows");
  console.log("🧪 Button found:", !!btn);
  console.log("🧪 Button element:", btn);
  console.log("🧪 Button classes:", btn?.className);
  console.log("🧪 Button text:", btn?.textContent?.trim());
  console.log("🧪 Button disabled:", btn?.disabled);
  
  // Use requestAnimationFrame to defer expensive layout reads
  if (btn) {
    requestAnimationFrame(() => {
      console.log("🧪 Button visible:", btn.offsetWidth > 0 && btn.offsetHeight > 0);
    });
    
    console.log("🧪 Simulating click...");
    btn.click();
  } else {
    console.log("🧪 Button not found - listing all buttons:");
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach((button, index) => {
      console.log(`  Button ${index + 1}: ID="${button.id}", Text="${button.textContent?.trim()?.substring(0, 30)}"`);
    });
  }
};

// Additional debug function to check button group (optimized for performance)
window.debugButtonGroup = function() {
  if (!window.DEBUG_MODE) return; // Only run in debug mode
  
  console.log("🧪 === DEBUGGING BUTTON GROUP ===");
  const buttonGroup = document.querySelector('.button-group');
  console.log("🧪 Button group found:", !!buttonGroup);
  
  if (buttonGroup) {
    const buttons = buttonGroup.querySelectorAll('button');
    console.log("🧪 Buttons in group:", buttons.length);
    buttons.forEach((btn, index) => {
      console.log(`  ${index + 1}. ID: "${btn.id}", Class: "${btn.className}", Text: "${btn.textContent?.trim()}"`);
    });
  }
  
  // Check if planning view is visible (optimized to prevent forced reflow)
  const planningView = document.getElementById('view-planning');
  console.log("🧪 Planning view found:", !!planningView);
  console.log("🧪 Planning view display:", planningView?.style.display);
  
  // Use requestAnimationFrame to defer expensive layout reads
  if (planningView) {
    requestAnimationFrame(() => {
      console.log("🧪 Planning view visible:", planningView.offsetWidth > 0 && planningView.offsetHeight > 0);
    });
  }
};

// Force wire up the button with simpler approach
window.forceWireDeleteAllButton = function() {
  console.log("🔧 === FORCE WIRING DELETE ALL BUTTON ===");
  const btn = document.getElementById("deleteAllPlanningRows");
  if (btn) {
    console.log("🔧 Button found, adding onclick handler...");
    btn.onclick = function(e) {
      console.log("🚨 ONCLICK TRIGGERED! Event:", e);
      alert("DELETE ALL BUTTON CLICKED! Check console for details.");
      console.log("🗑️ Delete All button onclick triggered!");
      
      if (!window.planningTableInstance) {
        console.log("❌ No planningTableInstance");
        alert("No table found");
        return;
      }
      
      try {
        const rows = window.planningTableInstance.getRows();
        console.log("📊 Rows found:", rows.length);
        
        if (rows.length === 0) {
          alert("No rows to delete");
          return;
        }
        
        if (confirm(`Delete ALL ${rows.length} rows?`)) {
          window.planningTableInstance.clearData();
          console.log("✅ Data cleared");
          alert("All rows deleted!");
        }
      } catch (error) {
        console.log("❌ Error:", error);
        alert("Error: " + error.message);
      }
    };
    console.log("✅ Onclick handler added");
    
    // Also add event listener as backup
    btn.addEventListener('click', function(e) {
      console.log("🚨 EVENT LISTENER TRIGGERED! Event:", e);
    });
    console.log("✅ Event listener added as backup");
  } else {
    console.log("❌ Button not found!");
  }
};

// === CAMPAIGN CALCULATION DEBUGGING TOOLS ===
// Debugging utility for campaign calculation issues
function debugCampaignCalculations() {
  console.log("🔍 DEBUGGING CAMPAIGN CALCULATIONS");
  console.log("=====================================");
  
  // Check if planning data is available
  if (!window.planningDataStore) {
    console.error("❌ Planning data store not available");
    return;
  }
  
  const data = window.planningDataStore.getData();
  console.log(`📊 Analyzing ${data.length} campaigns...`);
  
  let regularPrograms = 0;
  let inAccountEvents = 0;
  let calculationMismatches = 0;
  let issues = [];
  
  data.forEach((row, index) => {
    if (!row) return;
    
    const isInAccount = row.programType === "In-Account Events (1:1)";
    const expectedLeads = Number(row.expectedLeads) || 0;
    const forecastedCost = Number(row.forecastedCost) || 0;
    const currentMql = Number(row.mqlForecast) || 0;
    const currentPipeline = Number(row.pipelineForecast) || 0;
    
    if (isInAccount) {
      inAccountEvents++;
      
      // For In-Account Events: should be 0 leads, 0 MQL, cost * 20 pipeline
      const expectedMql = 0;
      const expectedPipeline = forecastedCost * 20;
      
      if (expectedLeads !== 0 || currentMql !== expectedMql || currentPipeline !== expectedPipeline) {
        calculationMismatches++;
        issues.push({
          index: index + 1,
          id: row.id,
          programType: row.programType,
          issue: "In-Account Events calculation mismatch",
          current: { leads: expectedLeads, mql: currentMql, pipeline: currentPipeline },
          expected: { leads: 0, mql: expectedMql, pipeline: expectedPipeline },
          cost: forecastedCost
        });
      }
    } else {
      regularPrograms++;
      
      // For regular programs: MQL = leads * 0.1, Pipeline = leads * 2400
      const expectedMql = Math.round(expectedLeads * 0.1);
      const expectedPipeline = Math.round(expectedLeads * 2400); // calculatePipeline formula
      
      if (currentMql !== expectedMql || currentPipeline !== expectedPipeline) {
        calculationMismatches++;
        issues.push({
          index: index + 1,
          id: row.id,
          programType: row.programType || "Unknown",
          issue: "Regular program calculation mismatch",
          current: { leads: expectedLeads, mql: currentMql, pipeline: currentPipeline },
          expected: { leads: expectedLeads, mql: expectedMql, pipeline: expectedPipeline }
        });
      }
    }
  });
  
  console.log(`📈 Summary:`);
  console.log(`   Regular Programs: ${regularPrograms}`);
  console.log(`   In-Account Events: ${inAccountEvents}`);
  console.log(`   Calculation Mismatches: ${calculationMismatches}`);
  
  if (issues.length > 0) {
    console.log(`\n❌ Found ${issues.length} calculation issues:`);
    issues.forEach(issue => {
      console.log(`\n   Row ${issue.index} (ID: ${issue.id})`);
      console.log(`   Program Type: ${issue.programType}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Current: Leads=${issue.current.leads}, MQL=${issue.current.mql}, Pipeline=$${issue.current.pipeline.toLocaleString()}`);
      console.log(`   Expected: Leads=${issue.expected.leads}, MQL=${issue.expected.mql}, Pipeline=$${issue.expected.pipeline.toLocaleString()}`);
      if (issue.cost !== undefined) {
        console.log(`   Forecasted Cost: $${issue.cost.toLocaleString()}`);
      }
    });
    
    console.log(`\n🔧 To fix these issues, you can run: fixCalculationIssues()`);
  } else {
    console.log(`\n✅ All calculations appear correct!`);
  }
  
  // Check for data type issues
  console.log(`\n🔍 Checking data types...`);
  const typeIssues = [];
  data.slice(0, 5).forEach((row, index) => {
    if (!row) return;
    
    const leadsType = typeof row.expectedLeads;
    const costType = typeof row.forecastedCost;
    const mqlType = typeof row.mqlForecast;
    const pipelineType = typeof row.pipelineForecast;
    
    if (leadsType !== 'number' || costType !== 'number' || mqlType !== 'number' || pipelineType !== 'number') {
      typeIssues.push({
        index: index + 1,
        id: row.id,
        types: { leads: leadsType, cost: costType, mql: mqlType, pipeline: pipelineType }
      });
    }
  });
  
  if (typeIssues.length > 0) {
    console.log(`❌ Found data type issues in first 5 rows:`);
    typeIssues.forEach(issue => {
      console.log(`   Row ${issue.index}: leads(${issue.types.leads}), cost(${issue.types.cost}), mql(${issue.types.mql}), pipeline(${issue.types.pipeline})`);
    });
  } else {
    console.log(`✅ Data types look correct (checked first 5 rows)`);
  }
  
  return { regularPrograms, inAccountEvents, calculationMismatches, issues, typeIssues };
}

function fixCalculationIssues() {
  console.log("🔧 CHECKING CALCULATION ISSUES (Preserving Imported Values)");
  console.log("===============================================================");
  
  if (!window.planningDataStore) {
    console.error("❌ Planning data store not available");
    return;
  }
  
  // Define calculatePipeline locally if not available globally
  const calcPipeline = window.calculatePipeline || function(leads) {
    return Math.round((leads || 0) * 2400);
  };
  
  const data = window.planningDataStore.getData();
  let fixedCount = 0;
  
  data.forEach(row => {
    if (!row) return;
    
    const isInAccount = row.programType === "In-Account Events (1:1)";
    const expectedLeads = Number(row.expectedLeads) || 0;
    const forecastedCost = Number(row.forecastedCost) || 0;
    
    let needsUpdate = false;
    const updates = {};
    
    // NEW LOGIC: Only fix calculations if values appear to be auto-generated errors
    // Do NOT override imported/manually set values
    
    if (isInAccount) {
      // For In-Account Events: Only fix if values are clearly wrong calculations
      // Allow imported values (like 300 leads for special In-Account Events) to remain
      
      // Only force to 0 if the current values seem like calculation errors
      // (e.g., if leads exactly match cost/24 formula, it's likely auto-calculated)
      const autoCalculatedLeads = Math.round(forecastedCost / 24);
      const isLikelyAutoCalculated = (expectedLeads === autoCalculatedLeads && expectedLeads > 0);
      
      if (isLikelyAutoCalculated) {
        // This looks like auto-calculated, revert to proper In-Account Events logic
        console.log(`🔧 Reverting auto-calculated In-Account Event ${row.id}: ${expectedLeads} leads → 0 (imported values preserved elsewhere)`);
        updates.expectedLeads = 0;
        updates.mqlForecast = 0;
        needsUpdate = true;
      }
      
      // Always fix pipeline for In-Account Events
      const correctPipeline = forecastedCost * 20;
      if (Math.abs(row.pipelineForecast - correctPipeline) > 1) {
        updates.pipelineForecast = correctPipeline;
        needsUpdate = true;
        console.log(`🔧 Fixing In-Account Event Pipeline ${row.id}: ${row.pipelineForecast} → ${correctPipeline} (cost: ${forecastedCost})`);
      }
    } else {
      // For regular programs: Only fix pipeline calculations, preserve imported leads/MQL
      
      // Fix MQL only if it's clearly wrong (not 10% of leads)
      const correctMql = Math.round(expectedLeads * 0.1);
      if (expectedLeads > 0 && Math.abs(row.mqlForecast - correctMql) > 0.1) {
        updates.mqlForecast = correctMql;
        needsUpdate = true;
        console.log(`🔧 Fixing MQL calculation for ${row.id}: ${row.mqlForecast} → ${correctMql} (leads: ${expectedLeads})`);
      }
      
      // Fix pipeline only if it's clearly wrong (not 2400 * leads)
      const correctPipeline = calcPipeline(expectedLeads);
      if (expectedLeads > 0 && Math.abs(row.pipelineForecast - correctPipeline) > 100) {
        updates.pipelineForecast = correctPipeline;
        needsUpdate = true;
        console.log(`🔧 Fixing Pipeline calculation for ${row.id}: ${row.pipelineForecast} → ${correctPipeline} (leads: ${expectedLeads})`);
      }
    }
    
    if (needsUpdate) {
      updates.__modified = true;
      window.planningDataStore.updateRow(row.id, updates);
      fixedCount++;
    }
  });
  
  console.log(`✅ Fixed ${fixedCount} calculation issues (imported values preserved)`);
  
  // Refresh the table display
  if (window.planningTableInstance && fixedCount > 0) {
    const refreshedData = window.planningDataStore.getFilteredData();
    window.planningTableInstance.replaceData(refreshedData);
    console.log(`🔄 Table refreshed with corrected data`);
    
    // Also trigger ROI updates if available
    if (window.roiModule && typeof window.roiModule.updateRoiTotalSpend === 'function') {
      setTimeout(() => {
        window.roiModule.updateRoiTotalSpend();
        console.log(`🔄 ROI metrics updated`);
      }, 100);
    }
  }
  
  return fixedCount;
}

// Make the proper calculatePipeline function globally available
window.calculatePipeline = function(cost, programType, row) {
  // Convert cost to number
  const forecastedCost = Number(cost) || 0;
  
  if (forecastedCost <= 0) {
    return {
      expectedLeads: 0,
      mqlForecast: 0,
      pipelineForecast: 0
    };
  }
  
  // PRIORITY 1: Always preserve imported/manually set values
  // If the row already has expectedLeads or mqlForecast values, preserve them
  // This ensures imported CSV data overrides any automatic calculation logic
  if (row && (row.expectedLeads !== undefined || row.mqlForecast !== undefined)) {
    const preservedLeads = Number(row.expectedLeads) || 0;
    const preservedMql = Number(row.mqlForecast) || 0;
    
    // Only use preserved values if they seem intentionally set (not just default 0s)
    // Exception: For In-Account Events, 0 can be intentional, so always preserve for them
    const isInAccount = programType === "In-Account Events (1:1)";
    const hasIntentionalValues = preservedLeads > 0 || preservedMql > 0 || isInAccount;
    
    if (hasIntentionalValues) {
      // Calculate pipeline based on program type but preserve leads/MQL
      let pipelineForecast;
      if (isInAccount) {
        pipelineForecast = forecastedCost * 20; // In-Account Events: cost * 20
      } else {
        pipelineForecast = Math.round(preservedLeads * 2400); // Regular programs: leads * 2400
      }
      
      return {
        expectedLeads: preservedLeads,
        mqlForecast: preservedMql,
        pipelineForecast: pipelineForecast
      };
    }
  }
  
  // PRIORITY 2: Automatic calculation only if no imported values exist
  // Check if this is an In-Account Events program
  const isInAccount = programType === "In-Account Events (1:1)";
  
  if (isInAccount) {
    // Standard In-Account Events: 0 leads, 0 MQL, cost * 20 pipeline
    return {
      expectedLeads: 0,
      mqlForecast: 0,
      pipelineForecast: forecastedCost * 20
    };
  } else {
    // For regular programs: reverse calculate leads from cost, then apply standard formulas
    // This is only used as a fallback when no imported values exist
    const expectedLeads = Math.round(forecastedCost / 24); // Rough estimate: $24 per lead
    const mqlForecast = Math.round(expectedLeads * 0.1);
    const pipelineForecast = Math.round(expectedLeads * 2400);
    
    return {
      expectedLeads: expectedLeads,
      mqlForecast: mqlForecast,
      pipelineForecast: pipelineForecast
    };
  }
};

// Make debugging functions available globally
window.debugCampaignCalculations = debugCampaignCalculations;
window.fixCalculationIssues = fixCalculationIssues;

// Add chart refresh function for debugging
window.refreshRoiChart = function() {
  console.log('Refreshing ROI chart...');
  if (window.roiModule && window.roiModule.updateRoiCharts) {
    window.roiModule.updateRoiCharts();
  } else if (typeof updateRoiCharts === 'function') {
    updateRoiCharts();
  } else {
    console.log('Chart update function not found');
  }
};

// Add function to check total expected leads
window.checkExpectedLeads = function() {
  let totalExpectedLeads = 0;
  let totalMqlForecast = 0;
  let planningData = window.planningDataStore ? window.planningDataStore.getData() : (window.planningTableInstance ? window.planningTableInstance.getData() : window.planningRows);
  
  if (planningData && Array.isArray(planningData)) {
    console.log(`Total planning rows: ${planningData.length}`);
    
    planningData.forEach((row, index) => {
      let leads = row.expectedLeads || 0;
      let mql = row.mqlForecast || 0;
      
      if (typeof leads === "string") leads = Number(leads.toString().replace(/[^\d.-]/g, ""));
      if (typeof mql === "string") mql = Number(mql.toString().replace(/[^\d.-]/g, ""));
      
      if (!isNaN(leads)) totalExpectedLeads += Number(leads);
      if (!isNaN(mql)) totalMqlForecast += Number(mql);
      
      // Show first few rows for debugging
      if (index < 5) {
        console.log(`Row ${index}: ${row.campaignName} - expectedLeads: ${row.expectedLeads}, mqlForecast: ${row.mqlForecast}`);
      }
    });
    
    console.log(`Total Expected Leads: ${totalExpectedLeads}`);
    console.log(`Total MQL Forecast: ${totalMqlForecast}`);
    console.log('Expected chart values - Leads: 4075, MQL: 407.5');
    console.log(`Chart showing correct values: Leads ${totalExpectedLeads === 4075 ? '✓' : '✗'}, MQL ${totalMqlForecast === 407.5 ? '✓' : '✗'}`);
  } else {
    console.log('No planning data found');
  }
  
  return { totalExpectedLeads, totalMqlForecast };
};

// Add detailed chart aggregation debugging
window.debugChartAggregation = function() {
  console.log('🔍 Debugging chart aggregation...');
  
  let planningData = window.planningDataStore ? window.planningDataStore.getData() : (window.planningTableInstance ? window.planningTableInstance.getData() : window.planningRows);
  
  if (!planningData || !Array.isArray(planningData)) {
    console.log('❌ No planning data found');
    return;
  }
  
  console.log(`📊 Total planning rows: ${planningData.length}`);
  
  // Manual calculation like the chart does
  let manualLeads = 0;
  let manualMql = 0;
  let processedRows = 0;
  let skippedRows = 0;
  
  planningData.forEach((row, index) => {
    let leads = row.expectedLeads || 0;
    let mql = row.mqlForecast || 0;
    
    // Parse strings like the chart does
    if (typeof leads === "string") leads = Number(leads.toString().replace(/[^\d.-]/g, ""));
    if (typeof mql === "string") mql = Number(mql.toString().replace(/[^\d.-]/g, ""));
    
    // Check if values are valid numbers
    if (!isNaN(leads) && !isNaN(mql)) {
      manualLeads += Number(leads);
      manualMql += Number(mql);
      processedRows++;
      
      // Show details for rows with values
      if (leads > 0 || mql > 0) {
        console.log(`Row ${index}: ${row.campaignName || 'Unnamed'} - leads: ${leads}, MQL: ${mql}`);
      }
    } else {
      skippedRows++;
      console.log(`Row ${index}: SKIPPED - invalid values - leads: ${row.expectedLeads}, MQL: ${row.mqlForecast}`);
    }
  });
  
  console.log(`\n📈 Manual aggregation results:`);
  console.log(`   Processed rows: ${processedRows}`);
  console.log(`   Skipped rows: ${skippedRows}`);
  console.log(`   Manual total leads: ${manualLeads}`);
  console.log(`   Manual total MQL: ${manualMql}`);
  console.log(`   Expected leads: 4075`);
  console.log(`   Expected MQL: 407.5`);
  console.log(`   Leads match: ${manualLeads === 4075 ? '✅' : '❌'} (difference: ${4075 - manualLeads})`);
  console.log(`   MQL match: ${manualMql === 407.5 ? '✅' : '❌'} (difference: ${407.5 - manualMql})`);
  
  // Compare with chart logic
  console.log(`\n🔄 Running chart aggregation simulation...`);
  
  // Get current ROI filter state (like the chart does)
  const filters = window.roiModule ? window.roiModule.getFilterState ? window.roiModule.getFilterState() : {} : {};
  console.log('Chart filters:', filters);
  
  let chartLeads = 0;
  let chartMql = 0;
  let chartProcessed = 0;
  let chartFiltered = 0;
  
  // Helper to normalize quarter (copied from chart)
  const normalizeQuarter = (quarter) => {
    if (!quarter) return '';
    return quarter.replace(/\s*-\s*/g, ' ').trim();
  };
  
  planningData.forEach((row, index) => {
    // Apply same filters as chart
    if (Array.isArray(filters.region) && filters.region.length > 0 && !filters.region.includes(row.region)) {
      chartFiltered++;
      return;
    }
    if (Array.isArray(filters.quarter) && filters.quarter.length > 0 && !filters.quarter.includes(normalizeQuarter(row.quarter))) {
      chartFiltered++;
      return;
    }
    if (Array.isArray(filters.country) && filters.country.length > 0 && !filters.country.includes(row.country)) {
      chartFiltered++;
      return;
    }
    if (Array.isArray(filters.owner) && filters.owner.length > 0 && !filters.owner.includes(row.owner)) {
      chartFiltered++;
      return;
    }
    if (Array.isArray(filters.status) && filters.status.length > 0) {
      const rowStatusLower = (row.status || '').toLowerCase();
      const statusMatches = filters.status.some(filterStatus => 
        (filterStatus || '').toLowerCase() === rowStatusLower
      );
      if (!statusMatches) {
        chartFiltered++;
        return;
      }
    }
    if (Array.isArray(filters.programType) && filters.programType.length > 0 && !filters.programType.includes(row.programType)) {
      chartFiltered++;
      return;
    }
    if (Array.isArray(filters.strategicPillars) && filters.strategicPillars.length > 0 && !filters.strategicPillars.includes(row.strategicPillars)) {
      chartFiltered++;
      return;
    }
    if (Array.isArray(filters.revenuePlay) && filters.revenuePlay.length > 0 && !filters.revenuePlay.includes(row.revenuePlay)) {
      chartFiltered++;
      return;
    }

    chartProcessed++;
    let fMql = row.mqlForecast || 0;
    if (typeof fMql === "string") fMql = Number(fMql.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(fMql)) chartMql += Number(fMql);

    let fLeads = row.expectedLeads || 0;
    if (typeof fLeads === "string") fLeads = Number(fLeads.toString().replace(/[^\d.-]/g, ""));
    if (!isNaN(fLeads)) chartLeads += Number(fLeads);
  });
  
  console.log(`\n� Chart simulation results:`);
  console.log(`   Chart processed rows: ${chartProcessed}`);
  console.log(`   Chart filtered out: ${chartFiltered}`);
  console.log(`   Chart total leads: ${chartLeads}`);
  console.log(`   Chart total MQL: ${chartMql}`);
  console.log(`   Chart matches manual: ${chartLeads === manualLeads ? '✅' : '❌'}`);
  
  return { manualLeads, manualMql, chartLeads, chartMql, processedRows, chartProcessed };
};

console.log("�🛠️ Campaign calculation debugging tools loaded!");
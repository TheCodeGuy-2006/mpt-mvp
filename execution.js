// --- Inject Description Keyword Search Bar for Execution Tab ---
function injectExecutionDescriptionKeywordSearchBar() {
  // (Filtering logic removed to restore previous state)
  // Only inject once
  if (document.getElementById('execution-description-search-bar')) return;

  // Find the filters container in the Execution tab
  const filtersBox = document.querySelector('#executionFilters');

  // Create the search bar container
  const container = document.createElement('div');
  container.id = 'execution-description-search-bar';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '8px';
  container.style.margin = '18px 0 8px 0';

  // Create the input
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'execution-description-search';
  input.placeholder = 'Search campaign descriptions...';
  input.style.flex = '1';
  input.style.padding = '8px 12px';
  input.style.border = '2px solid #d39e00';
  input.style.borderRadius = '7px';
  input.style.fontSize = '1em';
  input.style.background = '#fffbe6';

  // Create the button
  const button = document.createElement('button');
  button.id = 'execution-description-search-btn';
  button.textContent = 'Search';
  button.style.padding = '8px 18px';
  button.style.background = '#1976d2';
  button.style.color = '#fff';
  button.style.border = '2px solid #d39e00';
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
    if (window.executionTableInstance && typeof window.executionTableInstance.replaceData === 'function') {
      // On first use, cache the original data
      if (!window.executionDataCache || !Array.isArray(window.executionDataCache) || window.executionDataCache.length === 0) {
        if (typeof window.executionTableInstance.getData === 'function') {
          // Clone the data to avoid reference issues
          window.executionDataCache = window.executionTableInstance.getData().slice();
        }
      }
      let allRows = window.executionDataCache && Array.isArray(window.executionDataCache)
        ? window.executionDataCache
        : [];
      let filtered = allRows;
      if (keywords.length > 0) {
        filtered = allRows.filter(row => {
          if (!row.description) return false;
          const desc = row.description.toLowerCase();
          return keywords.every(kw => desc.includes(kw.toLowerCase()));
        });
      }
      window.executionTableInstance.replaceData(filtered);
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

  // Clear filter on empty input (restores all data)
  input.addEventListener('input', function() {
    if (input.value.trim() === '') {
      // Restore all data (clear filters)
      if (window.executionTableInstance && typeof window.executionTableInstance.replaceData === 'function') {
        // Always restore from the persistent cache
        if (window.executionDataCache && Array.isArray(window.executionDataCache)) {
          window.executionTableInstance.replaceData(window.executionDataCache);
        } else if (typeof window.executionTableInstance.getData === 'function') {
          // Fallback: cache and restore current data
          window.executionDataCache = window.executionTableInstance.getData().slice();
          window.executionTableInstance.replaceData(window.executionDataCache);
        }
      }
    }
  });

  // Insert the search bar into the DOM, always after the filters box
  if (filtersBox && filtersBox.parentNode) {
    if (filtersBox.nextSibling) {
      filtersBox.parentNode.insertBefore(container, filtersBox.nextSibling);
    } else {
      filtersBox.parentNode.appendChild(container);
    }
  } else {
    // Fallback: append to body, fixed at top for debug
    container.style.position = 'fixed';
    container.style.top = '80px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.width = '420px';
    document.body.appendChild(container);
  }
}

// Inject on DOMContentLoaded and after a short delay to ensure placement
function tryInjectExecutionDescriptionKeywordSearchBar() {
  injectExecutionDescriptionKeywordSearchBar();
  setTimeout(injectExecutionDescriptionKeywordSearchBar, 500);
  setTimeout(injectExecutionDescriptionKeywordSearchBar, 1500);
  setTimeout(injectExecutionDescriptionKeywordSearchBar, 3000);
  setTimeout(injectExecutionDescriptionKeywordSearchBar, 5000);
}

// Pre-populate execution filters as soon as DOM is ready for faster initial load
function initializeExecutionFiltersEarly() {
  const attemptPrePopulation = () => {
    if (window.executionModule?.prePopulateExecutionFilters) {
      window.executionModule.prePopulateExecutionFilters();
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
  document.addEventListener('DOMContentLoaded', tryInjectExecutionDescriptionKeywordSearchBar);
} else {
  tryInjectExecutionDescriptionKeywordSearchBar();
}

// Initialize execution filters early for better performance
initializeExecutionFiltersEarly();
// --- Unsaved Changes Flag for Execution Tab ---
window.hasUnsavedExecutionChanges = false;

// --- Warn on Tab Close/Reload if Unsaved Changes in Execution Tab ---
window.addEventListener('beforeunload', function (e) {
  if (window.hasUnsavedExecutionChanges) {
    // Standard message is ignored by most browsers, but setting returnValue triggers the dialog
    const msg = 'You have unsaved changes in the Execution tab. Are you sure you want to leave?';
    e.preventDefault();
    e.returnValue = msg;
    return msg;
  }
});

// Save button setup for execution table
function setupExecutionSave(table, rows) {
  let btn = document.getElementById("saveExecutionRows");
  if (!btn) {
    console.error("Save button not found in HTML structure");
    return;
  }
  btn.onclick = () => {
    // Save all execution data using the same pattern as planning
    const data = table.getData();
    console.log("Saving execution data:", data.length, "rows");
    // Try Worker first, then backend fallback
    if (window.cloudflareSyncModule) {
      window.cloudflareSyncModule
        .saveToWorker("planning", data, { source: "manual-save-execution" })
        .then((result) => {
          console.log("Worker save successful:", result);
          alert(
            "✅ Execution data saved to GitHub!\n\n💡 Note: It may take 1-2 minutes for changes from other users to appear due to GitHub's caching. Use the 'Refresh Data' button in GitHub Sync if needed."
          );
          // --- Reset unsaved changes flag after successful save ---
          console.log("[Execution] Unsaved changes set to false (save successful)");
          window.hasUnsavedExecutionChanges = false;
          if (window.cloudflareSyncModule.refreshDataAfterSave) {
            window.cloudflareSyncModule.refreshDataAfterSave("planning");
          }
        })
        .catch((error) => {
          console.warn("Worker save failed, trying backend:", error);
          fetch("http://localhost:3000/save-planning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data }),
          })
            .then((res) => res.json())
            .then((result) => {
              if (result.success) {
                alert(
                  "✅ Execution data saved to backend (Worker unavailable)!"
                );
                // --- Reset unsaved changes flag after successful save ---
                console.log("[Execution] Unsaved changes set to false (save successful, backend fallback)");
                window.hasUnsavedExecutionChanges = false;
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
      fetch("http://localhost:3000/save-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            alert("✅ Execution data saved to backend!");
            // --- Reset unsaved changes flag after successful save ---
            console.log("[Execution] Unsaved changes set to false (save successful, backend only)");
            window.hasUnsavedExecutionChanges = false;
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
// EXECUTION TAB MODULE

// Execution table instance
let executionTableInstance = null;

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

// EXECUTION FILTER MULTISELECT FUNCTIONALITY

// Custom multiselect implementation for execution filters
function createExecutionMultiselect(selectElement) {
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
      closeAllExecutionMultiselects();
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

// Close all execution multiselects
function closeAllExecutionMultiselects() {
  document.querySelectorAll('#executionFilters .multiselect-display.open').forEach(display => {
    display.classList.remove('open');
  });
  document.querySelectorAll('#executionFilters .multiselect-dropdown.open').forEach(dropdown => {
    dropdown.classList.remove('open');
  });
}

// Close execution multiselects when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#executionFilters .multiselect-container')) {
    closeAllExecutionMultiselects();
  }
});

// EXECUTION GRID INITIALIZATION
function initExecutionGrid(rows) {
  return new Promise(async (resolve, reject) => {
    try {
      // More aggressive yielding function for better responsiveness
      const yieldToMain = () => new Promise(resolveYield => {
        // Use requestIdleCallback if available, otherwise setTimeout
        if (window.requestIdleCallback) {
          requestIdleCallback(resolveYield, { timeout: 5 });
        } else {
          setTimeout(resolveYield, 5);
        }
      });

      // Chunk 1: Prepare configuration
      console.log("🔄 Initializing execution grid - preparing config...");
      const statusOptions = window.planningModule?.constants?.statusOptions || [
        "Planning",
        "On Track",
        "Shipped",
        "Cancelled",
      ];
      const yesNo = window.planningModule?.constants?.yesNo || ["Yes", "No"];
      const performanceConfig = {
        pagination: "local",
        paginationSize: 25,
        paginationSizeSelector: [25, 50, 100],
        paginationCounter: "rows",
        virtualDom: false,
        progressiveLoad: false,
        renderHorizontal: "basic",
        invalidOptionWarnings: false,
        autoResize: false,
        responsiveLayout: false,
        columnCalcs: false,
        scrollToRowPosition: "top",
        scrollToColumnPosition: "left",
        scrollToRowIfVisible: false,
        wheelScrollSpeed: 0,
      };
      await yieldToMain();

      // Chunk 2: Create table instance with no columns yet
      console.log("🔄 Initializing execution grid - creating table...");
      const table = new Tabulator("#executionGrid", {
        data: rows,
        reactiveData: true,
        selectableRows: 1,
        layout: "fitColumns",
        ...performanceConfig,
        columns: [] // Add columns in next chunk
      });
      executionTableInstance = table;
      await yieldToMain();

      // Chunk 3: Add columns in very small batches (1 at a time) with yields
      const allColumns = [
        {
          title: "#",
          field: "rowNumber",
          formatter: function (cell) {
            const row = cell.getRow();
            const table = row.getTable();
            const allRows = table.getRows();
            const index = allRows.indexOf(row);
            return index + 1;
          },
          width: 50,
          hozAlign: "center",
          headerSort: false,
          frozen: true,
        },
        {
          title: '<span style="display:flex;align-items:center;justify-content:space-between;width:100%;"><span>Program Type</span><span style="display:inline-block;width:18px;"></span><i class="octicon octicon-list-unordered" aria-hidden="true" style="margin-left:auto;"></i></span>',
          field: "details",
          width: 240,
          editable: false,
          formatter: function (cell) {
            const data = cell.getRow().getData();
            const region = data.region || "";
            const owner = data.owner || "";
            const description = data.description || "";
            const programType = data.programType || "";
            const quarter = data.quarter || "";
            let html = '<div style="padding: 4px; line-height: 1.3; font-size: 12px; position:relative;">';
            // DM badge for digital motions
            if (data.digitalMotions === true || data.digitalMotions === 'true') {
              html += '<span class="dm-badge" style="position:absolute;top:2px;right:2px;background:#1976d2;color:#fff;font-weight:bold;font-size:0.95em;padding:2px 8px;border-radius:8px;box-shadow:0 2px 8px rgba(25,118,210,0.08);z-index:10;letter-spacing:0.04em;user-select:none;pointer-events:none;display:inline-block;">DM</span>';
            }
            if (region) html += `<div style="font-weight: bold; color: #1976d2;">${region}</div>`;
            if (quarter) html += `<div style="color: #e65100; font-weight: bold; margin-top: 2px;">${quarter}</div>`;
            if (owner) html += `<div style="color: #666; margin-top: 2px;">${owner}</div>`;
            if (programType) html += `<div style="color: #888; font-size: 11px; margin-top: 2px;">${programType}</div>`;
            if (description) html += `<div style="color: #333; margin-top: 2px; word-wrap: break-word;">${description}</div>`;
            html += "</div>";
            return html;
          },
        },
        {
          title: '<span style="display:flex;align-items:center;justify-content:space-between;width:100%;"><span>Status</span><span style="display:inline-block;width:18px;"></span><i class="octicon octicon-checklist" aria-hidden="true" style="margin-left:auto;"></i></span>',
          field: "status",
          editor: "list",
          editorParams: { values: statusOptions },
          cellEdited: debounce((cell) => {
            cell.getRow().getData().__modified = true;
            window.hasUnsavedExecutionChanges = true;
            console.log("[Execution] Unsaved changes set to true (cellEdited: Status)");
          }, 500),
        },
        {
          title: '<span style="display:flex;align-items:center;justify-content:space-between;width:100%;"><span>PO Raised</span><span style="display:inline-block;width:18px;"></span><i class="octicon octicon-credit-card" aria-hidden="true" style="margin-left:auto;"></i></span>',
          field: "poRaised",
          editor: "list",
          editorParams: { values: yesNo },
          cellEdited: debounce((cell) => {
            cell.getRow().getData().__modified = true;
            window.hasUnsavedExecutionChanges = true;
            console.log("[Execution] Unsaved changes set to true (cellEdited: PO Raised)");
          }, 500),
        },
        {
          title: '<span style="display:flex;align-items:center;justify-content:space-between;width:100%;"><span>Forecasted Cost</span><span style="display:inline-block;width:18px;"></span><i class="octicon octicon-graph" aria-hidden="true" style="margin-left:auto;"></i></span>',
          field: "forecastedCost",
          editor: false,
          formatter: function (cell) {
            const v = cell.getValue();
            if (v === null || v === undefined || v === "") return "";
            return "$" + Number(v).toLocaleString();
          },
        },
        {
          title: '<span style="display:flex;align-items:center;justify-content:space-between;width:100%;"><span>Actual Cost</span><span style="display:inline-block;width:18px;"></span><i class="octicon octicon-repo-push" aria-hidden="true" style="margin-left:auto;"></i></span>',
          field: "actualCost",
          editor: "number",
          formatter: function (cell) {
            const v = cell.getValue();
            if (v === null || v === undefined || v === "") return "";
            return "$" + Number(v).toLocaleString();
          },
          cellEdited: debounce((cell) => {
            cell.getRow().getData().__modified = true;
            window.hasUnsavedExecutionChanges = true;
            console.log("[Execution] Unsaved changes set to true (cellEdited: Actual Cost)");
          }, 500),
        },
        { title: "Expected Leads", field: "expectedLeads" },
        {
          title: "Actual Leads",
          field: "actualLeads",
          editor: "number",
          cellEdited: debounce((cell) => {
            cell.getRow().getData().__modified = true;
            window.hasUnsavedExecutionChanges = true;
            console.log("[Execution] Unsaved changes set to true (cellEdited: Actual Leads)");
          }, 500),
        },
        { title: "Forecasted MQL", field: "mqlForecast", editable: false },
        {
          title: "Actual MQLs",
          field: "actualMQLs",
          editor: "number",
          cellEdited: debounce((cell) => {
            cell.getRow().getData().__modified = true;
            window.hasUnsavedExecutionChanges = true;
            console.log("[Execution] Unsaved changes set to true (cellEdited: Actual MQLs)");
          }, 500),
        },
        {
          title: "Forecasted Pipeline",
          field: "pipelineForecast",
          editable: false,
          formatter: function (cell) {
            const v = cell.getValue();
            if (v === null || v === undefined || v === "") return "";
            return "$" + Number(v).toLocaleString();
          },
        },
      ];
      // Add columns in batches of 1 with yields
      for (let i = 0; i < allColumns.length; i++) {
        table.addColumn(allColumns[i]);
        await yieldToMain();
      }

      setupExecutionSave(table, rows);
      await yieldToMain();

      // Chunk 4: Table built callback and universal search
      setTimeout(() => {
        try {
          table.redraw(true);
        } catch (e) {
          console.warn("Error in execution table built callback:", e.message);
        }
      }, 100);

      // Initialize universal search and then update search data when table is ready
      setTimeout(() => {
        if (typeof initializeExecutionUniversalSearch === 'function' && !window.executionUniversalSearch) {
          window.executionSearchRetryCount = 0;
          initializeExecutionUniversalSearch();
        }
        setTimeout(() => {
          if (window.executionUniversalSearch && 
              !(window.executionUniversalSearch instanceof HTMLElement) &&
              typeof window.executionUniversalSearch.updateData === 'function') {
            updateExecutionSearchData();
          } else {
            console.log("⏳ EXECUTION: Universal search not ready yet, will be updated by routing system");
          }
        }, 500);
      }, 300);

      await yieldToMain();
      console.log("✅ Execution grid initialization completed");
      
      // Debug: Show actual execution data structure
      const executionData = table.getData();
      console.log("[Execution] Data count after init:", executionData.length);
      if (executionData.length > 0) {
        console.log("[Execution] Sample data keys:", Object.keys(executionData[0]));
        console.log("[Execution] Sample data:", executionData[0]);
      }
      
      // Populate filters with actual data after grid is built
      setTimeout(() => {
        populateExecutionFilters();
      }, 500);
      
      resolve(table);
    } catch (error) {
      console.error("❌ Error initializing execution grid:", error);
      reject(error);
    }
  });
  let btn = document.getElementById("saveExecutionRows");
  if (!btn) {
    console.error("Save button not found in HTML structure");
    return;
  }
  
  btn.onclick = () => {
    // Save all execution data using the same pattern as planning
    const data = table.getData();
    
    console.log("Saving execution data:", data.length, "rows");

    // Try Worker first, then backend fallback
    if (window.cloudflareSyncModule) {
      // Primary: Save to Worker (using planning endpoint since execution is part of planning data)
      window.cloudflareSyncModule
        .saveToWorker("planning", data, { source: "manual-save-execution" })
        .then((result) => {
          console.log("Worker save successful:", result);
          alert(
            "✅ Execution data saved to GitHub!\n\n💡 Note: It may take 1-2 minutes for changes from other users to appear due to GitHub's caching. Use the 'Refresh Data' button in GitHub Sync if needed.",
          );

          // Refresh data after successful save
          if (window.cloudflareSyncModule.refreshDataAfterSave) {
            window.cloudflareSyncModule.refreshDataAfterSave("planning");
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
                  "✅ Execution data saved to backend (Worker unavailable)!",
                );
              } else {
                alert(
                  "❌ Failed to save: " + (result.error || "Unknown error"),
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
            alert("✅ Execution data saved to backend!");
          } else {
            alert("❌ Failed to save: " + (result.error || "Unknown error"));
          }
        })
        .catch((err) => {
          alert("❌ Failed to save: " + err.message);
        });
    }
  };
}

// EXECUTION FILTERS SETUP
function setupExecutionFilters() {
  // Sync digital motions data from planning table first
  syncDigitalMotionsFromPlanning();

  // Get constants from planning module for consistency
  const regionOptions = window.planningModule?.constants?.regionOptions || [
    "JP & Korea",
    "South APAC",
    "SAARC",
  ];
  const statusOptions = window.planningModule?.constants?.statusOptions || [
    "Planning",
    "On Track",
    "Shipped",
    "Cancelled",
  ];
  const programTypes = window.planningModule?.constants?.programTypes || [
    "User Groups",
    "Targeted paid ads & content sydication",
    "Flagship Events (Galaxy, Universe Recaps) 1:Many",
    "3P Sponsored Events",
    "Webinars",
    "Microsoft",
    "Lunch & Learns and Workshops (1:few)",
    "Localized Programs",
    "CxO events (1:few)",
    "Exec engagement programs",
    "In-Account Events (1:1)",
    "Contractor/Infrastructure",
    "Paid ads",
    "Operational/Infrastructure/Swag",
  ];
  const strategicPillars = window.planningModule?.constants?.strategicPillars || [
    "Account Growth and Product Adoption",
    "Pipeline Acceleration & Executive Engagement", 
    "Brand Awareness & Top of Funnel Demand Generation",
    "New Logo Acquisition",
  ];
  const quarterOptions = window.planningModule?.constants?.quarterOptions || [
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
  const names = window.planningModule?.constants?.names || [
    "Shruti Narang",
    "Beverly Leung",
    "Giorgia Parham",
    "Tomoko Tanaka",
  ];

  // Set up filters with constants from planning module

  // Populate filter dropdowns using the HTML elements already in index.html
  populateExecutionFilterDropdowns(regionOptions, quarterOptions, statusOptions, programTypes, strategicPillars, names);
  
  // Setup filter event listeners
  setupExecutionFilterLogic();
}

// Pre-populate execution filters with static data for immediate display
function prePopulateExecutionFilters() {
  console.log("🚀 Pre-populating execution filters for faster initial load...");
  
  // Use requestAnimationFrame to avoid blocking initial page load
  requestAnimationFrame(() => {
    const regionSelect = document.getElementById("executionRegionFilter");
    const quarterSelect = document.getElementById("executionQuarterFilter");
    const statusSelect = document.getElementById("executionStatusFilter");
    const programTypeSelect = document.getElementById("executionProgramTypeFilter");
    const strategicPillarSelect = document.getElementById("executionStrategicPillarFilter");
    const ownerSelect = document.getElementById("executionOwnerFilter");
    const revenuePlaySelect = document.getElementById("executionRevenuePlayFilter");
    const countrySelect = document.getElementById("executionCountryFilter");
    const digitalMotionsButton = document.getElementById("executionDigitalMotionsFilter");

    if (!regionSelect || !quarterSelect || !statusSelect || 
        !programTypeSelect || !strategicPillarSelect || !ownerSelect || 
        !revenuePlaySelect || !countrySelect || !digitalMotionsButton) {
      console.log("⏳ Execution filter elements not ready yet, will populate later");
      return;
    }

    console.log("✅ Pre-populating execution filters with static data");

    // Get constants from planning module for consistency
    const regionOptions = window.planningModule?.constants?.regionOptions || [
      "JP & Korea", "South APAC", "SAARC",
    ];
    const statusOptions = window.planningModule?.constants?.statusOptions || [
      "Planning", "On Track", "Shipped", "Cancelled",
    ];
    const programTypes = window.planningModule?.constants?.programTypes || [
      "User Groups", "Targeted paid ads & content sydication", "Flagship Events (Galaxy, Universe Recaps) 1:Many",
      "3P Sponsored Events", "Webinars", "Microsoft", "Lunch & Learns and Workshops (1:few)",
      "Localized Programs", "CxO events (1:few)", "Exec engagement programs", "In-Account Events (1:1)",
      "Contractor/Infrastructure", "Paid ads", "Operational/Infrastructure/Swag",
    ];
    const strategicPillars = window.planningModule?.constants?.strategicPillars || [
      "Account Growth and Product Adoption", "Pipeline Acceleration & Executive Engagement", 
      "Brand Awareness & Top of Funnel Demand Generation", "New Logo Acquisition",
    ];
    const quarterOptions = window.planningModule?.constants?.quarterOptions || [
      "Q1 July", "Q1 August", "Q1 September", "Q2 October", "Q2 November", "Q2 December",
      "Q3 January", "Q3 February", "Q3 March", "Q4 April", "Q4 May", "Q4 June",
    ];
    const names = window.planningModule?.constants?.names || [
      "Shruti Narang", "Beverly Leung", "Giorgia Parham", "Tomoko Tanaka",
    ];
    const revenuePlayOptions = window.planningModule?.constants?.revenuePlayOptions || [
      "New Logo Acquisition", "Account Expansion", "Customer Retention", "Cross-sell/Upsell", "Market Development", "Partner Channel",
    ];
    const countryOptions = window.planningModule?.constants?.countryOptions || [
      "Afghanistan", "Australia", "Bangladesh", "Bhutan", "Brunei Darussalam", "Cambodia", "China", "Hong Kong", "India", "Indonesia", "Japan", 
      "Lao People's Democratic Republic", "Malaysia", "Maldives", "Myanmar", "Nepal", "New Zealand", "Pakistan", "Philippines", "Singapore", 
      "South Korea", "Sri Lanka", "Taiwan", "Thailand", "Vietnam"
    ];

    // Get execution data for dynamic filter population
    const executionData = executionTableInstance?.getData() || [];
    
    // Extract unique values from actual data
    const uniqueOwners = executionData.length > 0 ? 
      Array.from(new Set(executionData.map((c) => c.owner).filter(Boolean))).sort() : 
      [];
    const uniqueRevenuePlays = executionData.length > 0 ? 
      Array.from(new Set(executionData.map((c) => c.revenuePlay).filter(Boolean))).sort() : 
      [];
    const uniqueCountries = executionData.length > 0 ? 
      Array.from(new Set(executionData.map((c) => c.country).filter(Boolean))).sort() : 
      [];

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

    // Populate with dynamic data when available, fallback to static data
    populateSelectFast(regionSelect, regionOptions, 'Regions');
    populateSelectFast(quarterSelect, quarterOptions, 'Quarters');
    populateSelectFast(statusSelect, statusOptions, 'Statuses');
    populateSelectFast(programTypeSelect, programTypes, 'Program Types');
    populateSelectFast(strategicPillarSelect, strategicPillars, 'Strategic Pillars');
    populateSelectFast(ownerSelect, uniqueOwners.length > 0 ? uniqueOwners : names, 'Owners');
    populateSelectFast(revenuePlaySelect, uniqueRevenuePlays.length > 0 ? uniqueRevenuePlays : revenuePlayOptions, 'Revenue Plays');
    populateSelectFast(countrySelect, uniqueCountries.length > 0 ? uniqueCountries : countryOptions, 'Countries');

    // Initialize Digital Motions button
    if (!digitalMotionsButton.hasAttribute("data-active")) {
      digitalMotionsButton.dataset.active = "false";
      updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);
    }

    // Initialize multiselects immediately
    const selectElements = [
      regionSelect, quarterSelect, statusSelect, 
      programTypeSelect, strategicPillarSelect, ownerSelect,
      revenuePlaySelect, countrySelect
    ].filter(Boolean);

    selectElements.forEach(select => {
      if (!select._multiselectContainer) {
        try {
          createExecutionMultiselect(select);
        } catch (e) {
          console.warn("Failed to initialize execution multiselect for", select.id, e);
        }
      }
    });

    console.log("✅ Execution filters pre-populated successfully");
  });
}

// Function to populate execution filter dropdowns (optimized)
function populateExecutionFilterDropdowns(regionOptions, quarterOptions, statusOptions, programTypes, strategicPillars, names, revenuePlayOptions, countryOptions) {
  console.log("🔧 Populating execution filters...");
  
  // Set placeholder attributes for custom multiselects
  const regionSelect = document.getElementById("executionRegionFilter");
  const quarterSelect = document.getElementById("executionQuarterFilter");
  const statusSelect = document.getElementById("executionStatusFilter");
  const programTypeSelect = document.getElementById("executionProgramTypeFilter");
  const strategicPillarSelect = document.getElementById("executionStrategicPillarFilter");
  const ownerSelect = document.getElementById("executionOwnerFilter");
  const revenuePlaySelect = document.getElementById("executionRevenuePlayFilter");
  const countrySelect = document.getElementById("executionCountryFilter");

  if (!regionSelect || !quarterSelect || !statusSelect || 
      !programTypeSelect || !strategicPillarSelect || !ownerSelect ||
      !revenuePlaySelect || !countrySelect) {
    console.warn("⚠️ Some execution filter elements not found, retrying in 100ms (reduced delay)");
    setTimeout(() => {
      populateExecutionFilterDropdowns(regionOptions, quarterOptions, statusOptions, programTypes, strategicPillars, names, revenuePlayOptions, countryOptions);
    }, 100); // Reduced from potential longer delays
    return;
  }

  console.log("✅ All execution filter elements found, proceeding with population");

  // Set placeholders with visual feedback
  if (regionSelect) regionSelect.setAttribute('data-placeholder', 'Regions');
  if (quarterSelect) quarterSelect.setAttribute('data-placeholder', 'Quarters');
  if (statusSelect) statusSelect.setAttribute('data-placeholder', 'Statuses');
  if (programTypeSelect) programTypeSelect.setAttribute('data-placeholder', 'Program Types');
  if (strategicPillarSelect) strategicPillarSelect.setAttribute('data-placeholder', 'Strategic Pillars');
  if (ownerSelect) ownerSelect.setAttribute('data-placeholder', 'Owners');

  // Add loading state visual feedback during filter population
  const showFilterLoadingState = (select) => {
    if (select && select.children.length === 0) {
      const loadingOption = document.createElement("option");
      loadingOption.value = "";
      loadingOption.textContent = "Loading...";
      loadingOption.disabled = true;
      select.appendChild(loadingOption);
    }
  };

  // Show loading state for empty filters
  [regionSelect, quarterSelect, statusSelect, programTypeSelect, strategicPillarSelect, ownerSelect]
    .filter(Boolean).forEach(showFilterLoadingState);

  // Use requestAnimationFrame to populate filters without blocking
  requestAnimationFrame(() => {
    // Clear loading states and populate filters efficiently
    const populateSelect = (select, options, clearFirst = true) => {
      if (!select) return;
      
      if (clearFirst && select.children.length > 0) {
        select.innerHTML = '';
      }
      
      if (select.children.length === 0) {
        options.forEach((optionValue) => {
          const option = document.createElement("option");
          option.value = optionValue;
          option.textContent = optionValue;
          select.appendChild(option);
        });
      }
    };

    // Populate filters in batches to avoid blocking
    populateSelect(regionSelect, regionOptions, true);
    populateSelect(quarterSelect, quarterOptions, true);
    populateSelect(statusSelect, statusOptions, true);
    populateSelect(programTypeSelect, programTypes, true);
    populateSelect(strategicPillarSelect, strategicPillars, true);
    populateSelect(ownerSelect, names, true);

    // Initialize custom multiselects if not already done
    const selectElements = [
      regionSelect, quarterSelect, statusSelect, 
      programTypeSelect, strategicPillarSelect, ownerSelect
    ].filter(Boolean);

    selectElements.forEach(select => {
      if (!select._multiselectContainer) {
        try {
          createExecutionMultiselect(select);
        } catch (e) {
          console.warn("Failed to initialize execution multiselect for", select.id, e);
        }
      }
    });

    console.log("✅ Execution filters populated successfully");
  }); // Close requestAnimationFrame
}

// Helper function to update Digital Motions button visual state
function updateExecutionDigitalMotionsButtonVisual(button) {
  const isActive = button.dataset.active === "true";
  if (isActive) {
    button.classList.add('filter-btn-active');
    button.style.background = "#1a7f37";
    button.style.borderColor = "#1a7f37";
    button.style.color = "white";
    button.innerHTML = '<i class="octicon octicon-rocket" aria-hidden="true"></i> Digital Motions <i class="octicon octicon-check" aria-hidden="true"></i>';
  } else {
    button.classList.remove('filter-btn-active');
    button.style.background = "#2da44e";
    button.style.borderColor = "#2da44e";
    button.style.color = "white";
    button.innerHTML = '<i class="octicon octicon-rocket" aria-hidden="true"></i> Digital Motions';
  }
}

// Setup filter logic for execution tracking
function setupExecutionFilterLogic() {
  // Ensure we have a valid table instance before setting up filters
  if (!executionTableInstance) {
    console.warn(
      "[Execution] Table instance not available yet, retrying in next idle period...",
    );
    
    // Use requestIdleCallback to retry more efficiently
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => setupExecutionFilterLogic(), { timeout: 200 });
    } else {
      setTimeout(setupExecutionFilterLogic, 100);
    }
    return;
  }

  // Batch DOM queries for better performance
  const filterElements = {
    regionSelect: document.getElementById("executionRegionFilter"),
    quarterSelect: document.getElementById("executionQuarterFilter"),
    statusSelect: document.getElementById("executionStatusFilter"),
    programTypeSelect: document.getElementById("executionProgramTypeFilter"),
    strategicPillarSelect: document.getElementById("executionStrategicPillarFilter"),
    ownerSelect: document.getElementById("executionOwnerFilter"),
    revenuePlaySelect: document.getElementById("executionRevenuePlayFilter"),
    countrySelect: document.getElementById("executionCountryFilter"),
    digitalMotionsButton: document.getElementById("executionDigitalMotionsFilter"),
    clearButton: document.getElementById("executionClearFilters")
  };

  const {
    regionSelect,
    quarterSelect,
    statusSelect,
    programTypeSelect,
    strategicPillarSelect,
    ownerSelect,
    revenuePlaySelect,
    countrySelect,
    digitalMotionsButton,
    clearButton
  } = filterElements;

  if (
    !regionSelect ||
    !quarterSelect ||
    !statusSelect ||
    !programTypeSelect ||
    !strategicPillarSelect ||
    !ownerSelect ||
    !digitalMotionsButton
  ) {
    console.warn("[Execution] Required filter elements not found");
    return;
  }

  // Set up filter logic with table instance ready

  // Initialize Digital Motions button state
  if (!digitalMotionsButton.hasAttribute("data-active")) {
    digitalMotionsButton.dataset.active = "false";
  }
  updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);

  // Set up event listeners for all filters (only if not already attached)
  const selectElements = [
    regionSelect,
    quarterSelect,
    statusSelect,
    programTypeSelect,
    strategicPillarSelect,
    ownerSelect,
    revenuePlaySelect,
    countrySelect,
  ];

  // Batch event listener setup to reduce DOM manipulation
  selectElements.forEach((select) => {
    if (!select.hasAttribute("data-listener-attached")) {
      select.addEventListener("change", debounce(applyExecutionFilters, 150));
      select.setAttribute("data-listener-attached", "true");
    }
  });

  // Digital Motions filter button toggle (only attach once)
  if (!digitalMotionsButton.hasAttribute("data-listener-attached")) {
    digitalMotionsButton.addEventListener("click", () => {
      const currentState = digitalMotionsButton.dataset.active;
      const isActive = currentState === "true";
      const newState = !isActive;

      digitalMotionsButton.dataset.active = newState.toString();
      updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);

      applyExecutionFilters();
    });
    digitalMotionsButton.setAttribute("data-listener-attached", "true");
  }

  // Clear filters button
  if (clearButton && !clearButton.hasAttribute("data-listener-attached")) {
    clearButton.addEventListener("click", () => {
      // Batch clear operations to reduce reflow
      requestAnimationFrame(() => {
        // Clear all multiselect values
        selectElements.forEach(select => {
          if (select && select.multiple) {
            // Clear all selected options in multiselect
            Array.from(select.options).forEach(option => {
              option.selected = false;
            });
            
            // Update custom multiselect display if it exists
            if (select._multiselectContainer) {
              const multiselectAPI = select._multiselectAPI;
              if (multiselectAPI) {
                multiselectAPI.setSelectedValues([]);
              }
            }
          } else if (select) {
            select.value = "";
          }
        });
        
        // Reset Digital Motions button
        digitalMotionsButton.dataset.active = "false";
        updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);

        // Clear universal search filters
        universalExecutionSearchFilters = {
          region: [],
          quarter: [],
          status: [],
          programType: [],
          strategicPillar: [],
          owner: [],
          revenuePlay: [],
          country: [],
          fiscalYear: [],
          digitalMotions: false
        };
        
        // Clear universal search display if it exists
        if (window.executionUniversalSearch && typeof window.executionUniversalSearch.clearAllFilters === 'function') {
          window.executionUniversalSearch.clearAllFilters();
        }

        // Clear all table filters first
        if (executionTableInstance) {
          executionTableInstance.clearFilter();
        }

        // Then apply the empty filter state to ensure consistency
        applyExecutionFilters();
      });
    });
    clearButton.setAttribute("data-listener-attached", "true");
  }
}

// Get current filter values for execution tracking
// Store universal search filters globally for execution
let universalExecutionSearchFilters = {
  region: [],
  quarter: [],
  status: [],
  programType: [],
  strategicPillar: [],
  owner: [],
  revenuePlay: [],
  country: [],
  fiscalYear: [],
  digitalMotions: false
};

function getExecutionFilterValues() {
  const digitalMotionsButton = document.getElementById(
    "executionDigitalMotionsFilter",
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
    region: getSelectedValues("executionRegionFilter"),
    quarter: getSelectedValues("executionQuarterFilter"),
    status: getSelectedValues("executionStatusFilter"),
    programType: getSelectedValues("executionProgramTypeFilter"),
    strategicPillar: getSelectedValues("executionStrategicPillarFilter"),
    owner: getSelectedValues("executionOwnerFilter"),
    revenuePlay: getSelectedValues("executionRevenuePlayFilter"),
    country: getSelectedValues("executionCountryFilter"),
    digitalMotions: digitalMotionsActive,
  };

  // Combine dropdown filters with universal search filters
  const filterValues = {
    region: [...new Set([...dropdownFilterValues.region, ...universalExecutionSearchFilters.region])],
    quarter: [...new Set([...dropdownFilterValues.quarter, ...universalExecutionSearchFilters.quarter])],
    status: [...new Set([...dropdownFilterValues.status, ...universalExecutionSearchFilters.status])],
    programType: [...new Set([...dropdownFilterValues.programType, ...universalExecutionSearchFilters.programType])],
    strategicPillar: [...new Set([...dropdownFilterValues.strategicPillar, ...universalExecutionSearchFilters.strategicPillar])],
    owner: [...new Set([...dropdownFilterValues.owner, ...universalExecutionSearchFilters.owner])],
    revenuePlay: [...new Set([...dropdownFilterValues.revenuePlay, ...universalExecutionSearchFilters.revenuePlay])],
    country: [...new Set([...dropdownFilterValues.country, ...universalExecutionSearchFilters.country])],
    digitalMotions: digitalMotionsActive || !!universalExecutionSearchFilters.digitalMotions,
  };

  console.log(
    "[Execution] getExecutionFilterValues - Digital Motions button state:",
    {
      element: !!digitalMotionsButton,
      datasetActive: digitalMotionsButton?.dataset.active,
      digitalMotionsActive,
    },
  );

  if (window.DEBUG_FILTERS || digitalMotionsActive) {
    console.log("[Execution] Combined filters (dropdown + universal search):", filterValues);
    
    // Additional debug for Digital Motions
    if (digitalMotionsActive) {
      console.log("[Execution] Digital Motions filter is ACTIVE - will filter to show only DM campaigns");
    }
  }

  return filterValues;
}

// Apply filters to execution tracking table
function applyExecutionFilters() {
  if (!executionTableInstance) {
    console.warn(
      "[Execution] Table instance not available, cannot apply filters",
    );
    return;
  }

  const filters = getExecutionFilterValues();
  console.log("[Execution] Applying filters:", filters);

  // Debug: Check what fields exist in the execution data
  const executionData = executionTableInstance.getData();
  if (executionData.length > 0) {
    console.log("[Execution] Sample data fields:", Object.keys(executionData[0]));
    console.log("[Execution] Sample row:", executionData[0]);
  }

  // Use requestAnimationFrame to batch DOM operations and reduce forced reflow
  requestAnimationFrame(() => {
    // Batch all filter operations to minimize reflow
    const startTime = performance.now();
    
    try {
      // Clear existing filters first
      executionTableInstance.clearFilter();

      // Apply filters using Tabulator's built-in filter system
      const activeFilters = [];

      // Multi-value filters (arrays)
      if (filters.region.length > 0) {
        activeFilters.push({ field: "region", type: "in", value: filters.region });
      }
      if (filters.status.length > 0) {
        activeFilters.push({ field: "status", type: "in", value: filters.status });
      }
      if (filters.programType.length > 0) {
        activeFilters.push({
          field: "programType",
          type: "in",
          value: filters.programType,
        });
      }
      if (filters.strategicPillar.length > 0) {
        activeFilters.push({
          field: "strategicPillars",
          type: "in",
          value: filters.strategicPillar,
        });
      }
      if (filters.owner.length > 0) {
        activeFilters.push({ field: "owner", type: "in", value: filters.owner });
      }
      if (filters.revenuePlay.length > 0) {
        console.log("[Execution] Adding revenuePlay filter:", filters.revenuePlay);
        activeFilters.push({ field: "revenuePlay", type: "in", value: filters.revenuePlay });
      }
      if (filters.country.length > 0) {
        console.log("[Execution] Adding country filter:", filters.country);
        activeFilters.push({ field: "country", type: "in", value: filters.country });
      }

      // Apply standard filters first (batched)
      if (activeFilters.length > 0) {
        executionTableInstance.setFilter(activeFilters);
      }

      // Add custom filters after standard filters
      if (filters.quarter.length > 0) {
        // Custom quarter filter to handle format mismatch between filter options and data
        // Filter options: "Q1 July", Data format: "Q1 - July"
        executionTableInstance.addFilter(function(data) {
          if (!data.quarter) return false;
          
          return filters.quarter.some(filterQuarter => {
            // Normalize both formats for comparison
            const normalizeQuarter = (q) => q.replace(/\s*-\s*/g, ' ').trim();
            return normalizeQuarter(data.quarter) === normalizeQuarter(filterQuarter);
          });
        });
      }

      // Apply Digital Motions filter separately as a custom function filter
      if (filters.digitalMotions) {
        console.log("[Execution] Applying Digital Motions filter - checking data...");
        
        // Count total rows and DM rows for debugging
        const allData = executionTableInstance.getData();
        const dmCount = allData.filter(row => row.digitalMotions === true || row.digitalMotions === 'true').length;
        console.log(`[Execution] Total rows: ${allData.length}, Digital Motions rows: ${dmCount}`);
        
        // Sample a few DM campaigns for debugging
        const dmSamples = allData.filter(row => row.digitalMotions === true || row.digitalMotions === 'true').slice(0, 3);
        if (dmSamples.length > 0) {
          console.log("[Execution] Sample DM campaigns:", dmSamples.map(r => ({
            id: r.id,
            description: r.description,
            digitalMotions: r.digitalMotions
          })));
        }
        
        executionTableInstance.addFilter(function (data) {
          // Handle both boolean true and string 'true' values for digitalMotions
          const isDM = data.digitalMotions === true || data.digitalMotions === 'true';
          if (isDM) {
            console.log(`[Execution] Including DM campaign: ${data.description || data.id}`, data.digitalMotions);
          }
          return isDM;
        });
      }

      // Get visible rows count efficiently
      const visibleRows = executionTableInstance.getDataCount(true);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log("[Execution] Filters applied in", duration.toFixed(2), "ms, showing", visibleRows, "rows");

      // Show helpful message when Digital Motions filter is active
      if (filters.digitalMotions) {
        console.log("[Execution] Digital Motions filter is active - showing only campaigns with Digital Motions enabled");
      }
      
    } catch (error) {
      console.error("[Execution] Error applying filters:", error);
    }
  });
}

// Initialize execution filters when execution grid is ready
function initializeExecutionFilters() {
  // Wait a bit for the execution grid to be initialized
  setTimeout(() => {
    setupExecutionFilters();
  }, 500);
}

// SYNC GRID FUNCTIONALITY
function syncGridsOnEdit(sourceTable, targetTable) {
  sourceTable.on("cellEdited", function (cell) {
    const rowData = cell.getRow().getData();
    // Find the matching row in the target table by unique id
    let match;
    if (rowData.id) {
      match = targetTable.getRows().find((r) => r.getData().id === rowData.id);
    } else {
      match = targetTable
        .getRows()
        .find((r) => r.getData().id === rowData.id);
    }
    if (match) {
      match.update({ ...rowData });
    }
  });
}

// Sync digital motions data from planning table to execution table
function syncDigitalMotionsFromPlanning() {
  if (!executionTableInstance || !window.planningModule?.tableInstance) {
    console.log("[Execution] Sync skipped - missing table instances");
    return;
  }

  const planningData = window.planningModule.tableInstance.getData();
  const executionData = executionTableInstance.getData();

  let updatedCount = 0;
  let checkedCount = 0;
  let dmCampaignsFound = 0;
  
  console.log(`[Execution] Syncing Digital Motions data: ${planningData.length} planning rows, ${executionData.length} execution rows`);

  // First, count how many Digital Motions campaigns exist in planning
  const planningDMCount = planningData.filter(row => row.digitalMotions === true || row.digitalMotions === 'true').length;
  console.log(`[Execution] Planning has ${planningDMCount} Digital Motions campaigns`);

  // Update execution table with digitalMotions values from planning table
  executionData.forEach((execRow) => {
    checkedCount++;
    
    // Try multiple matching strategies
    const planningRow = planningData.find((planRow) => {
      // Primary: Match by ID
      if (planRow.id && execRow.id && planRow.id === execRow.id) {
        return true;
      }
      // Secondary: Match by description + programType (if ID matching fails)
      if (planRow.description && execRow.description && 
          planRow.programType && execRow.programType &&
          planRow.description === execRow.description && 
          planRow.programType === execRow.programType) {
        return true;
      }
      return false;
    });

    if (planningRow) {
      // Check if digitalMotions value is different
      const planningDM = planningRow.digitalMotions === true || planningRow.digitalMotions === 'true';
      const executionDM = execRow.digitalMotions === true || execRow.digitalMotions === 'true';
      
      if (planningDM) dmCampaignsFound++;
      
      if (planningDM !== executionDM) {
        // Find the row in the execution table and update it
        const execTableRow = executionTableInstance.getRows().find((row) => {
          const rowData = row.getData();
          return (
            (rowData.id && rowData.id === execRow.id) ||
            (rowData.description === execRow.description && rowData.programType === execRow.programType)
          );
        });

        if (execTableRow) {
          execTableRow.update({ digitalMotions: planningRow.digitalMotions });
          updatedCount++;
          console.log(`[Execution] Updated Digital Motions for ${execRow.id || execRow.description}: ${planningRow.digitalMotions}`);
        }
      }
    }
  });
  
  console.log(`[Execution] Digital Motions sync complete: ${updatedCount} rows updated out of ${checkedCount} checked`);
  console.log(`[Execution] Found ${dmCampaignsFound} Digital Motions campaigns in matched rows`);
  
  // Final verification
  const finalExecutionDMCount = executionTableInstance.getData().filter(row => 
    row.digitalMotions === true || row.digitalMotions === 'true'
  ).length;
  console.log(`[Execution] Final execution table has ${finalExecutionDMCount} Digital Motions campaigns`);
}

// Test function to check Digital Motions data
function testDigitalMotionsData() {
  console.log("🔍 TESTING Digital Motions Data in Execution Table");
  console.log("================================================");
  
  if (!executionTableInstance) {
    console.log("❌ Execution table not available");
    return;
  }
  
  const allData = executionTableInstance.getData();
  console.log(`📊 Total execution rows: ${allData.length}`);
  
  // Check for digitalMotions field presence
  const rowsWithDMField = allData.filter(row => row.hasOwnProperty('digitalMotions'));
  console.log(`📊 Rows with digitalMotions field: ${rowsWithDMField.length}`);
  
  // Check for true Digital Motions campaigns
  const dmTrue = allData.filter(row => row.digitalMotions === true);
  const dmStringTrue = allData.filter(row => row.digitalMotions === 'true');
  const dmFalse = allData.filter(row => row.digitalMotions === false);
  const dmStringFalse = allData.filter(row => row.digitalMotions === 'false');
  const dmUndefined = allData.filter(row => row.digitalMotions === undefined || row.digitalMotions === null);
  
  console.log(`🚀 digitalMotions === true: ${dmTrue.length}`);
  console.log(`🚀 digitalMotions === 'true': ${dmStringTrue.length}`);
  console.log(`❌ digitalMotions === false: ${dmFalse.length}`);
  console.log(`❌ digitalMotions === 'false': ${dmStringFalse.length}`);
  console.log(`❓ digitalMotions undefined/null: ${dmUndefined.length}`);
  
  // Sample some data
  if (dmTrue.length > 0) {
    console.log("Sample DM (boolean true) campaign:", dmTrue[0]);
  }
  if (dmStringTrue.length > 0) {
    console.log("Sample DM (string 'true') campaign:", dmStringTrue[0]);
  }
  
  // Check a few random samples for their digitalMotions values
  const samples = allData.slice(0, 5);
  console.log("First 5 rows digitalMotions values:");
  samples.forEach((row, index) => {
    console.log(`  Row ${index}: ${row.description || row.id} -> digitalMotions: ${row.digitalMotions} (type: ${typeof row.digitalMotions})`);
  });
  
  console.log("================================================");
}

// Make test function globally available
window.testDigitalMotionsData = testDigitalMotionsData;

// Main function to populate execution filters with actual data (called after data is loaded)
function populateExecutionFilters() {
  console.log("🔧 Populating execution filters with actual data...");
  
  const regionSelect = document.getElementById("executionRegionFilter");
  const quarterSelect = document.getElementById("executionQuarterFilter");
  const statusSelect = document.getElementById("executionStatusFilter");
  const programTypeSelect = document.getElementById("executionProgramTypeFilter");
  const strategicPillarSelect = document.getElementById("executionStrategicPillarFilter");
  const ownerSelect = document.getElementById("executionOwnerFilter");
  const revenuePlaySelect = document.getElementById("executionRevenuePlayFilter");
  const countrySelect = document.getElementById("executionCountryFilter");
  const digitalMotionsButton = document.getElementById("executionDigitalMotionsFilter");

  if (!regionSelect || !quarterSelect || !statusSelect || 
      !programTypeSelect || !strategicPillarSelect || !ownerSelect || 
      !revenuePlaySelect || !countrySelect || !digitalMotionsButton) {
    console.warn("⚠️ Some execution filter elements not found, retrying in 100ms");
    setTimeout(populateExecutionFilters, 100);
    return;
  }

  console.log("✅ All execution filter elements found, proceeding with population");

  // Get execution data for dynamic filter population
  const executionData = executionTableInstance?.getData() || [];
  
  // Debug: Log the actual data structure
  console.log("[Execution] Execution data count:", executionData.length);
  if (executionData.length > 0) {
    console.log("[Execution] Sample execution data fields:", Object.keys(executionData[0]));
    console.log("[Execution] Sample execution data:", executionData[0]);
    
    // Debug: Show the actual country and revenuePlay values in the data
    executionData.forEach((row, index) => {
      console.log(`[Execution] Row ${index + 1}: country="${row.country}", revenuePlay="${row.revenuePlay}"`);
    });
  }
  
  // Extract unique values from actual data
  const uniqueOwners = executionData.length > 0 ? 
    Array.from(new Set(executionData.map((c) => c.owner).filter(Boolean))).sort() : 
    [];
  const uniqueRevenuePlays = executionData.length > 0 ? 
    Array.from(new Set(executionData.map((c) => c.revenuePlay).filter(Boolean))).sort() : 
    [];
  const uniqueCountries = executionData.length > 0 ? 
    Array.from(new Set(executionData.map((c) => c.country).filter(Boolean))).sort() : 
    [];

  // Get static options for fallback
  const regionOptions = window.planningModule?.constants?.regionOptions || ["JP & Korea", "South APAC", "SAARC"];
  const quarterOptions = window.planningModule?.constants?.quarterOptions || [];
  const statusOptions = window.planningModule?.constants?.statusOptions || [];
  const programTypes = window.planningModule?.constants?.programTypes || [];
  const strategicPillars = window.planningModule?.constants?.strategicPillars || [];
  const names = window.planningModule?.constants?.names || [];
  const revenuePlayOptions = window.planningModule?.constants?.revenuePlayOptions || [];
  const countryOptions = window.planningModule?.constants?.countryOptions || [];

  // Helper function to repopulate a select with new options
  const repopulateSelect = (select, options, clearFirst = true) => {
    if (clearFirst) {
      select.innerHTML = '';
    }
    
    options.forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
  };

  // Use requestAnimationFrame to populate filters without blocking
  requestAnimationFrame(() => {
    // Repopulate filters with actual data
    repopulateSelect(regionSelect, regionOptions, true);
    repopulateSelect(quarterSelect, quarterOptions.map(q => q.replace(/\s*-\s*/g, ' ').trim()), true);
    repopulateSelect(statusSelect, statusOptions, true);
    repopulateSelect(programTypeSelect, programTypes, true);
    repopulateSelect(strategicPillarSelect, strategicPillars, true);
    repopulateSelect(ownerSelect, uniqueOwners.length > 0 ? uniqueOwners : names, true);
    repopulateSelect(revenuePlaySelect, uniqueRevenuePlays.length > 0 ? uniqueRevenuePlays : revenuePlayOptions, true);
    repopulateSelect(countrySelect, uniqueCountries.length > 0 ? uniqueCountries : countryOptions, true);

    // Update multiselects if they exist
    const selectElements = [
      regionSelect, quarterSelect, statusSelect, 
      programTypeSelect, strategicPillarSelect, ownerSelect,
      revenuePlaySelect, countrySelect
    ];

    selectElements.forEach(select => {
      if (select._multiselectContainer) {
        // Refresh the multiselect
        const container = select._multiselectContainer;
        const parent = container.parentNode;
        parent.removeChild(container);
        select._multiselectContainer = null;
        
        // Use planning module's createMultiselect if available
        if (window.planningModule && typeof window.planningModule.createMultiselect === 'function') {
          window.planningModule.createMultiselect(select);
        }
      } else {
        // Use planning module's createMultiselect if available
        if (window.planningModule && typeof window.planningModule.createMultiselect === 'function') {
          window.planningModule.createMultiselect(select);
        }
      }
    });

    console.log("✅ Execution filters populated successfully with actual data");
  });
}

// EXPORT EXECUTION MODULE FUNCTIONS
window.executionModule = {
  initExecutionGrid,
  setupExecutionSave,
  setupExecutionFilters,
  prePopulateExecutionFilters, // Add pre-population function
  populateExecutionFilters, // Add main filter population function
  syncGridsOnEdit,
  applyExecutionFilters,
  getExecutionFilterValues,
  initializeExecutionFilters,
  syncDigitalMotionsFromPlanning,
  initializeExecutionUniversalSearch,
  updateExecutionSearchData,
  // Multiselect functions
  createExecutionMultiselect,
  closeAllExecutionMultiselects,
};

// Export the execution table instance getter
Object.defineProperty(window.executionModule, "tableInstance", {
  get: function () {
    return executionTableInstance;
  },
});

// Universal Search Implementation

function initializeExecutionUniversalSearch() {
  console.log("🔍 EXECUTION: Starting universal search initialization...");
  
  // Check if there's already a valid instance running
  if (window.executionUniversalSearch && 
      !(window.executionUniversalSearch instanceof HTMLElement) &&
      typeof window.executionUniversalSearch.updateData === 'function') {
    console.log("✅ EXECUTION: Universal search already properly initialized, skipping");
    return;
  }
  
  // Check if UniversalSearchFilter class is available
  if (!window.UniversalSearchFilter) {
    console.error("❌ EXECUTION: UniversalSearchFilter class not found!");
    console.log("Available on window:", Object.keys(window).filter(k => k.includes('Search') || k.includes('Universal')));
    // Retry after a short delay
    setTimeout(() => {
      if (window.UniversalSearchFilter) {
        initializeExecutionUniversalSearch();
      }
    }, 100);
    return;
  }
  
  console.log("✅ EXECUTION: UniversalSearchFilter class found");
  
  // Check if container exists
  const container = document.getElementById('executionUniversalSearch');
  if (!container) {
    console.error("❌ EXECUTION: Container 'executionUniversalSearch' not found in DOM!");
    console.log("Available elements with 'execution' in id:", Array.from(document.querySelectorAll('[id*="execution"]')).map(el => el.id));
    // Retry after a short delay
    setTimeout(() => {
      const retryContainer = document.getElementById('executionUniversalSearch');
      if (retryContainer) {
        initializeExecutionUniversalSearch();
      }
    }, 100);
    return;
  }
  
  console.log("✅ EXECUTION: Container found:", container);
  console.log("✅ EXECUTION: Container visible:", container.offsetParent !== null);
  
  try {
    // Debug: Check if UniversalSearchFilter constructor is working properly
    console.log("🔧 EXECUTION: Creating universal search with constructor:", window.UniversalSearchFilter);
    console.log("🔧 EXECUTION: Constructor prototype:", window.UniversalSearchFilter.prototype);
    
    // Clear any existing instance first
    if (window.executionUniversalSearch) {
      console.log("🔄 EXECUTION: Clearing existing universal search instance");
      window.executionUniversalSearch = null;
    }
    
    // Initialize universal search for execution
    console.log("🔧 EXECUTION: About to create new UniversalSearchFilter...");
    window.executionUniversalSearch = new window.UniversalSearchFilter(
      'executionUniversalSearch',
      {
        onFilterChange: (selectedFilters) => {
          console.log("🔄 EXECUTION: Search filters changed:", selectedFilters);
          applyExecutionSearchFilters(selectedFilters);
        }
      }
    );
    
    console.log("🔧 EXECUTION: Created object immediately after constructor:", window.executionUniversalSearch);
    console.log("🔧 EXECUTION: Constructor result type:", typeof window.executionUniversalSearch);
    console.log("🔧 EXECUTION: Constructor result is object:", typeof window.executionUniversalSearch === 'object');
    console.log("🔧 EXECUTION: Constructor result is HTMLElement:", window.executionUniversalSearch instanceof HTMLElement);
    
    // Verify the created object has the expected methods
    if (!window.executionUniversalSearch || typeof window.executionUniversalSearch.updateData !== 'function') {
      console.error("❌ EXECUTION: Universal search object creation failed - missing updateData method");
      console.log("❌ EXECUTION: Available methods on created object:", Object.getOwnPropertyNames(window.executionUniversalSearch || {}));
      console.log("❌ EXECUTION: Prototype methods:", window.executionUniversalSearch ? Object.getOwnPropertyNames(Object.getPrototypeOf(window.executionUniversalSearch)) : 'null');
      throw new Error("Universal search object creation failed - missing updateData method");
    }
    
    // Debug: Check the created object
    console.log("🔧 EXECUTION: Created object:", window.executionUniversalSearch);
    console.log("🔧 EXECUTION: Object methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(window.executionUniversalSearch)));
    console.log("🔧 EXECUTION: updateData method exists:", typeof window.executionUniversalSearch.updateData);

    console.log("✅ EXECUTION: Universal search initialized successfully!");
    
    // Update search data with current execution data - add delay like planning module
    setTimeout(() => {
      // Only update if the universal search was created successfully
      if (window.executionUniversalSearch && typeof window.executionUniversalSearch.updateData === 'function') {
        updateExecutionSearchData();
      } else {
        console.warn("⚠️ EXECUTION: Universal search not properly initialized, skipping initial data update");
      }
    }, 200); // Increased delay to ensure everything is ready
    
  } catch (error) {
    console.error("❌ EXECUTION: Error initializing universal search:", error);
    console.error("❌ EXECUTION: Error stack:", error.stack);
  }
}

function updateExecutionSearchData() {
  console.log("📊 EXECUTION: Updating search data...");
  
  if (!window.executionUniversalSearch) {
    console.log("⏳ EXECUTION: Universal search not initialized yet, skipping update");
    return;
  }
  
  // Check for valid universal search object
  if (window.executionUniversalSearch instanceof HTMLElement ||
      typeof window.executionUniversalSearch.updateData !== 'function') {
    console.warn("⚠️ EXECUTION: Invalid universal search object detected, skipping update");
    console.log("EXECUTION: Current object:", window.executionUniversalSearch);
    console.log("EXECUTION: Object type:", typeof window.executionUniversalSearch);
    console.log("EXECUTION: Is HTMLElement:", window.executionUniversalSearch instanceof HTMLElement);
    console.log("EXECUTION: Is UniversalSearchFilter:", window.executionUniversalSearch instanceof window.UniversalSearchFilter);
    console.log("EXECUTION: Constructor name:", window.executionUniversalSearch?.constructor?.name);
    console.log("EXECUTION: updateData type:", typeof window.executionUniversalSearch?.updateData);
    console.log("EXECUTION: Available methods:", window.executionUniversalSearch ? Object.getOwnPropertyNames(window.executionUniversalSearch) : 'null');
    return;
  }
  
  // Get table instance with multiple fallback options
  let tableInstance = executionTableInstance || window.executionModule?.tableInstance || window.executionTableInstance;
  
  if (!tableInstance) {
    console.warn("⚠️ EXECUTION: No execution table instance available, retrying...");
    
    // Implement exponential backoff retry (try 3 times with increasing delays)
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 200;
    
    const retryUpdate = () => {
      retryCount++;
      const delay = baseDelay * Math.pow(2, retryCount - 1); // 200ms, 400ms, 800ms
      
      setTimeout(() => {
        tableInstance = executionTableInstance || window.executionModule?.tableInstance || window.executionTableInstance;
        
        if (tableInstance) {
          console.log(`✅ EXECUTION: Table instance found on retry ${retryCount}, updating search data`);
          updateExecutionSearchData();
        } else if (retryCount < maxRetries) {
          console.warn(`⚠️ EXECUTION: Table instance still not available (retry ${retryCount}/${maxRetries}), trying again...`);
          retryUpdate();
        } else {
          console.warn(`⚠️ EXECUTION: Table instance still not available after ${maxRetries} retries, giving up search data update`);
        }
      }, delay);
    };
    
    retryUpdate();
    return;
  }
  
  // Use requestIdleCallback for non-blocking data processing
  const processData = () => {
    try {
      const startTime = performance.now();
      const executionData = tableInstance.getData();
      console.log("📈 EXECUTION: Creating filter options from", executionData.length, "execution records");
      
      // Get filter options from planning module constants
      const regionOptions = window.planningModule?.constants?.regionOptions || [];
      const quarterOptions = window.planningModule?.constants?.quarterOptions || [];
      const statusOptions = window.planningModule?.constants?.statusOptions || [];
      const programTypes = window.planningModule?.constants?.programTypes || [];
      const strategicPillars = window.planningModule?.constants?.strategicPillars || [];
      const fyOptions = window.planningModule?.constants?.fyOptions || [];
      
      // Get unique owners from actual data
      const uniqueOwners = Array.from(
        new Set(executionData.map((c) => c.owner).filter(Boolean)),
      ).sort();
      
      // Get unique revenue plays from actual data
      const uniqueRevenuePlays = Array.from(
        new Set(executionData.map((c) => c.revenuePlay).filter(Boolean)),
      ).sort();
      
      // Get unique countries from actual data
      const uniqueCountries = Array.from(
        new Set(executionData.map((c) => c.country).filter(Boolean)),
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
          id: `strategicPillar_${pillar}`,
          title: pillar,
          category: 'strategicPillar',
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
      
      // Add revenue play filters (from actual data)
      uniqueRevenuePlays.forEach(revenuePlay => {
        searchData.push({
          id: `revenuePlay_${revenuePlay}`,
          title: revenuePlay,
          category: 'revenuePlay',
          value: revenuePlay,
          description: `Filter by ${revenuePlay}`,
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

      // Update universal search with processed data
      window.executionUniversalSearch.updateData(searchData);
      
      const processingTime = performance.now() - startTime;
      console.log("✅ EXECUTION: Search data updated with", searchData.length, "filter options in", processingTime.toFixed(1), "ms");
      
    } catch (error) {
      console.error("❌ EXECUTION: Error updating search data:", error);
      console.error("❌ EXECUTION: Error stack:", error.stack);
    }
  };
  
  // Use requestIdleCallback if available, otherwise use setTimeout
  if (window.requestIdleCallback) {
    window.requestIdleCallback(processData, { timeout: 100 });
  } else {
    setTimeout(processData, 0);
  }
}

function applyExecutionSearchFilters(selectedFilters) {
  console.log("🎯 EXECUTION: Applying search filters:", selectedFilters);
  
  if (!executionTableInstance) {
    console.warn("⚠️ EXECUTION: Execution table instance not available");
    return;
  }
  
  try {
    // Reset universal search filters (include digitalMotions)
    universalExecutionSearchFilters = {
      region: [],
      quarter: [],
      status: [],
      programType: [],
      strategicPillar: [],
      owner: [],
      fiscalYear: [],
      digitalMotions: false
    };
    
    // selectedFilters is an object with categories as keys and arrays as values
    // e.g., { region: ['SAARC'], status: ['Planning'] }
    if (selectedFilters && typeof selectedFilters === 'object') {
      Object.entries(selectedFilters).forEach(([category, values]) => {
        if (category === 'digitalMotions') {
          // Handle digitalMotions as boolean (values will be array with 'true' or empty)
          universalExecutionSearchFilters.digitalMotions = Array.isArray(values) && values.includes('true');
        } else if (universalExecutionSearchFilters.hasOwnProperty(category) && Array.isArray(values)) {
          universalExecutionSearchFilters[category] = [...values];
        }
      });
    }
    
    console.log("🔍 EXECUTION: Universal search filters updated:", universalExecutionSearchFilters);
    
    // Apply filters using the main execution filter system
    applyExecutionFilters();
    
  } catch (error) {
    console.error("❌ EXECUTION: Error applying search filters:", error);
  }
}

// Quarter normalization function for execution tab
function normalizeQuarter(quarter) {
  if (!quarter || typeof quarter !== 'string') return quarter;
  return quarter.replace(/\s*-\s*/, ' ');
}
if (window.tabManager) {
  window.tabManager.registerTab(
    'execution',
    async () => {
      // Tab initialization callback with performance optimization
      console.log("🎯 Initializing execution tab via TabManager");
      
      // Use requestIdleCallback for better performance
      const initializeWithIdleCallback = (callback) => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(callback, { timeout: 100 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(callback, 0);
        }
      };
      
      // Only initialize if not already done by app.js
      if (!executionTableInstance) {
        console.log("🔧 EXECUTION: Table not initialized, creating with empty data...");
        
        // Split initialization into smaller chunks to prevent blocking
        await new Promise(resolve => {
          initializeWithIdleCallback(() => {
            const emptyData = [];
            initExecutionGrid(emptyData);
            resolve();
          });
        });
        
        // Setup filters in next idle period
        await new Promise(resolve => {
          initializeWithIdleCallback(() => {
            setupExecutionFilters();
            resolve();
          });
        });
      } else {
        console.log("✅ EXECUTION: Table already initialized, setting up filters only...");
        
        // Setup filters asynchronously
        await new Promise(resolve => {
          initializeWithIdleCallback(() => {
            setupExecutionFilters();
            resolve();
          });
        });
      }
      
      // Sync data from planning if available (in next idle period)
      if (window.planningModule?.tableInstance) {
        console.log("🔄 EXECUTION: Syncing data from planning...");
        initializeWithIdleCallback(() => {
          syncDigitalMotionsFromPlanning();
        });
      }
      
      // Initialize universal search in final idle period
      initializeWithIdleCallback(() => {
        initializeExecutionUniversalSearch();
      });
    },
    async () => {
      // Tab cleanup callback
      console.log("🧹 Cleaning up execution tab via TabManager");
      if (window.executionUniversalSearch) {
        window.executionUniversalSearch.destroy();
      }
    }
  );
  console.log("✅ Execution tab registered with TabManager");
} else {
  // Fallback: Initialize when explicitly needed
  console.log("🎯 TabManager not available, execution will initialize on demand");
  
  // Store fallback initialization function for later use
  window.executionModule.initializeFallback = async () => {
    try {
      console.log("🔧 EXECUTION: Initializing via fallback...");
      
      if (!executionTableInstance) {
        const emptyData = [];
        initExecutionGrid(emptyData);
        setupExecutionFilters();
        
        // Sync data from planning if available
        if (window.planningModule?.tableInstance) {
          syncDigitalMotionsFromPlanning();
        }
        
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          initializeExecutionUniversalSearch();
        }, 100);
      }
      
      console.log("✅ Execution tab initialized via fallback");
    } catch (error) {
      console.error("❌ Failed to initialize execution tab:", error);
    }
  };
}

// Add a safety initialization when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if execution tab is currently active and universal search isn't initialized
    if (window.location.hash === '#execution' && 
        (!window.executionUniversalSearch || 
         window.executionUniversalSearch instanceof HTMLElement ||
         typeof window.executionUniversalSearch.updateData !== 'function')) {
      console.log("🔄 EXECUTION: Safety initialization on DOMContentLoaded");
      setTimeout(() => {
        initializeExecutionUniversalSearch();
      }, 100);
    }
  });
} else {
  // Document already loaded, check if we need to initialize
  if (window.location.hash === '#execution' && 
      (!window.executionUniversalSearch || 
       window.executionUniversalSearch instanceof HTMLElement ||
       typeof window.executionUniversalSearch.updateData !== 'function')) {
    console.log("🔄 EXECUTION: Safety initialization - document already ready");
    setTimeout(() => {
      initializeExecutionUniversalSearch();
    }, 100);
  }
}

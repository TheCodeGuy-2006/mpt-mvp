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
  // Get constants from planning module for consistency
  const statusOptions = window.planningModule?.constants?.statusOptions || [
    "Planning",
    "On Track",
    "Shipped",
    "Cancelled",
  ];
  const yesNo = window.planningModule?.constants?.yesNo || ["Yes", "No"];

  // Performance optimizations for large datasets
  const performanceConfig = {
    // Use pagination for better performance and user experience
    pagination: "local",
    paginationSize: 25,
    paginationSizeSelector: [25, 50, 100],
    paginationCounter: "rows",
    
    // Disable conflicting features - cannot use virtualDom with pagination
    virtualDom: false,
    progressiveLoad: false,
    
    // Use basic horizontal rendering to avoid scroll violations
    renderHorizontal: "basic",
    
    // Disable expensive features for large datasets
    invalidOptionWarnings: false,
    autoResize: false,
    responsiveLayout: false,
    
    // Reduce column calculations
    columnCalcs: false,
    
    // Improve scroll performance
    scrollToRowPosition: "top",
    scrollToColumnPosition: "left",
  };

  const table = new Tabulator("#executionGrid", {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    layout: "fitColumns",
    ...performanceConfig,
    initialSort: [
      { column: "quarter", dir: "asc" }, // Sort by quarter for logical order
    ],
    
    // Add safer scroll configuration
    scrollToRowIfVisible: false, // Prevent automatic scrolling issues
    
    // Add error handling for table operations
    tableBuilt: function() {
      setTimeout(() => {
        try {
          this.redraw(true);
        } catch (e) {
          console.warn("Error in execution table built callback:", e.message);
        }
      }, 100);
    },
    rowFormatter: function (row) {
      // Visual indicator for shipped
      if (row.getData().status === "Shipped") {
        row.getElement().style.background = "#e3f2fd";
      } else {
        row.getElement().style.background = "";
      }
    },
    columns: [
      // Sequential number column
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
        frozen: true, // Keep this column visible when scrolling horizontally
      },
      {
        title: "Program Type",
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

          // Create multi-line informative format
          let html =
            '<div style="padding: 4px; line-height: 1.3; font-size: 12px;">';

          if (region) {
            html += `<div style="font-weight: bold; color: #1976d2;">${region}</div>`;
          }

          if (quarter) {
            html += `<div style="color: #e65100; font-weight: bold; margin-top: 2px;">${quarter}</div>`;
          }

          if (owner) {
            html += `<div style="color: #666; margin-top: 2px;">${owner}</div>`;
          }

          if (programType) {
            html += `<div style="color: #888; font-size: 11px; margin-top: 2px;">${programType}</div>`;
          }

          if (description) {
            html += `<div style="color: #333; margin-top: 2px; word-wrap: break-word;">${description}</div>`;
          }

          html += "</div>";
          return html;
        },
      },
      {
        title: "Status",
        field: "status",
        editor: "list",
        editorParams: { values: statusOptions },
        cellEdited: debounce((cell) => {
          cell.getRow().getData().__modified = true;
        }, 500),
      },
      {
        title: "PO Raised",
        field: "poRaised",
        editor: "list",
        editorParams: { values: yesNo },
        cellEdited: debounce((cell) => {
          cell.getRow().getData().__modified = true;
        }, 500),
      },
      {
        title: "Forecasted Cost",
        field: "forecastedCost",
        editor: false,
        formatter: function (cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        },
      },
      {
        title: "Actual Cost",
        field: "actualCost",
        editor: "number",
        formatter: function (cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        },
        cellEdited: debounce((cell) => {
          cell.getRow().getData().__modified = true;
        }, 500),
      },
      { title: "Expected Leads", field: "expectedLeads" },
      {
        title: "Actual Leads",
        field: "actualLeads",
        editor: "number",
        cellEdited: debounce((cell) => {
          cell.getRow().getData().__modified = true;
        }, 500),
      },
      { title: "MQL", field: "mqlForecast", editable: false },
      {
        title: "Actual MQLs",
        field: "actualMQLs",
        editor: "number",
        cellEdited: debounce((cell) => {
          cell.getRow().getData().__modified = true;
        }, 500),
      },
      { title: "SQL", field: "sqlForecast", editable: false },
      { title: "Opps", field: "oppsForecast", editable: false },
      {
        title: "Pipeline",
        field: "pipelineForecast",
        editable: false,
        formatter: function (cell) {
          const v = cell.getValue();
          if (v === null || v === undefined || v === "") return "";
          return "$" + Number(v).toLocaleString();
        },
      },
    ],
  });

  executionTableInstance = table;
  setupExecutionSave(table, rows);
  
  // Update search data when table is ready
  setTimeout(() => {
    updateExecutionSearchData();
  }, 100);
  
  return table;
}

// EXECUTION SAVE FUNCTIONALITY
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

// Function to populate execution filter dropdowns
function populateExecutionFilterDropdowns(regionOptions, quarterOptions, statusOptions, programTypes, strategicPillars, names) {
  // Set placeholder attributes for custom multiselects
  const regionSelect = document.getElementById("executionRegionFilter");
  const quarterSelect = document.getElementById("executionQuarterFilter");
  const statusSelect = document.getElementById("executionStatusFilter");
  const programTypeSelect = document.getElementById("executionProgramTypeFilter");
  const strategicPillarSelect = document.getElementById("executionStrategicPillarFilter");
  const ownerSelect = document.getElementById("executionOwnerFilter");

  if (regionSelect) regionSelect.setAttribute('data-placeholder', 'Regions');
  if (quarterSelect) quarterSelect.setAttribute('data-placeholder', 'Quarters');
  if (statusSelect) statusSelect.setAttribute('data-placeholder', 'Statuses');
  if (programTypeSelect) programTypeSelect.setAttribute('data-placeholder', 'Program Types');
  if (strategicPillarSelect) strategicPillarSelect.setAttribute('data-placeholder', 'Strategic Pillars');
  if (ownerSelect) ownerSelect.setAttribute('data-placeholder', 'Owners');

  // Region filter
  if (regionSelect && regionSelect.children.length === 0) {
    regionOptions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
  }

  // Quarter filter
  if (quarterSelect && quarterSelect.children.length === 0) {
    quarterOptions.forEach((quarter) => {
      const option = document.createElement("option");
      option.value = quarter;
      option.textContent = quarter;
      quarterSelect.appendChild(option);
    });
  }

  // Status filter
  if (statusSelect && statusSelect.children.length === 0) {
    statusOptions.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusSelect.appendChild(option);
    });
  }

  // Program Type filter
  if (programTypeSelect && programTypeSelect.children.length === 0) {
    programTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      programTypeSelect.appendChild(option);
    });
  }

  // Strategic Pillar filter
  if (strategicPillarSelect && strategicPillarSelect.children.length === 0) {
    strategicPillars.forEach((pillar) => {
      const option = document.createElement("option");
      option.value = pillar;
      option.textContent = pillar;
      strategicPillarSelect.appendChild(option);
    });
  }

  // Owner filter
  if (ownerSelect && ownerSelect.children.length === 0) {
    names.forEach((owner) => {
      const option = document.createElement("option");
      option.value = owner;
      option.textContent = owner;
      ownerSelect.appendChild(option);
    });
  }

  // Initialize custom multiselects if not already done
  const selectElements = [
    regionSelect, quarterSelect, statusSelect, 
    programTypeSelect, strategicPillarSelect, ownerSelect
  ].filter(Boolean);

  selectElements.forEach(select => {
    if (!select._multiselectContainer) {
      createExecutionMultiselect(select);
    }
  });
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

  const filterValues = {
    region: getSelectedValues("executionRegionFilter"),
    quarter: getSelectedValues("executionQuarterFilter"),
    status: getSelectedValues("executionStatusFilter"),
    programType: getSelectedValues("executionProgramTypeFilter"),
    strategicPillar: getSelectedValues("executionStrategicPillarFilter"),
    owner: getSelectedValues("executionOwnerFilter"),
    digitalMotions: digitalMotionsActive,
  };

  console.log(
    "[Execution] getExecutionFilterValues - Digital Motions button state:",
    {
      element: !!digitalMotionsButton,
      datasetActive: digitalMotionsButton?.dataset.active,
      digitalMotionsActive,
    },
  );

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
        executionTableInstance.addFilter(function (data) {
          return data.digitalMotions === true;
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
    return;
  }

  const planningData = window.planningModule.tableInstance.getData();
  const executionData = executionTableInstance.getData();

  let updatedCount = 0;

  // Update execution table with digitalMotions values from planning table
  executionData.forEach((execRow) => {
    const planningRow = planningData.find(
      (planRow) =>
        (planRow.id && planRow.id === execRow.id),
    );

    if (planningRow && planningRow.digitalMotions !== execRow.digitalMotions) {
      // Find the row in the execution table and update it
      const execTableRow = executionTableInstance.getRows().find((row) => {
        const rowData = row.getData();
        return (
          (rowData.id && rowData.id === execRow.id)
        );
      });

      if (execTableRow) {
        execTableRow.update({ digitalMotions: planningRow.digitalMotions });
        updatedCount++;
      }
    }
  });
}

// EXPORT EXECUTION MODULE FUNCTIONS
window.executionModule = {
  initExecutionGrid,
  setupExecutionSave,
  setupExecutionFilters,
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
  
  // Check if UniversalSearchFilter class is available
  if (!window.UniversalSearchFilter) {
    console.error("❌ EXECUTION: UniversalSearchFilter class not found!");
    console.log("Available on window:", Object.keys(window).filter(k => k.includes('Search') || k.includes('Universal')));
    return;
  }
  
  console.log("✅ EXECUTION: UniversalSearchFilter class found");
  
  // Check if container exists
  const container = document.getElementById('executionUniversalSearch');
  if (!container) {
    console.error("❌ EXECUTION: Container 'executionUniversalSearch' not found in DOM!");
    console.log("Available elements with 'execution' in id:", Array.from(document.querySelectorAll('[id*="execution"]')).map(el => el.id));
    return;
  }
  
  console.log("✅ EXECUTION: Container found:", container);
  console.log("✅ EXECUTION: Container visible:", container.offsetParent !== null);
  
  try {
    // Initialize universal search for execution
    window.executionUniversalSearch = new window.UniversalSearchFilter(
      'executionUniversalSearch',
      [],
      (selectedFilters) => {
        console.log("🔄 EXECUTION: Search filters changed:", selectedFilters);
        applyExecutionSearchFilters(selectedFilters);
      }
    );
    
    console.log("✅ EXECUTION: Universal search initialized successfully!");
    
    // Update search data with current execution data
    updateExecutionSearchData();
    
  } catch (error) {
    console.error("❌ EXECUTION: Error initializing universal search:", error);
    console.error("❌ EXECUTION: Error stack:", error.stack);
  }
}

function updateExecutionSearchData() {
  console.log("📊 EXECUTION: Updating search data...");
  
  if (!window.executionUniversalSearch) {
    console.warn("⚠️ EXECUTION: Universal search not initialized yet");
    return;
  }
  
  if (!executionTableInstance) {
    console.warn("⚠️ EXECUTION: Execution table instance not available yet");
    return;
  }
  
  // Use requestIdleCallback for non-blocking data processing
  const processData = () => {
    try {
      const startTime = performance.now();
      const executionData = executionTableInstance.getData();
      console.log("📈 EXECUTION: Processing", executionData.length, "execution records for search");
      
      // Process all data at once but normalize quarters efficiently
      const normalizedData = executionData.map(row => ({
        ...row,
        quarter: normalizeQuarter(row.quarter)
      }));
      
      // Create search data structure for universal search
      const searchData = [];
      normalizedData.forEach(row => {
        // Add searchable fields to search data
        if (row.region) {
          searchData.push({ category: 'region', value: row.region, displayValue: row.region });
        }
        if (row.quarter) {
          searchData.push({ category: 'quarter', value: row.quarter, displayValue: row.quarter });
        }
        if (row.status) {
          searchData.push({ category: 'status', value: row.status, displayValue: row.status });
        }
        if (row.programType) {
          searchData.push({ category: 'programType', value: row.programType, displayValue: row.programType });
        }
        if (row.strategicPillars) {
          searchData.push({ category: 'strategicPillars', value: row.strategicPillars, displayValue: row.strategicPillars });
        }
        if (row.owner) {
          searchData.push({ category: 'owner', value: row.owner, displayValue: row.owner });
        }
        if (row.description) {
          searchData.push({ category: 'description', value: row.description, displayValue: row.description });
        }
      });
      
      // Remove duplicates from search data
      const uniqueSearchData = [];
      const seen = new Set();
      searchData.forEach(item => {
        const key = `${item.category}:${item.value}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueSearchData.push(item);
        }
      });
      
      // Update universal search with processed data
      window.executionUniversalSearch.updateData(uniqueSearchData);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log("✅ EXECUTION: Search data updated successfully in", duration.toFixed(2), "ms");
      console.log("✅ EXECUTION: Created", uniqueSearchData.length, "unique search terms");
      
    } catch (error) {
      console.error("❌ EXECUTION: Error updating search data:", error);
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
    if (selectedFilters.length === 0) {
      // Clear all filters
      executionTableInstance.clearFilter();
      console.log("🧹 EXECUTION: Cleared all filters");
      return;
    }
    
    // Apply filters
    const filters = selectedFilters.map(filter => ({
      field: filter.category,
      type: "=",
      value: filter.value
    }));
    
    executionTableInstance.setFilter(filters);
    console.log("✅ EXECUTION: Applied", filters.length, "filters");
    
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
  console.warn("⚠️ TabManager not available, using direct initialization");
  // Direct initialization if no tab manager - also optimized
  const initializeWithIdleCallback = (callback) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(callback, { timeout: 100 });
    } else {
      setTimeout(callback, 0);
    }
  };
  
  initializeWithIdleCallback(() => {
    if (!executionTableInstance) {
      const emptyData = [];
      initExecutionGrid(emptyData);
      
      initializeWithIdleCallback(() => {
        setupExecutionFilters();
        
        if (window.planningModule?.tableInstance) {
          initializeWithIdleCallback(() => {
            syncDigitalMotionsFromPlanning();
          });
        }
        
        initializeWithIdleCallback(() => {
          initializeExecutionUniversalSearch();
        });
      });
    }
  });
}

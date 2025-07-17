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
    // Virtual DOM for handling large datasets efficiently
    virtualDom: true,
    virtualDomBuffer: 15,
    
    // Pagination to improve initial load
    pagination: "local",
    paginationSize: 25,
    paginationSizeSelector: [10, 25, 50, 100],
    
    // Optimized rendering
    renderHorizontal: "virtual",
    renderVertical: "virtual",
    
    // Disable expensive features for large datasets
    invalidOptionWarnings: false,
    autoResize: false,
    responsiveLayout: false,
    
    // Reduce column calculations
    columnCalcs: false,
  };

  const table = new Tabulator("#executionGrid", {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    layout: "fitColumns",
    ...performanceConfig,
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

          // Create multi-line informative format
          let html =
            '<div style="padding: 4px; line-height: 1.3; font-size: 12px;">';

          if (region) {
            html += `<div style="font-weight: bold; color: #1976d2;">${region}</div>`;
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
  setupExecutionFilters();
  return table;
}

// EXECUTION SAVE FUNCTIONALITY
function setupExecutionSave(table, rows) {
  let btn = document.getElementById("saveExecutionRows");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "saveExecutionRows";
    btn.textContent = "Save";
    btn.style.margin = "12px 0";
    document
      .getElementById("view-execution")
      .insertBefore(btn, document.getElementById("executionGrid"));
  } else {
    btn.textContent = "Save";
  }
  btn.onclick = () => {
    // Save all execution data to planning.json via backend API (same as planning)
    const data = table.getData();
    fetch("http://localhost:3000/save-planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: data }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          alert("Execution data saved to backend!");
        } else {
          alert("Failed to save: " + (result.error || "Unknown error"));
        }
      })
      .catch((err) => {
        alert("Failed to save: " + err.message);
      });
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
  // Region filter
  const regionSelect = document.getElementById("executionRegionFilter");
  if (regionSelect && regionSelect.children.length <= 1) {
    regionOptions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
  }

  // Quarter filter
  const quarterSelect = document.getElementById("executionQuarterFilter");
  if (quarterSelect && quarterSelect.children.length <= 1) {
    quarterOptions.forEach((quarter) => {
      const option = document.createElement("option");
      option.value = quarter;
      option.textContent = quarter;
      quarterSelect.appendChild(option);
    });
  }

  // Status filter
  const statusSelect = document.getElementById("executionStatusFilter");
  if (statusSelect && statusSelect.children.length <= 1) {
    statusOptions.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusSelect.appendChild(option);
    });
  }

  // Program Type filter
  const programTypeSelect = document.getElementById("executionProgramTypeFilter");
  if (programTypeSelect && programTypeSelect.children.length <= 1) {
    programTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      programTypeSelect.appendChild(option);
    });
  }

  // Strategic Pillar filter
  const strategicPillarSelect = document.getElementById("executionStrategicPillarFilter");
  if (strategicPillarSelect && strategicPillarSelect.children.length <= 1) {
    strategicPillars.forEach((pillar) => {
      const option = document.createElement("option");
      option.value = pillar;
      option.textContent = pillar;
      strategicPillarSelect.appendChild(option);
    });
  }

  // Owner filter
  const ownerSelect = document.getElementById("executionOwnerFilter");
  if (ownerSelect && ownerSelect.children.length <= 1) {
    names.forEach((owner) => {
      const option = document.createElement("option");
      option.value = owner;
      option.textContent = owner;
      ownerSelect.appendChild(option);
    });
  }
}

// Helper function to update Digital Motions button visual state
function updateExecutionDigitalMotionsButtonVisual(button) {
  const isActive = button.dataset.active === "true";
  if (isActive) {
    button.style.background = "#1976d2";
    button.style.color = "white";
    button.style.fontWeight = "600";
  } else {
    button.style.background = "white";
    button.style.color = "#1976d2";
    button.style.fontWeight = "500";
  }
}

// Setup filter logic for execution tracking
function setupExecutionFilterLogic() {
  // Ensure we have a valid table instance before setting up filters
  if (!executionTableInstance) {
    console.warn(
      "[Execution] Table instance not available yet, retrying in 100ms...",
    );
    setTimeout(setupExecutionFilterLogic, 100);
    return;
  }

  const regionSelect = document.getElementById("executionRegionFilter");
  const quarterSelect = document.getElementById("executionQuarterFilter");
  const statusSelect = document.getElementById("executionStatusFilter");
  const programTypeSelect = document.getElementById(
    "executionProgramTypeFilter",
  );
  const strategicPillarSelect = document.getElementById(
    "executionStrategicPillarFilter",
  );
  const ownerSelect = document.getElementById("executionOwnerFilter");
  const digitalMotionsButton = document.getElementById(
    "executionDigitalMotionsFilter",
  );
  const clearButton = document.getElementById("executionClearFilters");

  if (
    !regionSelect ||
    !quarterSelect ||
    !statusSelect ||
    !programTypeSelect ||
    !strategicPillarSelect ||
    !ownerSelect ||
    !digitalMotionsButton
  ) {
    return;
  }

  // Set up filter logic with table instance ready

  // Initialize Digital Motions button state
  if (!digitalMotionsButton.hasAttribute("data-active")) {
    digitalMotionsButton.dataset.active = "false";
  }
  updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);

  // Set up event listeners for all filters (only if not already attached)
  [
    regionSelect,
    quarterSelect,
    statusSelect,
    programTypeSelect,
    strategicPillarSelect,
    ownerSelect,
  ].forEach((select) => {
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
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      regionSelect.value = "";
      quarterSelect.value = "";
      statusSelect.value = "";
      programTypeSelect.value = "";
      strategicPillarSelect.value = "";
      ownerSelect.value = "";
      digitalMotionsButton.dataset.active = "false";
      updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);

      // Clear all table filters first
      if (executionTableInstance) {
        executionTableInstance.clearFilter();
      }

      // Then apply the empty filter state to ensure consistency
      applyExecutionFilters();
    });
  }
}

// Get current filter values for execution tracking
function getExecutionFilterValues() {
  const digitalMotionsButton = document.getElementById(
    "executionDigitalMotionsFilter",
  );
  const digitalMotionsActive = digitalMotionsButton?.dataset.active === "true";

  const filterValues = {
    region: document.getElementById("executionRegionFilter")?.value || "",
    quarter: document.getElementById("executionQuarterFilter")?.value || "",
    status: document.getElementById("executionStatusFilter")?.value || "",
    programType:
      document.getElementById("executionProgramTypeFilter")?.value || "",
    strategicPillar:
      document.getElementById("executionStrategicPillarFilter")?.value || "",
    owner: document.getElementById("executionOwnerFilter")?.value || "",
    digitalMotions: digitalMotionsActive,
  };

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

  // Use requestAnimationFrame to reduce forced reflow
  requestAnimationFrame(() => {
    // Clear existing filters first
    executionTableInstance.clearFilter();

    // Apply filters using Tabulator's built-in filter system
    const activeFilters = [];

    // Exact match filters
    if (filters.region) {
      activeFilters.push({ field: "region", type: "=", value: filters.region });
    }
    if (filters.quarter) {
      activeFilters.push({ field: "quarter", type: "=", value: filters.quarter });
    }
    if (filters.status) {
      activeFilters.push({ field: "status", type: "=", value: filters.status });
    }
    if (filters.programType) {
      activeFilters.push({
        field: "programType",
        type: "=",
        value: filters.programType,
      });
    }
    if (filters.strategicPillar) {
      activeFilters.push({
        field: "strategicPillars",
        type: "=",
        value: filters.strategicPillar,
      });
    }
    if (filters.owner) {
      activeFilters.push({ field: "owner", type: "=", value: filters.owner });
    }

    // Apply standard filters first
    if (activeFilters.length > 0) {
      executionTableInstance.setFilter(activeFilters);
    } else {
      executionTableInstance.clearFilter();
    }

    // Apply Digital Motions filter separately as a custom function filter
    if (filters.digitalMotions) {
      executionTableInstance.addFilter(function (data) {
        return data.digitalMotions === true;
      });
    }

    const visibleRows = executionTableInstance.getDataCount(true);
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
};

// Export the execution table instance getter
Object.defineProperty(window.executionModule, "tableInstance", {
  get: function () {
    return executionTableInstance;
  },
});

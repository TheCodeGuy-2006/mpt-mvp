console.log("execution.js loaded");

// EXECUTION TAB MODULE

// Execution table instance
let executionTableInstance = null;

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

  const table = new Tabulator("#executionGrid", {
    data: rows,
    reactiveData: true,
    selectableRows: 1,
    layout: "fitColumns",
    rowFormatter: function (row) {
      // Visual indicator for shipped
      if (row.getData().status === "Shipped") {
        row.getElement().style.background = "#e3f2fd";
      } else {
        row.getElement().style.background = "";
      }
    },
    columns: [
      {
        title: "Campaign Name",
        field: "campaignName",
        editor: false,
        width: 160,
      },
      {
        title: "Details",
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
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
      {
        title: "PO Raised",
        field: "poRaised",
        editor: "list",
        editorParams: { values: yesNo },
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
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
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
      { title: "Expected Leads", field: "expectedLeads" },
      {
        title: "Actual Leads",
        field: "actualLeads",
        editor: "number",
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
      },
      { title: "MQL", field: "mqlForecast", editable: false },
      {
        title: "Actual MQLs",
        field: "actualMQLs",
        editor: "number",
        cellEdited: (cell) => {
          cell.getRow().getData().__modified = true;
        },
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

  console.log("[Execution] Setting up filters with constants:", {
    programTypes: programTypes.length,
    strategicPillars: strategicPillars.length,
    quarterOptions: quarterOptions.length,
    names: names.length,
    regionOptions: regionOptions.length,
    statusOptions: statusOptions.length,
  });

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

  const campaignNameInput = document.getElementById(
    "executionCampaignNameFilter",
  );
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
    !campaignNameInput ||
    !regionSelect ||
    !quarterSelect ||
    !statusSelect ||
    !programTypeSelect ||
    !strategicPillarSelect ||
    !ownerSelect ||
    !digitalMotionsButton
  ) {
    console.error("[Execution] Missing filter elements:", {
      campaignNameInput: !!campaignNameInput,
      regionSelect: !!regionSelect,
      quarterSelect: !!quarterSelect,
      statusSelect: !!statusSelect,
      programTypeSelect: !!programTypeSelect,
      strategicPillarSelect: !!strategicPillarSelect,
      ownerSelect: !!ownerSelect,
      digitalMotionsButton: !!digitalMotionsButton,
    });
    return;
  }

  console.log("[Execution] Setting up filter logic with table instance ready");

  // Initialize Digital Motions button state
  if (!digitalMotionsButton.hasAttribute("data-active")) {
    digitalMotionsButton.dataset.active = "false";
  }
  updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);

  // Set up event listeners for all filters (only if not already attached)
  if (!campaignNameInput.hasAttribute("data-listener-attached")) {
    campaignNameInput.addEventListener("input", applyExecutionFilters);
    campaignNameInput.setAttribute("data-listener-attached", "true");
  }

  [
    regionSelect,
    quarterSelect,
    statusSelect,
    programTypeSelect,
    strategicPillarSelect,
    ownerSelect,
  ].forEach((select) => {
    if (!select.hasAttribute("data-listener-attached")) {
      select.addEventListener("change", applyExecutionFilters);
      select.setAttribute("data-listener-attached", "true");
    }
  });

  // Digital Motions filter button toggle (only attach once)
  if (!digitalMotionsButton.hasAttribute("data-listener-attached")) {
    digitalMotionsButton.addEventListener("click", () => {
      const currentState = digitalMotionsButton.dataset.active;
      const isActive = currentState === "true";
      const newState = !isActive;

      console.log("[Execution] Digital Motions button clicked:", {
        currentState,
        isActive,
        newState,
      });

      digitalMotionsButton.dataset.active = newState.toString();
      updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);

      console.log(
        "[Execution] About to apply filters with Digital Motions state:",
        newState,
      );
      applyExecutionFilters();
    });
    digitalMotionsButton.setAttribute("data-listener-attached", "true");
  }

  // Clear filters button
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      console.log("[Execution] Clearing all filters");
      campaignNameInput.value = "";
      campaignNameInput.value = "";
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
        console.log("[Execution] Cleared table filters");
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
    campaignName:
      document.getElementById("executionCampaignNameFilter")?.value || "",
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

  console.log("[Execution] getExecutionFilterValues:", {
    campaignName: filterValues.campaignName,
    region: filterValues.region,
    quarter: filterValues.quarter,
    status: filterValues.status,
    programType: filterValues.programType,
    strategicPillar: filterValues.strategicPillar,
    owner: filterValues.owner,
    digitalMotions: filterValues.digitalMotions,
    digitalMotionsButtonState: digitalMotionsButton?.dataset.active,
  });

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

  // Use requestAnimationFrame to reduce forced reflow
  requestAnimationFrame(() => {
    // Clear existing filters first
    executionTableInstance.clearFilter();

    // Apply filters using Tabulator's built-in filter system
    const activeFilters = [];

    // Campaign name filter (partial match)
    if (filters.campaignName) {
      activeFilters.push({
        field: "campaignName",
        type: "like",
        value: filters.campaignName,
      });
    }

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
      console.log(
        "[Execution] Adding programType filter:",
        filters.programType,
      );
      activeFilters.push({
        field: "programType",
        type: "=",
        value: filters.programType,
      });
    }
    if (filters.strategicPillar) {
      console.log(
        "[Execution] Adding strategicPillar filter:",
        filters.strategicPillar,
      );
      activeFilters.push({
        field: "strategicPillars",
        type: "=",
        value: filters.strategicPillar,
      });
    }
    if (filters.owner) {
      activeFilters.push({ field: "owner", type: "=", value: filters.owner });
    }

    console.log(
      "[Execution] Applying",
      activeFilters.length,
      "standard filters",
    );

    // Apply standard filters first
    if (activeFilters.length > 0) {
      executionTableInstance.setFilter(activeFilters);
    } else {
      executionTableInstance.clearFilter();
    }

    // Apply Digital Motions filter separately as a custom function filter
    if (filters.digitalMotions) {
      console.log(
        "[Execution] Adding digitalMotions custom filter - showing only campaigns with digitalMotions === true",
      );

      executionTableInstance.addFilter(function (data) {
        return data.digitalMotions === true;
      });
    }

    const visibleRows = executionTableInstance.getDataCount(true);
    console.log("[Execution] Filters applied, showing", visibleRows, "rows");
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
    // Find the matching row in the target table by unique id (use 'id' or 'campaignName' as fallback)
    let match;
    if (rowData.id) {
      match = targetTable.getRows().find((r) => r.getData().id === rowData.id);
    } else {
      match = targetTable
        .getRows()
        .find((r) => r.getData().campaignName === rowData.campaignName);
    }
    if (match) {
      match.update({ ...rowData });
    }
  });
}

// Sync digital motions data from planning table to execution table
function syncDigitalMotionsFromPlanning() {
  if (!executionTableInstance || !window.planningModule?.tableInstance) {
    console.log(
      "[Execution] Cannot sync digital motions - tables not available",
    );
    return;
  }

  const planningData = window.planningModule.tableInstance.getData();
  const executionData = executionTableInstance.getData();

  let updatedCount = 0;

  // Update execution table with digitalMotions values from planning table
  executionData.forEach((execRow) => {
    const planningRow = planningData.find(
      (planRow) =>
        (planRow.id && planRow.id === execRow.id) ||
        planRow.campaignName === execRow.campaignName,
    );

    if (planningRow && planningRow.digitalMotions !== execRow.digitalMotions) {
      // Find the row in the execution table and update it
      const execTableRow = executionTableInstance.getRows().find((row) => {
        const rowData = row.getData();
        return (
          (rowData.id && rowData.id === execRow.id) ||
          rowData.campaignName === execRow.campaignName
        );
      });

      if (execTableRow) {
        execTableRow.update({ digitalMotions: planningRow.digitalMotions });
        updatedCount++;
      }
    }
  });

  if (updatedCount > 0) {
    console.log(
      "[Execution] Synced",
      updatedCount,
      "rows with updated digital motions data",
    );
  }
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
  // Debug function for Digital Motions filter
  debugDigitalMotions: function () {
    console.log("=== EXECUTION DIGITAL MOTIONS DEBUG ===");

    if (!executionTableInstance) {
      console.log("ERROR: No execution table instance");
      return;
    }

    const allData = executionTableInstance.getData();
    console.log("Total execution records:", allData.length);

    const digitalMotionsRecords = allData.filter(
      (row) => row.digitalMotions === true,
    );
    console.log(
      "Records with digitalMotions === true:",
      digitalMotionsRecords.length,
    );

    console.log(
      "Sample records with digitalMotions:",
      digitalMotionsRecords.slice(0, 3).map((r) => ({
        campaignName: r.campaignName,
        digitalMotions: r.digitalMotions,
        region: r.region,
        status: r.status,
      })),
    );

    const button = document.getElementById("executionDigitalMotionsFilter");
    if (button) {
      console.log("Digital Motions button state:", button.dataset.active);
      console.log("Button element:", button);
    } else {
      console.log("ERROR: Digital Motions button not found");
    }

    const visibleRows = executionTableInstance.getDataCount(true);
    console.log("Currently visible rows:", visibleRows);

    // Test manual filter
    console.log("Testing manual digitalMotions filter...");
    executionTableInstance.clearFilter();
    executionTableInstance.setFilter(function (data) {
      return data.digitalMotions === true;
    });

    const afterFilterRows = executionTableInstance.getDataCount(true);
    console.log("Rows after manual digitalMotions filter:", afterFilterRows);

    console.log("=== END DEBUG ===");
  },
};

// Export the execution table instance getter
Object.defineProperty(window.executionModule, "tableInstance", {
  get: function () {
    return executionTableInstance;
  },
});

console.log(
  "Execution module initialized and exported to window.executionModule",
);

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
    "Flagship events (galaxy, universe recaps) 1:many",
    "3P sponsored events",
    "Webinars",
    "Microsoft",
    "Lunch & learns and workshops (1:few)",
    "Localized Programs",
    "CxO events (1:few)",
    "Exec engagement programs",
    "In-Account events (1:1)",
    "Contractor/Infrastructure",
    "Paid ads",
    "Operational/Infrastructure/Swag",
  ];
  const names = window.planningModule?.constants?.names || [
    "Shruti Narang",
    "Beverly Leung",
    "Giorgia Parham",
    "Tomoko Tanaka",
  ];
  const yesNo = window.planningModule?.constants?.yesNo || ["Yes", "No"];

  console.log("[Execution] Setting up filters with constants:", {
    programTypes: programTypes.length,
    names: names.length,
    regionOptions: regionOptions.length,
    statusOptions: statusOptions.length
  });

  // Create comprehensive filter UI matching planning tab
  const execFiltersDiv = document.createElement("div");
  execFiltersDiv.id = "execFiltersDiv";
  execFiltersDiv.style.margin = "0 0 16px 0";
  execFiltersDiv.style.background = "#f8f9fa";
  execFiltersDiv.style.padding = "16px";
  execFiltersDiv.style.borderRadius = "8px";
  execFiltersDiv.style.border = "1px solid #e0e0e0";
  execFiltersDiv.innerHTML = `
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <label for="executionCampaignNameFilter" style="font-weight: 500; white-space: nowrap;">Campaign Name:</label>
        <input type="text" id="executionCampaignNameFilter" placeholder="Search campaigns..." 
               style="padding: 6px 12px; border-radius: 6px; border: 1px solid #90caf9; font-size: 1rem; min-width: 200px;" />
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <label for="executionRegionFilter" style="font-weight: 500; white-space: nowrap;">Region:</label>
        <select id="executionRegionFilter" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #90caf9; font-size: 1rem;">
          <option value="">(All Regions)</option>
          ${regionOptions.map((r) => `<option value="${r}">${r}</option>`).join("")}
        </select>
      </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <label for="executionStatusFilter" style="font-weight: 500; white-space: nowrap;">Status:</label>
        <select id="executionStatusFilter" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #90caf9; font-size: 1rem;">
          <option value="">(All Statuses)</option>
          ${statusOptions.map((s) => `<option value="${s}">${s}</option>`).join("")}
        </select>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <label for="executionProgramTypeFilter" style="font-weight: 500; white-space: nowrap;">Program Type:</label>
        <select id="executionProgramTypeFilter" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #90caf9; font-size: 1rem;">
          <option value="">(All Types)</option>
          ${programTypes.map((type) => `<option value="${type}">${type}</option>`).join("")}
        </select>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <label for="executionOwnerFilter" style="font-weight: 500; white-space: nowrap;">Owner:</label>
        <select id="executionOwnerFilter" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #90caf9; font-size: 1rem;">
          <option value="">(All Owners)</option>
          ${names.map((owner) => `<option value="${owner}">${owner}</option>`).join("")}
        </select>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <label for="executionPOFilter" style="font-weight: 500; white-space: nowrap;">PO Raised:</label>
        <select id="executionPOFilter" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #90caf9; font-size: 1rem;">
          <option value="">(All)</option>
          ${yesNo.map((v) => `<option value="${v}">${v}</option>`).join("")}
        </select>
      </div>
      <button id="executionDigitalMotionsFilter" type="button" data-active="false"
              style="padding: 8px 16px; border-radius: 6px; border: 2px solid #1976d2; background: white; color: #1976d2; font-weight: 500; cursor: pointer; transition: all 0.2s;">
        Digital Motions
      </button>
      <button id="executionClearFilters" type="button"
              style="padding: 8px 16px; border-radius: 6px; border: 1px solid #666; background: white; color: #666; font-weight: 500; cursor: pointer; margin-left: 8px;">
        Clear All Filters
      </button>
    </div>
  `;

  const execGridSection = document.getElementById("view-execution");
  if (execGridSection) {
    // Check if filters already exist to avoid duplication
    const existingFilters = document.getElementById("execFiltersDiv");
    if (!existingFilters) {
      const h2 = execGridSection.querySelector("h2");
      if (h2 && execGridSection.contains(h2)) {
        h2.insertAdjacentElement("afterend", execFiltersDiv);
      } else {
        execGridSection.insertBefore(
          execFiltersDiv,
          execGridSection.firstChild,
        );
      }

      setupExecutionFilterLogic();
    }
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
    console.warn("[Execution] Table instance not available yet, retrying in 100ms...");
    setTimeout(setupExecutionFilterLogic, 100);
    return;
  }

  const campaignNameInput = document.getElementById("executionCampaignNameFilter");
  const regionSelect = document.getElementById("executionRegionFilter");
  const statusSelect = document.getElementById("executionStatusFilter");
  const programTypeSelect = document.getElementById("executionProgramTypeFilter");
  const ownerSelect = document.getElementById("executionOwnerFilter");
  const poSelect = document.getElementById("executionPOFilter");
  const digitalMotionsButton = document.getElementById("executionDigitalMotionsFilter");
  const clearButton = document.getElementById("executionClearFilters");

  if (!campaignNameInput || !regionSelect || !statusSelect || 
      !programTypeSelect || !ownerSelect || !poSelect || !digitalMotionsButton) {
    console.error("[Execution] Missing filter elements:", {
      campaignNameInput: !!campaignNameInput,
      regionSelect: !!regionSelect,
      statusSelect: !!statusSelect,
      programTypeSelect: !!programTypeSelect,
      ownerSelect: !!ownerSelect,
      poSelect: !!poSelect,
      digitalMotionsButton: !!digitalMotionsButton
    });
    return;
  }

  console.log("[Execution] Setting up filter logic with table instance ready");

  // Initialize Digital Motions button state
  if (!digitalMotionsButton.hasAttribute('data-active')) {
    digitalMotionsButton.dataset.active = "false";
  }
  updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);

  // Set up event listeners for all filters (only if not already attached)
  if (!campaignNameInput.hasAttribute('data-listener-attached')) {
    campaignNameInput.addEventListener("input", applyExecutionFilters);
    campaignNameInput.setAttribute('data-listener-attached', 'true');
  }
  
  [regionSelect, statusSelect, programTypeSelect, ownerSelect, poSelect].forEach(select => {
    if (!select.hasAttribute('data-listener-attached')) {
      select.addEventListener("change", applyExecutionFilters);
      select.setAttribute('data-listener-attached', 'true');
    }
  });

  // Digital Motions filter button toggle (only attach once)
  if (!digitalMotionsButton.hasAttribute('data-listener-attached')) {
    digitalMotionsButton.addEventListener("click", () => {
      const currentState = digitalMotionsButton.dataset.active;
      const isActive = currentState === "true";
      const newState = !isActive;
      
      console.log("[Execution] Digital Motions button clicked:", {
        currentState,
        isActive,
        newState
      });
      
      digitalMotionsButton.dataset.active = newState.toString();
      updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);
      
      console.log("[Execution] About to apply filters with Digital Motions state:", newState);
      applyExecutionFilters();
    });
    digitalMotionsButton.setAttribute('data-listener-attached', 'true');
  }

  // Clear filters button
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      campaignNameInput.value = "";
      regionSelect.value = "";
      quarterSelect.value = "";
      statusSelect.value = "";
      programTypeSelect.value = "";
      ownerSelect.value = "";
      poSelect.value = "";
      digitalMotionsButton.dataset.active = "false";
      updateExecutionDigitalMotionsButtonVisual(digitalMotionsButton);
      applyExecutionFilters();
    });
  }
}

// Get current filter values for execution tracking
function getExecutionFilterValues() {
  const digitalMotionsButton = document.getElementById("executionDigitalMotionsFilter");
  const digitalMotionsActive = digitalMotionsButton?.dataset.active === "true";
  
  const filterValues = {
    campaignName: document.getElementById("executionCampaignNameFilter")?.value || "",
    region: document.getElementById("executionRegionFilter")?.value || "",
    status: document.getElementById("executionStatusFilter")?.value || "",
    programType: document.getElementById("executionProgramTypeFilter")?.value || "",
    owner: document.getElementById("executionOwnerFilter")?.value || "",
    poRaised: document.getElementById("executionPOFilter")?.value || "",
    digitalMotions: digitalMotionsActive
  };
  
  console.log("[Execution] getExecutionFilterValues:", {
    campaignName: filterValues.campaignName,
    region: filterValues.region,
    status: filterValues.status,
    programType: filterValues.programType,
    owner: filterValues.owner,
    poRaised: filterValues.poRaised,
    digitalMotions: filterValues.digitalMotions,
    digitalMotionsButtonState: digitalMotionsButton?.dataset.active
  });
  
  return filterValues;
}

// Apply filters to execution tracking table
function applyExecutionFilters() {
  if (!executionTableInstance) {
    console.warn("[Execution] Table instance not available, cannot apply filters");
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
      activeFilters.push({field:"campaignName", type:"like", value:filters.campaignName});
    }
    
    // Exact match filters
    if (filters.region) {
      activeFilters.push({field:"region", type:"=", value:filters.region});
    }
    if (filters.status) {
      activeFilters.push({field:"status", type:"=", value:filters.status});
    }
    if (filters.programType) {
      console.log("[Execution] Adding programType filter:", filters.programType);
      activeFilters.push({field:"programType", type:"=", value:filters.programType});
    }
    if (filters.owner) {
      activeFilters.push({field:"owner", type:"=", value:filters.owner});
    }
    if (filters.poRaised) {
      activeFilters.push({field:"poRaised", type:"=", value:filters.poRaised});
    }
    
    // Digital Motions filter (custom function)
    if (filters.digitalMotions) {
      activeFilters.push(function(data) {
        return data.digitalMotions === true;
      });
    }
    
    console.log("[Execution] Applying", activeFilters.length, "filters");
    
    // Apply all filters
    if (activeFilters.length > 0) {
      executionTableInstance.setFilter(activeFilters);
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

// EXPORT EXECUTION MODULE FUNCTIONS
window.executionModule = {
  initExecutionGrid,
  setupExecutionSave,
  setupExecutionFilters,
  syncGridsOnEdit,
  applyExecutionFilters,
  getExecutionFilterValues,
  initializeExecutionFilters
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

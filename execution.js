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
  const yesNo = window.planningModule?.constants?.yesNo || ["Yes", "No"];

  // Add region, status, and PO Raised filter buttons below the execution tracking title
  const execRegionFilterDiv = document.createElement("div");
  execRegionFilterDiv.id = "execRegionFilterDiv";
  execRegionFilterDiv.style.margin = "0 0 16px 0";
  execRegionFilterDiv.style.display = "flex";
  execRegionFilterDiv.style.gap = "18px";
  execRegionFilterDiv.innerHTML = `
    <label for="execRegionFilter" style="font-weight:500;margin-right:8px;">Filter by Region:</label>
    <select id="execRegionFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
      <option value="">(All Regions)</option>
      ${regionOptions.map((r) => `<option value="${r}">${r}</option>`).join("")}
    </select>
    <label for="execStatusFilter" style="font-weight:500;margin-left:18px;margin-right:8px;">Status:</label>
    <select id="execStatusFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
      <option value="">(All Statuses)</option>
      ${statusOptions.map((s) => `<option value="${s}">${s}</option>`).join("")}
    </select>
    <label for="execPOFilter" style="font-weight:500;margin-left:18px;margin-right:8px;">PO Raised:</label>
    <select id="execPOFilter" style="padding:6px 12px;border-radius:6px;border:1px solid #90caf9;font-size:1rem;">
      <option value="">(All)</option>
      ${yesNo.map((v) => `<option value="${v}">${v}</option>`).join("")}
    </select>
  `;

  const execGridSection = document.getElementById("view-execution");
  if (execGridSection) {
    // Check if filters already exist to avoid duplication
    const existingFilters = document.getElementById("execRegionFilterDiv");
    if (!existingFilters) {
      const h2 = execGridSection.querySelector("h2");
      if (h2 && execGridSection.contains(h2)) {
        h2.insertAdjacentElement("afterend", execRegionFilterDiv);
      } else {
        execGridSection.insertBefore(
          execRegionFilterDiv,
          execGridSection.firstChild,
        );
      }

      // Add filter logic for execution grid
      function updateExecFilters() {
        const regionVal = document.getElementById("execRegionFilter").value;
        const statusVal = document.getElementById("execStatusFilter").value;
        const poVal = document.getElementById("execPOFilter").value;
        if (executionTableInstance) {
          executionTableInstance.setFilter(
            [
              regionVal
                ? { field: "region", type: "=", value: regionVal }
                : null,
              statusVal
                ? { field: "status", type: "=", value: statusVal }
                : null,
              poVal ? { field: "poRaised", type: "=", value: poVal } : null,
            ].filter(Boolean),
          );
        }
      }

      ["execRegionFilter", "execStatusFilter", "execPOFilter"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener("change", updateExecFilters);
        }
      });
    }
  }
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

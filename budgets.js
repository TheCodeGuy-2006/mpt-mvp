// budgets.js - Budget Management Module
console.log("budgets.js loaded");

// Load budgets data from budgets.json only
async function loadBudgets() {
  try {
    const r = await fetch("data/budgets.json");
    if (!r.ok) throw new Error("Failed to fetch budgets.json");
    return await r.json();
  } catch (e) {
    alert("Failed to fetch budgets.json");
    return {};
  }
}

// BUDGETS TABLE
function initBudgetsTable(budgets, rows) {
  const table = new Tabulator("#budgetsTable", {
    data: budgets,
    layout: "fitColumns",
    columns: [
      { title: "Region", field: "region", editor: "input" },
      { title: "Assigned Budget", field: "assignedBudget", editor: "number" },
      { title: "Notes", field: "notes", editor: "input" },
      {
        title: "Utilisation",
        field: "utilisation",
        mutator: (value, data) => value,
        formatter: (cell) => {
          const val = cell.getValue();
          return val !== undefined ? val : "";
        },
      },
    ],
  });
  // Use rows (from planning.json) instead of fetching individual files
  import("./src/calc.js").then(({ regionMetrics }) => {
    const budgetsObj = {};
    budgets.forEach(
      (b) => (budgetsObj[b.region] = { assignedBudget: b.assignedBudget }),
    );
    const metrics = regionMetrics(rows, budgetsObj);
    table.getRows().forEach((row) => {
      const region = row.getData().region;
      if (metrics[region]) {
        row.update({
          utilisation: `${metrics[region].forecast} / ${metrics[region].plan}`,
        });
        if (metrics[region].forecast > metrics[region].plan) {
          row.getElement().style.background = "#ffebee";
          row.getElement().style.color = "#b71c1c";
        }
      }
    });
  });
  setupBudgetsSave(table);
  setupBudgetsDownload(table); // Setup download functionality
  return table;
}

function setupBudgetsSave(table) {
  let btn = document.getElementById("saveBudgetDashboard");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "saveBudgetDashboard";
    btn.textContent = "Save Budget Dashboard";
    btn.style.margin = "12px 0";
    document.getElementById("view-budgets").appendChild(btn);
  }
  btn.onclick = () => {
    // Save all budgets data to budgets.json via backend
    const data = table.getData();
    // Convert array back to object by region
    const obj = {};
    data.forEach((row) => {
      obj[row.region] = {
        assignedBudget: row.assignedBudget,
        notes: row.notes,
        utilisation: row.utilisation,
      };
    });
    fetch("http://localhost:3000/save-budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: obj }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          alert("Budgets data saved to backend!");
        } else {
          alert("Failed to save: " + (result.error || "Unknown error"));
        }
      })
      .catch((err) => {
        alert("Failed to save: " + err.message);
      });
  };
}

// Setup Annual Budget Plan save functionality
function setupAnnualBudgetSave() {
  const saveBtn = document.getElementById("saveAnnualBudget");
  if (!saveBtn) return;

  saveBtn.onclick = () => {
    const planTableBody = document.querySelector("#planTable tbody");
    if (!planTableBody) return;
    const rows = Array.from(planTableBody.querySelectorAll("tr"));
    const budgets = rows
      .map((tr) => {
        const tds = tr.querySelectorAll("td");
        const region = tds[0]?.querySelector("input")?.value?.trim() || "";
        let assignedBudgetRaw = tds[1]?.querySelector("input")?.value || "0";
        // Remove $ and commas for parsing
        assignedBudgetRaw = assignedBudgetRaw.replace(/[^\d.]/g, "");
        const assignedBudget = Number(assignedBudgetRaw) || 0;
        return region ? { region, assignedBudget } : null;
      })
      .filter(Boolean);
    if (window.budgetsTableInstance) {
      window.budgetsTableInstance.replaceData(budgets);
      // Also save to backend
      const data = window.budgetsTableInstance.getData();
      const obj = {};
      data.forEach((row) => {
        obj[row.region] = {
          assignedBudget: row.assignedBudget,
          notes: row.notes,
          utilisation: row.utilisation,
        };
      });
      fetch("http://localhost:3000/save-budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: obj }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            alert("Budgets data saved to backend!");
          } else {
            alert("Failed to save: " + (result.error || "Unknown error"));
          }
        })
        .catch((err) => {
          alert("Failed to save: " + err.message);
        });
    }
  };
}

// Setup Annual Budget Plan table initialization
function initializeAnnualBudgetPlan(budgets) {
  // Add handler for '+ Add Region' button in Annual Budget Plan
  const addRegionBtn = document.getElementById("addRegionRow");
  if (addRegionBtn) {
    addRegionBtn.onclick = () => {
      const tbody = document.querySelector("#planTable tbody");
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td><input type="text" placeholder="Region name" /></td>
        <td><input type="number" value="" /></td>
        <td><button class="plan-delete-btn" title="Delete"><span style="font-size:1.2em;color:#b71c1c;">🗑️</span></button></td>
      `;
      newRow.querySelector(".plan-delete-btn").onclick = function () {
        newRow.remove();
      };
      tbody.appendChild(newRow);

      const input = newRow.querySelector('input[type="number"]');
      if (input) {
        input.type = "text";
        input.classList.add("plan-usd-input");
        input.addEventListener("blur", function () {
          let val = input.value.replace(/[^\d.]/g, "");
          val = val ? Number(val) : 0;
          input.value = `$${val.toLocaleString()}`;
        });
        input.addEventListener("focus", function () {
          let val = input.value.replace(/[^\d.]/g, "");
          input.value = val;
        });
      }
    };
  }

  // Populate Annual Budget Plan table from budgets.json
  try {
    const planTableBody = document.querySelector("#planTable tbody");
    if (planTableBody && budgets.length > 0) {
      planTableBody.innerHTML = "";
      budgets.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" value="${row.region}" /></td>
          <td><input type="text" class="plan-usd-input" value="$${Number(row.assignedBudget ?? 0).toLocaleString()}" /></td>
          <td><button class="plan-delete-btn" title="Delete"><span style="font-size:1.2em;color:#b71c1c;">🗑️</span></button></td>
        `;
        // Add delete handler
        tr.querySelector(".plan-delete-btn").onclick = function () {
          tr.remove();
        };
        // Format input on blur/change
        const input = tr.querySelector(".plan-usd-input");
        input.addEventListener("blur", function () {
          let val = input.value.replace(/[^\d.]/g, "");
          val = val ? Number(val) : 0;
          input.value = `$${val.toLocaleString()}`;
        });
        input.addEventListener("focus", function () {
          // Remove formatting for editing
          let val = input.value.replace(/[^\d.]/g, "");
          input.value = val;
        });
        planTableBody.appendChild(tr);
      });
    }
  } catch (e) {
    // fallback: do nothing if error
  }

  // Setup the save functionality for annual budget plan
  setupAnnualBudgetSave();
}

// Setup CSV download functionality for budgets
function setupBudgetsDownload(table) {
  const downloadBtn = document.getElementById("downloadBudgetsInfoCSV");
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      const data = table.getData();
      // Create CSV content
      const headers = ["Region", "Assigned Budget", "Notes", "Utilisation"];
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          [
            row.region || "",
            row.assignedBudget || 0,
            `"${(row.notes || "").replace(/"/g, '""')}"`, // Escape quotes in notes
            `"${row.utilisation || ""}"`,
          ].join(","),
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budgets_info_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }
}

// Module exports
const budgetsModule = {
  loadBudgets,
  initBudgetsTable,
  setupBudgetsSave,
  setupAnnualBudgetSave,
  initializeAnnualBudgetPlan,
  setupBudgetsDownload,
};

// Export to window for access from other modules
window.budgetsModule = budgetsModule;

export default budgetsModule;

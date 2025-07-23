// budgets.js - Budget Management Module

// Performance configuration for budget operations
const BUDGETS_PERFORMANCE_CONFIG = {
  // Debounce timing for different operations
  INPUT_DEBOUNCE: 300,      // Text input debounce
  CALCULATION_DEBOUNCE: 150, // Budget calculation debounce
  SAVE_DEBOUNCE: 1000,      // Auto-save debounce
  
  // UI optimization
  ANIMATION_DURATION: 200,   // Reduced animation time
  UPDATE_BATCH_SIZE: 50,     // Process updates in batches
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

// Load budgets data via Worker API for real-time updates
async function loadBudgets(retryCount = 0) {
  try {
    // Try to load via Worker API first (real-time, no caching issues)
    let budgets;

    try {
      // Use Worker API endpoint instead of raw GitHub files
      const workerEndpoint =
        window.cloudflareSyncModule?.getWorkerEndpoint() ||
        "https://mpt-mvp-sync.jordanradford.workers.dev";
      const workerUrl = `${workerEndpoint}/data/budgets`;

      const response = await fetch(workerUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        budgets = result.data;

        // Validate that we got actual data
        if (budgets && Object.keys(budgets).length > 0) {
          // Worker API budgets data validation passed
        } else {
          if (retryCount < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, (retryCount + 1) * 2000),
            );
            return loadBudgets(retryCount + 1);
          }
        }
      } else {
        throw new Error(
          `Worker API budgets failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (workerError) {
      // Fallback: Try local file
      try {
        const r = await fetch("data/budgets.json");
        if (!r.ok) throw new Error("Failed to fetch budgets.json");
        budgets = await r.json();

        // Show a message to the user about the Worker API being unavailable
        if (retryCount === 0) {
          // Worker API unavailable - using local data. Real-time sync disabled.
        }
      } catch (localError) {
        console.error("Local file also failed:", localError);
        throw new Error(
          "Failed to load budgets data from both Worker API and local file",
        );
      }
    }

    return budgets;
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
    
    // Performance optimizations
    virtualDom: true,
    virtualDomBuffer: 10, // Smaller buffer for budget table
    pagination: false,    // Budget data is typically small
    progressiveLoad: false,
    autoResize: false,
    responsiveLayout: false,
    
    // Add safer scroll configuration to prevent errors
    scrollToRowIfVisible: false,
    
    // Add error handling for table operations
    tableBuilt: function() {
      setTimeout(() => {
        try {
          this.redraw(true);
        } catch (e) {
          console.warn("Error in budgets table built callback:", e.message);
        }
      }, 100);
    },
    
    columns: [
      {
        title: "Region",
        field: "region",
        editor: "input",
        cellEdited: debounce((cell) => {
          triggerBudgetsAutosave(cell.getTable());
        }, BUDGETS_PERFORMANCE_CONFIG.INPUT_DEBOUNCE),
      },
      {
        title: "Assigned Budget",
        field: "assignedBudget",
        editor: "number",
        cellEdited: debounce((cell) => {
          triggerBudgetsAutosave(cell.getTable());
        }, BUDGETS_PERFORMANCE_CONFIG.INPUT_DEBOUNCE),
      },
      {
        title: "Notes",
        field: "notes",
        editor: "input",
        cellEdited: debounce((cell) => {
          triggerBudgetsAutosave(cell.getTable());
        }, BUDGETS_PERFORMANCE_CONFIG.INPUT_DEBOUNCE),
      },
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
  
  // Debounced utilization calculation for better performance
  const updateUtilization = debounce(async () => {
    try {
      const { regionMetrics } = await import("./src/calc.js");
      const budgetsObj = {};
      budgets.forEach(
        (b) => (budgetsObj[b.region] = { assignedBudget: b.assignedBudget }),
      );
      const metrics = regionMetrics(rows, budgetsObj);
      
      // Use requestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => {
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
    } catch (error) {
      console.error("Error calculating utilization:", error);
    }
  }, BUDGETS_PERFORMANCE_CONFIG.CALCULATION_DEBOUNCE);
  
  // Initialize utilization calculation
  updateUtilization();

  // Make globally accessible for data refreshing
  window.budgetsTableInstance = table;
  window.loadBudgets = loadBudgets;

  return table;
}

// Autosave functionality for budgets
const debouncedBudgetsAutosave = debounce((table) => {
  if (!window.cloudflareSyncModule) {
    return;
  }

  const data = table.getData();
  window.cloudflareSyncModule.scheduleSave("budgets", data, {
    source: "budgets-autosave",
  });
}, BUDGETS_PERFORMANCE_CONFIG.SAVE_DEBOUNCE);

// Legacy function name for compatibility
function triggerBudgetsAutosave(table) {
  debouncedBudgetsAutosave(table);
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
      // Also save to backend and Worker
      const data = window.budgetsTableInstance.getData();
      const obj = {};
      data.forEach((row) => {
        obj[row.region] = {
          assignedBudget: row.assignedBudget,
          notes: row.notes,
          utilisation: row.utilisation,
        };
      });

      // Try Worker first, then backend fallback
      if (window.cloudflareSyncModule) {
        // Primary: Save to Worker
        window.cloudflareSyncModule
          .saveToWorker("budgets", obj, { source: "annual-budget-save" })
          .then((result) => {
            alert("✅ Annual budget saved to GitHub!");
          })
          .catch((error) => {
            // Fallback: Save to backend
            fetch("http://localhost:3000/save-budgets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: obj }),
            })
              .then((res) => res.json())
              .then((result) => {
                if (result.success) {
                  alert(
                    "✅ Annual budget saved to backend (Worker unavailable)!",
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
        fetch("http://localhost:3000/save-budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: obj }),
        })
          .then((res) => res.json())
          .then((result) => {
            if (result.success) {
              alert("✅ Annual budget saved to backend!");
            } else {
              alert("❌ Failed to save: " + (result.error || "Unknown error"));
            }
          })
          .catch((err) => {
            alert("❌ Save failed: " + err.message);
          });
      }
    }
  };
}

// --- Annual Budget Permission Lock ---
let annualBudgetUnlocked = false;

function showAnnualBudgetPasswordModal(callback) {
  const modal = document.getElementById("annualBudgetPasswordModal");
  const input = document.getElementById("annualBudgetPasswordInput");
  const error = document.getElementById("annualBudgetPasswordError");
  const submit = document.getElementById("annualBudgetPasswordSubmit");
  const cancel = document.getElementById("annualBudgetPasswordCancel");
  if (!modal || !input || !submit || !cancel) return;
  error.textContent = "";
  input.value = "";
  modal.style.display = "flex";
  input.focus();
  function closeModal() {
    modal.style.display = "none";
    submit.onclick = null;
    cancel.onclick = null;
    input.onkeydown = null;
  }
  submit.onclick = function () {
    if (input.value === "git") {
      annualBudgetUnlocked = true;
      closeModal();
      callback(true);
    } else {
      error.textContent = "Incorrect password.";
      input.value = "";
      input.focus();
    }
  };
  cancel.onclick = function () {
    closeModal();
    callback(false);
  };
  input.onkeydown = function (e) {
    if (e.key === "Enter") submit.onclick();
    if (e.key === "Escape") cancel.onclick();
  };
}

function setAnnualBudgetInputsEnabled(enabled) {
  // Enable/disable all inputs and buttons in the plan table and controls
  document
    .querySelectorAll(
      "#planTable input, #planTable button, #addRegionRow, #saveAnnualBudget",
    )
    .forEach((el) => {
      if (enabled) {
        el.removeAttribute("disabled");
      } else {
        el.setAttribute("disabled", "disabled");
      }
    });
  // For future rows: observe DOM changes and enable new inputs/buttons if unlocked
  if (enabled && !setAnnualBudgetInputsEnabled._observer) {
    const tbody = document.querySelector("#planTable tbody");
    if (tbody) {
      const observer = new MutationObserver(() => {
        document
          .querySelectorAll("#planTable input, #planTable button")
          .forEach((el) => {
            el.removeAttribute("disabled");
          });
      });
      observer.observe(tbody, { childList: true, subtree: true });
      setAnnualBudgetInputsEnabled._observer = observer;
    }
  }
}

function initializeAnnualBudgetPlan(budgets) {
  // Populate Annual Budget Plan table from budgets.json
  try {
    const planTableBody = document.querySelector("#planTable tbody");
    if (planTableBody && budgets.length > 0) {
      planTableBody.innerHTML = "";
      budgets.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" value="${row.region}" disabled /></td>
          <td><input type="text" class="plan-usd-input" value="$${Number(row.assignedBudget ?? 0).toLocaleString()}" disabled /></td>
          <td><button class="plan-delete-btn delete-row-btn" title="Delete" disabled><i class="octicon octicon-trash" aria-hidden="true"></i></button></td>
        `;
        planTableBody.appendChild(tr);
      });
    }
  } catch (e) {
    // fallback: do nothing if error
  }

  // Always start with inputs disabled
  setAnnualBudgetInputsEnabled(false);

  // Overlay logic to intercept all clicks when locked
  const planTable = document.getElementById("planTable");
  if (planTable) {
    // Remove any existing overlay
    let overlay = document.getElementById("planTableLockOverlay");
    if (overlay) overlay.remove();

    if (!annualBudgetUnlocked) {
      overlay = document.createElement("div");
      overlay.id = "planTableLockOverlay";
      Object.assign(overlay.style, {
        position: "absolute",
        top: planTable.offsetTop + "px",
        left: planTable.offsetLeft + "px",
        width: planTable.offsetWidth + "px",
        height: planTable.offsetHeight + "px",
        background: "rgba(255,255,255,0)",
        zIndex: 10,
        cursor: "pointer",
      });
      overlay.addEventListener("click", function (e) {
        showAnnualBudgetPasswordModal((ok) => {
          if (ok) {
            setAnnualBudgetInputsEnabled(true);
            // Remove overlay after unlock
            overlay.remove();
          }
        });
        e.preventDefault();
        e.stopPropagation();
      });
      // Insert overlay in the same parent as the table
      planTable.parentNode.style.position = "relative";
      planTable.parentNode.appendChild(overlay);
    }
  }

  // Add handler for '+ Add Region' button in Annual Budget Plan
  const addRegionBtn = document.getElementById("addRegionRow");
  if (addRegionBtn) {
    addRegionBtn.onclick = (e) => {
      if (!annualBudgetUnlocked) {
        showAnnualBudgetPasswordModal((ok) => {
          if (ok) {
            setAnnualBudgetInputsEnabled(true);
          }
        });
        return;
      }
      const tbody = document.querySelector("#planTable tbody");
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td><input type="text" placeholder="Region name" /></td>
        <td><input type="number" value="" /></td>
        <td><button class="plan-delete-btn delete-row-btn" title="Delete"><i class="octicon octicon-trash" aria-hidden="true"></i></button></td>
      `;
      newRow.querySelector(".plan-delete-btn").onclick = function () {
        newRow.remove();
      };
      tbody.appendChild(newRow);
      // Enable new row's inputs/buttons if unlocked
      if (annualBudgetUnlocked) {
        newRow
          .querySelectorAll("input,button")
          .forEach((el) => el.removeAttribute("disabled"));
      }
      const input = newRow.querySelector('input[type="number"]');
      if (input) {
        input.type = "text";
        input.classList.add("plan-usd-input");
        
        // Debounced input handlers for better performance
        const debouncedBlur = debounce(() => {
          let val = input.value.replace(/[^\d.]/g, "");
          val = val ? Number(val) : 0;
          input.value = `$${val.toLocaleString()}`;
        }, BUDGETS_PERFORMANCE_CONFIG.CALCULATION_DEBOUNCE);
        
        const debouncedFocus = debounce(() => {
          let val = input.value.replace(/[^\d.]/g, "");
          input.value = val;
        }, BUDGETS_PERFORMANCE_CONFIG.CALCULATION_DEBOUNCE);
        
        input.addEventListener("blur", debouncedBlur);
        input.addEventListener("focus", debouncedFocus);
      }
    };
  }

  // Setup the save functionality for annual budget plan
  setupAnnualBudgetSave();

  // Intercept save button
  const saveBtn = document.getElementById("saveAnnualBudget");
  if (saveBtn) {
    saveBtn.onclick = (e) => {
      if (!annualBudgetUnlocked) {
        showAnnualBudgetPasswordModal((ok) => {
          if (ok) setAnnualBudgetInputsEnabled(true);
        });
        return;
      }
      // If unlocked, proceed with original save
      if (typeof window._originalAnnualBudgetSave === "function") {
        window._originalAnnualBudgetSave();
      }
    };
  }

  // If already unlocked (e.g. after reload), enable all inputs/buttons
  if (annualBudgetUnlocked) {
    setAnnualBudgetInputsEnabled(true);
  }
}

// Patch setupAnnualBudgetSave to allow calling original logic after unlock
if (!window._originalAnnualBudgetSave) {
  window._originalAnnualBudgetSave = setupAnnualBudgetSave;
}

// Setup CSV download functionality for budgets
// Module exports with performance optimizations
const budgetsModule = {
  loadBudgets,
  initBudgetsTable,
  setupAnnualBudgetSave,
  initializeAnnualBudgetPlan,
  
  // Performance utilities
  debounce,
  PERFORMANCE_CONFIG: BUDGETS_PERFORMANCE_CONFIG,
  
  // Cached calculation system for better performance
  _calculationCache: new Map(),
  
  // Method to clear calculation cache when data changes
  clearCalculationCache() {
    this._calculationCache.clear();
  },
  
  // Optimized utilization calculation with caching
  async calculateUtilizationOptimized(budgets, rows) {
    const cacheKey = JSON.stringify({
      budgets: budgets.map(b => ({ region: b.region, budget: b.assignedBudget })),
      rowCount: rows.length
    });
    
    if (this._calculationCache.has(cacheKey)) {
      return this._calculationCache.get(cacheKey);
    }
    
    try {
      const { regionMetrics } = await import("./src/calc.js");
      const budgetsObj = {};
      budgets.forEach(
        (b) => (budgetsObj[b.region] = { assignedBudget: b.assignedBudget }),
      );
      const metrics = regionMetrics(rows, budgetsObj);
      
      this._calculationCache.set(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error("Error in optimized utilization calculation:", error);
      return {};
    }
  }
};

// Export to window for access from other modules
window.budgetsModule = budgetsModule;

export default budgetsModule;

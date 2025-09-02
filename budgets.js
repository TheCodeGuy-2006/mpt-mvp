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
  const form = document.getElementById("annualBudgetPasswordForm");
  const input = document.getElementById("annualBudgetPasswordInput");
  const error = document.getElementById("annualBudgetPasswordError");
  const submit = document.getElementById("annualBudgetPasswordSubmit");
  const cancel = document.getElementById("annualBudgetPasswordCancel");
  if (!modal || !form || !input || !submit || !cancel) return;
  
  error.textContent = "";
  input.value = "";
  modal.style.display = "flex";
  input.focus();
  
  function closeModal() {
    modal.style.display = "none";
    form.onsubmit = null;
    cancel.onclick = null;
    input.onkeydown = null;
  }
  
  form.onsubmit = function (e) {
    e.preventDefault(); // Prevent actual form submission
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
  if (window.DEBUG_MODE) {
    console.log('🏦 [ANNUAL BUDGET PLAN] initializeAnnualBudgetPlan called with:', budgets);
    console.log('🏦 [ANNUAL BUDGET PLAN] budgets length:', budgets?.length);
    console.log('🏦 [ANNUAL BUDGET PLAN] planTable element exists:', !!document.getElementById("planTable"));
    console.log('🏦 [ANNUAL BUDGET PLAN] planTable tbody exists:', !!document.querySelector("#planTable tbody"));
  }
  
  // Ensure budgets is an array
  if (!budgets || !Array.isArray(budgets)) {
    console.warn('🏦 [ANNUAL BUDGET PLAN] budgets is not an array, converting or using empty array');
    if (budgets && typeof budgets === 'object') {
      // Convert object to array
      budgets = Object.entries(budgets).map(([region, data]) => ({
        region,
        assignedBudget: data.assignedBudget || 0
      }));
    } else {
      budgets = [];
    }
  }
  
  // Check if budgets sections are visible
  const budgetsSection = document.getElementById("view-budgets");
  const budgetSetupSection = document.getElementById("view-budget-setup");
  if (window.DEBUG_MODE) {
    console.log('🏦 [ANNUAL BUDGET PLAN] view-budgets display:', budgetsSection?.style.display);
    console.log('🏦 [ANNUAL BUDGET PLAN] view-budget-setup display:', budgetSetupSection?.style.display);
    console.log('🏦 [ANNUAL BUDGET PLAN] planTable visibility:', document.getElementById("planTable")?.offsetParent !== null);
  }
  
  // Ensure the budgets sections are visible (may not be if called too early)
  if (budgetsSection && budgetsSection.style.display === 'none') {
    budgetsSection.style.display = 'block';
  }
  if (budgetSetupSection && budgetSetupSection.style.display === 'none') {
    budgetSetupSection.style.display = 'block';
  }
  
  // Force show the budget setup section since planTable is inside it
  if (budgetSetupSection) {
    budgetSetupSection.style.display = 'block';
    if (window.DEBUG_MODE) {
      console.log('🏦 [ANNUAL BUDGET PLAN] Forced budget setup section to be visible');
    }
  }
  
  // Populate Annual Budget Plan table from budgets.json
  try {
    const planTableBody = document.querySelector("#planTable tbody");
    if (planTableBody) {
      if (window.DEBUG_MODE) {
        console.log('🏦 [ANNUAL BUDGET PLAN] Populating table with', budgets.length, 'rows');
      }
      
      // Clear existing content
      planTableBody.innerHTML = "";
      
      if (budgets.length > 0) {
        budgets.forEach((row, index) => {
          if (window.DEBUG_MODE) {
            console.log('🏦 [ANNUAL BUDGET PLAN] Processing row', index, ':', row);
          }
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><input type="text" value="${row.region || ''}" disabled /></td>
            <td><input type="text" class="plan-usd-input" value="$${Number(row.assignedBudget ?? 0).toLocaleString()}" disabled /></td>
            <td><button class="plan-delete-btn delete-row-btn" title="Delete" disabled><i class="octicon octicon-trash" aria-hidden="true"></i></button></td>
          `;
          planTableBody.appendChild(tr);
        });
      } else {
        // Add an empty row if no data
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" value="" placeholder="Enter region" disabled /></td>
          <td><input type="text" class="plan-usd-input" value="$0" disabled /></td>
          <td><button class="plan-delete-btn delete-row-btn" title="Delete" disabled><i class="octicon octicon-trash" aria-hidden="true"></i></button></td>
        `;
        planTableBody.appendChild(tr);
      }
      
      if (window.DEBUG_MODE) {
        console.log('🏦 [ANNUAL BUDGET PLAN] Table populated successfully');
      }
      
      // Force a redraw to ensure the table is rendered and visible
      const planTable = document.getElementById("planTable");
      if (planTable) {
        // Ensure table is visible
        planTable.style.visibility = 'hidden';
        planTable.style.display = 'table';
        planTable.offsetHeight; // Trigger reflow
        planTable.style.visibility = 'visible';
        
        if (window.DEBUG_MODE) {
          console.log('🏦 [ANNUAL BUDGET PLAN] Forced table redraw and visibility');
        }
      }
    } else {
      console.warn('🏦 [ANNUAL BUDGET PLAN] Cannot find planTable tbody - DOM may not be ready');
      
      // Try again after a short delay if DOM isn't ready
      setTimeout(() => {
        const retryTableBody = document.querySelector("#planTable tbody");
        if (retryTableBody) {
          console.log('🏦 [ANNUAL BUDGET PLAN] Retrying table population after DOM ready');
          initializeAnnualBudgetPlan(budgets);
        }
      }, 200);
    }
  } catch (e) {
    console.error('🏦 [ANNUAL BUDGET PLAN] Error populating table:', e);
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
  
  // Function to ensure annual budget plan table is visible
  ensureAnnualBudgetPlanVisible() {
    const planTable = document.getElementById("planTable");
    const budgetSetupSection = document.getElementById("view-budget-setup");
    
    // First ensure the parent section is visible
    if (budgetSetupSection) {
      if (budgetSetupSection.style.display === 'none' || !budgetSetupSection.offsetParent) {
        budgetSetupSection.style.display = 'block';
        console.log('🏦 [ANNUAL BUDGET PLAN] Made budget setup section visible');
      }
    }
    
    if (planTable) {
      // Check if table has content
      const tbody = planTable.querySelector("tbody");
      const hasRows = tbody && tbody.children.length > 0;
      
      if (!hasRows) {
        // If no rows, try to reinitialize with available data
        console.log('🏦 [ANNUAL BUDGET PLAN] Table has no rows, attempting to reinitialize');
        
        let budgetsData = [];
        try {
          if (window.budgetsTableInstance && window.budgetsTableInstance.getData) {
            budgetsData = window.budgetsTableInstance.getData();
          } else if (window.budgetsObj) {
            if (Array.isArray(window.budgetsObj)) {
              budgetsData = window.budgetsObj;
            } else if (typeof window.budgetsObj === 'object') {
              budgetsData = Object.entries(window.budgetsObj).map(([region, data]) => ({
                region,
                assignedBudget: data.assignedBudget || 0
              }));
            }
          }
          
          this.initializeAnnualBudgetPlan(budgetsData);
        } catch (e) {
          console.warn('Error reinitializing annual budget plan:', e);
        }
      } else {
        // Just ensure visibility
        planTable.style.visibility = 'visible';
        planTable.style.display = 'table';
        console.log('🏦 [ANNUAL BUDGET PLAN] Ensured table visibility');
      }
    }
  },
  
  // Debug function to check annual budget plan status
  debugAnnualBudgetPlan() {
    const planTable = document.getElementById("planTable");
    const tbody = planTable?.querySelector("tbody");
    const budgetsSection = document.getElementById("view-budgets");
    const budgetSetupSection = document.getElementById("view-budget-setup");
    
    console.log('🔍 [DEBUG] Annual Budget Plan Status:');
    console.log('  - planTable exists:', !!planTable);
    console.log('  - planTable visible:', planTable?.offsetParent !== null);
    console.log('  - planTable display:', planTable?.style.display);
    console.log('  - tbody exists:', !!tbody);
    console.log('  - tbody rows:', tbody?.children.length || 0);
    console.log('  - budgets section display:', budgetsSection?.style.display);
    console.log('  - budget setup section display:', budgetSetupSection?.style.display);
    console.log('  - budgetsTableInstance exists:', !!window.budgetsTableInstance);
    console.log('  - budgetsObj exists:', !!window.budgetsObj);
    
    if (tbody && tbody.children.length > 0) {
      console.log('  - First row content:', tbody.children[0].innerHTML);
    }
    
    return {
      tableExists: !!planTable,
      tableVisible: planTable?.offsetParent !== null,
      rowCount: tbody?.children.length || 0,
      sectionsVisible: {
        budgets: budgetsSection?.style.display,
        setup: budgetSetupSection?.style.display
      }
    };
  },
  
  // Quick test function to check and fix visibility
  testAnnualBudgetVisibility() {
    console.log('🧪 [TEST] Testing Annual Budget Plan visibility...');
    
    const result = this.debugAnnualBudgetPlan();
    
    if (!result.tableVisible) {
      console.log('🔧 [TEST] Table not visible, attempting to fix...');
      this.ensureAnnualBudgetPlanVisible();
      
      // Re-check after fix
      setTimeout(() => {
        const newResult = this.debugAnnualBudgetPlan();
        console.log('🎯 [TEST] Fix result - Table visible:', newResult.tableVisible);
      }, 100);
    } else {
      console.log('✅ [TEST] Table is already visible!');
    }
  },
  
  // Performance utilities
  debounce,
  PERFORMANCE_CONFIG: BUDGETS_PERFORMANCE_CONFIG,
  
  // Cached calculation system for better performance
  _calculationCache: new Map(),
  
  // Method to clear calculation cache when data changes
  clearCalculationCache() {
    this._calculationCache.clear();
    
    // Also clear ROI budgets cache if available to maintain consistency
    if (window.roiModule) {
      // Reset ROI budget data cache
      console.log('[BUDGETS] Clearing ROI budget cache for consistency');
      setTimeout(() => {
        if (typeof window.roiModule.updateRemainingBudget === 'function') {
          window.roiModule.updateRemainingBudget({});
        }
        if (typeof window.roiModule.updateForecastedBudgetUsage === 'function') {
          window.roiModule.updateForecastedBudgetUsage({});
        }
      }, 100);
    }
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

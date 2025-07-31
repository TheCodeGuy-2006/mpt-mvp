// ...existing code...
// charts.js - Chart rendering and visualization utilities

// CHARTS PERFORMANCE CONFIGURATION
const CHARTS_PERFORMANCE_CONFIG = {
  // Chart animation and interaction settings for better performance
  chartAnimationDuration: 300, // Reduced from default 1000ms
  chartResponsiveness: true,
  chartMaintainAspectRatio: false,
  
  // Debounce timings for chart updates
  chartUpdateDebounce: 200,
  windowResizeDebounce: 150,
  filterUpdateDebounce: 300,
  
  // Chart refresh and cache settings
  chartCacheTimeout: 30000, // 30 seconds
  
  // Rendering optimizations
  useRequestAnimationFrame: true,
  batchChartUpdates: true,
  maxConcurrentCharts: 3
}

// Performance utilities for charts
const chartsPerformanceUtils = {
  // Debounce utility
  debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Throttle utility for frequent updates
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Optimized chart update using requestAnimationFrame
  optimizedChartUpdate(updateFunction) {
    if (CHARTS_PERFORMANCE_CONFIG.useRequestAnimationFrame) {
      requestAnimationFrame(() => {
        updateFunction();
      });
    } else {
      updateFunction();
    }
  },

  // Chart instance cleanup
  cleanupChart(chartInstance) {
    if (chartInstance && typeof chartInstance.destroy === 'function') {
      chartInstance.destroy();
      return null;
    }
    return chartInstance;
  }
};

// Intelligent chart caching system
const chartCache = {
  cache: new Map(),
  
  set(key, data, ttl = CHARTS_PERFORMANCE_CONFIG.chartCacheTimeout) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
    
    // Auto cleanup expired entries
    setTimeout(() => {
      if (this.cache.has(key) && Date.now() > this.cache.get(key).expiry) {
        this.cache.delete(key);
      }
    }, ttl);
  },
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  },
  
  clear() {
    this.cache.clear();
  },
  
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
};

// Global chart instances for cleanup
let roiGaugeChart = null;

// Initialize Chart.js if not already loaded (with performance optimizations)
const initializeChartJS = chartsPerformanceUtils.debounce(() => {
  if (!window.Chart) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = () => {
      // Set global Chart.js performance defaults
      if (window.Chart) {
        Chart.defaults.animation.duration = CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration;
        Chart.defaults.responsive = CHARTS_PERFORMANCE_CONFIG.chartResponsiveness;
        Chart.defaults.maintainAspectRatio = CHARTS_PERFORMANCE_CONFIG.chartMaintainAspectRatio;
      }
      // Only render if data is available
      chartsPerformanceUtils.optimizedChartUpdate(() => {
        if (typeof renderBudgetsBarChart === "function") {
          renderBudgetsBarChart();
        }
        if (typeof renderBudgetsRegionCharts === "function") {
          renderBudgetsRegionCharts();
        }
      });
    };
    document.head.appendChild(script);
  } else {
    // Chart.js already loaded - apply performance settings
    Chart.defaults.animation.duration = CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration;
    Chart.defaults.responsive = CHARTS_PERFORMANCE_CONFIG.chartResponsiveness;
    Chart.defaults.maintainAspectRatio = CHARTS_PERFORMANCE_CONFIG.chartMaintainAspectRatio;
    chartsPerformanceUtils.optimizedChartUpdate(() => {
      if (typeof renderBudgetsBarChart === "function") {
        renderBudgetsBarChart();
      }
      if (typeof renderBudgetsRegionCharts === "function") {
        renderBudgetsRegionCharts();
      }
    });
  }
}, 100);

// Budgets Bar Chart (optimized with caching and performance improvements)
const renderBudgetsBarChart = chartsPerformanceUtils.debounce(() => {
  const ctx = document.getElementById("budgetsBarChart");
  if (!ctx) {
    console.error("[BudgetsBarChart] Canvas with id 'budgetsBarChart' not found.");
    return;
  }

  // Check cache first
  const cacheKey = 'budgets-bar-chart';
  const cachedData = chartCache.get(cacheKey);

  // Get budgets data from the table or from the budgets object
  let budgetsData = [];
  if (window.budgetsTableInstance) {
    budgetsData = window.budgetsTableInstance.getData();
    console.info("[BudgetsBarChart] Loaded budgets data from budgetsTableInstance", budgetsData);
  } else if (window.budgetsObj) {
    budgetsData = Object.entries(window.budgetsObj).map(([region, data]) => ({
      region,
      ...data,
    }));
    console.info("[BudgetsBarChart] Loaded budgets data from budgetsObj", budgetsData);
  } else {
    console.warn("[BudgetsBarChart] No budgetsTableInstance or budgetsObj found on window.");
  }

  if (!budgetsData || budgetsData.length === 0) {
    console.warn("[BudgetsBarChart] No budgets data found to render.", { budgetsData });
    return;
  }

  // Create cache signature for change detection
  const dataSignature = JSON.stringify(budgetsData.map(d => ({ 
    region: d.region || d.Region, 
    budget: d.assignedBudget || d.AssignedBudget 
  })));

  // Use cached data if unchanged
  if (cachedData && cachedData.signature === dataSignature) {
    console.info("[BudgetsBarChart] Using cached data, no changes detected.");
    return;
  }

  // Prepare data for chart
  const labels = budgetsData.map((row) => row.region || row.Region || "");
  const values = budgetsData.map((row) =>
    Number(row.assignedBudget || row.AssignedBudget || 0),
  );

  // Cache processed data
  chartCache.set(cacheKey, { signature: dataSignature, labels, values });

  // Destroy previous chart if exists
  if (window.budgetsBarChartInstance) {
    window.budgetsBarChartInstance = chartsPerformanceUtils.cleanupChart(window.budgetsBarChartInstance);
    console.info("[BudgetsBarChart] Destroyed previous chart instance.");
  }

  chartsPerformanceUtils.optimizedChartUpdate(() => {
    try {
      window.budgetsBarChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Assigned Budget (USD)",
              data: values,
              backgroundColor: "#1976d2",
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration
          },
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 600000,
              title: { display: true, text: "Dollars (USD)" },
              ticks: { callback: (v) => "$" + v.toLocaleString() },
            },
            x: {
              title: { display: false },
            },
          },
        },
      });
      console.info("[BudgetsBarChart] Chart rendered successfully.");
    } catch (err) {
      console.error("[BudgetsBarChart] Error rendering chart:", err);
    }
  });
}, CHARTS_PERFORMANCE_CONFIG.chartUpdateDebounce);

// Budgets Region Charts (optimized with intelligent caching and batch processing)
const renderBudgetsRegionCharts = chartsPerformanceUtils.debounce(() => {
  const container = document.getElementById("budgetsChartsContainer");
  if (!container) {
    console.error("[BudgetsRegionCharts] Container with id 'budgetsChartsContainer' not found.");
    return;
  }

  // Check cache for region data
  const cacheKey = 'budgets-region-charts';
  let shouldRebuild = true;

  // Get budgets data
  let budgetsData = [];
  if (window.budgetsTableInstance) {
    budgetsData = window.budgetsTableInstance.getData();
  } else if (window.budgetsObj) {
    budgetsData = Object.entries(window.budgetsObj).map(([region, data]) => ({
      region,
      ...data,
    }));
  }
  if (!budgetsData || budgetsData.length === 0) {
    console.warn("[BudgetsRegionCharts] No budgets data found.", { budgetsData });
  }

  // Get planning data (for forecasted/actual cost)
  let planningRows = [];
  if (window.planningTableInstance) {
    planningRows = window.planningTableInstance.getData();
  } else if (window.planningRows) {
    planningRows = window.planningRows;
  }
  if (!planningRows || planningRows.length === 0) {
    console.warn("[BudgetsRegionCharts] No planning data found.", { planningRows });
  }

  // Create data signature for caching
  const dataSignature = JSON.stringify({
    budgets: budgetsData.length,
    planning: planningRows.length,
    budgetSum: budgetsData.reduce((sum, b) => sum + (Number(b.assignedBudget) || 0), 0),
    forecastSum: planningRows.reduce((sum, p) => sum + (Number(p.forecastedCost) || 0), 0)
  });

  const cachedRegionData = chartCache.get(cacheKey);
  if (cachedRegionData && cachedRegionData.signature === dataSignature) {
    shouldRebuild = false;
    console.info("[BudgetsRegionCharts] Using cached region data.");
  }

  if (!shouldRebuild) {
    return;
  }

  // Clear container and rebuild
  container.innerHTML = "";

  // Get all unique regions from budgets and planning
  const allRegions = Array.from(
    new Set([
      ...budgetsData.map((b) => b.region),
      ...planningRows.map((r) => r.region),
    ]),
  ).filter(Boolean);
  if (allRegions.length === 0) {
    console.warn("[BudgetsRegionCharts] No regions found to render.", { allRegions });
    return;
  }

  // Cache the processed data
  chartCache.set(cacheKey, { signature: dataSignature, regions: allRegions });

  // Batch process regions for better performance
  const processRegionBatch = (startIndex, batchSize = 2) => {
    const endIndex = Math.min(startIndex + batchSize, allRegions.length);

    for (let idx = startIndex; idx < endIndex; idx++) {
      const region = allRegions[idx];

      // Create row container if needed
      if (idx % 4 === 0) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "budgets-graph-row";
        rowDiv.style.cssText = `
          display: flex;
          flex-direction: row;
          gap: 24px;
          margin-bottom: 24px;
        `;
        container.appendChild(rowDiv);
      }

      const currentRow = container.lastElementChild;
      processRegionChart(region, currentRow, budgetsData, planningRows);
    }

    // Process next batch
    if (endIndex < allRegions.length) {
      chartsPerformanceUtils.optimizedChartUpdate(() => {
        processRegionBatch(endIndex, batchSize);
      });
    }
  };

  // Start batch processing
  if (allRegions.length > 0) {
    processRegionBatch(0);
  }
}, CHARTS_PERFORMANCE_CONFIG.chartUpdateDebounce);

// Helper function to process individual region chart
function processRegionChart(region, rowContainer, budgetsData, planningRows) {
  // Debug: Confirm function is called
  console.log(`[Region Chart] processRegionChart called for region: ${region}`);
  // Debug: About to create chart for region
  console.log(`[Region Chart] Creating chart for region: ${region}`);
  // Assigned budget
  const budgetObj = budgetsData.find((b) => b.region === region);
  const assignedBudget = budgetObj && budgetObj.assignedBudget
    ? Number(budgetObj.assignedBudget) : 0;

  let regionForecasts, forecastedCost, actualCost;
  if (region === "Digital Motions") {
    // For Digital Motions, use all rows where digitalMotions === true
    regionForecasts = planningRows.filter(
      (r) => r.digitalMotions === true && typeof r.forecastedCost === "number"
    );
    forecastedCost = regionForecasts.reduce(
      (sum, r) => sum + r.forecastedCost, 0
    );
    actualCost = planningRows
      .filter((r) => r.digitalMotions === true && typeof r.actualCost === "number")
      .reduce((sum, r) => sum + r.actualCost, 0);
  } else {
    // For all other regions, use region match
    regionForecasts = planningRows.filter(
      (r) => r.region === region && typeof r.forecastedCost === "number"
    );
    forecastedCost = regionForecasts.reduce(
      (sum, r) => sum + r.forecastedCost, 0
    );
    actualCost = planningRows
      .filter((r) => r.region === region && typeof r.actualCost === "number")
      .reduce((sum, r) => sum + r.actualCost, 0);
  }

  // Create chart canvas and fullscreen button
  const chartDiv = document.createElement("div");
  chartDiv.style.cssText = `
    width: 300px;
    height: auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(25,118,210,0.08);
    padding: 18px 12px 8px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  `;

  // Title and canvas with explicit height for label space
  chartDiv.innerHTML = `
    <h3 style="font-size:1.18rem;margin:0 0 12px 0;color:#1976d2;">${region}</h3>
    <canvas id="chart-${region}" width="280" height="220"></canvas>
  `;

  // Fullscreen button
  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.className = "graph-fullscreen-btn";
  fullscreenBtn.title = "Expand graph";
  fullscreenBtn.innerHTML = "⛶";
  fullscreenBtn.style.cssText = `
    position: absolute;
    top: 6px;
    right: 8px;
    font-size: 1.2em;
    background: #fff;
    border: 2px solid #1976d2;
    border-radius: 6px;
    color: #1976d2;
    cursor: pointer;
    opacity: 1;
    padding: 2px 8px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(25,118,210,0.12);
    transition: background 0.2s, border 0.2s;
  `;
  chartDiv.appendChild(fullscreenBtn);
  rowContainer.appendChild(chartDiv);

  // Render chart with performance optimization
  chartsPerformanceUtils.optimizedChartUpdate(() => {
    const ctx = chartDiv.querySelector("canvas");
    if (!ctx) return;
    if (ctx.chartInstance) {
      ctx.chartInstance = chartsPerformanceUtils.cleanupChart(ctx.chartInstance);
    }
    
    ctx.chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Assigned", "Forecasted", "Actual"],
        datasets: [
          {
            label: "USD",
            data: [assignedBudget, forecastedCost, actualCost],
            backgroundColor: ["#1976d2", "#42a5f5", "#66bb6a"],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          duration: CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration
        },
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 25  // Extra bottom padding for x-axis labels
          }
        },
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 600000,
            title: { display: true, text: "Dollars (USD)" },
            ticks: { callback: (v) => "$" + v.toLocaleString() },
          },
          x: {
            type: 'category',
            title: { display: false },
            ticks: {
              display: true,
              maxRotation: 0,
              minRotation: 0,
              font: {
                size: 11
              },
              padding: 5,
              userCallback: function(label, index, labels) {
                // Always return the label as-is
                return label;
              }
            }
          },
        },
      },
    });
  });

  // Optimized fullscreen overlay logic
  fullscreenBtn.onclick = chartsPerformanceUtils.throttle(function () {
    createFullscreenOverlay(region, assignedBudget, forecastedCost, actualCost, regionForecasts);
  }, 500); // Throttle to prevent double-clicks
}

// Helper function to create fullscreen overlay (extracted for better performance)
function createFullscreenOverlay(region, assignedBudget, forecastedCost, actualCost, regionForecasts) {
  let overlay = document.getElementById("graphFullscreenOverlay");
  if (overlay) {
    overlay.remove();
    return;
  }

  overlay = document.createElement("div");
  overlay.id = "graphFullscreenOverlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(20,30,60,0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  overlay.onclick = function (e) {
    if (e.target === overlay) overlay.remove();
  };
  document.body.appendChild(overlay);

  // Chart container for fullscreen
  const fsDiv = document.createElement("div");
  fsDiv.style.cssText = `
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 32px rgba(25,118,210,0.18);
    padding: 32px 32px 18px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 85vw;
    height: 80vh;
  `;

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.title = "Close";
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 16px;
    font-size: 1.3em;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.7;
  `;
  closeBtn.onclick = () => overlay.remove();
  fsDiv.appendChild(closeBtn);

  // Title
  const title = document.createElement("h2");
  title.textContent = region;
  title.style.cssText = `
    color: #1976d2;
    margin: 0 0 18px 0;
  `;
  fsDiv.appendChild(title);

  // Content container with chart and breakdown side by side
  const contentDiv = document.createElement("div");
  contentDiv.style.cssText = `
    display: flex;
    gap: 32px;
    width: 100%;
    height: calc(100% - 80px);
    align-items: flex-start;
  `;

  // Chart container
  const chartContainer = document.createElement("div");
  chartContainer.style.cssText = `
    flex: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  `;

  // Canvas
  const fsCanvas = document.createElement("canvas");
  fsCanvas.width = Math.floor(window.innerWidth * 0.5);
  fsCanvas.height = Math.floor(window.innerHeight * 0.55);
  chartContainer.appendChild(fsCanvas);
  contentDiv.appendChild(chartContainer);

  // Breakdown container (only show if there are multiple forecasts)
  if (regionForecasts.length > 1) {
    const breakdownContainer = document.createElement("div");
    breakdownContainer.style.cssText = `
      flex: 1;
      min-width: 300px;
      max-width: 400px;
      height: 100%;
      overflow-y: auto;
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e3f2fd;
    `;

    // Breakdown title
    const breakdownTitle = document.createElement("h3");
    breakdownTitle.textContent = "Forecasted Cost Breakdown";
    breakdownTitle.style.cssText = `
      color: #1976d2;
      margin: 0 0 16px 0;
      font-size: 1.2rem;
      font-weight: 600;
    `;
    breakdownContainer.appendChild(breakdownTitle);

    // Breakdown items
    regionForecasts.forEach((r, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.style.cssText = `
        margin-bottom: 12px;
        padding: 12px;
        background: #ffffff;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      `;

      const campaignName = document.createElement("div");
      campaignName.textContent = `${index + 1}. ${r.programType ? r.programType : `Program ${index + 1}`}`;
      campaignName.style.cssText = `
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
        font-size: 0.95rem;
      `;

      const costValue = document.createElement("div");
      costValue.textContent = `$${Number(r.forecastedCost).toLocaleString()}`;
      costValue.style.cssText = `
        color: #1976d2;
        font-weight: 700;
        font-size: 1.1rem;
      `;

      itemDiv.appendChild(campaignName);
      itemDiv.appendChild(costValue);
      breakdownContainer.appendChild(itemDiv);
    });

    // Total at the bottom
    const totalDiv = document.createElement("div");
    totalDiv.style.cssText = `
      margin-top: 16px;
      padding: 16px;
      background: #1976d2;
      color: #ffffff;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.1rem;
      text-align: center;
    `;
    totalDiv.textContent = `Total: $${Number(forecastedCost).toLocaleString()}`;
    breakdownContainer.appendChild(totalDiv);

    contentDiv.appendChild(breakdownContainer);
  }

  fsDiv.appendChild(contentDiv);
  overlay.appendChild(fsDiv);

  // Render chart in fullscreen with performance optimization
  chartsPerformanceUtils.optimizedChartUpdate(() => {
    new Chart(fsCanvas, {
      type: "bar",
      data: {
        labels: ["Assigned", "Forecasted", "Actual"],
        datasets: [
          {
            label: "USD",
            data: [assignedBudget, forecastedCost, actualCost],
            backgroundColor: ["#1976d2", "#42a5f5", "#66bb6a"],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: false,
        animation: {
          duration: CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration
        },
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 600000,
            title: { display: true, text: "Dollars (USD)" },
            ticks: { callback: (v) => "$" + v.toLocaleString() },
          },
          x: {
            title: { display: false },
          },
        },
      },
    });
  });
}

// ROI by Region Chart (optimized with caching and filtering)
const renderRoiByRegionChart = chartsPerformanceUtils.debounce(() => {
  // Get current ROI filter state
  const filters = window.roiModule ? window.roiModule.getFilterState ? window.roiModule.getFilterState() : {} : {};
  
  // Create cache key based on filters
  const cacheKey = `roi-region-chart-${JSON.stringify(filters)}`;
  const cachedData = chartCache.get(cacheKey);
  
  // Define the specific regions to display
  const targetRegions = ["JP & Korea", "South APAC", "SAARC"];

  // Prepare data
  let regionMap = {};

  // Initialize all target regions with zero values
  targetRegions.forEach((region) => {
    regionMap[region] = { spend: 0, pipeline: 0 };
  });

  if (window.executionTableInstance) {
    const data = window.executionTableInstance.getData();
    
    // Helper function to normalize quarter formats for comparison
    const normalizeQuarter = (quarter) => {
      if (!quarter) return '';
      return quarter.replace(/\s*-\s*/g, ' ').trim();
    };
    
    // Process data with filtering
    data.forEach((row) => {
      // Apply filters before processing data
      if (filters.region && row.region !== filters.region) return;
      if (filters.quarter && normalizeQuarter(row.quarter) !== normalizeQuarter(filters.quarter)) return;
      if (filters.country && row.country !== filters.country) return;
      if (filters.owner && row.owner !== filters.owner) return;
      if (filters.status && row.status !== filters.status) return;
      if (filters.programType && row.programType !== filters.programType) return;
      if (filters.strategicPillars && row.strategicPillars !== filters.strategicPillars) return;
      if (filters.revenuePlay && row.revenuePlay !== filters.revenuePlay) return;
      
      const region = row.region;
      // Only process data for our target regions
      if (targetRegions.includes(region)) {
        let spend = row.actualCost;
        if (typeof spend === "string")
          spend = Number(spend.toString().replace(/[^\d.-]/g, ""));
        if (!isNaN(spend)) regionMap[region].spend += Number(spend);
        let pipeline = row.pipelineForecast;
        if (typeof pipeline === "string")
          pipeline = Number(pipeline.toString().replace(/[^\d.-]/g, ""));
        if (!isNaN(pipeline)) regionMap[region].pipeline += Number(pipeline);
      }
    });
  }

  const roiPercents = targetRegions.map((region) => {
    const vals = regionMap[region];
    return vals.spend > 0 ? (vals.pipeline / vals.spend) * 100 : 0;
  });
  
  // Cache the processed data
  chartCache.set(cacheKey, { roiPercents, targetRegions });

  // Use the predefined chart container
  const ctx = document.getElementById("roiRegionChart");
  if (!ctx) return;

  // Destroy previous chart if exists
  if (window.roiRegionChartInstance) {
    window.roiRegionChartInstance = chartsPerformanceUtils.cleanupChart(window.roiRegionChartInstance);
  }

  chartsPerformanceUtils.optimizedChartUpdate(() => {
    window.roiRegionChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: targetRegions,
        datasets: [
          {
            label: "ROI %",
            data: roiPercents,
            backgroundColor: "#42a5f5",
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration
        },
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.parsed.y.toFixed(1) + "%";
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value + "%";
              },
              font: { size: 12 },
            },
          },
          x: {
            ticks: {
              font: { size: 12 },
            },
          },
        },
      },
    });
  });
}, CHARTS_PERFORMANCE_CONFIG.filterUpdateDebounce);

// ROI by Program Type Table (replacing chart) - optimized with debouncing
const renderRoiByProgramTypeChart = chartsPerformanceUtils.debounce(() => {
  // Get the chart container and replace it with a table
  const container = document.getElementById("roiProgramTypeChartContainer");
  if (!container) return;

  // Find the chart div and replace it with a table container
  const chartDiv = container.querySelector('div[style*="max-width: 800px"]');
  if (!chartDiv) return;

  // Create table HTML
  const tableHTML = `
    <div style="width: 100%; max-width: 800px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #1976d2; color: white;">
            <th style="padding: 16px; text-align: left; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">Column 1</th>
            <th style="padding: 16px; text-align: left; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">Column 2</th>
            <th style="padding: 16px; text-align: left; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">Column 3</th>
            <th style="padding: 16px; text-align: left; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">Column 4</th>
            <th style="padding: 16px; text-align: left; font-weight: 600;">Column 5</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #f8f9fa;">
            <td style="padding: 16px; border-right: 1px solid #e0e0e0; color: #333;">Data 1</td>
            <td style="padding: 16px; border-right: 1px solid #e0e0e0; color: #333;">Data 2</td>
            <td style="padding: 16px; border-right: 1px solid #e0e0e0; color: #333;">Data 3</td>
            <td style="padding: 16px; border-right: 1px solid #e0e0e0; color: #333;">Data 4</td>
            <td style="padding: 16px; color: #333;">Data 5</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  // Replace the chart div with the table
  chartDiv.outerHTML = tableHTML;
}, CHARTS_PERFORMANCE_CONFIG.chartUpdateDebounce);

// Forecasted vs Actual Performance Chart (optimized with caching and filtering)
const renderRoiByQuarterChart = chartsPerformanceUtils.debounce(() => {
  // Get current ROI filter state
  const filters = window.roiModule ? window.roiModule.getFilterState ? window.roiModule.getFilterState() : {} : {};

  // Create cache key based on filters
  const cacheKey = `roi-quarter-chart-${JSON.stringify(filters)}`;
  const cachedData = chartCache.get(cacheKey);

  // Always use planning table for forecasted bars
  let forecastedMql = 0;
  let forecastedLeads = 0;
  let hasPlanningData = false;
  let actualMql = 0;
  let actualLeads = 0;
  let hasExecutionData = false;

  // Helper to normalize quarter
  const normalizeQuarter = (quarter) => {
    if (!quarter) return '';
    return quarter.replace(/\s*-\s*/g, ' ').trim();
  };

  // Get forecasted from planning table
  let planningRows = [];
  if (window.planningTableInstance) {
    planningRows = window.planningTableInstance.getData();
    console.log('[ROI CHART] planningTableInstance found, rows:', planningRows);
  } else if (window.planningRows) {
    planningRows = window.planningRows;
    console.log('[ROI CHART] window.planningRows fallback, rows:', planningRows);
  } else {
    console.warn('[ROI CHART] No planningTableInstance or planningRows found');
  }
  console.log('[ROI CHART] Filters:', filters);
  if (Array.isArray(planningRows) && planningRows.length > 0) {
    hasPlanningData = true;
    let filteredCount = 0;
    planningRows.forEach((row) => {
      // Multi-select filter logic: only filter if array is non-empty
      if (Array.isArray(filters.region) && filters.region.length > 0 && !filters.region.includes(row.region)) return;
      if (Array.isArray(filters.quarter) && filters.quarter.length > 0 && !filters.quarter.includes(normalizeQuarter(row.quarter))) return;
      if (Array.isArray(filters.country) && filters.country.length > 0 && !filters.country.includes(row.country)) return;
      if (Array.isArray(filters.owner) && filters.owner.length > 0 && !filters.owner.includes(row.owner)) return;
      if (Array.isArray(filters.status) && filters.status.length > 0 && !filters.status.includes(row.status)) return;
      if (Array.isArray(filters.programType) && filters.programType.length > 0 && !filters.programType.includes(row.programType)) return;
      if (Array.isArray(filters.strategicPillars) && filters.strategicPillars.length > 0 && !filters.strategicPillars.includes(row.strategicPillars)) return;
      if (Array.isArray(filters.revenuePlay) && filters.revenuePlay.length > 0 && !filters.revenuePlay.includes(row.revenuePlay)) return;

      filteredCount++;
      let fMql = row.mqlForecast || 0;
      if (typeof fMql === "string") fMql = Number(fMql.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(fMql)) forecastedMql += Number(fMql);

      let fLeads = row.expectedLeads || 0;
      if (typeof fLeads === "string") fLeads = Number(fLeads.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(fLeads)) forecastedLeads += Number(fLeads);
    });
    console.log(`[ROI CHART] Planning rows: total=${planningRows.length}, filtered=${filteredCount}, forecastedMql=${forecastedMql}, forecastedLeads=${forecastedLeads}`);
  } else {
    console.warn('[ROI CHART] planningRows is empty or not an array:', planningRows);
  }

  // Get actuals from execution table if available
  if (window.executionTableInstance) {
    const execRows = window.executionTableInstance.getData();
    console.log('[ROI CHART] executionTableInstance found, rows:', execRows);
    if (Array.isArray(execRows) && execRows.length > 0) {
      let execFilteredCount = 0;
      execRows.forEach((row) => {
        // Multi-select filter logic: only filter if array is non-empty
        if (Array.isArray(filters.region) && filters.region.length > 0 && !filters.region.includes(row.region)) return;
        if (Array.isArray(filters.quarter) && filters.quarter.length > 0 && !filters.quarter.includes(normalizeQuarter(row.quarter))) return;
        if (Array.isArray(filters.country) && filters.country.length > 0 && !filters.country.includes(row.country)) return;
        if (Array.isArray(filters.owner) && filters.owner.length > 0 && !filters.owner.includes(row.owner)) return;
        if (Array.isArray(filters.status) && filters.status.length > 0 && !filters.status.includes(row.status)) return;
        if (Array.isArray(filters.programType) && filters.programType.length > 0 && !filters.programType.includes(row.programType)) return;
        if (Array.isArray(filters.strategicPillars) && filters.strategicPillars.length > 0 && !filters.strategicPillars.includes(row.strategicPillars)) return;
        if (Array.isArray(filters.revenuePlay) && filters.revenuePlay.length > 0 && !filters.revenuePlay.includes(row.revenuePlay)) return;

        execFilteredCount++;
        hasExecutionData = true;
        let aMql = row.actualMQLs || 0;
        if (typeof aMql === "string") aMql = Number(aMql.toString().replace(/[^\d.-]/g, ""));
        if (!isNaN(aMql)) actualMql += Number(aMql);

        let aLeads = row.actualLeads || 0;
        if (typeof aLeads === "string") aLeads = Number(aLeads.toString().replace(/[^\d.-]/g, ""));
        if (!isNaN(aLeads)) actualLeads += Number(aLeads);
      });
      console.log(`[ROI CHART] Execution rows: total=${execRows.length}, filtered=${execFilteredCount}, actualMql=${actualMql}, actualLeads=${actualLeads}`);
    } else {
      console.warn('[ROI CHART] executionTableInstance rows is empty or not an array:', execRows);
    }
  } else {
    console.warn('[ROI CHART] No executionTableInstance found');
  }

  // Cache processed data
  const chartData = { forecastedMql, actualMql, forecastedLeads, actualLeads };
  chartCache.set(cacheKey, chartData);
  console.log('[ROI CHART] Final chartData:', chartData, 'hasPlanningData:', hasPlanningData, 'hasExecutionData:', hasExecutionData);

  // Use the predefined chart container
  const ctx = document.getElementById("roiQuarterChart");
  if (!ctx) return;

  // Destroy previous chart if exists
  if (window.roiQuarterChartInstance) {
    window.roiQuarterChartInstance = chartsPerformanceUtils.cleanupChart(window.roiQuarterChartInstance);
  }

  // If no planning data, show a message
  if (!hasPlanningData || (forecastedMql === 0 && forecastedLeads === 0)) {
    // Clear canvas and show message
    const parent = ctx.parentElement;
    ctx.style.display = 'none';
    let msg = parent.querySelector('.no-chart-data-msg');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'no-chart-data-msg';
      msg.style.cssText = 'text-align:center;padding:32px 0;color:#888;font-size:1.1em;';
      parent.appendChild(msg);
    }
    msg.textContent = 'No planning data available for this chart.';
    return;
  } else {
    // Remove message if present
    const parent = ctx.parentElement;
    ctx.style.display = '';
    const msg = parent.querySelector('.no-chart-data-msg');
    if (msg) msg.remove();
  }

  // If no execution data, set actuals to zero and show a note
  let showNoActualsNote = !hasExecutionData;

  chartsPerformanceUtils.optimizedChartUpdate(() => {
    window.roiQuarterChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["MQL", "Leads"],
        datasets: [
          {
            label: "Forecasted",
            data: [forecastedMql, forecastedLeads],
            backgroundColor: "#42a5f5",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: "Actual",
            data: [hasExecutionData ? actualMql : 0, hasExecutionData ? actualLeads : 0],
            backgroundColor: "#66bb6a",
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y", // This makes it horizontal
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          title: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return (
                  context.dataset.label + ": " + context.parsed.x.toLocaleString()
                );
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value.toLocaleString();
              },
              font: { size: 12 },
            },
          },
          y: {
            ticks: {
              font: { size: 12 },
            },
          },
        },
      },
    });

    // Show a note if there is no execution data
    if (showNoActualsNote) {
      const parent = ctx.parentElement;
      let note = parent.querySelector('.no-actuals-note');
      if (!note) {
        note = document.createElement('div');
        note.className = 'no-actuals-note';
        note.style.cssText = 'text-align:center;padding:8px 0;color:#888;font-size:0.95em;';
        parent.appendChild(note);
      }
      note.textContent = 'No actuals data available yet. Only forecasted values are shown.';
    } else {
      const parent = ctx.parentElement;
      const note = parent.querySelector('.no-actuals-note');
      if (note) note.remove();
    }
  });
}, CHARTS_PERFORMANCE_CONFIG.filterUpdateDebounce);

// ROI Gauge Chart (optimized with performance settings)
const updateRoiGauge = chartsPerformanceUtils.throttle((roiPercent) => {
  const ctx = document.getElementById("roiGaugeChart");
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (roiGaugeChart) {
    roiGaugeChart = chartsPerformanceUtils.cleanupChart(roiGaugeChart);
  }

  // Determine gauge color based on ROI performance
  let gaugeColor = "#d32f2f"; // Red for poor performance
  let performanceText = "Poor";

  if (roiPercent >= 300) {
    gaugeColor = "#2e7d32"; // Dark green for excellent
    performanceText = "Excellent";
  } else if (roiPercent >= 200) {
    gaugeColor = "#388e3c"; // Green for very good
    performanceText = "Very Good";
  } else if (roiPercent >= 100) {
    gaugeColor = "#689f38"; // Light green for good
    performanceText = "Good";
  } else if (roiPercent >= 50) {
    gaugeColor = "#ffa000"; // Orange for fair
    performanceText = "Fair";
  }

  // Create doughnut chart configured as a gauge with performance optimizations
  chartsPerformanceUtils.optimizedChartUpdate(() => {
    roiGaugeChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [Math.min(roiPercent, 400), Math.max(400 - roiPercent, 0)], // Cap at 400% for display
            backgroundColor: [gaugeColor, "#e0e0e0"],
            borderWidth: 0,
            circumference: 180,
            rotation: 270,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        cutout: "75%",
        animation: {
          duration: CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        elements: {
          arc: {
            borderWidth: 0,
          },
        },
      },
      plugins: [
        {
          id: "gaugeText",
          beforeDraw: function (chart) {
            const ctx = chart.ctx;
            ctx.save();

            // ROI percentage text
            ctx.font = "bold 24px Arial";
            ctx.fillStyle = gaugeColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY =
              (chart.chartArea.top + chart.chartArea.bottom) / 2 + 10;
            ctx.fillText(roiPercent.toFixed(1) + "%", centerX, centerY);

            // Performance text
            ctx.font = "14px Arial";
            ctx.fillStyle = "#666";
            ctx.fillText(performanceText, centerX, centerY + 25);

            ctx.restore();
          },
        },
      ],
    });
  });
}, 300); // Throttle gauge updates

// Report Spend by Region Chart (optimized with caching)
const createReportSpendByRegionChart = chartsPerformanceUtils.debounce((spendByRegion) => {
  const canvas = document.getElementById("reportSpendByRegionChart");
  if (!canvas) return;

  // Check cache for spend data
  const cacheKey = `report-spend-chart-${JSON.stringify(spendByRegion)}`;
  if (chartCache.has(cacheKey)) {
    return; // Use cached chart
  }

  // Destroy existing chart if it exists
  if (window.reportSpendChart) {
    window.reportSpendChart = chartsPerformanceUtils.cleanupChart(window.reportSpendChart);
  }

  const ctx = canvas.getContext("2d");
  const regions = Object.keys(spendByRegion).sort();
  const amounts = regions.map((region) => spendByRegion[region]);
  
  // Cache the processed data
  chartCache.set(cacheKey, { regions, amounts });

  chartsPerformanceUtils.optimizedChartUpdate(() => {
    window.reportSpendChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: regions,
        datasets: [
          {
            label: "Forecasted Spend",
            data: amounts,
            backgroundColor: "rgba(25, 118, 210, 0.6)",
            borderColor: "rgba(25, 118, 210, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: CHARTS_PERFORMANCE_CONFIG.chartAnimationDuration
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "£" + value.toLocaleString();
              },
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return "Forecasted Spend: £" + context.parsed.y.toLocaleString();
              },
            },
          },
          legend: {
            display: false,
          },
        },
      },
    });
  });
}, CHARTS_PERFORMANCE_CONFIG.chartUpdateDebounce);

// ROI Tab Functionality (optimized with debounced tab switching)
const initRoiTabSwitching = chartsPerformanceUtils.debounce(() => {
  const regionTabBtn = document.getElementById("roiRegionTabBtn");
  const dataTableTabBtn = document.getElementById("roiProgramTypeTabBtn");
  const quarterTabBtn = document.getElementById("roiQuarterTabBtn");
  const regionPanel = document.getElementById("roiRegionChartContainer");
  const dataTablePanel = document.getElementById(
    "roiProgramTypeChartContainer",
  );
  const quarterPanel = document.getElementById("roiQuarterChartContainer");

  if (
    !regionTabBtn ||
    !dataTableTabBtn ||
    !quarterTabBtn ||
    !regionPanel ||
    !dataTablePanel ||
    !quarterPanel
  ) {
    return;
  }

  // Optimized tab switching function with debouncing
  const switchToTab = chartsPerformanceUtils.debounce((activeTab, activePanel) => {
    // Reset all tabs
    [regionTabBtn, dataTableTabBtn, quarterTabBtn].forEach((btn) => {
      btn.style.background = "#f5f5f5";
      btn.style.color = "#666";
      btn.classList.remove("active");
    });

    // Reset all panels
    [regionPanel, dataTablePanel, quarterPanel].forEach((panel) => {
      panel.style.display = "none";
      panel.classList.remove("active");
    });

    // Activate selected tab and panel
    activeTab.style.background = "#1976d2";
    activeTab.style.color = "white";
    activeTab.classList.add("active");

    activePanel.style.display = "flex";
    activePanel.classList.add("active");

    // Re-render charts or update data table when switching tabs with optimization
    chartsPerformanceUtils.optimizedChartUpdate(() => {
      if (activePanel === regionPanel) {
        renderRoiByRegionChart();
      } else if (activePanel === dataTablePanel) {
        // Initialize the ROI data table if it doesn't exist yet
        if (!window.roiDataTableInstance) {
          if (window.roiModule && window.roiModule.initRoiDataTable) {
            window.roiDataTableInstance = window.roiModule.initRoiDataTable();
          }
        } else {
          // Update the ROI data table when switching to it
          if (window.roiModule && window.roiModule.updateRoiDataTable) {
            window.roiModule.updateRoiDataTable();
          }
        }
      } else if (activePanel === quarterPanel) {
        renderRoiByQuarterChart();
      }
    });
  }, 150);

  // Add click listeners with throttling to prevent rapid clicking
  const throttledRegionClick = chartsPerformanceUtils.throttle(() => {
    switchToTab(regionTabBtn, regionPanel);
  }, 200);

  const throttledDataTableClick = chartsPerformanceUtils.throttle(() => {
    switchToTab(dataTableTabBtn, dataTablePanel);
  }, 200);

  const throttledQuarterClick = chartsPerformanceUtils.throttle(() => {
    switchToTab(quarterTabBtn, quarterPanel);
  }, 200);

  regionTabBtn.addEventListener("click", throttledRegionClick);
  dataTableTabBtn.addEventListener("click", throttledDataTableClick);
  quarterTabBtn.addEventListener("click", throttledQuarterClick);

  // Initialize with the first tab active (already set in HTML)
  // Just ensure the panel visibility is correct
  regionPanel.style.display = "flex";
  dataTablePanel.style.display = "none";
  quarterPanel.style.display = "none";
}, 100);

// Window resize optimization for all charts
const optimizedWindowResize = chartsPerformanceUtils.debounce(() => {
  // Clear chart cache on significant resize
  chartCache.clear();
  
  // Re-render visible charts
  if (window.budgetsBarChartInstance) renderBudgetsBarChart();
  if (window.roiRegionChartInstance) renderRoiByRegionChart();
  if (window.roiQuarterChartInstance) renderRoiByQuarterChart();
  if (roiGaugeChart) {
    const roiPercent = parseFloat(roiGaugeChart.data.datasets[0].data[0]) || 0;
    updateRoiGauge(roiPercent);
  }
}, CHARTS_PERFORMANCE_CONFIG.windowResizeDebounce);

window.addEventListener('resize', optimizedWindowResize);

// Charts cleanup utilities
const cleanupAllCharts = () => {
  // Cleanup chart instances
  window.budgetsBarChartInstance = chartsPerformanceUtils.cleanupChart(window.budgetsBarChartInstance);
  window.roiRegionChartInstance = chartsPerformanceUtils.cleanupChart(window.roiRegionChartInstance);
  window.roiQuarterChartInstance = chartsPerformanceUtils.cleanupChart(window.roiQuarterChartInstance);
  roiGaugeChart = chartsPerformanceUtils.cleanupChart(roiGaugeChart);
  window.reportSpendChart = chartsPerformanceUtils.cleanupChart(window.reportSpendChart);
  
  // Clear all charts cache
  chartCache.clear();
  
  // Remove event listeners
  window.removeEventListener('resize', optimizedWindowResize);
};

// Export optimized chart module functions and utilities
if (typeof window !== "undefined") {
  window.chartsModule = {
    // Core chart functions
    initializeChartJS,
    renderBudgetsBarChart,
    renderBudgetsRegionCharts,
    renderRoiByRegionChart,
    renderRoiByProgramTypeChart,
    renderRoiByQuarterChart,
    updateRoiGauge,
    createReportSpendByRegionChart,
    initRoiTabSwitching,
    // Performance utilities
    cleanupAllCharts,
    clearChartCache: () => chartCache.clear(),
    // Performance configuration
    config: CHARTS_PERFORMANCE_CONFIG
  };
}

// Export all relevant functions for module usage
export {
  initializeChartJS,
  renderBudgetsBarChart,
  renderBudgetsRegionCharts,
  renderRoiByRegionChart,
  renderRoiByProgramTypeChart,
  renderRoiByQuarterChart,
  updateRoiGauge,
  createReportSpendByRegionChart,
  initRoiTabSwitching,
  cleanupAllCharts
};

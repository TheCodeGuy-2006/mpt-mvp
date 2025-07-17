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
};

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
    });
  }
}, 100);

// Budgets Bar Chart (optimized with caching and performance improvements)
const renderBudgetsBarChart = chartsPerformanceUtils.debounce(() => {
  const ctx = document.getElementById("budgetsBarChart");
  if (!ctx) {
    return;
  }

  // Check cache first
  const cacheKey = 'budgets-bar-chart';
  const cachedData = chartCache.get(cacheKey);
  
  // Get budgets data from the table or from the budgets object
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
    return;
  }

  // Create cache signature for change detection
  const dataSignature = JSON.stringify(budgetsData.map(d => ({ 
    region: d.region || d.Region, 
    budget: d.assignedBudget || d.AssignedBudget 
  })));
  
  // Use cached data if unchanged
  if (cachedData && cachedData.signature === dataSignature) {
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
  }

  chartsPerformanceUtils.optimizedChartUpdate(() => {
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
  });
}, CHARTS_PERFORMANCE_CONFIG.chartUpdateDebounce);

// Budgets Region Charts (optimized with intelligent caching and batch processing)
const renderBudgetsRegionCharts = chartsPerformanceUtils.debounce(() => {
  const container = document.getElementById("budgetsChartsContainer");
  if (!container) return;
  
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

  // Get planning data (for forecasted/actual cost)
  let planningRows = [];
  if (window.planningTableInstance) {
    planningRows = window.planningTableInstance.getData();
  } else if (window.planningRows) {
    planningRows = window.planningRows;
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
  }
  
  if (!shouldRebuild) return;
  
  // Clear container and rebuild
  container.innerHTML = "";

  // Get all unique regions from budgets and planning
  const allRegions = Array.from(
    new Set([
      ...budgetsData.map((b) => b.region),
      ...planningRows.map((r) => r.region),
    ]),
  ).filter(Boolean);

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
  // Assigned budget
  const budgetObj = budgetsData.find((b) => b.region === region);
  const assignedBudget = budgetObj && budgetObj.assignedBudget
    ? Number(budgetObj.assignedBudget) : 0;

  // Forecasted cost: sum of forecastedCost for this region
  const regionForecasts = planningRows.filter(
    (r) => r.region === region && typeof r.forecastedCost === "number",
  );
  const forecastedCost = regionForecasts.reduce(
    (sum, r) => sum + r.forecastedCost, 0,
  );

  // Actual cost: sum of actualCost for this region
  const actualCost = planningRows
    .filter((r) => r.region === region && typeof r.actualCost === "number")
    .reduce((sum, r) => sum + r.actualCost, 0);

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

  // Title and canvas
  chartDiv.innerHTML = `<h3 style="font-size:1.18rem;margin:0 0 12px 0;color:#1976d2;">${region}</h3><canvas id="chart-${region}"></canvas>`;

  // Fullscreen button
  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.className = "graph-fullscreen-btn";
  fullscreenBtn.title = "Expand graph";
  fullscreenBtn.innerHTML = "⛶";
  fullscreenBtn.style.cssText = `
    position: absolute;
    top: 6px;
    right: 8px;
    font-size: 1.1em;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.7;
    padding: 2px 6px;
    z-index: 2;
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
    
    // Process data with filtering
    data.forEach((row) => {
      // Apply filters before processing data
      if (filters.region && row.region !== filters.region) return;
      if (filters.quarter && row.quarter !== filters.quarter) return;
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
  
  // Calculate totals from execution data
  let forecastedMql = 0;
  let actualMql = 0;
  let forecastedLeads = 0;
  let actualLeads = 0;

  if (window.executionTableInstance) {
    const data = window.executionTableInstance.getData();
    
    let processedRows = 0;
    data.forEach((row) => {
      // Apply filters before processing data
      if (filters.region && row.region !== filters.region) return;
      if (filters.quarter && row.quarter !== filters.quarter) return;
      if (filters.country && row.country !== filters.country) return;
      if (filters.owner && row.owner !== filters.owner) return;
      if (filters.status && row.status !== filters.status) return;
      if (filters.programType && row.programType !== filters.programType) return;
      if (filters.strategicPillars && row.strategicPillars !== filters.strategicPillars) return;
      if (filters.revenuePlay && row.revenuePlay !== filters.revenuePlay) return;
      
      processedRows++;
      
      // MQL data
      let fMql = row.mqlForecast || 0;
      if (typeof fMql === "string")
        fMql = Number(fMql.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(fMql)) forecastedMql += Number(fMql);

      let aMql = row.actualMQLs || 0;
      if (typeof aMql === "string")
        aMql = Number(aMql.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(aMql)) actualMql += Number(aMql);

      // Leads data
      let fLeads = row.expectedLeads || 0;
      if (typeof fLeads === "string")
        fLeads = Number(fLeads.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(fLeads)) forecastedLeads += Number(fLeads);

      let aLeads = row.actualLeads || 0;
      if (typeof aLeads === "string")
        aLeads = Number(aLeads.toString().replace(/[^\d.-]/g, ""));
      if (!isNaN(aLeads)) actualLeads += Number(aLeads);
    });
  }
  
  // Cache processed data
  const chartData = { forecastedMql, actualMql, forecastedLeads, actualLeads };
  chartCache.set(cacheKey, chartData);

  // Use the predefined chart container
  const ctx = document.getElementById("roiQuarterChart");
  if (!ctx) return;

  // Destroy previous chart if exists
  if (window.roiQuarterChartInstance) {
    window.roiQuarterChartInstance = chartsPerformanceUtils.cleanupChart(window.roiQuarterChartInstance);
  }

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
            data: [actualMql, actualLeads],
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
    config: CHARTS_PERFORMANCE_CONFIG,
    
    // Performance statistics
    getCacheStats: () => ({
      cacheSize: chartCache.cache.size,
      cacheKeys: Array.from(chartCache.cache.keys())
    })
  };
  
  // Maintain backward compatibility
  window.initializeChartJS = initializeChartJS;
  window.renderBudgetsBarChart = renderBudgetsBarChart;
  window.renderBudgetsRegionCharts = renderBudgetsRegionCharts;
  window.renderRoiByRegionChart = renderRoiByRegionChart;
  window.renderRoiByProgramTypeChart = renderRoiByProgramTypeChart;
  window.renderRoiByQuarterChart = renderRoiByQuarterChart;
  window.updateRoiGauge = updateRoiGauge;
  window.createReportSpendByRegionChart = createReportSpendByRegionChart;
  window.initRoiTabSwitching = initRoiTabSwitching;
}

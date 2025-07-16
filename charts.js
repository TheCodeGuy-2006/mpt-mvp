// charts.js - Chart rendering and visualization utilities

// Global chart instances for cleanup
let roiGaugeChart = null;

// Initialize Chart.js if not already loaded
function initializeChartJS() {
  if (!window.Chart) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = () => {
      console.log("Chart.js loaded");
      // Only render if data is available
      setTimeout(() => {
        if (typeof renderBudgetsBarChart === "function") {
          renderBudgetsBarChart();
        }
      }, 500);
    };
    document.head.appendChild(script);
  } else {
    // Chart.js already loaded
    setTimeout(() => {
      if (typeof renderBudgetsBarChart === "function") {
        renderBudgetsBarChart();
      }
    }, 500);
  }
}

// Budgets Bar Chart
function renderBudgetsBarChart() {
  const ctx = document.getElementById("budgetsBarChart");
  if (!ctx) {
    console.log("[Charts] budgetsBarChart element not found");
    return;
  }

  // Get budgets data from the table or from the budgets object
  let budgetsData = [];
  if (window.budgetsTableInstance) {
    budgetsData = window.budgetsTableInstance.getData();
    console.log("[Charts] Using budgets data from table:", budgetsData);
  } else if (window.budgetsObj) {
    budgetsData = Object.entries(window.budgetsObj).map(([region, data]) => ({
      region,
      ...data,
    }));
    console.log("[Charts] Using budgets data from global object:", budgetsData);
  }

  if (!budgetsData || budgetsData.length === 0) {
    console.log("[Charts] No budgets data available for chart");
    return;
  }

  // Prepare data for chart
  const labels = budgetsData.map((row) => row.region || row.Region || "");
  const values = budgetsData.map((row) =>
    Number(row.assignedBudget || row.AssignedBudget || 0),
  );

  console.log("[Charts] Chart labels:", labels);
  console.log("[Charts] Chart values:", values);

  // Destroy previous chart if exists
  if (window.budgetsBarChartInstance) {
    window.budgetsBarChartInstance.destroy();
  }

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
}

// Budgets Region Charts
function renderBudgetsRegionCharts() {
  const container = document.getElementById("budgetsChartsContainer");
  if (!container) return;
  container.innerHTML = "";

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

  // Get all unique regions from budgets and planning
  const allRegions = Array.from(
    new Set([
      ...budgetsData.map((b) => b.region),
      ...planningRows.map((r) => r.region),
    ]),
  ).filter(Boolean);

  // For each region, create a chart
  let rowDiv = null;
  allRegions.forEach((region, idx) => {
    if (idx % 4 === 0) {
      rowDiv = document.createElement("div");
      rowDiv.className = "budgets-graph-row";
      rowDiv.style.display = "flex";
      rowDiv.style.flexDirection = "row";
      rowDiv.style.gap = "24px";
      rowDiv.style.marginBottom = "24px";
      container.appendChild(rowDiv);
    }

    // Assigned budget
    const budgetObj = budgetsData.find((b) => b.region === region);
    const assignedBudget =
      budgetObj && budgetObj.assignedBudget
        ? Number(budgetObj.assignedBudget)
        : 0;

    // Forecasted cost: sum of forecastedCost for this region
    const regionForecasts = planningRows.filter(
      (r) => r.region === region && typeof r.forecastedCost === "number",
    );
    const forecastedCost = regionForecasts.reduce(
      (sum, r) => sum + r.forecastedCost,
      0,
    );

    // Actual cost: sum of actualCost for this region
    const actualCost = planningRows
      .filter((r) => r.region === region && typeof r.actualCost === "number")
      .reduce((sum, r) => sum + r.actualCost, 0);

    // Create chart canvas and fullscreen button
    const chartDiv = document.createElement("div");
    chartDiv.style.width = "300px";
    chartDiv.style.height = "auto";
    chartDiv.style.background = "#fff";
    chartDiv.style.borderRadius = "12px";
    chartDiv.style.boxShadow = "0 2px 12px rgba(25,118,210,0.08)";
    chartDiv.style.padding = "18px 12px 8px 12px";
    chartDiv.style.display = "flex";
    chartDiv.style.flexDirection = "column";
    chartDiv.style.alignItems = "center";
    chartDiv.style.position = "relative";

    // Title and canvas
    chartDiv.innerHTML = `<h3 style="font-size:1.18rem;margin:0 0 12px 0;color:#1976d2;">${region}</h3><canvas id="chart-${region}"></canvas>`;

    // Fullscreen button
    const fullscreenBtn = document.createElement("button");
    fullscreenBtn.className = "graph-fullscreen-btn";
    fullscreenBtn.title = "Expand graph";
    fullscreenBtn.innerHTML = "⛶";
    fullscreenBtn.style.position = "absolute";
    fullscreenBtn.style.top = "6px";
    fullscreenBtn.style.right = "8px";
    fullscreenBtn.style.fontSize = "1.1em";
    fullscreenBtn.style.background = "none";
    fullscreenBtn.style.border = "none";
    fullscreenBtn.style.cursor = "pointer";
    fullscreenBtn.style.opacity = "0.7";
    fullscreenBtn.style.padding = "2px 6px";
    fullscreenBtn.style.zIndex = "2";
    chartDiv.appendChild(fullscreenBtn);
    rowDiv.appendChild(chartDiv);

    // Render chart in normal box
    setTimeout(() => {
      const ctx = chartDiv.querySelector("canvas");
      if (!ctx) return;
      if (ctx.chartInstance) ctx.chartInstance.destroy();
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
    }, 0);

    // Fullscreen overlay logic
    fullscreenBtn.onclick = function () {
      let overlay = document.getElementById("graphFullscreenOverlay");
      if (overlay) {
        overlay.remove();
        return;
      }

      overlay = document.createElement("div");
      overlay.id = "graphFullscreenOverlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.background = "rgba(20,30,60,0.92)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "9999";
      overlay.onclick = function (e) {
        if (e.target === overlay) overlay.remove();
      };
      document.body.appendChild(overlay);

      // Chart container for fullscreen
      const fsDiv = document.createElement("div");
      fsDiv.style.background = "#fff";
      fsDiv.style.borderRadius = "16px";
      fsDiv.style.boxShadow = "0 4px 32px rgba(25,118,210,0.18)";
      fsDiv.style.padding = "32px 32px 18px 32px";
      fsDiv.style.display = "flex";
      fsDiv.style.flexDirection = "column";
      fsDiv.style.alignItems = "center";
      fsDiv.style.position = "relative";
      fsDiv.style.width = "85vw";
      fsDiv.style.height = "80vh";

      // Close button
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕";
      closeBtn.title = "Close";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "10px";
      closeBtn.style.right = "16px";
      closeBtn.style.fontSize = "1.3em";
      closeBtn.style.background = "none";
      closeBtn.style.border = "none";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.opacity = "0.7";
      closeBtn.onclick = () => overlay.remove();
      fsDiv.appendChild(closeBtn);

      // Title
      const title = document.createElement("h2");
      title.textContent = region;
      title.style.color = "#1976d2";
      title.style.margin = "0 0 18px 0";
      fsDiv.appendChild(title);

      // Content container with chart and breakdown side by side
      const contentDiv = document.createElement("div");
      contentDiv.style.display = "flex";
      contentDiv.style.gap = "32px";
      contentDiv.style.width = "100%";
      contentDiv.style.height = "calc(100% - 80px)";
      contentDiv.style.alignItems = "flex-start";

      // Chart container
      const chartContainer = document.createElement("div");
      chartContainer.style.flex = "2";
      chartContainer.style.display = "flex";
      chartContainer.style.justifyContent = "center";
      chartContainer.style.alignItems = "center";
      chartContainer.style.height = "100%";

      // Canvas
      const fsCanvas = document.createElement("canvas");
      fsCanvas.width = Math.floor(window.innerWidth * 0.5);
      fsCanvas.height = Math.floor(window.innerHeight * 0.55);
      chartContainer.appendChild(fsCanvas);
      contentDiv.appendChild(chartContainer);

      // Breakdown container (only show if there are multiple forecasts)
      if (regionForecasts.length > 1) {
        const breakdownContainer = document.createElement("div");
        breakdownContainer.style.flex = "1";
        breakdownContainer.style.minWidth = "300px";
        breakdownContainer.style.maxWidth = "400px";
        breakdownContainer.style.height = "100%";
        breakdownContainer.style.overflowY = "auto";
        breakdownContainer.style.background = "#f8f9fa";
        breakdownContainer.style.borderRadius = "12px";
        breakdownContainer.style.padding = "20px";
        breakdownContainer.style.border = "1px solid #e3f2fd";

        // Breakdown title
        const breakdownTitle = document.createElement("h3");
        breakdownTitle.textContent = "Forecasted Cost Breakdown";
        breakdownTitle.style.color = "#1976d2";
        breakdownTitle.style.margin = "0 0 16px 0";
        breakdownTitle.style.fontSize = "1.2rem";
        breakdownTitle.style.fontWeight = "600";
        breakdownContainer.appendChild(breakdownTitle);

        // Breakdown items
        regionForecasts.forEach((r, index) => {
          const itemDiv = document.createElement("div");
          itemDiv.style.marginBottom = "12px";
          itemDiv.style.padding = "12px";
          itemDiv.style.background = "#ffffff";
          itemDiv.style.borderRadius = "8px";
          itemDiv.style.border = "1px solid #e0e0e0";
          itemDiv.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";

          const campaignName = document.createElement("div");
          campaignName.textContent = r.campaignName
            ? r.campaignName
            : `Campaign ${index + 1}`;
          campaignName.style.fontWeight = "600";
          campaignName.style.color = "#333";
          campaignName.style.marginBottom = "4px";
          campaignName.style.fontSize = "0.95rem";

          const costValue = document.createElement("div");
          costValue.textContent = `$${Number(r.forecastedCost).toLocaleString()}`;
          costValue.style.color = "#1976d2";
          costValue.style.fontWeight = "700";
          costValue.style.fontSize = "1.1rem";

          itemDiv.appendChild(campaignName);
          itemDiv.appendChild(costValue);
          breakdownContainer.appendChild(itemDiv);
        });

        // Total at the bottom
        const totalDiv = document.createElement("div");
        totalDiv.style.marginTop = "16px";
        totalDiv.style.padding = "16px";
        totalDiv.style.background = "#1976d2";
        totalDiv.style.color = "#ffffff";
        totalDiv.style.borderRadius = "8px";
        totalDiv.style.fontWeight = "700";
        totalDiv.style.fontSize = "1.1rem";
        totalDiv.style.textAlign = "center";
        totalDiv.textContent = `Total: $${Number(forecastedCost).toLocaleString()}`;
        breakdownContainer.appendChild(totalDiv);

        contentDiv.appendChild(breakdownContainer);
      }

      fsDiv.appendChild(contentDiv);
      overlay.appendChild(fsDiv);

      // Render chart in fullscreen
      setTimeout(() => {
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
      }, 0);
    };
  });
}

// ROI by Region Chart
function renderRoiByRegionChart() {
  // Get current ROI filter state
  const filters = window.roiModule ? window.roiModule.getFilterState ? window.roiModule.getFilterState() : {} : {};
  
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

  // Use the predefined chart container
  const ctx = document.getElementById("roiRegionChart");
  if (!ctx) return;

  // Destroy previous chart if exists
  if (window.roiRegionChartInstance) {
    window.roiRegionChartInstance.destroy();
  }

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
}

// ROI by Program Type Table (replacing chart)
function renderRoiByProgramTypeChart() {
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
}

// Forecasted vs Actual Performance Chart (replacing ROI by Quarter)
function renderRoiByQuarterChart() {
  // Get current ROI filter state
  const filters = window.roiModule ? window.roiModule.getFilterState ? window.roiModule.getFilterState() : {} : {};
  console.log("[Charts] renderRoiByQuarterChart - Current filters:", filters);
  
  // Calculate totals from execution data
  let forecastedMql = 0;
  let actualMql = 0;
  let forecastedLeads = 0;
  let actualLeads = 0;

  if (window.executionTableInstance) {
    const data = window.executionTableInstance.getData();
    console.log("[Charts] renderRoiByQuarterChart - Total data rows:", data.length);
    
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
    
    console.log("[Charts] renderRoiByQuarterChart - Processed rows:", processedRows);
    console.log("[Charts] renderRoiByQuarterChart - Calculated values:", {
      forecastedMql, actualMql, forecastedLeads, actualLeads
    });
  }

  // Use the predefined chart container
  const ctx = document.getElementById("roiQuarterChart");
  if (!ctx) return;

  // Destroy previous chart if exists
  if (window.roiQuarterChartInstance) {
    window.roiQuarterChartInstance.destroy();
  }

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
}

// ROI Gauge Chart
function updateRoiGauge(roiPercent) {
  const ctx = document.getElementById("roiGaugeChart");
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (roiGaugeChart) {
    roiGaugeChart.destroy();
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

  // Create doughnut chart configured as a gauge
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
}

// Report Spend by Region Chart
function createReportSpendByRegionChart(spendByRegion) {
  const canvas = document.getElementById("reportSpendByRegionChart");
  if (!canvas) return;

  // Destroy existing chart if it exists
  if (window.reportSpendChart) {
    window.reportSpendChart.destroy();
  }

  const ctx = canvas.getContext("2d");
  const regions = Object.keys(spendByRegion).sort();
  const amounts = regions.map((region) => spendByRegion[region]);

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
}

// ROI Tab Functionality
function initRoiTabSwitching() {
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

  // Function to switch tabs
  function switchToTab(activeTab, activePanel) {
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

    // Re-render charts or update data table when switching tabs
    setTimeout(() => {
      if (activePanel === regionPanel) {
        renderRoiByRegionChart();
      } else if (activePanel === dataTablePanel) {
        console.log("Switching to Data Table tab");
        // Initialize the ROI data table if it doesn't exist yet
        if (!window.roiDataTableInstance) {
          console.log("Initializing ROI Data Table for the first time");
          if (window.roiModule && window.roiModule.initRoiDataTable) {
            window.roiDataTableInstance = window.roiModule.initRoiDataTable();
          }
        } else {
          // Update the ROI data table when switching to it
          if (window.roiModule && window.roiModule.updateRoiDataTable) {
            console.log("Updating existing ROI Data Table");
            window.roiModule.updateRoiDataTable();
          }
        }
      } else if (activePanel === quarterPanel) {
        renderRoiByQuarterChart();
      }
    }, 100);
  }

  // Add click listeners
  regionTabBtn.addEventListener("click", () => {
    switchToTab(regionTabBtn, regionPanel);
  });

  dataTableTabBtn.addEventListener("click", () => {
    switchToTab(dataTableTabBtn, dataTablePanel);
  });

  quarterTabBtn.addEventListener("click", () => {
    switchToTab(quarterTabBtn, quarterPanel);
  });

  // Initialize with the first tab active (already set in HTML)
  // Just ensure the panel visibility is correct
  regionPanel.style.display = "flex";
  dataTablePanel.style.display = "none";
  quarterPanel.style.display = "none";
}

// Export functions for use in app.js
if (typeof window !== "undefined") {
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

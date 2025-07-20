// Planning Data Processing Web Worker
// This worker handles heavy data processing off the main thread

// Quarter normalization function to handle format differences ("Q1 July" vs "Q1 - July")
function normalizeQuarter(quarter) {
  if (!quarter || typeof quarter !== 'string') return quarter;
  return quarter.replace(/\s*-\s*/, ' ');
}

self.onmessage = function(e) {
  const { type, data, options } = e.data;
  
  try {
    switch (type) {
      case 'PROCESS_PLANNING_DATA':
        processPlanningData(data, options);
        break;
      case 'APPLY_FILTERS':
        applyFilters(data, options);
        break;
      case 'CALCULATE_KPIS':
        calculateKPIs(data, options);
        break;
      case 'PROCESS_CSV_IMPORT':
        processCSVImport(data, options);
        break;
      default:
        self.postMessage({ 
          type: 'ERROR', 
          error: `Unknown task type: ${type}` 
        });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      error: error.message,
      originalType: type 
    });
  }
};

// KPI calculation function (duplicated from calc.js for worker use)
function kpis(expectedLeads) {
  if (!expectedLeads || expectedLeads <= 0) {
    return { mql: 0, sql: 0, opps: 0, pipeline: 0 };
  }
  
  const mql = Math.round(expectedLeads * 0.3);
  const sql = Math.round(mql * 0.25);
  const opps = Math.round(sql * 0.15);
  const pipeline = opps * 50000; // $50k average deal size
  
  return { mql, sql, opps, pipeline };
}

// Process planning data with KPI calculations
function processPlanningData(rows, options = {}) {
  const batchSize = options.batchSize || 100;
  const processedRows = [];
  
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    batch.forEach((row, index) => {
      const globalIndex = i + index;
      
      // Calculate KPIs if expectedLeads is present
      if (typeof row.expectedLeads === "number" && row.expectedLeads > 0) {
        const kpiResults = kpis(row.expectedLeads);
        Object.assign(row, kpiResults);
      }
      
      // Ensure row has an ID
      if (!row.id) {
        row.id = `row_${globalIndex}_${Date.now()}`;
      }
      
      processedRows.push(row);
    });
    
    // Send progress update
    if (rows.length > 500) {
      const progress = Math.round(((i + batch.length) / rows.length) * 100);
      self.postMessage({
        type: 'PROGRESS',
        progress,
        processed: i + batch.length,
        total: rows.length
      });
    }
  }
  
  self.postMessage({
    type: 'PROCESS_PLANNING_DATA_COMPLETE',
    data: processedRows
  });
}

// Apply filters to data
function applyFilters(rows, filters) {
  const startTime = performance.now();
  
  const filteredRows = rows.filter(row => {
    // Campaign name filter removed
    
    // Digital Motions filter
    if (filters.digitalMotions && row.digitalMotions !== true) {
      return false;
    }
    
    // Exact match filters
    const exactMatchFields = ['region', 'quarter', 'status', 'programType', 'strategicPillars', 'owner'];
    for (const field of exactMatchFields) {
      if (filters[field]) {
        if (field === 'quarter') {
          // Apply quarter normalization for comparison
          const normalizedRowQuarter = normalizeQuarter(row[field]);
          const normalizedFilterQuarter = normalizeQuarter(filters[field]);
          if (normalizedRowQuarter !== normalizedFilterQuarter) {
            return false;
          }
        } else {
          if (row[field] !== filters[field]) {
            return false;
          }
        }
      }
    }
    
    return true;
  });
  
  const duration = performance.now() - startTime;
  
  self.postMessage({
    type: 'APPLY_FILTERS_COMPLETE',
    data: filteredRows,
    originalCount: rows.length,
    filteredCount: filteredRows.length,
    duration
  });
}

// Calculate KPIs for multiple rows
function calculateKPIs(rows, options = {}) {
  const updatedRows = rows.map(row => {
    if (row.programType === "In-Account Events (1:1)") {
      return {
        ...row,
        expectedLeads: 0,
        mqlForecast: 0,
        sqlForecast: 0,
        oppsForecast: 0,
        pipelineForecast: row.forecastedCost ? Number(row.forecastedCost) * 20 : 0,
      };
    } else if (typeof row.expectedLeads === "number" && row.expectedLeads > 0) {
      const kpiResults = kpis(row.expectedLeads);
      return {
        ...row,
        mqlForecast: kpiResults.mql,
        sqlForecast: kpiResults.sql,
        oppsForecast: kpiResults.opps,
        pipelineForecast: kpiResults.pipeline,
      };
    }
    return row;
  });
  
  self.postMessage({
    type: 'CALCULATE_KPIS_COMPLETE',
    data: updatedRows
  });
}

// Process CSV import data
function processCSVImport(csvData, options = {}) {
  const { columnMapping } = options;
  const processedRows = [];
  
  csvData.forEach(row => {
    const mappedRow = {};
    
    // Apply column mapping
    Object.keys(row).forEach(csvField => {
      const gridField = columnMapping[csvField] || csvField;
      let value = row[csvField];
      
      // Clean up specific fields
      if (gridField === "forecastedCost") {
        if (typeof value === "string") {
          value = value.replace(/[",\s]/g, "");
          value = value ? Number(value) : 0;
        } else {
          value = value ? Number(value) : 0;
        }
      } else if (gridField === "expectedLeads") {
        if (typeof value === "string") {
          value = value.replace(/[",\s]/g, "");
          value = value ? Number(value) : 0;
        } else {
          value = value ? Number(value) : 0;
        }
      } else if (gridField === "status") {
        if (value && typeof value !== "string") {
          value = String(value);
        }
        if (!value || value === "" || value === "undefined") {
          value = "Planning";
        }
      }
      
      if (value !== "" && value !== undefined && value !== null) {
        mappedRow[gridField] = value;
      }
    });
    
    // Calculate KPIs
    if (mappedRow.programType === "In-Account Events (1:1)") {
      mappedRow.expectedLeads = 0;
      mappedRow.mqlForecast = 0;
      mappedRow.sqlForecast = 0;
      mappedRow.oppsForecast = 0;
      mappedRow.pipelineForecast = mappedRow.forecastedCost ? Number(mappedRow.forecastedCost) * 20 : 0;
    } else if (typeof mappedRow.expectedLeads === "number" && mappedRow.expectedLeads > 0) {
      const kpiResults = kpis(mappedRow.expectedLeads);
      mappedRow.mqlForecast = kpiResults.mql;
      mappedRow.sqlForecast = kpiResults.sql;
      mappedRow.oppsForecast = kpiResults.opps;
      mappedRow.pipelineForecast = kpiResults.pipeline;
    }
    
    processedRows.push(mappedRow);
  });
  
  self.postMessage({
    type: 'PROCESS_CSV_IMPORT_COMPLETE',
    data: processedRows
  });
}

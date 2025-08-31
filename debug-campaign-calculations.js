// Debugging utility for campaign calculation issues
// Run this in the browser console on the planning tab to diagnose calculation problems

function debugCampaignCalculations() {
  console.log("🔍 DEBUGGING CAMPAIGN CALCULATIONS");
  console.log("=====================================");
  
  // Check if planning data is available
  if (!window.planningDataStore) {
    console.error("❌ Planning data store not available");
    return;
  }
  
  const data = window.planningDataStore.getData();
  console.log(`📊 Analyzing ${data.length} campaigns...`);
  
  let regularPrograms = 0;
  let inAccountEvents = 0;
  let calculationMismatches = 0;
  let issues = [];
  
  data.forEach((row, index) => {
    if (!row) return;
    
    const isInAccount = row.programType === "In-Account Events (1:1)";
    const expectedLeads = Number(row.expectedLeads) || 0;
    const forecastedCost = Number(row.forecastedCost) || 0;
    const currentMql = Number(row.mqlForecast) || 0;
    const currentPipeline = Number(row.pipelineForecast) || 0;
    
    if (isInAccount) {
      inAccountEvents++;
      
      // For In-Account Events: should be 0 leads, 0 MQL, cost * 20 pipeline
      const expectedMql = 0;
      const expectedPipeline = forecastedCost * 20;
      
      if (expectedLeads !== 0 || currentMql !== expectedMql || currentPipeline !== expectedPipeline) {
        calculationMismatches++;
        issues.push({
          index: index + 1,
          id: row.id,
          programType: row.programType,
          issue: "In-Account Events calculation mismatch",
          current: { leads: expectedLeads, mql: currentMql, pipeline: currentPipeline },
          expected: { leads: 0, mql: expectedMql, pipeline: expectedPipeline },
          cost: forecastedCost
        });
      }
    } else {
      regularPrograms++;
      
      // For regular programs: MQL = leads * 0.1, Pipeline = leads * 2400
      const expectedMql = Math.round(expectedLeads * 0.1);
      const expectedPipeline = Math.round(expectedLeads * 2400); // calculatePipeline formula
      
      if (currentMql !== expectedMql || currentPipeline !== expectedPipeline) {
        calculationMismatches++;
        issues.push({
          index: index + 1,
          id: row.id,
          programType: row.programType || "Unknown",
          issue: "Regular program calculation mismatch",
          current: { leads: expectedLeads, mql: currentMql, pipeline: currentPipeline },
          expected: { leads: expectedLeads, mql: expectedMql, pipeline: expectedPipeline }
        });
      }
    }
  });
  
  console.log(`📈 Summary:`);
  console.log(`   Regular Programs: ${regularPrograms}`);
  console.log(`   In-Account Events: ${inAccountEvents}`);
  console.log(`   Calculation Mismatches: ${calculationMismatches}`);
  
  if (issues.length > 0) {
    console.log(`\n❌ Found ${issues.length} calculation issues:`);
    issues.forEach(issue => {
      console.log(`\n   Row ${issue.index} (ID: ${issue.id})`);
      console.log(`   Program Type: ${issue.programType}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Current: Leads=${issue.current.leads}, MQL=${issue.current.mql}, Pipeline=$${issue.current.pipeline.toLocaleString()}`);
      console.log(`   Expected: Leads=${issue.expected.leads}, MQL=${issue.expected.mql}, Pipeline=$${issue.expected.pipeline.toLocaleString()}`);
      if (issue.cost !== undefined) {
        console.log(`   Forecasted Cost: $${issue.cost.toLocaleString()}`);
      }
    });
    
    console.log(`\n🔧 To fix these issues, you can run: fixCalculationIssues()`);
  } else {
    console.log(`\n✅ All calculations appear correct!`);
  }
  
  // Check for data type issues
  console.log(`\n🔍 Checking data types...`);
  const typeIssues = [];
  data.slice(0, 5).forEach((row, index) => {
    if (!row) return;
    
    const leadsType = typeof row.expectedLeads;
    const costType = typeof row.forecastedCost;
    const mqlType = typeof row.mqlForecast;
    const pipelineType = typeof row.pipelineForecast;
    
    if (leadsType !== 'number' || costType !== 'number' || mqlType !== 'number' || pipelineType !== 'number') {
      typeIssues.push({
        index: index + 1,
        id: row.id,
        types: { leads: leadsType, cost: costType, mql: mqlType, pipeline: pipelineType }
      });
    }
  });
  
  if (typeIssues.length > 0) {
    console.log(`❌ Found data type issues in first 5 rows:`);
    typeIssues.forEach(issue => {
      console.log(`   Row ${issue.index}: leads(${issue.types.leads}), cost(${issue.types.cost}), mql(${issue.types.mql}), pipeline(${issue.types.pipeline})`);
    });
  } else {
    console.log(`✅ Data types look correct (checked first 5 rows)`);
  }
  
  return { regularPrograms, inAccountEvents, calculationMismatches, issues, typeIssues };
}

function fixCalculationIssues() {
  console.log("🔧 FIXING CALCULATION ISSUES");
  console.log("===============================");
  
  if (!window.planningDataStore || !window.calculatePipeline) {
    console.error("❌ Required functions not available");
    return;
  }
  
  const data = window.planningDataStore.getData();
  let fixedCount = 0;
  
  data.forEach(row => {
    if (!row) return;
    
    const isInAccount = row.programType === "In-Account Events (1:1)";
    const expectedLeads = Number(row.expectedLeads) || 0;
    const forecastedCost = Number(row.forecastedCost) || 0;
    
    let needsUpdate = false;
    const updates = {};
    
    if (isInAccount) {
      // For In-Account Events: 0 leads, 0 MQL, cost * 20 pipeline
      if (row.expectedLeads !== 0) {
        updates.expectedLeads = 0;
        needsUpdate = true;
      }
      if (row.mqlForecast !== 0) {
        updates.mqlForecast = 0;
        needsUpdate = true;
      }
      const correctPipeline = forecastedCost * 20;
      if (row.pipelineForecast !== correctPipeline) {
        updates.pipelineForecast = correctPipeline;
        needsUpdate = true;
      }
    } else {
      // For regular programs: use leads-based calculations
      const correctMql = Math.round(expectedLeads * 0.1);
      const correctPipeline = window.calculatePipeline(expectedLeads);
      
      if (row.mqlForecast !== correctMql) {
        updates.mqlForecast = correctMql;
        needsUpdate = true;
      }
      if (row.pipelineForecast !== correctPipeline) {
        updates.pipelineForecast = correctPipeline;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      updates.__modified = true;
      window.planningDataStore.updateRow(row.id, updates);
      fixedCount++;
    }
  });
  
  console.log(`✅ Fixed ${fixedCount} calculation issues`);
  
  // Refresh the table display
  if (window.planningTableInstance && fixedCount > 0) {
    const refreshedData = window.planningDataStore.getFilteredData();
    window.planningTableInstance.replaceData(refreshedData);
    console.log(`🔄 Table refreshed with corrected data`);
  }
  
  return fixedCount;
}

// Make functions available globally
window.debugCampaignCalculations = debugCampaignCalculations;
window.fixCalculationIssues = fixCalculationIssues;

console.log("🛠️ Campaign calculation debugging tools loaded!");
console.log("Run debugCampaignCalculations() to analyze issues");
console.log("Run fixCalculationIssues() to fix calculation problems");

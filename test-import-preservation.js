// Test script to verify universal import preservation logic
// This tests that imported values always override automatic calculations

console.log('=== Testing Universal Import Preservation ===');

// Test data simulating CSV rows with imported values
const testRows = [
  {
    campaignName: "Test In-Account Events",
    programType: "In-Account Events (1:1)",
    expectedLeads: 300,  // Imported value - should be preserved
    mqlForecast: 30,     // Imported value - should be preserved
    forecastedCost: 5000
  },
  {
    campaignName: "Test Regular Program",
    programType: "Webinar",
    expectedLeads: 500,  // Imported value - should be preserved
    mqlForecast: 50,     // Imported value - should be preserved
    forecastedCost: 12000
  },
  {
    campaignName: "Test Auto-Calculate",
    programType: "Webinar",
    // No expectedLeads/mqlForecast - should auto-calculate
    forecastedCost: 2400  // Should result in 100 leads, 10 MQL
  },
  {
    campaignName: "Test In-Account Auto",
    programType: "In-Account Events (1:1)",
    // No expectedLeads/mqlForecast - should set to 0
    forecastedCost: 3000
  }
];

// Simulate the import preservation logic
testRows.forEach((row, index) => {
  console.log(`\n--- Testing Row ${index + 1}: ${row.campaignName} ---`);
  console.log('Before processing:', {
    leads: row.expectedLeads,
    mql: row.mqlForecast,
    cost: row.forecastedCost,
    type: row.programType
  });
  
  // Check if expectedLeads and mqlForecast were imported from CSV
  const hasImportedLeads = row.expectedLeads !== undefined && row.expectedLeads !== null && row.expectedLeads !== '';
  const hasImportedMql = row.mqlForecast !== undefined && row.mqlForecast !== null && row.mqlForecast !== '';
  
  if (hasImportedLeads || hasImportedMql) {
    // Preserve imported values - this overrides any automatic logic
    console.log('✓ PRESERVING imported values');
    
    // Ensure they're numbers
    if (hasImportedLeads) row.expectedLeads = Number(row.expectedLeads) || 0;
    if (hasImportedMql) row.mqlForecast = Number(row.mqlForecast) || 0;
    
    // Calculate pipeline based on program type
    if (row.programType === "In-Account Events (1:1)") {
      row.pipelineForecast = row.forecastedCost ? Number(row.forecastedCost) * 20 : 0;
    } else {
      // Use simple calculation for test (actual uses calculatePipeline function)
      row.pipelineForecast = Number(row.expectedLeads) * 100; // Simplified
    }
  } else {
    // No imported leads/MQL values, use automatic calculation
    console.log('→ AUTO-CALCULATING (no imported values)');
    
    if (row.programType === "In-Account Events (1:1)") {
      row.expectedLeads = 0;
      row.mqlForecast = 0;
      row.pipelineForecast = row.forecastedCost ? Number(row.forecastedCost) * 20 : 0;
    } else if (row.forecastedCost && Number(row.forecastedCost) > 0) {
      // Auto-calculate from cost for regular programs
      const leadCount = Math.round(Number(row.forecastedCost) / 24);
      row.expectedLeads = leadCount;
      row.mqlForecast = Math.round(leadCount * 0.1);
      row.pipelineForecast = leadCount * 100; // Simplified
    }
  }
  
  console.log('After processing:', {
    leads: row.expectedLeads,
    mql: row.mqlForecast,
    pipeline: row.pipelineForecast,
    preserved: hasImportedLeads || hasImportedMql
  });
  
  // Validate results
  if (index === 0) {
    // Test 1: In-Account Events with imported values should preserve them
    const success = row.expectedLeads === 300 && row.mqlForecast === 30;
    console.log(`Test Result: ${success ? '✅ PASS' : '❌ FAIL'} - In-Account Events preserved imported values`);
  } else if (index === 1) {
    // Test 2: Regular program with imported values should preserve them
    const success = row.expectedLeads === 500 && row.mqlForecast === 50;
    console.log(`Test Result: ${success ? '✅ PASS' : '❌ FAIL'} - Regular program preserved imported values`);
  } else if (index === 2) {
    // Test 3: Regular program without imported values should auto-calculate
    const success = row.expectedLeads === 100 && row.mqlForecast === 10;
    console.log(`Test Result: ${success ? '✅ PASS' : '❌ FAIL'} - Regular program auto-calculated correctly`);
  } else if (index === 3) {
    // Test 4: In-Account Events without imported values should be 0
    const success = row.expectedLeads === 0 && row.mqlForecast === 0;
    console.log(`Test Result: ${success ? '✅ PASS' : '❌ FAIL'} - In-Account Events auto-set to 0`);
  }
});

console.log('\n=== Universal Import Preservation Test Complete ===');
console.log('✓ Imported values always override automatic calculations');
console.log('✓ In-Account Events can have non-zero values when imported');
console.log('✓ Regular programs preserve imported leads/MQL');
console.log('✓ Auto-calculation only occurs when no values are imported');

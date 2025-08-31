// Debug function to test calculatePipeline
window.testCalculatePipeline = function() {
  console.log('🧪 Testing calculatePipeline function...');
  
  let planningData = window.planningDataStore ? window.planningDataStore.getData() : window.planningTableInstance.getData();
  
  // Test a few sample rows
  let testRows = [2, 3, 4, 21, 27]; // Pick some rows that have issues
  
  testRows.forEach(index => {
    if (planningData[index]) {
      let row = planningData[index];
      console.log(`\n📋 Testing Row ${index}:`);
      console.log(`   Campaign: ${row.campaignName || 'Unnamed'}`);
      console.log(`   Program Type: ${row.programType}`);
      console.log(`   Forecasted Cost: ${row.forecastedCost}`);
      console.log(`   Current expectedLeads: ${row.expectedLeads}`);
      console.log(`   Current mqlForecast: ${row.mqlForecast}`);
      
      // Test the calculation function
      try {
        let result = calculatePipeline(row.forecastedCost, row.programType, row);
        console.log(`   calculatePipeline result:`, result);
        
        if (result && typeof result === 'object') {
          console.log(`   Should be expectedLeads: ${result.expectedLeads}`);
          console.log(`   Should be mqlForecast: ${result.mqlForecast}`);
          console.log(`   Should be pipelineForecast: ${result.pipelineForecast}`);
        } else {
          console.log(`   ❌ calculatePipeline returned invalid result: ${result}`);
        }
      } catch (error) {
        console.log(`   ❌ Error calling calculatePipeline:`, error);
      }
    }
  });
  
  // Test with simple manual values
  console.log(`\n🔧 Manual tests:`);
  console.log(`Test 1: calculatePipeline(1000, "Targeted Paid Ads & Content Syndication", {})`);
  try {
    let test1 = calculatePipeline(1000, "Targeted Paid Ads & Content Syndication", {});
    console.log(`Result:`, test1);
  } catch (error) {
    console.log(`Error:`, error);
  }
  
  console.log(`Test 2: calculatePipeline(4000, "In-Account Events (1:1)", {})`);
  try {
    let test2 = calculatePipeline(4000, "In-Account Events (1:1)", {});
    console.log(`Result:`, test2);
  } catch (error) {
    console.log(`Error:`, error);
  }
};

console.log("Debug pipeline function loaded. Run testCalculatePipeline()");

// ROI Master Dataset Integration Test

console.log('🧪 Testing ROI Master Dataset Integration');
console.log('========================================');

// Test planning data access
function testPlanningDataAccess() {
  console.log('\n1️⃣ Testing Planning Data Access:');
  
  if (typeof getPlanningData === 'function') {
    const data = getPlanningData();
    console.log(`✅ getPlanningData() works: ${data.length} rows`);
    return true;
  } else {
    console.log('❌ getPlanningData() function not found');
    return false;
  }
}

// Test execution data access  
function testExecutionDataAccess() {
  console.log('\n2️⃣ Testing Execution Data Access:');
  
  if (typeof getExecutionData === 'function') {
    const data = getExecutionData();
    console.log(`✅ getExecutionData() works: ${data.length} rows`);
    return true;
  } else {
    console.log('❌ getExecutionData() function not found');
    return false;
  }
}

// Test ROI calculations
function testRoiCalculations() {
  console.log('\n3️⃣ Testing ROI Calculations:');
  
  try {
    // Test if ROI functions exist
    const functions = [
      'updateRoiTotalSpend',
      'updateReportTotalSpend',
      'populateRoiFilters'
    ];
    
    let allExist = true;
    functions.forEach(func => {
      if (typeof window[func] === 'function') {
        console.log(`✅ ${func}() exists`);
      } else {
        console.log(`❌ ${func}() not found`);
        allExist = false;
      }
    });
    
    return allExist;
  } catch (error) {
    console.log('❌ Error testing ROI functions:', error);
    return false;
  }
}

// Run all tests
function runRoiMasterDatasetTests() {
  console.log('🚀 Running ROI Master Dataset Tests...\n');
  
  const results = {
    planningData: testPlanningDataAccess(),
    executionData: testExecutionDataAccess(), 
    roiCalculations: testRoiCalculations()
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('🎉 ROI master dataset integration is working!');
  }
  
  return allPassed;
}

// Auto-run tests when loaded
if (typeof window !== 'undefined') {
  window.runRoiMasterDatasetTests = runRoiMasterDatasetTests;
  
  // Run tests after a short delay to ensure ROI module is loaded
  setTimeout(() => {
    if (window.location.hash === '#roi') {
      runRoiMasterDatasetTests();
    }
  }, 1000);
}

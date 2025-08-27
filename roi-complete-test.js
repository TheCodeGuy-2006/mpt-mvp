// ROI Master Dataset Integration - Complete Test Suite
// Copy and paste this entire script into browser console

(function() {
  console.log('🧪 ROI MASTER DATASET INTEGRATION TEST');
  console.log('=====================================');
  
  let testResults = {
    moduleLoading: false,
    dataAccess: false,
    functionCalls: false,
    masterDatasets: false
  };
  
  // Test 1: Module Loading
  console.log('\n1️⃣ Testing Module Loading:');
  if (typeof window.roiModule !== 'undefined' && window.roiModule !== null) {
    console.log('✅ window.roiModule exists');
    
    const requiredFunctions = [
      'updateRoiTotalSpend',
      'getPlanningData', 
      'getExecutionData',
      'populateRoiFilters',
      'initializeRoiFunctionality'
    ];
    
    let allFunctionsExist = true;
    requiredFunctions.forEach(func => {
      if (typeof window.roiModule[func] === 'function') {
        console.log(`✅ ${func} exists`);
      } else {
        console.log(`❌ ${func} missing`);
        allFunctionsExist = false;
      }
    });
    
    testResults.moduleLoading = allFunctionsExist;
  } else {
    console.log('❌ window.roiModule not found');
  }
  
  // Test 2: Master Datasets
  console.log('\n2️⃣ Testing Master Datasets:');
  if (typeof window.planningDataStore !== 'undefined' && window.planningDataStore !== null) {
    console.log('✅ planningDataStore available');
    testResults.masterDatasets = true;
  } else {
    console.log('❌ planningDataStore not found');
  }
  
  if (typeof window.executionDataStore !== 'undefined' && window.executionDataStore !== null) {
    console.log('✅ executionDataStore available');
  } else {
    console.log('❌ executionDataStore not found');
    testResults.masterDatasets = false;
  }
  
  // Test 3: Data Access
  console.log('\n3️⃣ Testing Data Access:');
  try {
    if (window.roiModule && typeof window.roiModule.getPlanningData === 'function') {
      const planningData = window.roiModule.getPlanningData();
      console.log(`✅ Planning data accessible: ${planningData.length} rows`);
      testResults.dataAccess = true;
    }
    
    if (window.roiModule && typeof window.roiModule.getExecutionData === 'function') {
      const executionData = window.roiModule.getExecutionData();
      console.log(`✅ Execution data accessible: ${executionData.length} rows`);
    }
  } catch (error) {
    console.log('❌ Error accessing data:', error);
    testResults.dataAccess = false;
  }
  
  // Test 4: Function Calls
  console.log('\n4️⃣ Testing Function Calls:');
  try {
    if (window.roiModule && typeof window.roiModule.updateRoiTotalSpend === 'function') {
      window.roiModule.updateRoiTotalSpend();
      console.log('✅ updateRoiTotalSpend executed successfully');
      testResults.functionCalls = true;
    } else {
      console.log('❌ updateRoiTotalSpend not available');
    }
  } catch (error) {
    console.log('❌ Error calling updateRoiTotalSpend:', error);
    testResults.functionCalls = false;
  }
  
  // Summary
  console.log('\n📋 TEST RESULTS SUMMARY:');
  console.log('========================');
  Object.entries(testResults).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  const allPassed = Object.values(testResults).every(result => result === true);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('🎉 ROI master dataset integration is working!');
    console.log('💡 You can now proceed with Phase B: Calendar Tab Integration');
  } else {
    console.log('🔧 Some issues remain - check the failed tests above');
  }
  
  return testResults;
})();

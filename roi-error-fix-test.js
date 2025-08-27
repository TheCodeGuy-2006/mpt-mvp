// ROI Master Dataset Integration - Error Fix Validation

console.log('🔧 Testing ROI Error Fixes');
console.log('==========================');

// Test 1: Check if roiModule is properly loaded
function testRoiModuleAvailability() {
  console.log('\n1️⃣ Testing ROI Module Availability:');
  
  if (typeof window.roiModule !== 'undefined') {
    console.log('✅ window.roiModule exists');
    
    // Check for updateRoiTotalSpend function
    if (typeof window.roiModule.updateRoiTotalSpend === 'function') {
      console.log('✅ updateRoiTotalSpend function exists');
    } else {
      console.log('❌ updateRoiTotalSpend function missing');
    }
    
    // Check for helper functions
    if (typeof window.roiModule.getPlanningData === 'function') {
      console.log('✅ getPlanningData helper function exists');
    } else {
      console.log('❌ getPlanningData helper function missing');
    }
    
    if (typeof window.roiModule.getExecutionData === 'function') {
      console.log('✅ getExecutionData helper function exists');
    } else {
      console.log('❌ getExecutionData helper function missing');
    }
    
    return true;
  } else {
    console.log('❌ window.roiModule not found');
    return false;
  }
}

// Test 2: Check master dataset accessibility
function testMasterDatasetAccess() {
  console.log('\n2️⃣ Testing Master Dataset Access:');
  
  try {
    if (typeof window.roiModule.getPlanningData === 'function') {
      const planningData = window.roiModule.getPlanningData();
      console.log(`✅ Planning data accessible: ${planningData.length} rows`);
    }
    
    if (typeof window.roiModule.getExecutionData === 'function') {
      const executionData = window.roiModule.getExecutionData();
      console.log(`✅ Execution data accessible: ${executionData.length} rows`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error accessing master datasets:', error);
    return false;
  }
}

// Test 3: Test updateRoiTotalSpend function
function testUpdateRoiTotalSpend() {
  console.log('\n3️⃣ Testing updateRoiTotalSpend Function:');
  
  try {
    if (typeof window.roiModule.updateRoiTotalSpend === 'function') {
      // Try to call the function (should not throw errors)
      window.roiModule.updateRoiTotalSpend();
      console.log('✅ updateRoiTotalSpend executed without errors');
      return true;
    } else {
      console.log('❌ updateRoiTotalSpend function not available');
      return false;
    }
  } catch (error) {
    console.log('❌ Error calling updateRoiTotalSpend:', error);
    return false;
  }
}

// Run all tests
function runRoiErrorFixTests() {
  console.log('🚀 Running ROI Error Fix Tests...\n');
  
  const results = {
    moduleAvailability: testRoiModuleAvailability(),
    masterDatasetAccess: testMasterDatasetAccess(),
    updateFunction: testUpdateRoiTotalSpend()
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL ERRORS FIXED' : '❌ ISSUES REMAIN'}`);
  
  return allPassed;
}

// Make globally available
if (typeof window !== 'undefined') {
  window.runRoiErrorFixTests = runRoiErrorFixTests;
}

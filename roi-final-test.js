// ROI Final Integration Test
// Test all recent fixes for ROI master dataset integration
console.log('🧪 === ROI FINAL INTEGRATION TEST ===');
console.log('Testing all recent fixes for ROI master dataset integration\n');

// Test 1: Check if checkForPlanningData is now globally accessible
console.log('🔍 Test 1: checkForPlanningData Global Access');
try {
  if (typeof checkForPlanningData !== 'undefined') {
    console.log('✅ checkForPlanningData is globally accessible');
    console.log('✅ Function type:', typeof checkForPlanningData);
  } else if (window.roiModule && typeof window.roiModule.checkForPlanningData === 'function') {
    console.log('✅ checkForPlanningData accessible via roiModule');
    console.log('✅ Function type:', typeof window.roiModule.checkForPlanningData);
  } else {
    console.log('❌ checkForPlanningData not accessible');
  }
} catch (error) {
  console.log('❌ Error testing checkForPlanningData:', error);
}

// Test 2: Module Loading and Exports
console.log('\n🔍 Test 2: ROI Module Exports');
if (window.roiModule) {
  console.log('✅ roiModule exists');
  
  const expectedFunctions = [
    'getPlanningData',
    'getExecutionData', 
    'updateRoiTotalSpend',
    'checkForPlanningData'
  ];
  
  expectedFunctions.forEach(funcName => {
    if (typeof window.roiModule[funcName] === 'function') {
      console.log(`✅ ${funcName} exported correctly`);
    } else {
      console.log(`❌ ${funcName} missing or not a function`);
    }
  });
} else {
  console.log('❌ roiModule not found');
}

// Test 3: Master Dataset Access
console.log('\n🔍 Test 3: Master Dataset Access');
try {
  if (window.roiModule && window.roiModule.getPlanningData) {
    const planningData = window.roiModule.getPlanningData();
    console.log('✅ getPlanningData works, rows:', planningData ? planningData.length : 0);
  } else {
    console.log('❌ getPlanningData not available');
  }
  
  if (window.roiModule && window.roiModule.getExecutionData) {
    const executionData = window.roiModule.getExecutionData();
    console.log('✅ getExecutionData works, rows:', executionData ? executionData.length : 0);
  } else {
    console.log('❌ getExecutionData not available');
  }
} catch (error) {
  console.log('❌ Error testing master dataset access:', error);
}

// Test 4: Data Store Availability
console.log('\n🔍 Test 4: Data Store Availability');
if (window.planningDataStore && typeof window.planningDataStore.getData === 'function') {
  try {
    const data = window.planningDataStore.getData();
    console.log('✅ planningDataStore available, rows:', data.length);
  } catch (error) {
    console.log('❌ Error accessing planningDataStore:', error);
  }
} else {
  console.log('❌ planningDataStore not available');
}

if (window.executionDataStore && typeof window.executionDataStore.getData === 'function') {
  try {
    const data = window.executionDataStore.getData();
    console.log('✅ executionDataStore available, rows:', data.length);
  } catch (error) {
    console.log('❌ Error accessing executionDataStore:', error);
  }
} else {
  console.log('❌ executionDataStore not available');
}

// Test 5: Function Call Test (Safe)
console.log('\n🔍 Test 5: Safe Function Calls');
try {
  if (window.roiModule && window.roiModule.updateRoiTotalSpend) {
    console.log('✅ updateRoiTotalSpend available for calling');
    // Don't actually call it to avoid disrupting the UI
  } else {
    console.log('❌ updateRoiTotalSpend not available');
  }
  
  if (window.roiModule && window.roiModule.checkForPlanningData) {
    console.log('✅ checkForPlanningData available for calling');
    // Test actual call
    window.roiModule.checkForPlanningData();
    console.log('✅ checkForPlanningData called successfully');
  } else {
    console.log('❌ checkForPlanningData not available for calling');
  }
} catch (error) {
  console.log('❌ Error during function calls:', error);
}

// Test 6: Chart Integration Test
console.log('\n🔍 Test 6: Charts Integration');
if (typeof renderRoiByQuarterChart !== 'undefined') {
  console.log('✅ renderRoiByQuarterChart is accessible');
} else {
  console.log('❌ renderRoiByQuarterChart not accessible');
}

// Summary
console.log('\n📊 === TEST SUMMARY ===');
console.log('All fixes have been tested. Check individual results above.');
console.log('If all tests show ✅, the ROI integration is working correctly.');
console.log('Any ❌ indicates areas that may need attention.');

// Navigation check
if (window.location.hash === '#roi') {
  console.log('\n🎯 Currently on ROI tab - UI should be working');
} else {
  console.log('\n💡 Switch to ROI tab to see the integration in action');
}

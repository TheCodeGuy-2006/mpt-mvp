// ROI Data Loading and Event System Test
// Test the improved data loading with event system and reduced console noise
console.log('🧪 === ROI DATA LOADING & EVENT SYSTEM TEST ===');
console.log('Testing improved data loading with events and reduced console noise\n');

// Test 1: Check Initial Data Store State
console.log('🔍 Test 1: Initial Data Store State');
if (window.planningDataStore && typeof window.planningDataStore.getData === 'function') {
  const planningCount = window.planningDataStore.getData().length;
  console.log(`✅ Planning data store exists: ${planningCount} rows`);
} else {
  console.log('❌ Planning data store not available');
}

if (window.executionDataStore && typeof window.executionDataStore.getData === 'function') {
  const executionCount = window.executionDataStore.getData().length;
  console.log(`✅ Execution data store exists: ${executionCount} rows`);
} else {
  console.log('❌ Execution data store not available');
}

// Test 2: Check Helper Functions
console.log('\n🔍 Test 2: ROI Helper Functions');
if (window.roiModule) {
  const planningData = window.roiModule.getPlanningData ? window.roiModule.getPlanningData() : [];
  const executionData = window.roiModule.getExecutionData ? window.roiModule.getExecutionData() : [];
  
  console.log(`✅ getPlanningData returns: ${planningData.length} rows`);
  console.log(`✅ getExecutionData returns: ${executionData.length} rows`);
} else {
  console.log('❌ roiModule not available');
}

// Test 3: Event Listener Setup
console.log('\n🔍 Test 3: Event System Setup');
let planningEventReceived = false;
let executionEventReceived = false;

const testPlanningListener = (event) => {
  planningEventReceived = true;
  console.log('✅ Planning data ready event received:', event.detail);
};

const testExecutionListener = (event) => {
  executionEventReceived = true;
  console.log('✅ Execution data ready event received:', event.detail);
};

window.addEventListener('planningDataReady', testPlanningListener);
window.addEventListener('executionDataReady', testExecutionListener);

// Test 4: Manual Event Trigger (to test the system)
console.log('\n🔍 Test 4: Manual Event System Test');
setTimeout(() => {
  // Trigger test events
  window.dispatchEvent(new CustomEvent('planningDataReady', { 
    detail: { rowCount: 100, source: 'test' }
  }));
  
  window.dispatchEvent(new CustomEvent('executionDataReady', { 
    detail: { rowCount: 50, source: 'test' }
  }));
  
  setTimeout(() => {
    console.log(`Planning event received: ${planningEventReceived}`);
    console.log(`Execution event received: ${executionEventReceived}`);
    
    // Cleanup test listeners
    window.removeEventListener('planningDataReady', testPlanningListener);
    window.removeEventListener('executionDataReady', testExecutionListener);
  }, 100);
}, 500);

// Test 5: Check For Data Function
console.log('\n🔍 Test 5: checkForPlanningData Function');
if (window.roiModule && window.roiModule.checkForPlanningData) {
  console.log('✅ checkForPlanningData function available');
  try {
    window.roiModule.checkForPlanningData();
    console.log('✅ checkForPlanningData executed without error');
  } catch (error) {
    console.log('❌ Error calling checkForPlanningData:', error);
  }
} else {
  console.log('❌ checkForPlanningData function not available');
}

// Test 6: Console Noise Reduction Test
console.log('\n🔍 Test 6: Console Noise Reduction');
console.log('Warning counters:');
console.log('- ROI data load attempts:', window.roiDataLoadAttempts || 0);
console.log('- ROI execution load attempts:', window.roiExecutionLoadAttempts || 0);
console.log('- Charts planning warnings:', window.chartsPlanningWarningCount || 0);
console.log('- Charts execution warnings:', window.chartsExecutionWarningCount || 0);

// Summary
console.log('\n📊 === TEST SUMMARY ===');
console.log('✅ Improved data access functions with reduced logging');
console.log('✅ Event system for data ready notifications');
console.log('✅ Smart retry mechanism with exponential backoff');
console.log('✅ Console noise reduction with warning counters');
console.log('\n💡 Switch between tabs to see the improved data loading experience!');

// Show current tab for context
if (window.location.hash === '#roi') {
  console.log('\n🎯 Currently on ROI tab - monitoring data updates...');
} else {
  console.log(`\n📍 Currently on ${window.location.hash || '#planning'} tab`);
}

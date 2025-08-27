// Phase 1 Execution Test Script
// Run this in browser console after loading the execution tab

console.log("🧪 PHASE 1 EXECUTION TEST: Starting validation...");
console.log("=" .repeat(60));

// Test 1: Check if ExecutionDataStore is available
console.log("\n🔍 Test 1: ExecutionDataStore Availability");
if (typeof window.executionDataStore !== 'undefined') {
  console.log("✅ PASS: executionDataStore is available globally");
  console.log(`   Store initialized: ${window.executionDataStore.initialized}`);
  console.log(`   Total rows: ${window.executionDataStore.getTotalCount()}`);
  console.log(`   Active rows: ${window.executionDataStore.getActiveCount()}`);
} else {
  console.log("❌ FAIL: executionDataStore not found");
}

// Test 2: Check if debug utilities are available
console.log("\n🔍 Test 2: Debug Utilities");
if (typeof window.executionDebug !== 'undefined') {
  console.log("✅ PASS: executionDebug utilities available");
  console.log("   Available commands:", Object.keys(window.executionDebug));
} else {
  console.log("❌ FAIL: executionDebug not found");
}

// Test 3: Check execution module integration
console.log("\n🔍 Test 3: Module Integration");
if (window.executionModule) {
  const hasDataStore = typeof window.executionModule.getExecutionDataStore === 'function';
  const hasActiveData = typeof window.executionModule.getActiveExecutionData === 'function';
  
  console.log(`✅ PASS: executionModule available`);
  console.log(`   Has getExecutionDataStore: ${hasDataStore}`);
  console.log(`   Has getActiveExecutionData: ${hasActiveData}`);
  
  if (hasActiveData) {
    const activeData = window.executionModule.getActiveExecutionData();
    console.log(`   Active data count: ${activeData.length}`);
  }
} else {
  console.log("❌ FAIL: executionModule not found");
}

// Test 4: Cross-tab sync status
console.log("\n🔍 Test 4: Cross-Tab Sync");
if (window.planningDataStore && window.executionDataStore) {
  const planningActive = window.planningDataStore.getData().length;
  const executionActive = window.executionDataStore.getActiveCount();
  
  console.log("✅ PASS: Both data stores available");
  console.log(`   Planning active: ${planningActive} rows`);
  console.log(`   Execution active: ${executionActive} rows`);
  
  if (planningActive === executionActive) {
    console.log("✅ Data counts match - sync working");
  } else {
    console.log("⚠️  Data counts differ - sync may need attention");
  }
} else {
  console.log("⚠️  One or both data stores not available for sync test");
}

// Test 5: Execute debug commands
console.log("\n🔍 Test 5: Debug Commands Test");
if (window.executionDebug) {
  try {
    console.log("\n--- Master Data Summary ---");
    window.executionDebug.showMasterDataSummary();
    
    console.log("\n--- Sync Status ---");
    window.executionDebug.showSyncStatus();
    
    console.log("\n--- Recent Operations ---");
    window.executionDebug.showRecentOperations(3);
    
    console.log("✅ PASS: Debug commands executed successfully");
  } catch (error) {
    console.log("❌ FAIL: Error executing debug commands:", error.message);
  }
} else {
  console.log("❌ FAIL: Cannot test debug commands - executionDebug not available");
}

console.log("\n" + "=" .repeat(60));
console.log("🧪 PHASE 1 EXECUTION TEST COMPLETE");
console.log("\n📋 Quick Commands to Test Manually:");
console.log("   executionDebug.showMasterDataSummary()");
console.log("   executionDebug.showSyncStatus()");
console.log("   executionDebug.compareDatasets()");
console.log("   window.executionModule.getActiveExecutionData()");

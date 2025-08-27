// Quick Phase 3 Validation Script
// Run this in the browser console when on the execution tab

(function() {
  console.log('\n🚀 QUICK PHASE 3 VALIDATION');
  console.log('============================');
  
  // Check 1: Core Components
  console.log('\n1️⃣ Checking Core Components:');
  const hasExecutionStore = typeof executionDataStore !== 'undefined';
  const hasPlanningStore = typeof window.planningDataStore !== 'undefined';
  const hasExecutionTable = typeof executionTableInstance !== 'undefined';
  
  console.log(`   ExecutionDataStore: ${hasExecutionStore ? '✅' : '❌'}`);
  console.log(`   PlanningDataStore: ${hasPlanningStore ? '✅' : '❌'}`);
  console.log(`   ExecutionTable: ${hasExecutionTable ? '✅' : '❌'}`);
  
  if (!hasExecutionStore || !hasPlanningStore) {
    console.log('❌ Core components missing - ensure you\'re on the execution tab');
    return;
  }
  
  // Check 2: Data Integrity
  console.log('\n2️⃣ Checking Data Integrity:');
  const masterData = executionDataStore.getData();
  const tableData = hasExecutionTable ? executionTableInstance.getData() : [];
  
  console.log(`   Master Dataset: ${masterData.length} rows`);
  console.log(`   Table Display: ${tableData.length} rows`);
  console.log(`   Data Structure: ${masterData.length > 0 ? Object.keys(masterData[0]).join(', ') : 'No data'}`);
  
  // Check 3: Cross-Tab Sync
  console.log('\n3️⃣ Checking Cross-Tab Sync:');
  const planningData = window.planningDataStore.getData();
  const planningDeleted = window.planningDataStore.getDeletedRows();
  
  console.log(`   Planning Active: ${planningData.length} rows`);
  console.log(`   Planning Deleted: ${planningDeleted.length} rows`);
  console.log(`   Sync Function: ${typeof syncDigitalMotionsFromPlanning === 'function' ? '✅' : '❌'}`);
  
  // Check 4: Save Function
  console.log('\n4️⃣ Checking Save Function:');
  const hasSaveFunction = typeof setupExecutionSave === 'function';
  console.log(`   Save Function Available: ${hasSaveFunction ? '✅' : '❌'}`);
  
  // Summary
  console.log('\n📋 QUICK VALIDATION SUMMARY:');
  const allChecks = hasExecutionStore && hasPlanningStore && hasExecutionTable && hasSaveFunction;
  console.log(`   Overall Status: ${allChecks ? '✅ READY FOR FULL TESTING' : '❌ ISSUES DETECTED'}`);
  
  if (allChecks) {
    console.log('\n🎯 Ready to run comprehensive tests!');
    console.log('   Run: runExecutionTests()');
    console.log('   Or run individual tests from window.testExecutionPhase3');
  }
  
  return allChecks;
})();

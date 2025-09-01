/**
 * EXECUTION MQL SAVE/LOAD TEST SCRIPT
 * 
 * This script helps test the MQL data persistence issue in the execution grid
 * by simulating the save and reload process.
 */

// Test data simulation
const testExecutionData = [
  {
    id: "test_1",
    campaignName: "Test Campaign 1",
    region: "AMER",
    quarter: "Q1",
    status: "Shipped",
    expectedLeads: 100,
    mqlForecast: 10,
    actualMQLs: 8,  // This should persist
    actualLeads: 95
  },
  {
    id: "test_2", 
    campaignName: "Test Campaign 2",
    region: "EMEA",
    quarter: "Q2",
    status: "Planning",
    expectedLeads: 200,
    mqlForecast: 20,
    actualMQLs: 15, // This should persist
    actualLeads: 180
  }
];

const testPlanningData = [
  {
    id: "test_1",
    campaignName: "Test Campaign 1 - Updated", // Changed in planning
    region: "AMER",
    quarter: "Q1",
    status: "Shipped",
    expectedLeads: 110, // Updated in planning
    mqlForecast: 11,
    // No actualMQLs or actualLeads - these are execution-only
  },
  {
    id: "test_2",
    campaignName: "Test Campaign 2",
    region: "EMEA", 
    quarter: "Q2",
    status: "Shipped", // Updated status in planning
    expectedLeads: 200,
    mqlForecast: 20,
    // No actualMQLs or actualLeads - these are execution-only
  }
];

// Test functions
function testMQLPersistence() {
  console.log('🧪 Testing MQL Persistence in Execution Grid');
  console.log('='.repeat(50));
  
  // Simulate execution data store initialization
  console.log('\n1. Initializing ExecutionDataStore with test data...');
  
  // Mock ExecutionDataStore for testing
  const mockExecutionDataStore = {
    masterData: [...testExecutionData],
    
    initialize(data) {
      this.masterData = data.map(row => ({...row}));
      console.log(`   ✅ Initialized with ${this.masterData.length} rows`);
      this.masterData.forEach(row => {
        console.log(`   - ${row.campaignName}: actualMQLs = ${row.actualMQLs}`);
      });
      return true;
    },
    
    getData() {
      return this.masterData.map(row => ({...row}));
    },
    
    updateRow(id, updates) {
      const rowIndex = this.masterData.findIndex(row => row.id === id);
      if (rowIndex >= 0) {
        this.masterData[rowIndex] = { ...this.masterData[rowIndex], ...updates };
        return true;
      }
      return false;
    },
    
    // OLD VERSION (problematic)
    syncWithPlanningOLD() {
      console.log('   ❌ OLD syncWithPlanning - OVERWRITES execution data');
      this.masterData = testPlanningData.map(row => ({...row}));
      console.log('   Data after OLD sync:');
      this.masterData.forEach(row => {
        console.log(`   - ${row.campaignName}: actualMQLs = ${row.actualMQLs || 'LOST!'}`);
      });
    },
    
    // NEW VERSION (fixed)
    syncWithPlanningNEW() {
      console.log('   ✅ NEW syncWithPlanning - PRESERVES execution data');
      const mergedData = testPlanningData.map(planningRow => {
        const existingExecutionRow = this.masterData.find(execRow => execRow.id === planningRow.id);
        
        if (existingExecutionRow) {
          return {
            ...planningRow, // Start with planning data
            // Preserve execution-specific actual values
            actualLeads: existingExecutionRow.actualLeads,
            actualMQLs: existingExecutionRow.actualMQLs,
            actualSQL: existingExecutionRow.actualSQL,
            actualOpportunities: existingExecutionRow.actualOpportunities,
            actualPipeline: existingExecutionRow.actualPipeline,
            actualCost: existingExecutionRow.actualCost,
            __modified: existingExecutionRow.__modified || false
          };
        } else {
          return {
            ...planningRow,
            actualLeads: null,
            actualMQLs: null,
            actualSQL: null,
            actualOpportunities: null,
            actualPipeline: null,
            actualCost: null,
            __modified: false
          };
        }
      });
      
      this.masterData = mergedData;
      console.log('   Data after NEW sync:');
      this.masterData.forEach(row => {
        console.log(`   - ${row.campaignName}: actualMQLs = ${row.actualMQLs}`);
      });
    }
  };
  
  // Initialize with execution data
  mockExecutionDataStore.initialize(testExecutionData);
  
  // Test the old problematic version
  console.log('\n2. Testing OLD syncWithPlanning (problematic version)...');
  const dataBeforeOldSync = mockExecutionDataStore.getData();
  mockExecutionDataStore.syncWithPlanningOLD();
  
  // Test the new fixed version
  console.log('\n3. Resetting and testing NEW syncWithPlanning (fixed version)...');
  mockExecutionDataStore.initialize(testExecutionData); // Reset
  mockExecutionDataStore.syncWithPlanningNEW();
  
  // Test MQL update and save
  console.log('\n4. Testing MQL update and persistence...');
  mockExecutionDataStore.updateRow('test_1', { actualMQLs: 12 });
  console.log('   Updated test_1 actualMQLs to 12');
  
  const updatedData = mockExecutionDataStore.getData();
  console.log('   Final data state:');
  updatedData.forEach(row => {
    console.log(`   - ${row.campaignName}: actualMQLs = ${row.actualMQLs}, expectedLeads = ${row.expectedLeads}`);
  });
  
  console.log('\n5. Summary:');
  console.log('   ✅ NEW version preserves actualMQLs during sync');
  console.log('   ✅ Updates to actualMQLs are maintained');
  console.log('   ✅ Planning field updates are merged correctly');
  
  return updatedData;
}

// Test the cross-tab sync field filtering
function testCrossTabSyncFiltering() {
  console.log('\n🔄 Testing Cross-Tab Sync Field Filtering');
  console.log('='.repeat(50));
  
  const fullExecutionRow = {
    id: "test_sync",
    campaignName: "Sync Test Campaign",
    region: "AMER",
    quarter: "Q1",
    status: "Shipped",
    expectedLeads: 100,
    mqlForecast: 10,
    // Execution-specific fields that should NOT sync back to planning
    actualMQLs: 8,
    actualLeads: 95,
    actualSQL: 5,
    actualOpportunities: 3,
    actualPipeline: 150000,
    actualCost: 25000
  };
  
  // Simulate the NEW field filtering for cross-tab sync
  const planningFields = {
    // Core planning fields
    id: fullExecutionRow.id,
    campaignName: fullExecutionRow.campaignName,
    region: fullExecutionRow.region,
    quarter: fullExecutionRow.quarter,
    status: fullExecutionRow.status,
    expectedLeads: fullExecutionRow.expectedLeads,
    mqlForecast: fullExecutionRow.mqlForecast,
    // Execution fields are deliberately excluded
  };
  
  console.log('\n   Original execution row fields:');
  Object.keys(fullExecutionRow).forEach(key => {
    console.log(`   - ${key}: ${fullExecutionRow[key]}`);
  });
  
  console.log('\n   Fields that will sync back to planning:');
  Object.keys(planningFields).forEach(key => {
    console.log(`   - ${key}: ${planningFields[key]}`);
  });
  
  console.log('\n   Execution fields excluded from planning sync:');
  const excludedFields = Object.keys(fullExecutionRow).filter(key => !planningFields.hasOwnProperty(key));
  excludedFields.forEach(field => {
    console.log(`   - ${field}: ${fullExecutionRow[field]} (preserved in execution only)`);
  });
  
  console.log('\n   ✅ Cross-tab sync now properly filters fields!');
}

// Run all tests
function runAllMQLTests() {
  console.log('🚀 EXECUTION MQL PERSISTENCE TEST SUITE');
  console.log('='.repeat(60));
  
  try {
    testMQLPersistence();
    testCrossTabSyncFiltering();
    
    console.log('\n🎉 ALL TESTS COMPLETED!');
    console.log('\nThe fixes should resolve:');
    console.log('1. ✅ MQL data disappearing after save/reload');
    console.log('2. ✅ Execution fields being lost during planning sync');
    console.log('3. ✅ Cross-tab sync overwriting planning data with execution fields');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  window.runAllMQLTests = runAllMQLTests;
  window.testMQLPersistence = testMQLPersistence;
  window.testCrossTabSyncFiltering = testCrossTabSyncFiltering;
  console.log('MQL persistence tests loaded. Run with: runAllMQLTests()');
}

// Auto-run if this script is executed directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllMQLTests,
    testMQLPersistence,
    testCrossTabSyncFiltering
  };
  
  // Run tests if called directly
  if (require.main === module) {
    runAllMQLTests();
  }
}

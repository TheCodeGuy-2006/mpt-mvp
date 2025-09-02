/**
 * Phase 1 Testing Suite
 * Tests the new modular architecture components
 */

// Test data for planning module
const testPlanningData = [
  {
    id: 'test1',
    campaignName: 'Test Campaign 1',
    description: 'Test description for campaign 1',
    region: 'North America',
    quarter: 'Q1',
    status: 'Active',
    owner: 'Test User',
    digitalMotions: true
  },
  {
    id: 'test2',
    campaignName: 'Test Campaign 2',
    description: 'Another test campaign',
    region: 'Europe',
    quarter: 'Q2',
    status: 'Planning',
    owner: 'Another User',
    digitalMotions: false
  }
];

// Test EventBus functionality
async function testEventBus() {
  console.log('🧪 Testing EventBus...');
  
  try {
    // Dynamically import EventBus
    const { default: eventBus, EVENTS } = await import('./src/utils/EventBus.js');
    
    let testPassed = false;
    
    // Subscribe to test event
    const unsubscribe = eventBus.subscribe('test:event', (data) => {
      console.log('✅ EventBus received:', data);
      testPassed = data.message === 'Hello EventBus!';
    });
    
    // Publish test event
    eventBus.publish('test:event', { message: 'Hello EventBus!' });
    
    // Clean up
    unsubscribe();
    
    console.log(testPassed ? '✅ EventBus test PASSED' : '❌ EventBus test FAILED');
    return testPassed;
    
  } catch (error) {
    console.error('❌ EventBus test FAILED:', error);
    return false;
  }
}

// Test PlanningDataModel functionality
async function testPlanningDataModel() {
  console.log('🧪 Testing PlanningDataModel...');
  
  try {
    const { default: PlanningDataModel } = await import('./src/models/PlanningDataModel.js');
    
    const model = new PlanningDataModel();
    
    // Test setData
    model.setData(testPlanningData);
    console.log('✅ Data set successfully');
    
    // Test getData
    const data = model.getData();
    const passed1 = data.length === 2;
    console.log(passed1 ? '✅ getData works' : '❌ getData failed');
    
    // Test addRow
    const newRow = model.addRow({
      campaignName: 'New Test Campaign',
      description: 'Newly added campaign'
    });
    const passed2 = model.getData().length === 3;
    console.log(passed2 ? '✅ addRow works' : '❌ addRow failed');
    
    // Test updateRow
    const updated = model.updateRow(newRow.id, { status: 'Updated' });
    const passed3 = updated === true;
    console.log(passed3 ? '✅ updateRow works' : '❌ updateRow failed');
    
    // Test deleteRow (soft delete)
    const deleted = model.deleteRow(newRow.id);
    const passed4 = deleted === true && model.getData().length === 2;
    console.log(passed4 ? '✅ deleteRow works' : '❌ deleteRow failed');
    
    // Test filters
    const filtered = model.applyFilters({ region: ['North America'] });
    const passed5 = filtered.length === 1 && filtered[0].region === 'North America';
    console.log(passed5 ? '✅ applyFilters works' : '❌ applyFilters failed');
    
    const allPassed = passed1 && passed2 && passed3 && passed4 && passed5;
    console.log(allPassed ? '✅ PlanningDataModel test PASSED' : '❌ PlanningDataModel test FAILED');
    
    // Clean up
    model.destroy();
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ PlanningDataModel test FAILED:', error);
    return false;
  }
}

// Test PlanningController functionality
async function testPlanningController() {
  console.log('🧪 Testing PlanningController...');
  
  try {
    const { default: PlanningController } = await import('./src/controllers/PlanningController.js');
    
    const controller = new PlanningController();
    
    // Test initialization
    await controller.initialize(testPlanningData);
    console.log('✅ Controller initialized');
    
    // Test getData
    const data = controller.getData();
    const passed1 = data.length === 2;
    console.log(passed1 ? '✅ Controller getData works' : '❌ Controller getData failed');
    
    // Test addCampaign
    const newCampaign = controller.addCampaign({
      campaignName: 'Controller Test Campaign',
      description: 'Added via controller'
    });
    const passed2 = controller.getData().length === 3;
    console.log(passed2 ? '✅ Controller addCampaign works' : '❌ Controller addCampaign failed');
    
    // Test applyFilters
    const filtered = controller.applyFilters({ region: ['Europe'] });
    const passed3 = filtered.length === 1 && filtered[0].region === 'Europe';
    console.log(passed3 ? '✅ Controller applyFilters works' : '❌ Controller applyFilters failed');
    
    // Test getUniqueValues
    const uniqueRegions = controller.getUniqueValues('region');
    const passed4 = uniqueRegions.length >= 2 && uniqueRegions.includes('North America');
    console.log(passed4 ? '✅ Controller getUniqueValues works' : '❌ Controller getUniqueValues failed');
    
    const allPassed = passed1 && passed2 && passed3 && passed4;
    console.log(allPassed ? '✅ PlanningController test PASSED' : '❌ PlanningController test FAILED');
    
    // Clean up
    controller.destroy();
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ PlanningController test FAILED:', error);
    return false;
  }
}

// Test PlanningService functionality
async function testPlanningService() {
  console.log('🧪 Testing PlanningService...');
  
  try {
    const { default: PlanningService } = await import('./src/services/PlanningService.js');
    
    const service = new PlanningService();
    
    // Test CSV export
    const csvOutput = service.exportToCSV(testPlanningData);
    const passed1 = csvOutput.includes('campaignName') && csvOutput.includes('Test Campaign 1');
    console.log(passed1 ? '✅ CSV export works' : '❌ CSV export failed');
    
    // Test CSV import
    const csvInput = 'campaignName,region,status\nTest CSV Campaign,Asia,Active';
    const importedData = service.importFromCSV(csvInput);
    const passed2 = importedData.length === 1 && importedData[0].campaignName === 'Test CSV Campaign';
    console.log(passed2 ? '✅ CSV import works' : '❌ CSV import failed');
    
    const allPassed = passed1 && passed2;
    console.log(allPassed ? '✅ PlanningService test PASSED' : '❌ PlanningService test FAILED');
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ PlanningService test FAILED:', error);
    return false;
  }
}

// Test full module integration
async function testPlanningModuleIntegration() {
  console.log('🧪 Testing PlanningModule Integration...');
  
  try {
    const module = await import('./src/PlanningModule.js');
    
    // Test module initialization
    const planningModule = await module.initializePlanningModule(testPlanningData);
    console.log('✅ Module initialized');
    
    // Test public API
    const data = planningModule.getData();
    const passed1 = data.length === 2;
    console.log(passed1 ? '✅ Module getData works' : '❌ Module getData failed');
    
    const filtered = planningModule.applyFilters({ status: ['Active'] });
    const passed2 = filtered.length === 1 && filtered[0].status === 'Active';
    console.log(passed2 ? '✅ Module applyFilters works' : '❌ Module applyFilters failed');
    
    const newCampaign = planningModule.addCampaign({
      campaignName: 'Module Test Campaign',
      status: 'Testing'
    });
    const passed3 = planningModule.getData().length === 3;
    console.log(passed3 ? '✅ Module addCampaign works' : '❌ Module addCampaign failed');
    
    const allPassed = passed1 && passed2 && passed3;
    console.log(allPassed ? '✅ PlanningModule Integration test PASSED' : '❌ PlanningModule Integration test FAILED');
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ PlanningModule Integration test FAILED:', error);
    return false;
  }
}

// Run all tests
export async function runPhase1Tests() {
  console.log('🚀 Starting Phase 1 Architecture Tests...');
  console.log('================================================');
  
  const results = {
    eventBus: await testEventBus(),
    planningDataModel: await testPlanningDataModel(),
    planningController: await testPlanningController(),
    planningService: await testPlanningService(),
    moduleIntegration: await testPlanningModuleIntegration()
  };
  
  console.log('================================================');
  console.log('📊 Phase 1 Test Results:');
  
  let passedCount = 0;
  let totalCount = 0;
  
  Object.entries(results).forEach(([testName, passed]) => {
    totalCount++;
    if (passed) passedCount++;
    console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = passedCount === totalCount;
  console.log('================================================');
  console.log(`🎯 Overall Result: ${passedCount}/${totalCount} tests passed`);
  console.log(allPassed ? '🎉 Phase 1 Architecture: SUCCESS!' : '⚠️ Phase 1 Architecture: Some tests failed');
  
  return { results, allPassed, passedCount, totalCount };
}

// Auto-run tests if called directly
if (typeof window !== 'undefined') {
  window.runPhase1Tests = runPhase1Tests;
  console.log('Phase 1 tests loaded. Run window.runPhase1Tests() to execute.');
}

export default runPhase1Tests;

// Console Log Cleanup Script
// This will systematically remove excessive console logs from all files

// ROI.js cleanup
const roiLogsToRemove = [
  'console.log("✅ ROI: Universal search initialized successfully!");',
  'console.log("🔍 ROI: Applying search filters:", selectedFilters);', 
  'console.log("🔍 ROI: Universal search filters applied:", universalRoiSearchFilters);',
  'console.log("🔍 ROI: Universal search not initialized yet");',
  'console.log(`🔍 ROI: Creating filter options from ${campaigns.length} campaigns`);',
  'console.log("✅ ROI: Search data updated with", searchData.length, "filter options");',
  'console.log("[ROI] Total actual cost calculated:", totalActualCost);',
  'console.log("[ROI] Total forecasted cost calculated:", totalForecastedCost);'
];

// Planning.js cleanup  
const planningLogsToRemove = [
  'console.log("🎯 TabManager found, registering planning tab...");',
  'console.log("✅ Planning tab registered with TabManager");',
  'console.log("Planning module initialized and exported to window.planningModule");',
  'console.log("⚡ Attempting to hide loading indicator...");',
  'console.log("ℹ️ No loading indicator found to remove");',
  'console.log("Master dataset updated:", rows, "rows");',
  'console.log("🔧 Table instance created, wiring up UI functionality...");'
];

// Execution.js cleanup
const executionLogsToRemove = [
  'console.log("🚀 Pre-populating execution filters for faster initial load...");',
  'console.log("🔧 PHASE 1: Initializing ExecutionDataStore...");',
  'console.log("🔧 PHASE 1: ExecutionDataStore initialized");',
  'console.log("🔄 PHASE 1: Syncing with planning data store...");',
  'console.log("🔄 Initializing execution grid - preparing config...");',
  'console.log("🔄 Initializing execution grid - creating table...");',
  'console.log("✅ PHASE 1: Execution table instance ready and linked to data store");',
  'console.log("[Execution] Data count after init:", data.length);',
  'console.log("[Execution] Sample data keys:", Object.keys(data[0] || {}));',
  'console.log("[Execution] Sample data:", data[0]);'
];

console.log("📝 Console Log Cleanup Analysis:");
console.log(`- ROI logs to clean: ${roiLogsToRemove.length}`);
console.log(`- Planning logs to clean: ${planningLogsToRemove.length}`);  
console.log(`- Execution logs to clean: ${executionLogsToRemove.length}`);
console.log("🎯 Manual cleanup required - use replace_string_in_file for each");

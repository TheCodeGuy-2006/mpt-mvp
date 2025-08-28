// Execution Table Initialization Debug Helper

// Function to check execution table status
function checkExecutionTableStatus() {
  console.log("🔍 Execution Table Diagnostic Report:");
  console.log("=====================================");
  
  // Check all possible table references
  console.log("Table Instance References:");
  console.log("  - executionTableInstance:", !!window.executionTableInstance);
  console.log("  - global executionTableInstance:", typeof executionTableInstance !== 'undefined' ? !!executionTableInstance : 'undefined');
  console.log("  - window.executionModule?.tableInstance:", !!window.executionModule?.tableInstance);
  
  // Check DOM elements
  console.log("\nDOM Elements:");
  const gridElement = document.getElementById('executionGrid');
  console.log("  - #executionGrid exists:", !!gridElement);
  if (gridElement) {
    console.log("  - #executionGrid visible:", gridElement.offsetParent !== null);
    console.log("  - #executionGrid children:", gridElement.children.length);
  }
  
  // Check execution module status
  console.log("\nExecution Module Status:");
  console.log("  - window.executionModule exists:", !!window.executionModule);
  if (window.executionModule) {
    console.log("  - filtersInitialized:", window.executionModule.filtersInitialized);
    console.log("  - filterLogicInitialized:", window.executionModule.filterLogicInitialized);
    console.log("  - initializationInProgress:", window.executionModule.initializationInProgress);
  }
  
  // Check data store
  console.log("\nData Store Status:");
  console.log("  - window.executionDataStore exists:", !!window.executionDataStore);
  if (window.executionDataStore) {
    console.log("  - initialized:", window.executionDataStore.initialized);
    console.log("  - data count:", window.executionDataStore.getData().length);
  }
  
  console.log("=====================================");
}

// Make it globally available for debugging
window.checkExecutionTableStatus = checkExecutionTableStatus;

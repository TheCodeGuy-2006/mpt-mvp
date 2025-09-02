// Console Log Cleanup Script for roi.js
const fs = require('fs');

const filePath = '/Users/jordanradford/Desktop/New Github/mpt-mvp/roi.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove most debug console.log statements but keep essential ones
const linesToRemove = [
  // Data source debug logs
  /\s*console\.log\(`\[ROI\] Using planning master dataset: \${data\.length} rows`\);\s*/g,
  /\s*console\.log\(`\[ROI\] Fallback to planning table data: \${data\.length} rows`\);\s*/g,
  /\s*console\.log\(`\[ROI\] Fallback to direct planning table: \${data\.length} rows`\);\s*/g,
  /\s*console\.log\(`\[ROI\] Using execution master dataset: \${data\.length} rows`\);\s*/g,
  /\s*console\.log\(`\[ROI\] Fallback to execution table data: \${data\.length} rows`\);\s*/g,
  /\s*console\.log\(`\[ROI\] Fallback to direct execution table: \${data\.length} rows`\);\s*/g,
  
  // Filter debug logs
  /\s*console\.log\('\[ROI\] getFilterState - dropdown filters:', dropdownFilters\);\s*/g,
  /\s*console\.log\('\[ROI\] getFilterState - universal search filters:', Object\.fromEntries\(universalRoiSearchFilters\)\);\s*/g,
  /\s*console\.log\('\[ROI\] getFilterState - combined filters:', combinedFilters\);\s*/g,
  
  // Chart update logs
  /\s*console\.log\('\[ROI\] Updating charts with current filters\.\.\.'\);\s*/g,
  /\s*console\.log\('\[ROI\] Chart filters:', filters\);\s*/g,
  
  // Data initialization logs
  /\s*console\.log\('\[ROI\] Planning data ready event received'\);\s*/g,
  /\s*console\.log\('\[ROI\] Execution data ready event received'\);\s*/g,
  /\s*console\.log\(`\[ROI\] Data available - Planning: \${planningData\.length}, Execution: \${executionData\.length}`\);\s*/g,
  /\s*console\.log\('\[ROI\] Stopped checking for data after maximum attempts'\);\s*/g,
  
  // Table filtering logs
  /\s*console\.log\(`\[ROI\] Data table filtered: \${campaigns\.length} → \${filteredCampaigns\.length} campaigns`\);\s*/g,
  
  // Universal search logs
  /\s*console\.log\("✅ ROI: Universal search initialized successfully!"\);\s*/g,
  /\s*console\.log\("🔍 ROI: Applying search filters:", selectedFilters\);\s*/g,
  /\s*console\.log\("🔍 ROI: Universal search filters applied:", universalRoiSearchFilters\);\s*/g,
  /\s*console\.log\("🔍 ROI: Universal search not initialized yet"\);\s*/g,
  /\s*console\.log\(`🔍 ROI: Creating filter options from \${campaigns\.length} campaigns`\);\s*/g,
  
  // Budget calculation logs
  /\s*console\.log\("\[ROI\] Loaded budgets data from budgets module"\);\s*/g,
  /\s*console\.log\("\[ROI\] Updated remaining budget display:.*?"\);\s*/g,
  /\s*console\.log\("\[ROI\] Budgets data loaded for forecasted calculation:.*?"\);\s*/g,
  /\s*console\.log\("\[ROI\] Forecasted budget usage calculated:.*?"\);\s*/g,
  /\s*console\.log\("\[ROI\] Updated forecasted budget display:.*?"\);\s*/g,
  /\s*console\.log\("\[ROI\] Updating forecasted budget usage with filters:.*?"\);\s*/g
];

// Apply all removals
linesToRemove.forEach(pattern => {
  content = content.replace(pattern, '');
});

// Clean up any double empty lines that might result
content = content.replace(/\n\n\n+/g, '\n\n');

// Write the cleaned content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Console log cleanup completed for roi.js');

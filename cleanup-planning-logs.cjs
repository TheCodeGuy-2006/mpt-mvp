// Console Log Cleanup Script for planning.js
const fs = require('fs');

const filePath = '/Users/jordanradford/Desktop/New Github/mpt-mvp/planning.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove most debug console.log statements but keep essential ones
const linesToRemove = [
  // Data store debug logs
  /\s*console\.log\(`Master dataset updated: \${this\.masterData\.length} rows`\);\s*/g,
  /\s*console\.log\(`Row added to master dataset: \${rowData\.id}`\);\s*/g,
  /\s*console\.log\(`Row soft-deleted: \${rowId}`\);\s*/g,
  /\s*console\.log\(`Row permanently deleted: \${rowId}`\);\s*/g,
  /\s*console\.log\(`Row restored: \${rowId}`\);\s*/g,
  /\s*console\.log\(`Permanently cleared \${deletedCount} deleted rows`\);\s*/g,
  
  // Filter performance logs
  /\s*console\.log\(`Filter applied \(no filters\): \${this\.filteredData\.length}\/\${activeData\.length} rows \(\${duration\.toFixed\(2\)}ms\)`\);\s*/g,
  /\s*console\.log\(`Filter applied: \${this\.filteredData\.length}\/\${activeData\.length} rows \(\${duration\.toFixed\(2\)}ms\)`\);\s*/g,
  
  // Delete operation logs
  /\s*console\.log\("=== PHASE 3: Using Master Dataset for Delete ==="\);\s*/g,
  /\s*console\.log\(`Soft deleted row ID: \${rowData\.id}`\);\s*/g,
  /\s*console\.log\(`Phase 3: Deleted \${deletedIds\.length} rows from master dataset`\);\s*/g,
  /\s*console\.log\(`\[Planning\] Unsaved changes set to true \(mass delete: \${selectedRows\.length} rows\)`\);\s*/g,
  /\s*console\.log\("=== PHASE 3: Using Master Dataset for Delete All ==="\);\s*/g,
  /\s*console\.log\(`Phase 3: Marked \${deletedIds\.length} rows as deleted in master dataset`\);\s*/g,
  
  // Import logs
  /\s*console\.log\('\[Planning\] Unsaved changes set to true \(imported campaigns\)'\);\s*/g,
  
  // Loading state logs
  /\s*console\.log\("🔧 Resetting loading state and returning empty array"\);\s*/g,
  
  // Loading indicator debug
  /\s*console\.log\("⚡ Attempting to hide loading indicator\.\.\."\);\s*/g,
  /\s*console\.log\("ℹ️ No loading indicator found to remove"\);\s*/g,
  
  // Debug tool initialization logs
  /\s*console\.log\("🛠️ Campaign calculation debugging tools loaded!"\);\s*/g,
  /\s*console\.log\("Run debugCampaignCalculations\(\) to analyze issues"\);\s*/g,
  /\s*console\.log\("Run fixCalculationIssues\(\) to fix calculation problems"\);\s*/g,
  /\s*console\.log\("Run refreshRoiChart\(\) to refresh the chart"\);\s*/g,
  /\s*console\.log\("Run checkExpectedLeads\(\) to verify total expected leads\/MQL"\);\s*/g,
  /\s*console\.log\("Run debugChartAggregation\(\) to debug chart aggregation logic"\);\s*/g,
  
  // Table setup logs
  /\s*console\.log\("🔧 Table instance created, wiring up UI functionality\.\.\."\);\s*/g
];

// Apply all removals
linesToRemove.forEach(pattern => {
  content = content.replace(pattern, '');
});

// Clean up any double empty lines that might result
content = content.replace(/\n\n\n+/g, '\n\n');

// Write the cleaned content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Console log cleanup completed for planning.js');

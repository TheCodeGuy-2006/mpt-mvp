// Console Log Cleanup Script for charts.js
const fs = require('fs');

const filePath = '/Users/jordanradford/Desktop/New Github/mpt-mvp/charts.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove most debug console.log statements but keep essential ones
const linesToRemove = [
  // ROI Chart debug logs
  /\s*console\.log\('\[ROI CHART\] ROI by Region - Current filters:', filters\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Using ROI campaign data:', data\.length, 'campaigns'\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Available regions in data:', uniqueRegions\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Target regions for chart:', targetRegions\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Processing', totalCount, 'total campaigns with filters:', filters\);\s*/g,
  /\s*console\.log\(`\[ROI CHART\] Sample row \${idx}:`, \{[\s\S]*?\}\);\s*/g,
  /\s*if \(idx < 5\) console\.log\(`\[ROI CHART\] Row \${idx} filtered out by .*?\);\s*/g,
  /\s*if \(idx < 5\) console\.log\(`\[ROI CHART\] Row \${idx} PASSED all filters - will be included in chart`\);\s*/g,
  /\s*console\.log\(`\[ROI CHART\] Filtering complete: \${filteredCount}\/\${totalCount} campaigns passed filters`\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Final regionMap after processing:', regionMap\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Using planning master dataset, rows:', planningRows\.length\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Fallback to planningTableInstance, rows:', planningRows\.length\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Fallback to window\.planningRows, rows:', planningRows\.length\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Filters:', filters\);\s*/g,
  /\s*console\.log\(`\[ROI CHART\] Planning rows: total=\${planningRows\.length}, filtered=\${filteredCount}, forecastedMql=\${forecastedMql}, forecastedLeads=\${forecastedLeads}`\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Using execution master dataset, rows:', execRows\.length\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Fallback to executionTableInstance, rows:', execRows\.length\);\s*/g,
  /\s*console\.log\(`\[ROI CHART\] Execution rows: total=\${execRows\.length}, filtered=\${execFilteredCount}, actualMql=\${actualMql}, actualLeads=\${actualLeads}`\);\s*/g,
  /\s*console\.log\('\[ROI CHART\] Final chartData:', chartData, 'hasPlanningData:', hasPlanningData, 'hasExecutionData:', hasExecutionData\);\s*/g,
  
  // Budget chart debug logs
  /\s*console\.info\("\[BudgetsBarChart\] Loaded budgets data from budgetsTableInstance", budgetsData\);\s*/g,
  /\s*console\.info\("\[BudgetsBarChart\] Loaded budgets data from budgetsObj", budgetsData\);\s*/g,
  /\s*console\.info\("\[BudgetsBarChart\] Using cached data, no changes detected\."\);\s*/g,
  /\s*console\.info\("\[BudgetsBarChart\] Destroyed previous chart instance\."\);\s*/g,
  /\s*console\.info\("\[BudgetsBarChart\] Chart rendered successfully\."\);\s*/g,
  /\s*console\.info\("\[BudgetsRegionCharts\] Using cached region data\."\);\s*/g,
  
  // Chart debug logs
  /\s*console\.log\(`\[Chart Debug\] \${region}:`, \{[\s\S]*?\}\);\s*/g,
  
  // Commented debug logs (remove the comments)
  /\s*\/\/ console\.log\(`\[Region Chart\] processRegionChart called for region: \${region}`\);\s*/g,
  /\s*\/\/ console\.log\(`\[Region Chart\] Creating chart for region: \${region}`\);\s*/g
];

// Apply all removals
linesToRemove.forEach(pattern => {
  content = content.replace(pattern, '');
});

// Clean up any double empty lines that might result
content = content.replace(/\n\n\n+/g, '\n\n');

// Write the cleaned content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Console log cleanup completed for charts.js');

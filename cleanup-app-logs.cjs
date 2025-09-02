// Console Log Cleanup Script for app.js
const fs = require('fs');

const filePath = '/Users/jordanradford/Desktop/New Github/mpt-mvp/app.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove most debug console.log statements but keep essential ones
const linesToRemove = [
  // Tab manager logs
  /\s*console\.log\("🎯 TabManager initialized and available globally"\);\s*/g,
  /\s*\(\) => console\.log\('.*? tab cleanup'\)/g,
  
  // Route debug logs
  /\s*console\.log\('🏦 \[ROUTE\] Showing budgets sections'\);\s*/g,
  /\s*console\.log\('🏦 \[ROUTE\] budgetsSection exists:', !!\s*budgetsSection\);\s*/g,
  /\s*console\.log\('🏦 \[ROUTE\] budgetSetupSection exists:', !!\s*budgetSetupSection\);\s*/g,
  /\s*console\.log\('🏦 \[ROUTE\] Calling debouncedRoute\(\), current hash:', location\.hash\);\s*/g,
  
  // Annual budget debug logs
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] Initializing during tab switch to budgets'\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] Using table data for tab switch:', budgetsData\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] Error getting table data during tab switch:', e\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] Module or function not available during tab switch'\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] budgetsModule:', !!\s*window\.budgetsModule\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] initializeAnnualBudgetPlan:', !!\s*window\.budgetsModule\?\.initializeAnnualBudgetPlan\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] Initializing during page load with budgets data:', budgetsData\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] Current location\.hash:', location\.hash\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] budgetsModule available:', !!\s*window\.budgetsModule\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] Not budgets tab or module not ready'\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] hash:', location\.hash\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] budgetsModule:', !!\s*window\.budgetsModule\);\s*/g,
  /\s*console\.log\('🏦 \[ANNUAL BUDGET\] initializeAnnualBudgetPlan:', !!\s*window\.budgetsModule\?\.initializeAnnualBudgetPlan\);\s*/g,
  
  // App initialization logs
  /\s*console\.log\("🔄 APP: Initializing execution universal search on tab switch"\);\s*/g,
  
  // Performance logs
  /\s*console\.log\(`Table redraw idle callback: \${.*?}ms`\);\s*/g,
  
  // Debug info logs
  /\s*console\.log\("\[DEBUG\] Planning searchData after universal search init:", searchData\);\s*/g,
  
  // Commented debug logs
  /\s*\/\/ console\.log\(".*?"\);\s*\/\/ .*?\s*/g
];

// Apply all removals
linesToRemove.forEach(pattern => {
  content = content.replace(pattern, '');
});

// Clean up any double empty lines that might result
content = content.replace(/\n\n\n+/g, '\n\n');

// Write the cleaned content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Console log cleanup completed for app.js');

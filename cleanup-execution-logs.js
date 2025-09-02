// Console Log Cleanup Script for execution.js
// This script will clean up most debug console logs while preserving errors and warnings

const fs = require('fs');
const path = require('path');

const filePath = '/Users/jordanradford/Desktop/New Github/mpt-mvp/execution.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define patterns to remove (debug console.log statements)
const patternsToRemove = [
  /\s*console\.log\('🚀 EXECUTION MODULE: Early debug marker set'\);\s*/g,
  /\s*console\.log\("=== PHASE 2: Using Master Dataset for Execution Save ==="\);\s*/g,
  /\s*console\.log\(`Saving execution master dataset: \${masterData\.length} rows \(vs table: \${table\.getData\(\)\.length} visible\)`\);\s*/g,
  /\s*console\.log\("Worker save successful:", result\);\s*/g,
  /\s*console\.log\("🔄 PHASE 2: Syncing execution changes back to planning\.\.\."\);\s*/g,
  /\s*console\.log\("✅ PHASE 2: Planning data store updated with execution changes \(planning fields only\)"\);\s*/g,
  /\s*console\.log\("🔄 PHASE 2: Refreshing table display after save\.\.\."\);\s*/g,
  /\s*console\.log\("✅ PHASE 2: Table display refreshed with", currentData\.length, "rows"\);\s*/g,
  /\s*console\.log\("✅ PHASE 2: Filters reapplied after save"\);\s*/g,
  /\s*console\.log\("\[Execution\] Unsaved changes set to false \(save successful\)"\);\s*/g,
  /\s*console\.log\("\[Execution\] Unsaved changes set to false \(save successful, backend fallback\)"\);\s*/g,
  /\s*console\.log\("\[Execution\] Unsaved changes set to false \(save successful, backend only\)"\);\s*/g,
  /\s*console\.log\("🔧 PHASE 1: ExecutionDataStore initialized"\);\s*/g,
  /\s*console\.log\(`✅ PHASE 1: ExecutionDataStore initialized with \${this\.masterData\.length} rows`\);\s*/g,
  /\s*console\.log\(`✅ PHASE 1: Added row to execution master dataset: \${rowData\.id}`\);\s*/g,
  /\s*console\.log\(`🔄 PHASE 1: Replaced execution data: \${oldCount} → \${this\.masterData\.length} rows`\);\s*/g,
  /\s*console\.log\("⏳ PHASE 1: Planning data store not available for sync"\);\s*/g,
  /\s*console\.log\(`🔄 PHASE 1: Syncing execution data with planning \(\${planningData\.length} planning rows\)`\);\s*/g,
  /\s*console\.log\(`✅ PHASE 1: Synced with planning while preserving execution fields`\);\s*/g,
  /\s*console\.log\(`🗑️ PHASE 1: Cleared all execution data \(\${oldCount} rows removed\)`\);\s*/g,
  /\s*console\.log\("🔗 PHASE 1: ExecutionDataStore linked to table instance"\);\s*/g,
  /\s*console\.log\(`🔄 PHASE 1: Syncing table with data store \(\${currentData\.length} rows\)`\);\s*/g,
  /\s*console\.log\("✅ PHASE 1: Table synced with data store"\);\s*/g,
  /\s*console\.log\("🔄 EXECUTION-PLANNING Sync Status:"\);\s*/g,
  /\s*console\.log\(`\s+Planning active: \${planningActive} rows`\);\s*/g,
  /\s*console\.log\(`\s+Planning deleted: \${planningDeleted} rows`\);\s*/g,
  /\s*console\.log\("\s+❌ Planning data store not available"\);\s*/g,
  /\s*console\.log\(`\s+Execution active: \${executionActive} rows`\);\s*/g,
  /\s*console\.log\(`\s+Execution total: \${executionTotal} rows`\);\s*/g,
  /\s*console\.log\(`\s+Sync alignment: \${syncAligned \? '✅ Aligned' : '⚠️ Misaligned'}`\);\s*/g,
  /\s*console\.log\("✅ Manual sync completed - table updated with data store data"\);\s*/g
];

// Apply all removals
patternsToRemove.forEach(pattern => {
  content = content.replace(pattern, '');
});

// Write the cleaned content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Console log cleanup completed for execution.js');

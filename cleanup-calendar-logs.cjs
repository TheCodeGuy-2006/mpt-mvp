// Console Log Cleanup Script for calendar.js
const fs = require('fs');

const filePath = '/Users/jordanradford/Desktop/New Github/mpt-mvp/calendar.js';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove most debug console.log statements but keep essential ones
const linesToRemove = [
  // Data source debug logs
  /\s*console\.log\(`Calendar: Got \${rawCampaigns\.length} campaigns from planningDataStore \(master dataset\)`\);\s*/g,
  /\s*console\.log\(`Calendar: Got \${rawCampaigns\.length} campaigns from planningTableInstance`\);\s*/g,
  /\s*console\.log\(`Calendar: Got \${rawCampaigns\.length} campaigns from planningModule\.tableInstance`\);\s*/g,
  /\s*console\.log\(`Calendar: Got \${rawCampaigns\.length} campaigns from planningDataCache`\);\s*/g,
  /\s*console\.log\(`Calendar: Cached \${this\.campaigns\.length} campaigns with index numbers`\);\s*/g,
  
  // Initialization logs
  /\s*console\.log\(`Calendar: Found \${campaigns\.length} campaigns during initialization`\);\s*/g,
  /\s*console\.log\(`Calendar: Available fiscal years: \${availableFYs\.join\(', '\)}`\);\s*/g,
  /\s*console\.log\(`Calendar: Set current FY to \${currentFY}`\);\s*/g,
  /\s*console\.log\('\[CALENDAR\] Planning data ready event received:', event\.detail\);\s*/g,
  
  // Performance logs
  /\s*console\.log\(`📊 Calendar rendered in \${renderTime\.toFixed\(2\)}ms`\);\s*/g,
  
  // Universal search logs
  /\s*console\.log\('🔍 CALENDAR: Updating search data with.*? campaigns'\);\s*/g,
  /\s*console\.log\('🔍 CALENDAR: Generated.*? filter options'\);\s*/g
];

// Apply all removals
linesToRemove.forEach(pattern => {
  content = content.replace(pattern, '');
});

// Clean up any double empty lines that might result
content = content.replace(/\n\n\n+/g, '\n\n');

// Write the cleaned content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Console log cleanup completed for calendar.js');

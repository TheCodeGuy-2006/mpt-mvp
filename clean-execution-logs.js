// Script to clean up verbose console logs in execution.js

const fs = require('fs');

// Read the file
const filePath = '/Users/jordanradford/Desktop/New Github/mpt-mvp/execution.js';
let content = fs.readFileSync(filePath, 'utf8');

// Define patterns to remove (verbose initialization and routine logs)
const patternsToRemove = [
  /console\.log\(['"]\s*🚀.*?['"]\);?\n?/g,
  /console\.log\(['"]\s*🔄.*?PHASE.*?['"]\);?\n?/g,
  /console\.log\(['"]\s*✅.*?PHASE.*?['"]\);?\n?/g,
  /console\.log\(['"]\s*🔧.*?PHASE.*?['"]\);?\n?/g,
  /console\.log\(['"]\s*📊.*?EXECUTION.*?['"]\);?\n?/g,
  /console\.log\(['"]\s*🔍.*?EXECUTION.*?['"]\);?\n?/g,
  /console\.log\(['"]\s*🔧.*?\[EXECUTION\].*?['"]\);?\n?/g,
  /console\.log\(['"]\s*✅.*?\[EXECUTION\].*?['"]\);?\n?/g,
  /console\.log\(['"]\s*📈.*?EXECUTION.*?['"]\);?\n?/g,
];

// Count how many logs we're removing
let removedCount = 0;
const originalLines = content.split('\n').length;

// Apply each pattern
patternsToRemove.forEach(pattern => {
  const matches = content.match(pattern);
  if (matches) {
    removedCount += matches.length;
    content = content.replace(pattern, '');
  }
});

// Clean up empty lines that might be left behind
content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

// Write the cleaned content back
fs.writeFileSync(filePath, content);

const finalLines = content.split('\n').length;

console.log(`✅ Execution.js cleanup complete:`);
console.log(`   - Removed ${removedCount} verbose console.log statements`);
console.log(`   - File size reduced from ${originalLines} to ${finalLines} lines`);
console.log(`   - Kept error/warning logs for debugging`);

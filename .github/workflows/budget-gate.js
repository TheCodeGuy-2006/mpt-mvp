// Budget gate script for CI: block if any region's forecast > plan
const fs = require('fs');
const path = require('path');
const { regionMetrics } = require('../../src/calc.js');
const budgets = require('../../data/budgets.json');
const dataDir = path.join(__dirname, '../../data');
const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith('.json') && f !== 'budgets.json');
const rows = files.map((f) => require(path.join(dataDir, f)));
const metrics = regionMetrics(rows, budgets);
let failed = false;
Object.entries(metrics).forEach(([region, m]) => {
  if (m.forecast > m.plan) {
    console.error(
      `Budget gate failed: ${region} forecast (${m.forecast}) > plan (${m.plan})`
    );
    failed = true;
  }
});
if (failed) process.exit(1);

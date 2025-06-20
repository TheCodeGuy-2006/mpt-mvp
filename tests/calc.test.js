import { kpis } from "../src/calc.js";

console.assert(
  JSON.stringify(kpis(100)) ===
    JSON.stringify({ mql: 10, sql: 6, opps: 5, pipeline: 250000 }),
  "Test 1 failed",
);
console.assert(
  JSON.stringify(kpis(0)) ===
    JSON.stringify({ mql: 0, sql: 0, opps: 0, pipeline: 0 }),
  "Test 2 failed",
);
console.log("All KPI tests passed.");

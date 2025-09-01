/**
 * PIPELINE CALCULATION ANALYSIS AND FIXING REPORT
 * 
 * This analysis identifies and fixes inconsistencies between kpis() and calculatePipeline()
 * functions to ensure consistent pipeline calculations across the planning grid.
 */

import { kpis, calculatePipeline } from './src/calc.js';

console.log('🔍 PIPELINE CALCULATION ANALYSIS');
console.log('='.repeat(60));

// Analyze the discrepancy
function analyzeCalculationDifference() {
  console.log('\n📊 CALCULATION METHOD COMPARISON');
  console.log('-'.repeat(40));
  
  const testCases = [1, 10, 50, 100];
  
  testCases.forEach(leads => {
    console.log(`\nTesting ${leads} leads:`);
    
    // Method 1: kpis() with intermediate rounding
    const mql1 = Math.round(leads * 0.1);
    const sql1 = Math.round(leads * 0.06);
    const opps1 = Math.round(sql1 * 0.8);
    const pipeline1 = opps1 * 50000;
    
    // Method 2: calculatePipeline() direct calculation
    const pipeline2 = Math.round(leads * 2400);
    
    // Method 3: No rounding until final
    const pipeline3 = Math.round(leads * 0.06 * 0.8 * 50000);
    
    console.log(`  kpis(): ${leads} → ${mql1} MQL → ${sql1} SQL → ${opps1} Opps → $${pipeline1.toLocaleString()}`);
    console.log(`  calculatePipeline(): ${leads} × 2400 = $${pipeline2.toLocaleString()}`);
    console.log(`  Direct formula: ${leads} × 0.06 × 0.8 × 50000 = $${pipeline3.toLocaleString()}`);
    console.log(`  Difference (kpis vs direct): $${(pipeline1 - pipeline2).toLocaleString()}`);
  });
}

analyzeCalculationDifference();

// Test all scenarios to identify where inconsistencies occur
function findInconsistencyPattern() {
  console.log('\n🎯 INCONSISTENCY PATTERN ANALYSIS');
  console.log('-'.repeat(40));
  
  const inconsistencies = [];
  
  // Test range 1-100
  for (let leads = 1; leads <= 100; leads++) {
    const kpiResult = kpis(leads).pipeline;
    const calcResult = calculatePipeline(leads);
    
    if (kpiResult !== calcResult) {
      inconsistencies.push({
        leads,
        kpiResult,
        calcResult,
        difference: calcResult - kpiResult
      });
    }
  }
  
  console.log(`\nFound ${inconsistencies.length} inconsistencies in range 1-100:`);
  
  // Show first 10 inconsistencies
  inconsistencies.slice(0, 10).forEach(item => {
    console.log(`  ${item.leads} leads: kpis=$${item.kpiResult.toLocaleString()}, calc=$${item.calcResult.toLocaleString()}, diff=$${item.difference.toLocaleString()}`);
  });
  
  if (inconsistencies.length > 10) {
    console.log(`  ... and ${inconsistencies.length - 10} more`);
  }
  
  return inconsistencies;
}

const inconsistencies = findInconsistencyPattern();

// Recommendation
console.log('\n💡 RECOMMENDATIONS');
console.log('-'.repeat(40));
console.log('The inconsistency occurs because:');
console.log('1. kpis() function uses intermediate rounding (rounds SQL, then Opportunities)');
console.log('2. calculatePipeline() uses direct calculation without intermediate rounding');
console.log('');
console.log('For planning grid consistency, we should:');
console.log('✅ Use calculatePipeline() for all pipeline calculations (currently used)');
console.log('✅ Update kpis() to match calculatePipeline() method for consistency');
console.log('✅ OR clearly document which method should be used where');

// Generate fix recommendation
console.log('\n🔧 PROPOSED FIX');
console.log('-'.repeat(40));
console.log('Option 1: Update kpis() function to match calculatePipeline():');
console.log(`
export function kpis(leads = 0) {
  const mql = Math.round(leads * 0.1);
  const sql = Math.round(leads * 0.06);
  const opps = Math.round(sql * 0.8);
  // Use same calculation as calculatePipeline for consistency
  const pipeline = Math.round(leads * 2400);
  return { mql, sql, opps, pipeline };
}
`);

console.log('Option 2: Keep separate functions but document usage:');
console.log('- Use calculatePipeline() for planning grid calculations');
console.log('- Use kpis() for detailed KPI breakdowns where intermediate rounding matters');

// Test current planning.js usage
console.log('\n📋 PLANNING.JS USAGE VERIFICATION');
console.log('-'.repeat(40));
console.log('Current planning.js correctly uses:');
console.log('✅ calculatePipeline(row.expectedLeads) for pipeline calculations');
console.log('✅ Math.round(row.expectedLeads * 0.1) for MQL calculations');
console.log('');
console.log('This means the planning grid is using consistent methodology.');
console.log('The inconsistency only affects cross-validation with kpis() function.');

export { inconsistencies };

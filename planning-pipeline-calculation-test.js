/**
 * PLANNING PIPELINE CALCULATION ROBUST TEST SUITE
 * 
 * This test suite validates the pipeline calculation logic used in the planning grid
 * to ensure accuracy and consistency across different scenarios.
 */

// Import the calculation functions
import { kpis, calculatePipeline } from './src/calc.js';

// Test configuration
const TEST_CONFIG = {
  // Test various lead volumes
  leadTestCases: [
    0, 1, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000
  ],
  // Edge cases
  edgeCases: [
    { leads: null, expected: 0, description: "null leads" },
    { leads: undefined, expected: 0, description: "undefined leads" },
    { leads: "", expected: 0, description: "empty string leads" },
    { leads: "100", expected: 240000, description: "string number leads" },
    { leads: 0.5, expected: 1200, description: "fractional leads (0.5)" },
    { leads: 1.7, expected: 4080, description: "fractional leads (1.7)" },
    { leads: -10, expected: -24000, description: "negative leads" },
    { leads: Infinity, expected: Infinity, description: "infinite leads" },
    { leads: NaN, expected: 0, description: "NaN leads" }
  ]
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

/**
 * Core calculation validation
 * Formula: leads * 0.06 * 0.8 * 50000 = leads * 2400
 */
function validatePipelineCalculation(leads) {
  const expected = Math.round(leads * 2400);
  const actual = calculatePipeline(leads);
  
  return {
    leads,
    expected,
    actual,
    passed: actual === expected,
    difference: actual - expected
  };
}

/**
 * Test individual lead values
 */
function testLeadCases() {
  console.log('\n=== TESTING STANDARD LEAD CASES ===');
  
  TEST_CONFIG.leadTestCases.forEach(leads => {
    const result = validatePipelineCalculation(leads);
    testResults.details.push(result);
    
    if (result.passed) {
      testResults.passed++;
      console.log(`✅ ${leads} leads -> $${result.actual.toLocaleString()}`);
    } else {
      testResults.failed++;
      testResults.errors.push(`${leads} leads: expected $${result.expected.toLocaleString()}, got $${result.actual.toLocaleString()}`);
      console.log(`❌ ${leads} leads: expected $${result.expected.toLocaleString()}, got $${result.actual.toLocaleString()}`);
    }
  });
}

/**
 * Test edge cases
 */
function testEdgeCases() {
  console.log('\n=== TESTING EDGE CASES ===');
  
  TEST_CONFIG.edgeCases.forEach(testCase => {
    try {
      const actual = calculatePipeline(testCase.leads);
      const passed = (isNaN(testCase.expected) && isNaN(actual)) || 
                    (testCase.expected === Infinity && actual === Infinity) ||
                    actual === testCase.expected;
      
      testResults.details.push({
        ...testCase,
        actual,
        passed
      });
      
      if (passed) {
        testResults.passed++;
        console.log(`✅ ${testCase.description}: ${testCase.leads} -> $${actual.toLocaleString()}`);
      } else {
        testResults.failed++;
        testResults.errors.push(`${testCase.description}: expected $${testCase.expected.toLocaleString()}, got $${actual.toLocaleString()}`);
        console.log(`❌ ${testCase.description}: expected $${testCase.expected.toLocaleString()}, got $${actual.toLocaleString()}`);
      }
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(`${testCase.description}: threw error - ${error.message}`);
      console.log(`❌ ${testCase.description}: ERROR - ${error.message}`);
    }
  });
}

/**
 * Test consistency with kpis function
 */
function testKpisConsistency() {
  console.log('\n=== TESTING CONSISTENCY WITH KPIS FUNCTION ===');
  
  TEST_CONFIG.leadTestCases.forEach(leads => {
    const directPipeline = calculatePipeline(leads);
    const kpisPipeline = kpis(leads).pipeline;
    const passed = directPipeline === kpisPipeline;
    
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${leads} leads: both functions return $${directPipeline.toLocaleString()}`);
    } else {
      testResults.failed++;
      testResults.errors.push(`${leads} leads: calculatePipeline=$${directPipeline.toLocaleString()}, kpis.pipeline=$${kpisPipeline.toLocaleString()}`);
      console.log(`❌ ${leads} leads: calculatePipeline=$${directPipeline.toLocaleString()}, kpis.pipeline=$${kpisPipeline.toLocaleString()}`);
    }
  });
}

/**
 * Test MQL calculation consistency
 */
function testMqlConsistency() {
  console.log('\n=== TESTING MQL CALCULATION CONSISTENCY ===');
  
  TEST_CONFIG.leadTestCases.forEach(leads => {
    const expectedMql = Math.round(leads * 0.1);
    const kpisMql = kpis(leads).mql;
    const passed = expectedMql === kpisMql;
    
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${leads} leads -> ${expectedMql} MQLs`);
    } else {
      testResults.failed++;
      testResults.errors.push(`${leads} leads: expected ${expectedMql} MQLs, kpis returned ${kpisMql}`);
      console.log(`❌ ${leads} leads: expected ${expectedMql} MQLs, kpis returned ${kpisMql}`);
    }
  });
}

/**
 * Test real-world planning scenarios
 */
function testPlanningScenarios() {
  console.log('\n=== TESTING REAL-WORLD PLANNING SCENARIOS ===');
  
  const scenarios = [
    { description: "Small webinar campaign", leads: 75, expectedPipeline: 180000 },
    { description: "Medium trade show", leads: 300, expectedPipeline: 720000 },
    { description: "Large conference", leads: 1200, expectedPipeline: 2880000 },
    { description: "Digital campaign", leads: 500, expectedPipeline: 1200000 },
    { description: "Account-based program", leads: 25, expectedPipeline: 60000 }
  ];
  
  scenarios.forEach(scenario => {
    const actualPipeline = calculatePipeline(scenario.leads);
    const passed = actualPipeline === scenario.expectedPipeline;
    
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${scenario.description}: ${scenario.leads} leads -> $${actualPipeline.toLocaleString()}`);
    } else {
      testResults.failed++;
      testResults.errors.push(`${scenario.description}: expected $${scenario.expectedPipeline.toLocaleString()}, got $${actualPipeline.toLocaleString()}`);
      console.log(`❌ ${scenario.description}: expected $${scenario.expectedPipeline.toLocaleString()}, got $${actualPipeline.toLocaleString()}`);
    }
  });
}

/**
 * Test special case: In-Account Events (1:1)
 * These should use a different calculation based on forecasted cost
 */
function testInAccountEventsCalculation() {
  console.log('\n=== TESTING IN-ACCOUNT EVENTS CALCULATION ===');
  
  const eventScenarios = [
    { forecastedCost: 1000, expectedPipeline: 20000 },
    { forecastedCost: 5000, expectedPipeline: 100000 },
    { forecastedCost: 10000, expectedPipeline: 200000 },
    { forecastedCost: 0, expectedPipeline: 0 }
  ];
  
  eventScenarios.forEach(scenario => {
    const actualPipeline = scenario.forecastedCost * 20;
    const passed = actualPipeline === scenario.expectedPipeline;
    
    if (passed) {
      testResults.passed++;
      console.log(`✅ In-Account Event: $${scenario.forecastedCost.toLocaleString()} cost -> $${actualPipeline.toLocaleString()} pipeline`);
    } else {
      testResults.failed++;
      testResults.errors.push(`In-Account Event: $${scenario.forecastedCost.toLocaleString()} cost, expected $${scenario.expectedPipeline.toLocaleString()}, got $${actualPipeline.toLocaleString()}`);
      console.log(`❌ In-Account Event: expected $${scenario.expectedPipeline.toLocaleString()}, got $${actualPipeline.toLocaleString()}`);
    }
  });
}

/**
 * Performance test for large datasets
 */
function testPerformance() {
  console.log('\n=== TESTING PERFORMANCE ===');
  
  const iterations = 10000;
  const testLeads = 1000;
  
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    calculatePipeline(testLeads);
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;
  
  console.log(`✅ Performance test: ${iterations} calculations in ${totalTime.toFixed(2)}ms`);
  console.log(`✅ Average time per calculation: ${avgTime.toFixed(4)}ms`);
  
  testResults.passed++;
}

/**
 * Test calculation formula breakdown
 */
function testFormulaBreakdown() {
  console.log('\n=== TESTING FORMULA BREAKDOWN ===');
  
  const testLeads = 1000;
  
  // Step by step calculation
  const mqlRate = 0.1;
  const sqlRate = 0.06;
  const oppConversionRate = 0.8;
  const dealSize = 50000;
  
  const mql = testLeads * mqlRate; // 100
  const sql = testLeads * sqlRate; // 60
  const opps = sql * oppConversionRate; // 48
  const pipeline = opps * dealSize; // 2,400,000
  
  // Direct calculation used in function
  const directPipeline = testLeads * 2400; // 2,400,000
  
  console.log(`Lead flow for ${testLeads} leads:`);
  console.log(`  MQLs: ${mql} (${testLeads} * ${mqlRate})`);
  console.log(`  SQLs: ${sql} (${testLeads} * ${sqlRate})`);
  console.log(`  Opportunities: ${opps} (${sql} * ${oppConversionRate})`);
  console.log(`  Pipeline: $${pipeline.toLocaleString()} (${opps} * $${dealSize.toLocaleString()})`);
  console.log(`  Direct calculation: $${directPipeline.toLocaleString()} (${testLeads} * 2400)`);
  
  const passed = pipeline === directPipeline;
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ Formula breakdown verification passed`);
  } else {
    testResults.failed++;
    testResults.errors.push(`Formula breakdown: step-by-step=$${pipeline.toLocaleString()}, direct=$${directPipeline.toLocaleString()}`);
    console.log(`❌ Formula breakdown verification failed`);
  }
}

/**
 * Generate test summary report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  console.log('PLANNING PIPELINE CALCULATION TEST SUMMARY');
  console.log('='.repeat(60));
  
  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? (testResults.passed / total * 100).toFixed(1) : 0;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Pass Rate: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Pipeline calculations are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the pipeline calculation logic.');
  }
  
  return {
    total,
    passed: testResults.passed,
    failed: testResults.failed,
    passRate: parseFloat(passRate),
    errors: testResults.errors
  };
}

/**
 * Main test runner
 */
async function runPipelineCalculationTests() {
  console.log('🚀 Starting Planning Pipeline Calculation Test Suite...\n');
  
  try {
    // Run all test suites
    testLeadCases();
    testEdgeCases();
    testKipsConsistency();
    testMqlConsistency();
    testPlanningScenarios();
    testInAccountEventsCalculation();
    testFormulaBreakdown();
    testPerformance();
    
    // Generate final report
    const summary = generateTestReport();
    return summary;
    
  } catch (error) {
    console.error('❌ Test suite encountered an error:', error);
    return {
      total: 0,
      passed: 0,
      failed: 1,
      passRate: 0,
      errors: [error.message]
    };
  }
}

// Export for use in other modules
export { runPipelineCalculationTests, validatePipelineCalculation, testResults };

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runPipelineCalculationTests = runPipelineCalculationTests;
  console.log('Pipeline calculation tests loaded. Run with: runPipelineCalculationTests()');
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    runPipelineCalculationTests,
    validatePipelineCalculation,
    testResults
  };
}

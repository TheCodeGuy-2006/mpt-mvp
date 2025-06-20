import { kpis, regionMetrics } from '../src/calc.js';

test('kpis for 200 leads', () => {
  expect(kpis(200)).toEqual({
    mql: 20,
    sql: 12,
    opps: 10,
    pipeline: 500000,
  });
});

test('regionMetrics with stub data', () => {
  const rows = [
    { region: 'ANZ', forecastedCost: 100, status: 'Planning' },
    { region: 'ANZ', forecastedCost: 200, status: 'Planning' },
    { region: 'EMEA', forecastedCost: 300, status: 'Planning' },
    { region: 'ANZ', actualCost: 50, status: 'Shipped' },
  ];
  const budgets = { ANZ: { assignedBudget: 500 }, EMEA: { assignedBudget: 400 } };
  expect(regionMetrics(rows, budgets)).toEqual({
    ANZ: expect.objectContaining({ plan: 500, forecast: 350, actuals: 50 }),
    EMEA: expect.objectContaining({ plan: 400, forecast: 300, actuals: 0 }),
  });
});

console.assert(
  JSON.stringify(kpis(100)) ===
    JSON.stringify({ mql: 10, sql: 6, opps: 5, pipeline: 250000 }),
  'Test 1 failed'
);
console.assert(
  JSON.stringify(kpis(0)) ===
    JSON.stringify({ mql: 0, sql: 0, opps: 0, pipeline: 0 }),
  'Test 2 failed'
);
console.log('All KPI tests passed.');

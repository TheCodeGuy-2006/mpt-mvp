// Pure KPI helper
export function kpis(leads = 0) {
  const mql = Math.round(leads * 0.10);
  const sql = Math.round(leads * 0.06);
  const opps = Math.round(sql * 0.80);
  const pipeline = opps * 50000;
  return { mql, sql, opps, pipeline };
}

// regionMetrics: Summarise region totals for reporting and budget alerts
export function regionMetrics(rows, budgets) {
  // rows: array of programme objects
  // budgets: object { region: { assignedBudget } }
  const result = {};
  rows.forEach(row => {
    const region = row.region || 'Unknown';
    if (!result[region]) result[region] = { plan: 0, forecast: 0, actuals: 0 };
    if (budgets[region]) result[region].plan = budgets[region].assignedBudget;
    if (row.status === 'Shipped') {
      result[region].actuals += Number(row.actualCost || 0);
    } else {
      result[region].forecast += Number(row.forecastedCost || 0);
    }
  });
  // Calculate totals and variances
  Object.keys(result).forEach(region => {
    const r = result[region];
    r.forecast += r.actuals;
    r.varPlan = r.plan - r.forecast;
    r.varActual = r.plan - r.actuals;
  });
  return result;
}

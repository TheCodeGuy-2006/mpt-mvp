// Pure KPI helper
export function kpis(leads = 0) {
  const mql = Math.round(leads * 0.1);
  const sql = Math.round(leads * 0.06);
  const opps = Math.round(sql * 0.8);
  const pipeline = opps * 50000;
  return { mql, sql, opps, pipeline };
}

// Simplified pipeline calculation for planning tab (since SQL/Opps columns removed)
export function calculatePipeline(leads = 0) {
  // Direct calculation: leads -> 6% -> 80% -> $50K per opp
  // This is equivalent to: leads * 0.06 * 0.8 * 50000 = leads * 2400
  return Math.round(leads * 0.06 * 0.8) * 50000;
}

// regionMetrics: Summarise region totals for reporting and budget alerts
export function regionMetrics(rows, budgets) {
  // rows: array of programme objects
  // budgets: object { region: { assignedBudget } }
  const result = {};
  rows.forEach((row) => {
    // Assign to 'Digital Motions' if digitalMotions is true, else use region
    const isDigitalMotions = row.digitalMotions === true;
    const region = isDigitalMotions ? "Digital Motions" : (row.region || "Unknown");
    if (!result[region]) result[region] = { plan: 0, forecast: 0, actuals: 0 };
    if (budgets[region]) result[region].plan = budgets[region].assignedBudget;
    if (row.status === "Shipped") {
      result[region].actuals += Number(row.actualCost || 0);
    } else {
      result[region].forecast += Number(row.forecastedCost || 0);
    }
  });
  // Calculate totals and variances
  Object.keys(result).forEach((region) => {
    const r = result[region];
    r.forecast += r.actuals;
    r.varPlan = r.plan - r.forecast;
    r.varActual = r.plan - r.actuals;
  });
  return result;
}

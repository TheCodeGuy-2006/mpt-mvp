// Pure KPI helper
export function kpis(leads = 0) {
  const mql = Math.round(leads * 0.10);
  const sql = Math.round(leads * 0.06);
  const opps = Math.round(sql * 0.80);
  const pipeline = opps * 50000;
  return { mql, sql, opps, pipeline };
}

export function regionMetrics (rows, budgets) {
  const out = {};
  rows.forEach(r => {
    const reg = r.region;
    if (!out[reg]) {
      out[reg] = {
        plan: (budgets[reg] || {}).assignedBudget || 0,
        actual: 0,
        forecast: 0
      };
    }
    if (r.status === 'Shipped') {
      out[reg].actual += Number(r.actualCost || 0);
      out[reg].forecast += Number(r.actualCost || 0);
    } else {
      out[reg].forecast += Number(r.forecastedCost || 0);
    }
  });
  Object.values(out).forEach(m => {
    m.varPlan = m.plan - m.forecast;
    m.varActual = m.plan - m.actual;
  });
  return out;
}

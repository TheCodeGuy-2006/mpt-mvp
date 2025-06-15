// Pure KPI helper
export function kpis(leads = 0) {
  const mql = Math.round(leads * 0.10);
  const sql = Math.round(leads * 0.06);
  const opps = Math.round(sql * 0.80);
  const pipeline = opps * 50000;
  return { mql, sql, opps, pipeline };
}

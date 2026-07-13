import { loadDotEnv } from './load-env.mjs';
loadDotEnv();

const token = process.env.SUPABASE_ACCESS_TOKEN;
async function q(sql) {
  const res = await fetch('https://api.supabase.com/v1/projects/sgttsotrvemmgmujcuay/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  return JSON.parse(await res.text());
}

const fns = await q(
  `SELECT proname FROM pg_proc WHERE proname IN ('get_my_ea_quarterly_results','get_eo_ea_quarterly_status_roster') ORDER BY 1`,
);
console.log('fns', fns);

const sample = await q(`
  SELECT e.name, r.period, r.status
  FROM assessment_responses r
  JOIN assessment_forms f ON f.id = r.form_id
  JOIN employees e ON e.id = r.reviewee_id
  WHERE f.code = 'ea_quarterly' AND r.status = 'submitted'
  ORDER BY r.submitted_at DESC NULLS LAST
  LIMIT 5
`);
console.log('submitted EA', sample);

const insightCols = await q(`
  SELECT prosrc LIKE '%ea_quarterly_status%' AS has_ea
  FROM pg_proc WHERE proname = 'get_eo_employee_insight'
`);
console.log('insight has ea', insightCols);

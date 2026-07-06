import { loadDotEnv } from './load-env.mjs';
loadDotEnv();

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = 'sgttsotrvemmgmujcuay';

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  return res.ok ? await res.json() : { error: await res.text() };
}

const checks = {
  immediate_360: await q(`SELECT public.peer_360_results_released('2026-Q2') AS released`),
  oversight_fn: await q(`SELECT count(*)::int AS n FROM pg_proc WHERE proname = 'boom_peer360_oversight_subject_allowed'`),
  employee_id_fn: await q(`SELECT left(prosrc, 200) AS src FROM pg_proc WHERE proname = 'current_employee_id'`),
  insight_l2: await q(`SELECT prosrc LIKE '%hierarchy_level = 2%' AS has_l2 FROM pg_proc WHERE proname = 'get_eo_employee_insight'`),
  review_assignments: await q(`SELECT prosrc LIKE '%current_employee_id%' AS uses_fn FROM pg_proc WHERE proname = 'get_review_assignments'`),
  peer360_released_fn: await q(`SELECT left(prosrc, 200) AS src FROM pg_proc WHERE proname = 'peer_360_results_released'`),
};

console.log(JSON.stringify(checks, null, 2));

// Udeme email
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: udeme } = await sb.from('employees').select('email,name').ilike('email', '%inyang%');
console.log('Udeme:', udeme);

const { data: chuka } = await sb.from('employees').select('email,name').ilike('email', '%monyei%');
const { data: ade } = await sb.from('employees').select('email,name').ilike('email', '%oshin%');
console.log('Chukwuka:', chuka);
console.log('Adeyinka:', ade);

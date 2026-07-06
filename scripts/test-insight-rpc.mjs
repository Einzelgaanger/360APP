import { createClient } from '@supabase/supabase-js';
import { loadDotEnv } from './load-env.mjs';

loadDotEnv();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = 'sgttsotrvemmgmujcuay';

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

const { data: brenda } = await sb.from('employees').select('id,name').ilike('name', '%Brenda%').single();
const result = await q(
  `SELECT public.get_eo_employee_insight('${brenda.id}'::uuid, '2026-Q3', '2026-07') AS insight`,
);
console.log('OK for', brenda.name);
console.log(JSON.stringify(result[0]?.insight, null, 2).slice(0, 600));

import { createClient } from '@supabase/supabase-js';
import { loadDotEnv } from './load-env.mjs';

loadDotEnv();

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: discussions } = await sb
  .from('boom_result_discussions')
  .select('id, form_code, period, subject:subject_employee_id(name, email), facilitator:facilitator_employee_id(name, email)')
  .limit(5);

console.log('Sample discussions:', JSON.stringify(discussions, null, 2));

const { data: profiles } = await sb.from('profiles').select('id, email, name, employee_id').limit(30);

const { data: employees } = await sb
  .from('employees')
  .select('id, name, email')
  .eq('subsidiary_id', '11111111-1111-1111-1111-111111111111');

const empByEmail = new Map((employees ?? []).map((e) => [e.email?.toLowerCase(), e]));
const mismatches = [];
for (const p of profiles ?? []) {
  const emp = empByEmail.get(p.email?.toLowerCase());
  if (!emp) {
    mismatches.push({ profile: p.email, issue: 'no employee with matching email' });
  } else if (p.employee_id && p.employee_id !== emp.id) {
    mismatches.push({ profile: p.email, employee_id: p.employee_id, actual: emp.id });
  }
}

console.log('\nProfile/employee mismatches:', mismatches.length ? mismatches : 'none in sample');

// Users with profile but current_employee_id would fail (email join)
const noMatch = (profiles ?? []).filter((p) => !empByEmail.has(p.email?.toLowerCase()));
console.log('Profiles without employee email match:', noMatch.map((p) => p.email));

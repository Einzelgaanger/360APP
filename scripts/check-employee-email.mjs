import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const email = (process.argv[2] || '').trim().toLowerCase();
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: emps } = await sb
  .from('employees')
  .select('id,name,email,role,department,eo_appraisal_active,hierarchy_level')
  .or('email.ilike.%ekemudeme%,email.ilike.%iriyang%,name.ilike.%ekemudeme%,name.ilike.%udeme%');

console.log('employees table:');
for (const e of emps ?? []) {
  console.log(`  ${e.name} | ${e.email} | L${e.hierarchy_level} | active=${e.eo_appraisal_active}`);
}

let page = 1;
let authHit = null;
for (;;) {
  const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
  authHit = data?.users?.find((u) =>
    /ekemudeme|iriyang|udeme/i.test(u.email || ''),
  );
  if (authHit || !data?.users?.length || data.users.length < 200) break;
  page += 1;
}
console.log('auth user:', authHit ? `${authHit.email} (${authHit.id})` : '(none matching)');

if (email) {
  const canonical = 'ekemudeme.inyang@venturegardengroup.com';
  console.log(`\nProvided: ${email}`);
  console.log(`Canonical in roster: ${canonical}`);
  console.log(`Match (case-insensitive): ${email === canonical}`);
}

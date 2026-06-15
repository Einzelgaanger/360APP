/**
 * Export EO pilot roster for team guide documentation.
 * Run: node scripts/export-eo-team-roster.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
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

const EO = '11111111-1111-1111-1111-111111111111';
const sb = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data, error } = await sb
  .from('employees')
  .select(
    'name, email, role, department, department_code, hierarchy_level, appraisal_self_performance, appraisal_gives_comments, appraisal_receives_comments, eo_appraisal_active',
  )
  .eq('subsidiary_id', EO)
  .order('hierarchy_level')
  .order('name');

if (error) {
  console.error(error.message);
  process.exit(1);
}

for (const e of data ?? []) {
  const flags = [
    e.appraisal_self_performance ? 'green' : null,
    e.appraisal_gives_comments ? 'orange' : null,
    e.appraisal_receives_comments ? 'blue' : null,
  ]
    .filter(Boolean)
    .join('+') || '—';
  console.log(
    [
      `L${e.hierarchy_level}`,
      e.eo_appraisal_active ? 'active' : 'inactive',
      e.email,
      e.name,
      e.department_code ?? '—',
      flags,
    ].join('\t'),
  );
}

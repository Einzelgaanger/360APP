/**
 * Apply one SQL file via Supabase Management API (needs SUPABASE_ACCESS_TOKEN in .env).
 * Usage: node scripts/apply-sql-management.mjs supabase/migrations/20260611260000_fix_current_employee_id_profile_link.sql
 */
import { readFileSync } from 'fs';
import { loadDotEnv, projectRoot } from './load-env.mjs';
import { readFileSync as readConfig } from 'fs';
import { join } from 'path';

loadDotEnv();

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/apply-sql-management.mjs <path-to.sql>');
  process.exit(1);
}

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const config = readConfig(join(projectRoot(), 'supabase', 'config.toml'), 'utf8');
const ref = config.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
if (!ref) {
  console.error('Could not read project_id from supabase/config.toml');
  process.exit(1);
}

const query = readFileSync(join(projectRoot(), file), 'utf8');
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
});

const body = await res.text();
if (!res.ok) {
  console.error('Failed:', res.status, body);
  process.exit(1);
}

console.log('Applied:', file);
console.log(body.slice(0, 500));

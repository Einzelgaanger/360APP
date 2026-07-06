/**
 * Reset a single Supabase Auth user's password (service role required).
 * Usage: node scripts/reset-user-password.mjs <email> [newPassword]
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

const emailArg = process.argv[2];
const password = process.argv[3] || process.env.DEMO_DEFAULT_PASSWORD || 'BoomEoDemo2026!';
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!emailArg || !url || !serviceKey) {
  console.error('Usage: node scripts/reset-user-password.mjs <email> [password]');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserId() {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || '').toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function main() {
  const { data: emp } = await supabase
    .from('employees')
    .select('name, email')
    .ilike('email', email)
    .maybeSingle();

  let userId = await findUserId();

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user for ${email}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Password reset for ${email}`);
  }

  if (emp) {
    console.log(`Employee: ${emp.name}`);
  }

  console.log(`Login email: ${email}`);
  console.log(`New password: ${password}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

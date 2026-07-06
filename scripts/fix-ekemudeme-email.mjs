/**
 * Fix Ekemudeme/Udeme email in employees, profiles, and Supabase Auth.
 * Usage: node scripts/fix-ekemudeme-email.mjs
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

const NEW_EMAIL = 'ekemudeme.inyang@venturegardengroup.com';
const OLD_EMAILS = [
  'ekemudeme.iriyang@venturegardengroup.com',
  'udeme.inyang@peopleos.co',
];

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function findAuthUser() {
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) =>
      OLD_EMAILS.some((e) => (u.email || '').toLowerCase() === e) ||
      (u.email || '').toLowerCase() === NEW_EMAIL,
    );
    if (hit) return hit;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

const { data: empBefore } = await sb
  .from('employees')
  .select('id,name,email')
  .or(OLD_EMAILS.map((e) => `email.ilike.${e}`).join(',') + `,email.ilike.${NEW_EMAIL}`)
  .limit(5);

console.log('Before:', empBefore);

const { data: empRows } = await sb
  .from('employees')
  .select('id,name,email')
  .or(
    OLD_EMAILS.map((e) => `email.ilike.${e}`).join(',') +
      ',name.ilike.Udeme Inyang,name.ilike.Ekemudeme%',
  );

const emp = empRows?.[0];
if (!emp) {
  console.error('No employee row found for Udeme/Ekemudeme');
  process.exit(1);
}

const { error: empErr } = await sb
  .from('employees')
  .update({ email: NEW_EMAIL, name: 'Ekemudeme Inyang' })
  .eq('id', emp.id);
if (empErr) throw empErr;
console.log('Updated employees:', NEW_EMAIL);

const authUser = await findAuthUser();
if (authUser) {
  const { error: authErr } = await sb.auth.admin.updateUserById(authUser.id, {
    email: NEW_EMAIL,
    email_confirm: true,
  });
  if (authErr) throw authErr;
  console.log('Updated auth user:', authUser.email, '→', NEW_EMAIL);

  const { error: profErr } = await sb
    .from('profiles')
    .update({ email: NEW_EMAIL, name: 'Ekemudeme Inyang' })
    .eq('id', authUser.id);
  if (profErr) throw profErr;
  console.log('Updated profile');
} else {
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email: NEW_EMAIL,
    password: process.env.DEMO_DEFAULT_PASSWORD || 'BoomEoDemo2026!',
    email_confirm: true,
  });
  if (createErr) throw createErr;
  await sb.from('profiles').upsert({
    id: created.user.id,
    employee_id: emp.id,
    email: NEW_EMAIL,
    name: 'Ekemudeme Inyang',
    profile_completed: true,
    profile_completed_at: new Date().toISOString(),
  });
  console.log('Created auth user + profile for', NEW_EMAIL);
}

const { data: after } = await sb.from('employees').select('name,email').eq('id', emp.id).single();
console.log('\nConfirmed:', after);
console.log('Login:', NEW_EMAIL);
console.log('Password:', process.env.DEMO_DEFAULT_PASSWORD || 'BoomEoDemo2026!');

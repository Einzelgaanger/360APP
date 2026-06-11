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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const EXPECTED = [
  { name: 'Uche Ukonu', email: 'uche.ukonu@venturegardengroup.com', department: 'Executive Office', role: 'Chief of Staff' },
  { name: 'Tobi Bankole', email: 'tobi.bankole@venturegardengroup.com', department: 'Executive Office', role: 'Technical Assistant' },
  { name: 'Dorathy Akor', email: 'dorathy.akor@venturegardengroup.com', department: 'Executive Office', role: 'Technical Assistant' },
  { name: 'Ayomide Adeosun', email: 'adeosun.ayomide@venturegardengroup.com', department: 'Executive Office', role: 'Technical Lead' },
  { name: 'Gisele ishema karekezi', email: 'gisele.karakezi@venturegardengroup.com', department: 'Executive Office', role: 'Group head - Brand, Growth and Strategic' },
  { name: 'Oluwatobiloba Ijamakinwa', email: 'oluwatobiloba.ijamakinwa@venturegardengroup.com', department: 'Executive Office', role: 'EA - Brands and comms' },
  { name: 'Brenda Nafula', email: 'brenda.nafula@vgplatform.com', department: 'Executive Office', role: 'EA - Brands and comms' },
  { name: 'Gideon Abiona', email: 'gideon.abiona@venturegardengroup.com', department: 'Executive Office', role: 'Visual Associate - Brands & Coms' },
  { name: 'Favour Oyekanmi', email: 'favour.oyekanmi@venturegardengroup.com', department: 'Executive Office', role: 'EA - Itinerary and Calendar Management' },
  { name: 'Ekemudeme Inyang', email: 'ekemudeme.iriyang@venturegardengroup.com', department: 'Executive Office', role: 'EA - Itinerary and Calendar Management' },
  { name: 'Omotola Akinyemiju', email: 'omotola.akinyemiju@venturegardengroup.com', department: 'Executive Office', role: 'Executive Office Lead' },
  { name: 'Adeyinka Oshin', email: 'adeyinka.oshin@venturegardengroup.com', department: 'Executive Office', role: 'Executive Operations Support' },
  { name: 'Deyi Dipeolu', email: 'Deyi.Dipeolu@venturegardengroup.com', department: 'Executive office', role: 'Chief of Staff Portfolio, Capital & Investment' },
  { name: 'Regina ottoh-ebhonu', email: 'regina.ottoh-ebhonu@venturegardengroup.com', department: 'Central Ops - Executive office', role: 'Associate product officer, strategy and growth' },
  { name: 'Melissa Omede', email: 'melissa.omede@venturegardengroup.com', department: 'Central Ops - Executive office', role: 'Senior Analyst Operations & Execution' },
  { name: 'Baluku Dounnah', email: 'baluku.dounnah@venturegardengroup.com', department: 'Central Ops - Executive office', role: 'Manager, Operations and Execution' },
  { name: 'Chukwuka Monyei', email: 'chukwuka.monyei@venturegardengroup.com', department: 'Central Ops - Executive office', role: 'Associate, Operations and Execution' },
];

const sb = createClient(url, key);
const emails = [...new Set(EXPECTED.map((e) => e.email.toLowerCase()))];

const { data, error } = await sb
  .from('employees')
  .select('id,name,email,role,department,subsidiary_id')
  .eq('subsidiary_id', '11111111-1111-1111-1111-111111111111');

if (error) {
  console.error(error);
  process.exit(1);
}

const byEmail = new Map();
for (const r of data || []) {
  if (r.email) byEmail.set(String(r.email).toLowerCase(), r);
}

let ok = 0;
let missing = 0;
let mismatch = 0;

for (const exp of EXPECTED) {
  const row = byEmail.get(exp.email.toLowerCase());
  if (!row) {
    console.log(`MISSING\t${exp.email}\t${exp.name}`);
    missing += 1;
    continue;
  }
  const issues = [];
  if (row.department?.toLowerCase() !== exp.department.toLowerCase()) {
    issues.push(`dept: DB="${row.department}" vs expected="${exp.department}"`);
  }
  if (row.role !== exp.role) {
    issues.push(`role: DB="${row.role}" vs expected="${exp.role}"`);
  }
  if (issues.length) {
    console.log(`MISMATCH\t${exp.email}\t${row.name}\t${issues.join('; ')}`);
    mismatch += 1;
  } else {
    console.log(`OK\t${exp.email}\t${row.name}`);
    ok += 1;
  }
}

const uche = (data || []).filter((r) => String(r.email).toLowerCase() === 'uche.ukonu@venturegardengroup.com');
console.log('---');
console.log(`Uche rows in EO subsidiary: ${uche.length}`);
for (const r of uche) console.log(`  ${r.name} | ${r.department} | ${r.role}`);

console.log('---');
console.log(`Summary: ${ok} exact match, ${mismatch} present with text differences, ${missing} missing`);
console.log(`EO subsidiary employee count: ${data?.length ?? 0}`);

if (missing > 0) {
  console.log('\nCurrent EO subsidiary rows (actual DB):');
  for (const r of (data || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''))) {
    console.log(`  ${r.name}\t${r.email}\t${r.department}\t${r.role}`);
  }
}

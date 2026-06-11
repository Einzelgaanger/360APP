/**
 * Apply EO corporate email roster to public.employees (same logic as migration 20260518150000).
 * Run: node scripts/apply-eo-corporate-emails.mjs
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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const EO = '11111111-1111-1111-1111-111111111111';
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

/** @type {Array<{ matchEmails: string[], matchNames?: string[], patch: Record<string, string> }>} */
const UPDATES = [
  {
    matchEmails: ['uche.ukonu@peopleos.co', 'uche.ukonu@venturegardengroup.com'],
    patch: { email: 'uche.ukonu@venturegardengroup.com', role: 'Chief of Staff', department: 'Executive Office' },
  },
  {
    matchEmails: ['tobi.bankole@peopleos.co', 'tobi.bankole@venturegardengroup.com'],
    patch: { email: 'tobi.bankole@venturegardengroup.com', role: 'Technical Assistant', department: 'Executive Office' },
  },
  {
    matchEmails: ['dorathy.akor@peopleos.co', 'dorathy.akor@venturegardengroup.com'],
    patch: { email: 'dorathy.akor@venturegardengroup.com', role: 'Technical Assistant', department: 'Executive Office' },
  },
  {
    matchEmails: ['ayomide.adeosun@peopleos.co', 'adeosun.ayomide@venturegardengroup.com'],
    patch: { email: 'adeosun.ayomide@venturegardengroup.com', role: 'Technical Lead', department: 'Executive Office', name: 'Ayomide Adeosun' },
  },
  {
    matchEmails: ['gisele.karekezi@peopleos.co', 'gisele.karakezi@venturegardengroup.com'],
    matchNames: ['Gisele Karekezi'],
    patch: {
      email: 'gisele.karakezi@venturegardengroup.com',
      name: 'Gisele Ishema Karekezi',
      role: 'Group head - Brand, Growth and Strategic',
      department: 'Executive Office',
    },
  },
  {
    matchEmails: ['oluwatobi.ijamakinwa@peopleos.co', 'oluwatobiloba.ijamakinwa@venturegardengroup.com'],
    patch: {
      email: 'oluwatobiloba.ijamakinwa@venturegardengroup.com',
      name: 'Oluwatobiloba Ijamakinwa',
      role: 'EA - Brands and comms',
      department: 'Executive Office',
    },
  },
  {
    matchEmails: ['brenda.nafula@peopleos.co', 'brenda.nafula@vgplatform.com'],
    patch: { email: 'brenda.nafula@vgplatform.com', role: 'EA - Brands and comms', department: 'Executive Office' },
  },
  {
    matchEmails: ['abiona.gideon@peopleos.co', 'gideon.abiona@venturegardengroup.com'],
    matchNames: ['Abiona Gideon', 'Gideon Abiona'],
    patch: {
      email: 'gideon.abiona@venturegardengroup.com',
      name: 'Gideon Abiona',
      role: 'Visual Associate - Brands & Coms',
      department: 'Executive Office',
    },
  },
  {
    matchEmails: ['favour.oyekanmi@peopleos.co', 'favour.oyekanmi@venturegardengroup.com'],
    patch: {
      email: 'favour.oyekanmi@venturegardengroup.com',
      role: 'EA - Itinerary and Calendar Management',
      department: 'Executive Office',
    },
  },
  {
    matchEmails: ['udeme.inyang@peopleos.co', 'ekemudeme.iriyang@venturegardengroup.com'],
    matchNames: ['Udeme Inyang', 'Ekemudeme Iriyang'],
    patch: {
      email: 'ekemudeme.iriyang@venturegardengroup.com',
      name: 'Ekemudeme Iriyang',
      role: 'EA - Itinerary and Calendar Management',
      department: 'Executive Office',
    },
  },
  {
    matchEmails: ['omotola.akinyemiju@peopleos.co', 'omotola.akinyemiju@venturegardengroup.com'],
    patch: { email: 'omotola.akinyemiju@venturegardengroup.com', role: 'Executive Office Lead', department: 'Executive Office' },
  },
  {
    matchEmails: ['adeyinka.oshin@peopleos.co', 'adeyinka.oshin@venturegardengroup.com'],
    patch: { email: 'adeyinka.oshin@venturegardengroup.com', role: 'Executive Operations Support', department: 'Executive Office' },
  },
  {
    matchEmails: ['deyi.dipeolu@peopleos.co', 'deyi.dipeolu@venturegardengroup.com', 'Deyi.Dipeolu@venturegardengroup.com'],
    patch: {
      email: 'deyi.dipeolu@venturegardengroup.com',
      name: 'Deyi Dipeolu',
      role: 'Chief of Staff Portfolio, Capital & Investment',
      department: 'Executive Office',
    },
  },
  {
    matchEmails: ['regina.ottoh-ebhonu@peopleos.co', 'regina.ottoh-ebhonu@venturegardengroup.com'],
    patch: {
      email: 'regina.ottoh-ebhonu@venturegardengroup.com',
      name: 'Regina Ottoh-Ebhonu',
      role: 'Associate product officer, strategy and growth',
      department: 'Central Ops - Executive office',
    },
  },
  {
    matchEmails: ['melissa.omede@peopleos.co', 'melissa.omede@venturegardengroup.com'],
    patch: {
      email: 'melissa.omede@venturegardengroup.com',
      role: 'Senior Analyst Operations & Execution',
      department: 'Central Ops - Executive office',
    },
  },
  {
    matchEmails: ['baluku.duannah@peopleos.co', 'baluku.dounnah@venturegardengroup.com'],
    patch: {
      email: 'baluku.dounnah@venturegardengroup.com',
      name: 'Baluku Dounnah',
      role: 'Manager, Operations and Execution',
      department: 'Central Ops - Executive office',
    },
  },
  {
    matchEmails: ['chuka.monyei@peopleos.co', 'chukwuka.monyei@venturegardengroup.com'],
    matchNames: ['Chuka Monyei', 'Chukwuka Monyei'],
    patch: {
      email: 'chukwuka.monyei@venturegardengroup.com',
      name: 'Chukwuka Monyei',
      role: 'Associate, Operations and Execution',
      department: 'Central Ops - Executive office',
    },
  },
];

const sb = createClient(url, key);
const { data: rows, error: loadErr } = await sb
  .from('employees')
  .select('id,name,email')
  .eq('subsidiary_id', EO);
if (loadErr) throw loadErr;

for (const u of UPDATES) {
  const emails = new Set(u.matchEmails.map((e) => e.toLowerCase()));
  const names = new Set((u.matchNames || []).map((n) => n.toLowerCase()));
  const row = (rows || []).find(
    (r) =>
      (r.email && emails.has(r.email.toLowerCase())) ||
      (r.name && names.has(r.name.toLowerCase())),
  );
  if (!row) {
    console.warn('No row matched:', u.patch.email);
    continue;
  }
  const { error } = await sb.from('employees').update(u.patch).eq('id', row.id);
  if (error) throw error;
  console.log('Updated:', u.patch.email, '←', row.email);
}

console.log('\nDone. Run: node scripts/check-eo-roster.mjs');

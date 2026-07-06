import { createClient } from '@supabase/supabase-js';
import { loadDotEnv } from './load-env.mjs';

loadDotEnv();

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(url, anon);

await sb.auth.signInWithPassword({
  email: 'bunmi.akinyemiju@peopleos.co',
  password: process.env.DEMO_EO_PASSWORD || 'BoomEoDemo2026!',
});

const { data, error } = await sb.rpc('get_eo_growth_hub_pulse', { _period: '2026-Q3' });
if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

console.log('mode:', data?.mode);
console.log('pulse_label:', data?.pulse_label);
console.log('sections:', data?.sections?.length);
console.log('peer_count:', data?.peer_count);
console.log('subject_count:', data?.subject_count);
console.log('start_doing:', data?.start_doing?.length);
console.log('themes:', data?.themes?.length);

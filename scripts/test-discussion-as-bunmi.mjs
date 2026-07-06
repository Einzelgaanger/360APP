import { createClient } from '@supabase/supabase-js';
import { loadDotEnv } from './load-env.mjs';

loadDotEnv();

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(url, anon);

const email = 'bunmi.akinyemiju@peopleos.co';
const password = process.env.DEMO_EO_PASSWORD || 'BoomEoDemo2026!';

const { data: auth, error: signErr } = await sb.auth.signInWithPassword({ email, password });
if (signErr) {
  console.error('Sign in failed:', signErr.message);
  process.exit(1);
}
console.log('Signed in as', auth.user?.email);

const discussionId = 'cbd8d70a-0d62-4381-9edb-0009238529f7';

const { data, error } = await sb.rpc('get_boom_discussion_thread', {
  _discussion_id: discussionId,
});

if (error) {
  console.error('RPC error:', error.message, error.details, error.hint, error.code);
  process.exit(1);
}

console.log('RPC OK');
console.log(JSON.stringify(data, null, 2).slice(0, 1200));

// Also test oversight detail directly
const ade = 'd40a6090-9854-4a39-811e-2117b032c807';
const { data: detail, error: detailErr } = await sb.rpc('get_boom_peer360_oversight_detail', {
  _reviewee_id: ade,
  _period: '2026-Q3',
});
if (detailErr) {
  console.error('Detail RPC error:', detailErr.message, detailErr.details);
} else {
  console.log('Detail keys:', Object.keys(detail || {}));
  console.log('Sections count:', detail?.sections?.length ?? 0);
}

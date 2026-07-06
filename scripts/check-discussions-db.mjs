/**
 * Check discussion RPCs / tables exist on remote DB.
 */
import { createClient } from '@supabase/supabase-js';
import { loadDotEnv, projectRoot } from './load-env.mjs';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

loadDotEnv();

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const checks = [
  ['boom_result_discussions table', () => sb.from('boom_result_discussions').select('id', { count: 'exact', head: true })],
  ['assessment_peer_comments table', () => sb.from('assessment_peer_comments').select('id', { count: 'exact', head: true })],
  ['get_boom_discussion_inbox', () => sb.rpc('get_boom_discussion_inbox', { _period_quarter: '2026-Q2', _period_month: '2026-06' })],
  ['get_boom_discussion_thread', () => sb.rpc('get_boom_discussion_thread', { _discussion_id: '00000000-0000-0000-0000-000000000001' })],
  ['get_boom_comment_assignments', () => sb.rpc('get_boom_comment_assignments', { _period: '2026-Q2' })],
  ['get_my_360_dashboard', () => sb.rpc('get_my_360_dashboard', { _period: '2026-Q2' })],
];

for (const [name, fn] of checks) {
  const { data, error } = await fn();
  if (error) console.log('FAIL', name, '→', error.message);
  else console.log('OK  ', name, '→', typeof data, Array.isArray(data) ? `rows:${data.length}` : JSON.stringify(data)?.slice(0, 80));
}

const { count } = await sb.from('boom_result_discussions').select('*', { count: 'exact', head: true });
console.log('\nDiscussion rows:', count ?? 0);

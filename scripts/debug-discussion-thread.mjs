import { createClient } from '@supabase/supabase-js';
import { loadDotEnv } from './load-env.mjs';

loadDotEnv();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = 'sgttsotrvemmgmujcuay';

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return JSON.parse(text);
}

const { data: bunmi } = await sb.from('employees').select('id,name,email').ilike('name', '%Bunmi%').single();
const { data: ade } = await sb.from('employees').select('id,name').ilike('email', '%adeyinka.oshin%').single();

console.log('Bunmi:', bunmi?.id);
console.log('Adeyinka:', ade?.id);

const discussions = await q(`
  SELECT id, subject_employee_id, facilitator_employee_id, period, form_code
  FROM public.boom_result_discussions
  WHERE form_code = 'peer_360' AND period = '2026-Q3'
    AND subject_employee_id = '${ade.id}'
  ORDER BY created_at DESC
  LIMIT 5
`);
console.log('Discussions:', discussions);

if (discussions[0]) {
  const did = discussions[0].id;
  const participant = await q(`
    SELECT public.boom_discussion_participant('${did}'::uuid, '${bunmi.id}'::uuid) AS ok
  `);
  console.log('Bunmi participant?', participant);

  const oversight = await q(`
    SELECT public.boom_peer360_oversight_subject_allowed('${bunmi.id}'::uuid, '${ade.id}'::uuid) AS ok
  `);
  console.log('Oversight allowed?', oversight);

  try {
    const thread = await q(`
      SELECT public.get_boom_discussion_thread('${did}'::uuid)::text AS t
    `);
    console.log('Thread (no auth):', thread[0]?.t?.slice?.(0, 300));
  } catch (e) {
    console.error('Thread error:', e.message);
  }

  try {
    const detail = await q(`
      SELECT public.get_boom_peer360_oversight_detail('${ade.id}'::uuid, '2026-Q3')::text AS detail
    `);
    console.log('Oversight detail (no auth):', detail[0]?.detail);
  } catch (e) {
    console.error('Detail error:', e.message);
  }

  try {
    const narratives = await q(`
      SELECT COALESCE(jsonb_agg(peer_block), '[]'::jsonb) AS narratives
      FROM (
        SELECT jsonb_build_object(
          'peer_label', 'Peer ' || row_number() OVER (ORDER BY r.submitted_at NULLS LAST, r.id),
          'answers', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'section', q.section,
              'question', q.question_text,
              'score', a.score,
              'text_answer', a.text_answer
            ) ORDER BY q.section_order, q.sort_order), '[]'::jsonb)
            FROM public.assessment_answers a
            JOIN public.assessment_questions q ON q.id = a.question_id
            WHERE a.response_id = r.id
          )
        ) AS peer_block
        FROM public.assessment_responses r
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = '${ade.id}' AND r.period = '2026-Q3' AND r.status = 'submitted'
          AND f.code = 'peer_360'
      ) sub
    `);
    console.log('Narratives query OK, len:', JSON.stringify(narratives).length);
  } catch (e) {
    console.error('Narratives query FAIL:', e.message);
  }
}

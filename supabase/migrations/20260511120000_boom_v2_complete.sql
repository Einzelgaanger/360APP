-- BOOM v2: EO lead assessor, audience on questions, EA quarterly form, expanded 360 bank,
-- dual period routing for quarterly vs monthly assignments.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_eo_lead_assessor boolean NOT NULL DEFAULT false;

UPDATE public.employees
SET is_eo_lead_assessor = true
WHERE name = 'Kunmi Demuren';

ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'all';

COMMENT ON COLUMN public.assessment_questions.audience IS 'all | manager_only — manager_only items shown only to reviewers with hierarchy_level <= 2';

-- EA quarterly manager evaluation (non-anonymous)
INSERT INTO public.assessment_forms (code, title, description, scale_min, scale_max, allows_no_opportunity, cadence, anonymous)
VALUES (
  'ea_quarterly',
  'EA Quarterly Evaluation',
  'Manager assessment of Executive Assistant performance and partnership.',
  1, 5, false, 'quarterly', false
)
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title;

WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'ea_quarterly')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text, audience)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw::int, s.h, 'all'::text
FROM f, (VALUES
  ('Partnership & Reliability', 1, 1, 'Anticipates needs and follows through on commitments without requiring repeated follow-up.', 'scored', NULL::int, NULL::text),
  ('Partnership & Reliability', 1, 2, 'Maintains professionalism and discretion in high-stakes or sensitive situations.', 'scored', NULL::int, NULL::text),
  ('Partnership & Reliability', 1, 3, 'Coordinates calendars, travel, and stakeholders with accuracy and sound judgment.', 'scored', NULL::int, NULL::text),
  ('Communication', 2, 1, 'Communicates clearly, concisely, and with appropriate tone across channels.', 'scored', NULL::int, NULL::text),
  ('Communication', 2, 2, 'Escalates risks or conflicts early with context and proposed options.', 'scored', NULL::int, NULL::text),
  ('Impact', 3, 1, 'Describe one standout contribution this EA made this quarter.', 'written', 40, NULL::text),
  ('Impact', 3, 2, 'What is the single highest-leverage improvement area for the next quarter?', 'written', 40, NULL::text),
  ('Impact', 3, 3, 'Anything else the EO leadership should know about this partnership?', 'written', NULL::int, NULL::text)
) AS s(section, so, qo, q, qt, mw, h)
WHERE EXISTS (SELECT 1 FROM f)
  AND NOT EXISTS (
    SELECT 1 FROM public.assessment_questions q
    JOIN public.assessment_forms af ON af.id = q.form_id
    WHERE af.code = 'ea_quarterly' AND q.section = 'Partnership & Reliability' AND q.sort_order = 1
  );

-- Monthly: optional open field
WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'monthly_self')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text, audience)
SELECT f.id, 'Personal Check-In', 1, 9, 'Anything else you want to note this month (optional)?', 'written', NULL::int, NULL::text, 'all'
FROM f
WHERE NOT EXISTS (
  SELECT 1 FROM public.assessment_questions q WHERE q.form_id = f.id AND q.sort_order = 9 AND q.section = 'Personal Check-In'
);

-- Expanded peer 360 (additional sections)
WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'peer_360')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text, audience)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw::int, s.h, s.aud
FROM f, (VALUES
  ('Communication & Responsiveness', 6, 1, 'Responds to messages and requests within a reasonable timeframe and sets expectations when delayed.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 6, 2, 'Communicates with clarity and precision - avoids unnecessary jargon or ambiguity.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 6, 3, 'Keeps relevant stakeholders appropriately informed without overwhelming them.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 6, 4, 'Receives feedback and adjusts communication style when needed.', 'scored', NULL::int, NULL::text, 'all'),
  ('Communication & Responsiveness', 6, 5, 'Demonstrates sound judgment in what to escalate versus handle independently.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance & Accountability', 7, 1, 'Follows agreed processes for approvals, documentation, and information security.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance & Accountability', 7, 2, 'Takes ownership of mistakes and fixes them transparently.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance & Accountability', 7, 3, 'Honours confidentiality and handles sensitive information responsibly.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance & Accountability', 7, 4, 'Coordinates cross-functional work without letting tasks slip through cracks.', 'scored', NULL::int, NULL::text, 'all'),
  ('Governance & Accountability', 7, 5, 'Demonstrates reliability under tight deadlines or shifting priorities.', 'scored', NULL::int, NULL::text, 'all'),
  ('Learning & Development', 8, 1, 'Seeks learning opportunities relevant to role and Executive Office context.', 'scored', NULL::int, NULL::text, 'all'),
  ('Learning & Development', 8, 2, 'Applies new skills or insights in a visible way within a reasonable timeframe.', 'scored', NULL::int, NULL::text, 'all'),
  ('Learning & Development', 8, 3, 'Asks thoughtful questions that deepen understanding of priorities and stakeholders.', 'scored', NULL::int, NULL::text, 'all'),
  ('Learning & Development (Executive lens)', 9, 1, 'Sets a credible development trajectory for their vertical or function.', 'scored', NULL::int, 'Managers and executive leaders only.', 'manager_only'),
  ('Learning & Development (Executive lens)', 9, 2, 'Invests in coaching or lifting capability on their team, not only task delivery.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Learning & Development (Executive lens)', 9, 3, 'Balances urgent executive demands with sustainable ways of working for the team.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Learning & Development (Executive lens)', 9, 4, 'Demonstrates judgment in prioritisation when trade-offs are unavoidable.', 'scored', NULL::int, NULL::text, 'manager_only'),
  ('Learning & Development (Executive lens)', 9, 5, 'Short comment: where should this person focus development next quarter?', 'written', 20, NULL::text, 'manager_only'),
  ('Learning & Development (Executive lens)', 9, 6, 'Short comment: what strength should they lean into more deliberately?', 'written', 20, NULL::text, 'manager_only')
) AS s(section, so, qo, q, qt, mw, h, aud)
WHERE EXISTS (SELECT 1 FROM f)
  AND NOT EXISTS (
    SELECT 1 FROM public.assessment_questions q
    JOIN public.assessment_forms af ON af.id = q.form_id
    WHERE af.code = 'peer_360' AND q.section = 'Communication & Responsiveness' AND q.sort_order = 1
  );

-- Executive form: additional strategic / OKR-style prompts (append; does not remove seeded rows)
WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'executive')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text, audience)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw::int, s.h, 'all'::text
FROM f, (VALUES
  ('Priority Execution & Judgment', 5, 1, 'Rate how decisively you executed the quarter''s top priorities under ambiguity or constraint.', 'scored', 200, NULL::text),
  ('Priority Execution & Judgment', 5, 2, 'Ground your rating with trade-offs you made and outcomes delivered.', 'written', 200, NULL::text),
  ('Stakeholder & Risk Management', 6, 1, 'Rate how well you managed reputational risk, stakeholder alignment, and escalation discipline.', 'scored', 200, NULL::text),
  ('Stakeholder & Risk Management', 6, 2, 'Cite a situation where your judgment protected or advanced the Executive Office.', 'written', 200, NULL::text)
) AS s(section, so, qo, q, qt, mw, h)
WHERE EXISTS (SELECT 1 FROM f)
  AND NOT EXISTS (
    SELECT 1 FROM public.assessment_questions q
    JOIN public.assessment_forms af ON af.id = q.form_id
    WHERE af.code = 'executive' AND q.section = 'Priority Execution & Judgment' AND q.sort_order = 1
  );

DROP FUNCTION IF EXISTS public.get_review_assignments(text);

CREATE OR REPLACE FUNCTION public.get_review_assignments(_period_quarter text, _period_month text)
RETURNS TABLE (
  form_code text,
  form_title text,
  reviewee_id uuid,
  reviewee_name text,
  reviewee_role text,
  reviewee_department text,
  anonymous boolean,
  response_id uuid,
  status text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid; my_level int; my_dept text; my_manager uuid;
BEGIN
  SELECT e.id, e.hierarchy_level, e.department, e.manager_id
  INTO me, my_level, my_dept, my_manager
  FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email)
  WHERE p.id = auth.uid()
  LIMIT 1;
  IF me IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH targets AS (
    SELECT 'executive'::text AS form_code, e.id AS rid
    FROM public.employees e WHERE my_level = 0 AND e.hierarchy_level = 1
    UNION ALL
    SELECT 'executive', e.id FROM public.employees e
    WHERE my_level = 1 AND e.hierarchy_level = 0
    UNION ALL
    SELECT 'executive', e.id FROM public.employees e
    WHERE EXISTS (SELECT 1 FROM public.employees x WHERE x.id = me AND x.is_eo_lead_assessor)
      AND e.hierarchy_level = 1
    UNION ALL
    SELECT 'peer_360', e.id FROM public.employees e
    WHERE my_manager IS NOT NULL AND e.id = my_manager
    UNION ALL
    SELECT 'peer_360', e.id FROM public.employees e
    WHERE my_dept IS NOT NULL AND e.department = my_dept AND e.id <> me AND e.hierarchy_level >= my_level
    UNION ALL
    SELECT 'peer_360', e.id FROM public.employees e WHERE e.manager_id = me
    UNION ALL
    SELECT 'ea_quarterly', e.id FROM public.employees e
    WHERE e.manager_id = me AND e.role ILIKE '%Executive Assistant%'
    UNION ALL
    SELECT 'monthly_self', me
  ),
  dedup AS (SELECT DISTINCT form_code, rid FROM targets)
  SELECT
    f.code, f.title, e.id, e.name, e.role, e.department, f.anonymous, r.id, COALESCE(r.status, 'todo')
  FROM dedup d
  JOIN public.assessment_forms f ON f.code = d.form_code
  JOIN public.employees e ON e.id = d.rid
  LEFT JOIN public.assessment_responses r
    ON r.form_id = f.id AND r.reviewer_id = me AND r.reviewee_id = e.id
    AND r.period = (CASE WHEN f.code = 'monthly_self' THEN _period_month ELSE _period_quarter END)
  ORDER BY f.code, e.name;
END $$;

COMMENT ON FUNCTION public.get_review_assignments(text, text) IS 'Returns assigned BOOM reviews for the current user. Pass fiscal quarter key (e.g. 2026-Q1) and calendar month (e.g. 2026-05) for monthly self-assessment.';

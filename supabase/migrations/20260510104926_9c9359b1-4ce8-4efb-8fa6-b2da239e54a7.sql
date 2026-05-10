
TRUNCATE TABLE public.survey_answers CASCADE;
TRUNCATE TABLE public.survey_responses CASCADE;
TRUNCATE TABLE public.survey_questions CASCADE;
TRUNCATE TABLE public.survey_categories CASCADE;
TRUNCATE TABLE public.appraisal_responses CASCADE;
TRUNCATE TABLE public.manager_summaries CASCADE;
TRUNCATE TABLE public.review_completions CASCADE;
TRUNCATE TABLE public.employees CASCADE;
TRUNCATE TABLE public.subsidiaries CASCADE;
DELETE FROM public.user_roles;

CREATE TABLE IF NOT EXISTS public.assessment_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  scale_min int NOT NULL DEFAULT 1,
  scale_max int NOT NULL DEFAULT 5,
  allows_no_opportunity boolean NOT NULL DEFAULT false,
  cadence text NOT NULL DEFAULT 'quarterly',
  anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.assessment_forms(id) ON DELETE CASCADE,
  section text NOT NULL,
  section_order int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'scored',
  min_words int,
  helper_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assessment_questions_form_idx ON public.assessment_questions(form_id, section_order, sort_order);

CREATE TABLE IF NOT EXISTS public.assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.assessment_forms(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  period text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(form_id, reviewer_id, reviewee_id, period)
);
CREATE INDEX IF NOT EXISTS assessment_responses_reviewee_idx ON public.assessment_responses(reviewee_id, form_id, period);
CREATE INDEX IF NOT EXISTS assessment_responses_reviewer_idx ON public.assessment_responses(reviewer_id, form_id, period);

CREATE TABLE IF NOT EXISTS public.assessment_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.assessment_responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  score int,
  no_opportunity boolean NOT NULL DEFAULT false,
  text_answer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(response_id, question_id)
);

CREATE OR REPLACE FUNCTION public.tg_assessment_responses_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_assessment_responses_updated ON public.assessment_responses;
CREATE TRIGGER trg_assessment_responses_updated BEFORE UPDATE ON public.assessment_responses
FOR EACH ROW EXECUTE FUNCTION public.tg_assessment_responses_updated();

ALTER TABLE public.assessment_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read forms" ON public.assessment_forms;
CREATE POLICY "Anyone authenticated can read forms" ON public.assessment_forms FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Anyone authenticated can read questions" ON public.assessment_questions;
CREATE POLICY "Anyone authenticated can read questions" ON public.assessment_questions FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email)
  WHERE p.id = auth.uid()
  LIMIT 1
$$;

DROP POLICY IF EXISTS "Reviewer can read own responses" ON public.assessment_responses;
CREATE POLICY "Reviewer can read own responses" ON public.assessment_responses
  FOR SELECT TO authenticated USING (reviewer_id = public.current_employee_id() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Reviewer can insert own responses" ON public.assessment_responses;
CREATE POLICY "Reviewer can insert own responses" ON public.assessment_responses
  FOR INSERT TO authenticated WITH CHECK (reviewer_id = public.current_employee_id());
DROP POLICY IF EXISTS "Reviewer can update own draft responses" ON public.assessment_responses;
CREATE POLICY "Reviewer can update own draft responses" ON public.assessment_responses
  FOR UPDATE TO authenticated
  USING (reviewer_id = public.current_employee_id())
  WITH CHECK (reviewer_id = public.current_employee_id());

DROP POLICY IF EXISTS "Reviewer can read own answers" ON public.assessment_answers;
CREATE POLICY "Reviewer can read own answers" ON public.assessment_answers
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.assessment_responses r WHERE r.id = response_id
      AND (r.reviewer_id = public.current_employee_id() OR public.has_role(auth.uid(), 'admin')))
  );
DROP POLICY IF EXISTS "Reviewer can write own answers" ON public.assessment_answers;
CREATE POLICY "Reviewer can write own answers" ON public.assessment_answers
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.assessment_responses r WHERE r.id = response_id
      AND r.reviewer_id = public.current_employee_id() AND r.status = 'draft')
  );
DROP POLICY IF EXISTS "Reviewer can update own answers" ON public.assessment_answers;
CREATE POLICY "Reviewer can update own answers" ON public.assessment_answers
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.assessment_responses r WHERE r.id = response_id
      AND r.reviewer_id = public.current_employee_id() AND r.status = 'draft')
  );

CREATE OR REPLACE FUNCTION public.get_review_assignments(_period text)
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
    SELECT 'peer_360', e.id FROM public.employees e
    WHERE my_manager IS NOT NULL AND e.id = my_manager
    UNION ALL
    SELECT 'peer_360', e.id FROM public.employees e
    WHERE my_dept IS NOT NULL AND e.department = my_dept AND e.id <> me AND e.hierarchy_level >= my_level
    UNION ALL
    SELECT 'peer_360', e.id FROM public.employees e WHERE e.manager_id = me
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
    ON r.form_id = f.id AND r.reviewer_id = me AND r.reviewee_id = e.id AND r.period = _period
  ORDER BY f.code, e.name;
END $$;

CREATE OR REPLACE FUNCTION public.get_my_360_results(_period text)
RETURNS TABLE (
  question_id uuid, question_text text, section text,
  avg_score numeric, response_count int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid; cnt int;
BEGIN
  SELECT e.id INTO me FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email)
  WHERE p.id = auth.uid() LIMIT 1;
  IF me IS NULL THEN RETURN; END IF;
  SELECT COUNT(*) INTO cnt FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted' AND f.code = 'peer_360';
  IF cnt < 3 THEN RETURN; END IF;
  RETURN QUERY
  SELECT q.id, q.question_text, q.section,
    ROUND(AVG(a.score)::numeric, 2),
    COUNT(a.score)::int
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
    AND f.code = 'peer_360' AND a.score IS NOT NULL AND NOT a.no_opportunity
  GROUP BY q.id, q.question_text, q.section
  ORDER BY q.section;
END $$;

INSERT INTO public.subsidiaries (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Executive Office of the GCEO');

INSERT INTO public.employees (subsidiary_id, name, email, role, department, hierarchy_level) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bunmi Akinyemiju', 'bunmi.akinyemiju@peopleos.co', 'Group CEO', 'Executive Office', 0),
  ('11111111-1111-1111-1111-111111111111', 'Kunmi Demuren', 'kunmi.demuren@peopleos.co', 'Chief of Staff', 'General Executive Support', 1),
  ('11111111-1111-1111-1111-111111111111', 'Uche Ukonu', 'uche.ukonu@peopleos.co', 'Executive Manager', 'Central Ops', 1),
  ('11111111-1111-1111-1111-111111111111', 'Gisele Karekezi', 'gisele.karekezi@peopleos.co', 'Executive Manager', 'Brand & Comms', 1),
  ('11111111-1111-1111-1111-111111111111', 'Deyi Dipeolu', 'deyi.dipeolu@peopleos.co', 'Executive Manager', 'Governance', 1),
  ('11111111-1111-1111-1111-111111111111', 'Omotola Akinyemiju', 'omotola.akinyemiju@peopleos.co', 'Executive Manager', 'General Operations', 1),
  ('11111111-1111-1111-1111-111111111111', 'Ayomide Adeosun', 'ayomide.adeosun@peopleos.co', 'Team Manager', 'Technical', 2),
  ('11111111-1111-1111-1111-111111111111', 'Eniola Olawale', 'eniola.olawale@peopleos.co', 'Executive Assistant', 'General Executive Support', 3),
  ('11111111-1111-1111-1111-111111111111', 'Oreoluwa Ifia', 'oreoluwa.ifia@peopleos.co', 'Executive Assistant', 'General Executive Support', 3),
  ('11111111-1111-1111-1111-111111111111', 'Adeyinka Oshin', 'adeyinka.oshin@peopleos.co', 'Operations', 'General Operations', 3),
  ('11111111-1111-1111-1111-111111111111', 'Chuka Monyei', 'chuka.monyei@peopleos.co', 'Central Ops', 'Central Ops', 3),
  ('11111111-1111-1111-1111-111111111111', 'Baluku Duannah', 'baluku.duannah@peopleos.co', 'Central Ops', 'Central Ops', 3),
  ('11111111-1111-1111-1111-111111111111', 'Melissa Omede', 'melissa.omede@peopleos.co', 'Central Ops', 'Central Ops', 3),
  ('11111111-1111-1111-1111-111111111111', 'Regina Ottoh-Ebhonu', 'regina.ottoh-ebhonu@peopleos.co', 'Central Ops', 'Central Ops', 3),
  ('11111111-1111-1111-1111-111111111111', 'Oluwatobi Ijamakinwa', 'oluwatobi.ijamakinwa@peopleos.co', 'Brand & Comms', 'Brand & Comms', 3),
  ('11111111-1111-1111-1111-111111111111', 'Brenda Nafula', 'brenda.nafula@peopleos.co', 'Brand & Comms', 'Brand & Comms', 3),
  ('11111111-1111-1111-1111-111111111111', 'Abiona Gideon', 'abiona.gideon@peopleos.co', 'Brand & Comms', 'Brand & Comms', 3),
  ('11111111-1111-1111-1111-111111111111', 'Dorathy Akor', 'dorathy.akor@peopleos.co', 'Technical', 'Technical', 3),
  ('11111111-1111-1111-1111-111111111111', 'Tobi Bankole', 'tobi.bankole@peopleos.co', 'Technical', 'Technical', 3),
  ('11111111-1111-1111-1111-111111111111', 'Udeme Inyang', 'udeme.inyang@peopleos.co', 'Calendar & Travel', 'Calendar & Travel', 3),
  ('11111111-1111-1111-1111-111111111111', 'Favour Oyekanmi', 'favour.oyekanmi@peopleos.co', 'Calendar & Travel', 'Calendar & Travel', 3);

UPDATE public.employees e SET manager_id = m.id
FROM public.employees m
WHERE e.manager_id IS NULL AND (
  (e.name IN ('Eniola Olawale','Oreoluwa Ifia') AND m.name = 'Kunmi Demuren') OR
  (e.name IN ('Chuka Monyei','Baluku Duannah','Melissa Omede','Regina Ottoh-Ebhonu') AND m.name = 'Uche Ukonu') OR
  (e.name IN ('Oluwatobi Ijamakinwa','Brenda Nafula','Abiona Gideon') AND m.name = 'Gisele Karekezi') OR
  (e.name = 'Ayomide Adeosun' AND m.name = 'Uche Ukonu') OR
  (e.name IN ('Dorathy Akor','Tobi Bankole') AND m.name = 'Ayomide Adeosun') OR
  (e.name IN ('Udeme Inyang','Favour Oyekanmi') AND m.name = 'Uche Ukonu') OR
  (e.name = 'Adeyinka Oshin' AND m.name = 'Omotola Akinyemiju') OR
  (e.name IN ('Uche Ukonu','Gisele Karekezi','Deyi Dipeolu','Omotola Akinyemiju','Kunmi Demuren') AND m.name = 'Bunmi Akinyemiju')
);

INSERT INTO public.assessment_forms (code, title, description, scale_min, scale_max, allows_no_opportunity, cadence, anonymous) VALUES
('executive', 'Executive Performance Assessment', 'Quarterly performance assessment for executives. 1-5 scale with required written justification.', 1, 5, false, 'quarterly', false),
('peer_360', 'Quarterly 360 Peer Review', 'Anonymous peer review across same-vertical colleagues and direct manager.', 1, 5, true, 'quarterly', true),
('monthly_self', 'Monthly Self-Assessment', 'Personal monthly check-in: wellbeing, motivation, BOOM values in practice.', 1, 5, false, 'monthly', false);

WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'executive')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw::int, s.h FROM f, (VALUES
  ('BOOM Alignment', 1, 1, 'How well do you understand and operate within the BOOM operating doctrine? Provide specific evidence.', 'scored', 200, 'Self-rating 1-5. Vague responses score 2 or below regardless of self-rating.'),
  ('BOOM Alignment', 1, 2, 'Justify your BOOM Alignment score with a concrete example from this period.', 'written', 200, NULL::text),
  ('Strategic Comprehension', 2, 1, 'How clearly can you articulate the executive''s strategic priorities and how your work advances them?', 'scored', 200, NULL::text),
  ('Strategic Comprehension', 2, 2, 'Justify your Strategic Comprehension score with evidence from this period.', 'written', 200, NULL::text),
  ('Output Quality', 3, 1, 'Rate the consistency and quality of your outputs this period - drafts, decisions, deliverables.', 'scored', 200, NULL::text),
  ('Output Quality', 3, 2, 'Justify your Output Quality score with two concrete deliverables.', 'written', 200, NULL::text),
  ('Culture Standards', 4, 1, 'Rate how well you embody and enforce the Executive Office culture standards.', 'scored', 200, NULL::text),
  ('Culture Standards', 4, 2, 'Justify your Culture Standards score with a specific situation.', 'written', 200, NULL::text)
) AS s(section, so, qo, q, qt, mw, h);

WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'peer_360')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw, s.h FROM f, (VALUES
  ('Cultural Agility & Humility', 1, 1, 'Admits mistakes openly and uses them as a basis for improvement rather than concealing or deflecting them.', 'scored', NULL::int, NULL::text),
  ('Cultural Agility & Humility', 1, 2, 'Shows humility under pressure and treats others with respect regardless of seniority or role.', 'scored', NULL::int, NULL::text),
  ('Cultural Agility & Humility', 1, 3, 'Demonstrates emotional maturity by staying composed during conflict, tension, or a difficult instruction.', 'scored', NULL::int, NULL::text),
  ('Cultural Agility & Humility', 1, 4, 'Actively seeks feedback from peers and colleagues and visibly acts on it.', 'scored', NULL::int, NULL::text),
  ('Cultural Agility & Humility', 1, 5, 'Listens to others before making decisions or taking action - and genuinely acknowledges others'' contributions.', 'scored', NULL::int, NULL::text),
  ('Cultural Agility & Humility', 1, 6, 'Responds constructively when colleagues make mistakes rather than distancing themselves or judging.', 'scored', NULL::int, NULL::text),
  ('Cultural Agility & Humility', 1, 7, 'Demonstrates willingness to learn from anyone in the team regardless of their seniority or experience.', 'scored', NULL::int, NULL::text),
  ('Cultural Agility & Humility', 1, 8, 'Listens actively and respectfully even when others'' opinions differ significantly from their own.', 'scored', NULL::int, NULL::text),
  ('Collaboration & Partnership', 2, 1, 'Shares knowledge, information, and context freely with colleagues rather than operating in isolation.', 'scored', NULL::int, NULL::text),
  ('Collaboration & Partnership', 2, 2, 'Collaborates effectively with other verticals to achieve shared outcomes for the executive or the office.', 'scored', NULL::int, NULL::text),
  ('Collaboration & Partnership', 2, 3, 'Addresses conflicts or misalignments constructively and early rather than letting them compound.', 'scored', NULL::int, NULL::text),
  ('Collaboration & Partnership', 2, 4, 'Acts as a connector - brings together people or information across the team to solve problems.', 'scored', NULL::int, NULL::text),
  ('Collaboration & Partnership', 2, 5, 'Operates with a One Executive Office mindset rather than focusing solely on their own vertical''s interests.', 'scored', NULL::int, NULL::text),
  ('Collaboration & Partnership', 2, 6, 'Proactively shares updates, context, or relevant information with the team without being prompted.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy in Practice', 3, 1, 'Demonstrates Integrity - confidentiality, dependability, and ethical decision-making.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy in Practice', 3, 2, 'Demonstrates Excellence - quality of output, attention to detail, mastery of craft.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy in Practice', 3, 3, 'Demonstrates Mutual Respect - collaboration with humility across functions and levels.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy in Practice', 3, 4, 'Demonstrates Adaptability - resilience under pressure, pivots without panic.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy in Practice', 3, 5, 'Demonstrates Innovation - challenges convention to create scalable systems and value.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy in Practice', 3, 6, 'Demonstrates Overachievement - owns results end-to-end, aims and lands above expectations.', 'scored', NULL::int, NULL::text),
  ('BOOM Philosophy in Practice', 3, 7, 'Demonstrates openness, transparency, and accountability in all communications - does not obscure or hedge.', 'scored', NULL::int, NULL::text),
  ('Executive Office Standards', 4, 1, 'Manages upward effectively - keeps the EO Lead informed without being prompted, flags risks early.', 'scored', NULL::int, NULL::text),
  ('Executive Office Standards', 4, 2, 'Handles required documentation, reports, and information with accuracy and on time.', 'scored', NULL::int, NULL::text),
  ('Executive Office Standards', 4, 3, 'Demonstrates behaviour consistent with the reputational stakes of the function.', 'scored', NULL::int, NULL::text),
  ('Open Questions', 5, 1, 'Provide a specific example of an area where this person could meaningfully improve. What is the gap and what would it look like fixed?', 'written', NULL::int, 'Generic answers are not useful.'),
  ('Open Questions', 5, 2, 'What should this person STOP doing? Up to 3 specific behaviours.', 'written', NULL::int, NULL::text),
  ('Open Questions', 5, 3, 'What should this person START doing? Up to 3 specific behaviours.', 'written', NULL::int, NULL::text),
  ('Open Questions', 5, 4, 'What should this person CONTINUE doing? Up to 3 specific behaviours.', 'written', NULL::int, NULL::text),
  ('Open Questions', 5, 5, 'Anything else you want the EO Lead to know about this person''s contribution this quarter?', 'written', NULL::int, NULL::text)
) AS s(section, so, qo, q, qt, mw, h);

WITH f AS (SELECT id FROM public.assessment_forms WHERE code = 'monthly_self')
INSERT INTO public.assessment_questions (form_id, section, section_order, sort_order, question_text, question_type, min_words, helper_text)
SELECT f.id, s.section, s.so, s.qo, s.q, s.qt, s.mw, s.h FROM f, (VALUES
  ('Personal Check-In', 1, 1, 'Is there anything you are proud of this month?', 'written', NULL::int, NULL::text),
  ('Personal Check-In', 1, 2, 'Is there anything personal that has affected your productivity? You don''t need to share details - just flag if support would help.', 'written', NULL::int, NULL::text),
  ('Personal Check-In', 1, 3, 'Is there anything your manager or the EO Lead can do to better support you this month?', 'written', NULL::int, NULL::text),
  ('Personal Check-In', 1, 4, 'How motivated and challenged have you felt in your role this month?', 'scored', NULL::int, '1=Not at all, 5=Completely'),
  ('Personal Check-In', 1, 5, 'How fulfilled do you feel in your role this month?', 'scored', NULL::int, '1=Not at all, 5=Completely'),
  ('Personal Check-In', 1, 6, 'Have you taken any time off this month? If not, do you need to?', 'written', NULL::int, NULL::text),
  ('Personal Check-In', 1, 7, 'Anything personal you''re looking forward to in the next month?', 'written', NULL::int, NULL::text),
  ('Personal Check-In', 1, 8, 'Do you have a good working relationship with your team this month? If not, what would help?', 'written', NULL::int, NULL::text),
  ('BOOM Values in Practice', 2, 1, 'Integrity - describe a specific instance this month.', 'value_example', NULL::int, 'A vague answer like "I was professional" does not constitute an example.'),
  ('BOOM Values in Practice', 2, 2, 'Excellence - describe a specific instance this month.', 'value_example', NULL::int, NULL::text),
  ('BOOM Values in Practice', 2, 3, 'Mutual Respect - describe a specific instance this month.', 'value_example', NULL::int, NULL::text),
  ('BOOM Values in Practice', 2, 4, 'Adaptability - describe a specific instance this month.', 'value_example', NULL::int, NULL::text),
  ('BOOM Values in Practice', 2, 5, 'Innovation - describe a specific instance this month (small process improvements count).', 'value_example', NULL::int, NULL::text),
  ('BOOM Values in Practice', 2, 6, 'Overachievement - describe a specific instance this month.', 'value_example', NULL::int, NULL::text)
) AS s(section, so, qo, q, qt, mw, h);

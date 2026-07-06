-- EO pilot: reviewees see anonymous 360 aggregates immediately as peers submit (no HR release gate).
-- Reviewer identity is never exposed — only section averages and unattributed written feedback.

CREATE OR REPLACE FUNCTION public.peer_360_results_released(_period text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true;
$$;

COMMENT ON FUNCTION public.peer_360_results_released(text) IS
  'EO pilot: peer 360 aggregates are visible to reviewees immediately (anonymous). Period arg kept for API compatibility.';

CREATE OR REPLACE FUNCTION public.get_my_360_results(_period text)
RETURNS TABLE (
  question_id uuid,
  question_text text,
  section text,
  avg_score numeric,
  response_count int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid;
  cnt int;
  min_peers int := 1;
BEGIN
  SELECT e.id INTO me
  FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email)
  WHERE p.id = auth.uid()
  LIMIT 1;

  IF me IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO cnt
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me
    AND r.period = _period
    AND r.status = 'submitted'
    AND f.code = 'peer_360';

  IF cnt < min_peers THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    q.section,
    ROUND(AVG(a.score)::numeric, 2),
    COUNT(a.score)::int
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me
    AND r.period = _period
    AND r.status = 'submitted'
    AND f.code = 'peer_360'
    AND a.score IS NOT NULL
    AND NOT a.no_opportunity
  GROUP BY q.id, q.question_text, q.section
  ORDER BY q.section;
END;
$$;

COMMENT ON FUNCTION public.get_my_360_results(text) IS
  'Anonymous aggregated peer 360 scores for the current user; updates as each peer submits (min 1 review).';

CREATE OR REPLACE FUNCTION public.get_my_360_dashboard(_period text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  peer_cnt int;
  min_peers int := 1;
  sections jsonb;
  narratives jsonb;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT COUNT(*)::int INTO peer_cnt
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me
    AND r.period = _period
    AND r.status = 'submitted'
    AND f.code = 'peer_360';

  IF peer_cnt < min_peers THEN
    RETURN jsonb_build_object(
      'released', true,
      'peer_count', peer_cnt,
      'min_peers_required', min_peers,
      'sections', '[]'::jsonb,
      'start_doing', '[]'::jsonb,
      'stop_doing', '[]'::jsonb,
      'continue_doing', '[]'::jsonb,
      'themes', '[]'::jsonb
    );
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'section', q.section,
    'avg_score', ROUND(AVG(a.score)::numeric, 2),
    'response_count', COUNT(a.score)::int
  ) ORDER BY q.section), '[]'::jsonb)
  INTO sections
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me
    AND r.period = _period
    AND r.status = 'submitted'
    AND f.code = 'peer_360'
    AND a.score IS NOT NULL
    AND NOT a.no_opportunity
  GROUP BY q.section;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('text', trim(a.text_answer)) ORDER BY r.submitted_at NULLS LAST), '[]'::jsonb)
  INTO narratives
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me
    AND r.period = _period
    AND r.status = 'submitted'
    AND f.code = 'peer_360'
    AND a.text_answer IS NOT NULL
    AND trim(a.text_answer) <> '';

  RETURN jsonb_build_object(
    'released', true,
    'peer_count', peer_cnt,
    'min_peers_required', min_peers,
    'sections', COALESCE(sections, '[]'::jsonb),
    'start_doing', (
      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me
          AND r.period = _period
          AND r.status = 'submitted'
          AND f.code = 'peer_360'
          AND a.text_answer IS NOT NULL
          AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%start%'
      ) s
    ),
    'stop_doing', (
      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me
          AND r.period = _period
          AND r.status = 'submitted'
          AND f.code = 'peer_360'
          AND a.text_answer IS NOT NULL
          AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%stop%'
      ) s
    ),
    'continue_doing', (
      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me
          AND r.period = _period
          AND r.status = 'submitted'
          AND f.code = 'peer_360'
          AND a.text_answer IS NOT NULL
          AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%continue%'
      ) s
    ),
    'themes', COALESCE(narratives, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.get_my_360_dashboard(text) IS
  'Anonymous peer 360 dashboard: section averages + narrative themes; updates live as peers submit (min 1).';

-- Peer 360 discussion: subjects see their own anonymous dashboard, not a HR-hold message.
CREATE OR REPLACE FUNCTION public.get_boom_discussion_thread(_discussion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  d record;
  msgs jsonb;
  payload jsonb;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  SELECT * INTO d
  FROM public.boom_result_discussions
  WHERE id = _discussion_id;

  IF d.id IS NULL THEN RETURN '{}'::jsonb; END IF;
  IF NOT public.boom_discussion_participant(d.id, me) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'author_id', m.author_employee_id,
    'author_name', e.name,
    'body', m.body,
    'created_at', m.created_at,
    'is_me', m.author_employee_id = me
  ) ORDER BY m.created_at), '[]'::jsonb)
  INTO msgs
  FROM public.boom_discussion_messages m
  JOIN public.employees e ON e.id = m.author_employee_id
  WHERE m.discussion_id = d.id;

  IF d.form_code = 'peer_360' THEN
    IF d.facilitator_employee_id = me OR public.has_role(auth.uid(), 'admin') THEN
      payload := public.get_boom_peer360_oversight_detail(d.subject_employee_id, d.period);
    ELSIF d.subject_employee_id = me THEN
      payload := public.get_my_360_dashboard(d.period);
    ELSE
      payload := jsonb_build_object(
        'subject_view', true,
        'message', 'Anonymous peer 360 feedback for this thread is only visible to participants.'
      );
    END IF;
  ELSIF d.source_response_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'section', q.section,
      'question', q.question_text,
      'question_type', q.question_type,
      'score', a.score,
      'text_answer', a.text_answer,
      'no_opportunity', a.no_opportunity
    ) ORDER BY q.section_order, q.sort_order), '[]'::jsonb)
    INTO payload
    FROM public.assessment_answers a
    JOIN public.assessment_questions q ON q.id = a.question_id
    WHERE a.response_id = d.source_response_id;
  ELSE
    payload := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'discussion_id', d.id,
    'form_code', d.form_code,
    'period', d.period,
    'subject_id', d.subject_employee_id,
    'subject_name', (SELECT name FROM public.employees WHERE id = d.subject_employee_id),
    'facilitator_id', d.facilitator_employee_id,
    'facilitator_name', (SELECT name FROM public.employees WHERE id = d.facilitator_employee_id),
    'source_response_id', d.source_response_id,
    'viewer_role', CASE WHEN d.subject_employee_id = me THEN 'subject' ELSE 'facilitator' END,
    'results', payload,
    'messages', msgs
  );
END;
$$;

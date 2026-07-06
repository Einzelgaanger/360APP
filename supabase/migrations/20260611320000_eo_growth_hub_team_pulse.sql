-- Growth Hub: personal 360 when available; otherwise L0/L1 team pulse from oversight roster.

CREATE OR REPLACE FUNCTION public.get_eo_growth_hub_pulse(_period text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  my_level int;
  peer_cnt int;
  subject_cnt int;
  team_peer_cnt int;
  sections jsonb;
  start_doing jsonb;
  stop_doing jsonb;
  continue_doing jsonb;
  themes jsonb;
  pulse_label text;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT hierarchy_level INTO my_level FROM public.employees WHERE id = me;

  -- 1) Personal peer 360 about the current user.
  SELECT COUNT(*)::int INTO peer_cnt
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me
    AND r.period = _period
    AND r.status = 'submitted'
    AND f.code = 'peer_360';

  IF peer_cnt >= 1 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'section', section,
      'avg_score', avg_score,
      'response_count', response_count
    ) ORDER BY section), '[]'::jsonb)
    INTO sections
    FROM (
      SELECT
        q.section,
        ROUND(AVG(a.score)::numeric, 2) AS avg_score,
        COUNT(a.score)::int AS response_count
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
      GROUP BY q.section
    ) section_agg;

    IF jsonb_array_length(COALESCE(sections, '[]'::jsonb)) > 0 THEN
      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb) INTO start_doing
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
          AND f.code = 'peer_360' AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%start%'
        LIMIT 15
      ) s;

      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb) INTO stop_doing
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
          AND f.code = 'peer_360' AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%stop%'
        LIMIT 15
      ) s;

      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb) INTO continue_doing
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
          AND f.code = 'peer_360' AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%continue%'
        LIMIT 15
      ) s;

      SELECT COALESCE(jsonb_agg(jsonb_build_object('text', trim(a.text_answer)) ORDER BY r.submitted_at NULLS LAST), '[]'::jsonb)
      INTO themes
      FROM public.assessment_answers a
      JOIN public.assessment_questions q ON q.id = a.question_id
      JOIN public.assessment_responses r ON r.id = a.response_id
      JOIN public.assessment_forms f ON f.id = r.form_id
      WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
        AND f.code = 'peer_360' AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
      LIMIT 20;

      RETURN jsonb_build_object(
        'mode', 'self',
        'pulse_label', 'Your peer 360 feedback',
        'peer_count', peer_cnt,
        'subject_count', 1,
        'sections', COALESCE(sections, '[]'::jsonb),
        'start_doing', COALESCE(start_doing, '[]'::jsonb),
        'stop_doing', COALESCE(stop_doing, '[]'::jsonb),
        'continue_doing', COALESCE(continue_doing, '[]'::jsonb),
        'themes', COALESCE(themes, '[]'::jsonb)
      );
    END IF;
  END IF;

  -- 2) L0/L1 leaders: team pulse across oversight roster (anonymous aggregate).
  IF NOT public.boom_has_peer360_oversight_access(me) THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT COUNT(DISTINCT e.id)::int INTO subject_cnt
  FROM public.employees e
  WHERE e.subsidiary_id = '11111111-1111-1111-1111-111111111111'
    AND COALESCE(e.eo_appraisal_active, false)
    AND public.boom_peer360_oversight_subject_allowed(me, e.id);

  SELECT COUNT(DISTINCT r.id)::int INTO team_peer_cnt
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'peer_360'
  WHERE r.period = _period
    AND r.status = 'submitted'
    AND public.boom_peer360_oversight_subject_allowed(me, r.reviewee_id);

  IF subject_cnt = 0 OR team_peer_cnt = 0 THEN
    RETURN '{}'::jsonb;
  END IF;

  pulse_label := CASE
    WHEN COALESCE(my_level, 99) = 0 THEN 'Executive Office L2 team pulse'
    ELSE 'Your pod — L2 team pulse'
  END;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'section', section,
    'avg_score', avg_score,
    'response_count', response_count
  ) ORDER BY section), '[]'::jsonb)
  INTO sections
  FROM (
    SELECT
      q.section,
      ROUND(AVG(a.score)::numeric, 2) AS avg_score,
      COUNT(a.score)::int AS response_count
    FROM public.assessment_answers a
    JOIN public.assessment_questions q ON q.id = a.question_id
    JOIN public.assessment_responses r ON r.id = a.response_id
    JOIN public.assessment_forms f ON f.id = r.form_id
    WHERE r.period = _period
      AND r.status = 'submitted'
      AND f.code = 'peer_360'
      AND a.score IS NOT NULL
      AND NOT a.no_opportunity
      AND public.boom_peer360_oversight_subject_allowed(me, r.reviewee_id)
    GROUP BY q.section
  ) section_agg;

  IF jsonb_array_length(COALESCE(sections, '[]'::jsonb)) = 0 THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb) INTO start_doing
  FROM (
    SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
           row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
    FROM public.assessment_answers a
    JOIN public.assessment_questions q ON q.id = a.question_id
    JOIN public.assessment_responses r ON r.id = a.response_id
    JOIN public.assessment_forms f ON f.id = r.form_id
    WHERE r.period = _period AND r.status = 'submitted' AND f.code = 'peer_360'
      AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
      AND lower(q.question_text) LIKE '%start%'
      AND public.boom_peer360_oversight_subject_allowed(me, r.reviewee_id)
    LIMIT 15
  ) s;

  SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb) INTO stop_doing
  FROM (
    SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
           row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
    FROM public.assessment_answers a
    JOIN public.assessment_questions q ON q.id = a.question_id
    JOIN public.assessment_responses r ON r.id = a.response_id
    JOIN public.assessment_forms f ON f.id = r.form_id
    WHERE r.period = _period AND r.status = 'submitted' AND f.code = 'peer_360'
      AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
      AND lower(q.question_text) LIKE '%stop%'
      AND public.boom_peer360_oversight_subject_allowed(me, r.reviewee_id)
    LIMIT 15
  ) s;

  SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb) INTO continue_doing
  FROM (
    SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
           row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
    FROM public.assessment_answers a
    JOIN public.assessment_questions q ON q.id = a.question_id
    JOIN public.assessment_responses r ON r.id = a.response_id
    JOIN public.assessment_forms f ON f.id = r.form_id
    WHERE r.period = _period AND r.status = 'submitted' AND f.code = 'peer_360'
      AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
      AND lower(q.question_text) LIKE '%continue%'
      AND public.boom_peer360_oversight_subject_allowed(me, r.reviewee_id)
    LIMIT 15
  ) s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('text', trim(a.text_answer)) ORDER BY r.submitted_at NULLS LAST), '[]'::jsonb)
  INTO themes
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.period = _period AND r.status = 'submitted' AND f.code = 'peer_360'
    AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
    AND public.boom_peer360_oversight_subject_allowed(me, r.reviewee_id)
  LIMIT 20;

  RETURN jsonb_build_object(
    'mode', 'team_pulse',
    'pulse_label', pulse_label,
    'peer_count', team_peer_cnt,
    'subject_count', subject_cnt,
    'sections', COALESCE(sections, '[]'::jsonb),
    'start_doing', COALESCE(start_doing, '[]'::jsonb),
    'stop_doing', COALESCE(stop_doing, '[]'::jsonb),
    'continue_doing', COALESCE(continue_doing, '[]'::jsonb),
    'themes', COALESCE(themes, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.get_eo_growth_hub_pulse(text) IS
  'Growth Hub input: personal peer 360 when present, else anonymous L2 team pulse for L0/L1 oversight viewers.';

GRANT EXECUTE ON FUNCTION public.get_eo_growth_hub_pulse(text) TO authenticated;

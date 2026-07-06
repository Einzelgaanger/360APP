-- Fix "aggregate function calls cannot be nested" when aggregating 360 section scores.
-- AVG/COUNT must run in an inner subquery; outer jsonb_agg only wraps the rows.

CREATE OR REPLACE FUNCTION public.get_eo_employee_insight(
  _employee_id uuid,
  _period_quarter text,
  _period_month text
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  my_level int;
  target record;
  monthly_status text;
  exec_status text;
  peer_rows jsonb;
  peer_by_rel jsonb;
  released boolean;
  can_view boolean;
  can_view_360 boolean;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  SELECT hierarchy_level INTO my_level FROM public.employees WHERE id = me;
  SELECT * INTO target FROM public.employees WHERE id = _employee_id;
  IF target.id IS NULL THEN RETURN '{}'::jsonb; END IF;

  can_view := public.has_role(auth.uid(), 'admin')
    OR me = _employee_id
    OR (COALESCE(my_level, 99) = 1 AND target.hierarchy_level = 2)
    OR (COALESCE(my_level, 99) = 0 AND target.hierarchy_level <= 2);

  IF NOT can_view THEN RETURN '{}'::jsonb; END IF;

  can_view_360 := public.has_role(auth.uid(), 'admin')
    OR me = _employee_id
    OR (COALESCE(my_level, 99) = 1 AND target.hierarchy_level = 2)
    OR (COALESCE(my_level, 99) = 0 AND target.hierarchy_level = 2);

  SELECT COALESCE(r.status, 'todo') INTO monthly_status
  FROM public.assessment_forms f
  LEFT JOIN public.assessment_responses r
    ON r.form_id = f.id AND r.reviewer_id = _employee_id AND r.reviewee_id = _employee_id
    AND r.period = _period_month
  WHERE f.code = 'monthly_self' LIMIT 1;

  SELECT COALESCE(r.status, 'todo') INTO exec_status
  FROM public.assessment_forms f
  LEFT JOIN public.assessment_responses r
    ON r.form_id = f.id AND r.reviewer_id = _employee_id AND r.reviewee_id = _employee_id
    AND r.period = _period_quarter
  WHERE f.code = 'executive' LIMIT 1;

  SELECT public.peer_360_results_released(_period_quarter) INTO released;

  IF can_view_360 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'section', section,
      'avg_score', avg_score,
      'response_count', response_count
    ) ORDER BY section), '[]'::jsonb) INTO peer_rows
    FROM (
      SELECT
        q.section,
        ROUND(AVG(a.score)::numeric, 2) AS avg_score,
        COUNT(a.score)::int AS response_count
      FROM public.assessment_answers a
      JOIN public.assessment_questions q ON q.id = a.question_id
      JOIN public.assessment_responses r ON r.id = a.response_id
      JOIN public.assessment_forms f ON f.id = r.form_id
      WHERE r.reviewee_id = _employee_id AND r.period = _period_quarter AND r.status = 'submitted'
        AND f.code = 'peer_360' AND a.score IS NOT NULL AND NOT a.no_opportunity
      GROUP BY q.section
    ) section_agg;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'relation', rel,
      'avg_score', avg_score,
      'response_count', response_count
    )), '[]'::jsonb) INTO peer_by_rel
    FROM (
      SELECT
        COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) AS rel,
        ROUND(AVG(a.score)::numeric, 2) AS avg_score,
        COUNT(DISTINCT r.id)::int AS response_count
      FROM public.assessment_responses r
      JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'peer_360'
      JOIN public.assessment_answers a ON a.response_id = r.id AND a.score IS NOT NULL AND NOT a.no_opportunity
      WHERE r.reviewee_id = _employee_id AND r.period = _period_quarter AND r.status = 'submitted'
      GROUP BY rel
      HAVING COUNT(DISTINCT r.id) >= 1
    ) rel_agg;
  ELSE
    peer_rows := '[]'::jsonb;
    peer_by_rel := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'employee_id', _employee_id,
    'name', target.name,
    'hierarchy_level', target.hierarchy_level,
    'monthly_self_status', monthly_status,
    'executive_self_status', exec_status,
    'peer_360_released', COALESCE(released, false),
    'peer_360_sections', COALESCE(peer_rows, '[]'::jsonb),
    'peer_360_by_relation', COALESCE(peer_by_rel, '[]'::jsonb),
    'can_view_360', can_view_360
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_boom_peer360_oversight_detail(_reviewee_id uuid, _period text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  sections jsonb;
  narratives jsonb;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.boom_peer360_oversight_subject_allowed(me, _reviewee_id)
    OR EXISTS (
      SELECT 1 FROM public.boom_result_discussions d
      WHERE d.form_code = 'peer_360'
        AND d.subject_employee_id = _reviewee_id
        AND d.period = _period
        AND (d.subject_employee_id = me OR d.facilitator_employee_id = me)
    )
  ) THEN
    RETURN '{}'::jsonb;
  END IF;

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
    WHERE r.reviewee_id = _reviewee_id AND r.period = _period AND r.status = 'submitted'
      AND f.code = 'peer_360' AND a.score IS NOT NULL AND NOT a.no_opportunity
    GROUP BY q.section
  ) section_agg;

  SELECT COALESCE(jsonb_agg(peer_block), '[]'::jsonb)
  INTO narratives
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
    WHERE r.reviewee_id = _reviewee_id AND r.period = _period AND r.status = 'submitted'
      AND f.code = 'peer_360'
  ) sub;

  RETURN jsonb_build_object(
    'sections', COALESCE(sections, '[]'::jsonb),
    'peer_feedback', COALESCE(narratives, '[]'::jsonb)
  );
END;
$$;

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

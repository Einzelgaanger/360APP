-- EA quarterly: reviewee dashboard results + oversight completion status on Directory.

-- Reviewee (e.g. Favour) can see submitted manager evaluations for a quarter.
CREATE OR REPLACE FUNCTION public.get_my_ea_quarterly_results(_period text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  submissions jsonb;
  effective_period text;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  effective_period := _period;

  -- If nothing for the requested quarter, fall back to the latest submitted period.
  IF NOT EXISTS (
    SELECT 1
    FROM public.assessment_responses r
    JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'ea_quarterly'
    WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
  ) THEN
    SELECT r.period INTO effective_period
    FROM public.assessment_responses r
    JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'ea_quarterly'
    WHERE r.reviewee_id = me AND r.status = 'submitted'
    ORDER BY r.submitted_at DESC NULLS LAST, r.period DESC
    LIMIT 1;
  END IF;

  IF effective_period IS NULL THEN
    RETURN jsonb_build_object(
      'period', _period,
      'submission_count', 0,
      'submissions', '[]'::jsonb
    );
  END IF;

  SELECT COALESCE(jsonb_agg(sub ORDER BY (sub->>'submitted_at') DESC NULLS LAST), '[]'::jsonb)
  INTO submissions
  FROM (
    SELECT jsonb_build_object(
      'response_id', r.id,
      'reviewer_id', r.reviewer_id,
      'reviewer_name', rev.name,
      'reviewer_role', rev.role,
      'period', r.period,
      'status', r.status,
      'submitted_at', r.submitted_at,
      'avg_score', sec.avg_score,
      'score_pct', sec.score_pct,
      'scored_count', sec.scored_count,
      'sections', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'section', section,
          'avg_score', avg_score,
          'response_count', response_count
        ) ORDER BY section), '[]'::jsonb)
        FROM (
          SELECT
            q.section,
            ROUND(AVG(a.score)::numeric, 2) AS avg_score,
            COUNT(a.score)::int AS response_count
          FROM public.assessment_answers a
          JOIN public.assessment_questions q ON q.id = a.question_id
          WHERE a.response_id = r.id
            AND a.score IS NOT NULL
            AND NOT a.no_opportunity
            AND q.question_type = 'scored'
          GROUP BY q.section
        ) section_agg
      ),
      'answers', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'section', q.section,
          'question', q.question_text,
          'question_type', q.question_type,
          'score', a.score,
          'text_answer', a.text_answer,
          'no_opportunity', a.no_opportunity
        ) ORDER BY q.section_order, q.sort_order), '[]'::jsonb)
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        WHERE a.response_id = r.id
      )
    ) AS sub
    FROM public.assessment_responses r
    JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'ea_quarterly'
    JOIN public.employees rev ON rev.id = r.reviewer_id
    LEFT JOIN LATERAL (
      SELECT
        ROUND(AVG(a.score)::numeric, 2) AS avg_score,
        ROUND((AVG(a.score)::numeric / 5) * 100, 0) AS score_pct,
        COUNT(a.score)::int AS scored_count
      FROM public.assessment_answers a
      JOIN public.assessment_questions q ON q.id = a.question_id
      WHERE a.response_id = r.id
        AND a.score IS NOT NULL
        AND NOT a.no_opportunity
        AND q.question_type = 'scored'
    ) sec ON true
    WHERE r.reviewee_id = me
      AND r.period = effective_period
      AND r.status = 'submitted'
  ) x;

  RETURN jsonb_build_object(
    'period', effective_period,
    'requested_period', _period,
    'submission_count', jsonb_array_length(COALESCE(submissions, '[]'::jsonb)),
    'submissions', COALESCE(submissions, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.get_my_ea_quarterly_results(text) IS
  'Submitted EA quarterly manager evaluations for the logged-in reviewee, with avg score and %.';

GRANT EXECUTE ON FUNCTION public.get_my_ea_quarterly_results(text) TO authenticated;

-- L0/L1: EA quarterly completion roster for the quarter (who is done / by whom).
CREATE OR REPLACE FUNCTION public.get_eo_ea_quarterly_status_roster(_period text)
RETURNS TABLE (
  employee_id uuid,
  employee_name text,
  employee_role text,
  expected_reviewers int,
  submitted_count int,
  draft_count int,
  status text,
  submissions jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  my_level int;
  eo uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN; END IF;
  SELECT hierarchy_level INTO my_level FROM public.employees WHERE id = me;
  IF NOT (public.has_role(auth.uid(), 'admin') OR COALESCE(my_level, 99) <= 1) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH targets AS (
    SELECT DISTINCT e.id, e.name, e.role
    FROM public.employees e
    JOIN public.eo_ea_quarterly_pairs p ON p.reviewee_employee_id = e.id
    WHERE e.subsidiary_id = eo
      AND e.eo_appraisal_active
      AND e.hierarchy_level = 2
      AND (
        public.has_role(auth.uid(), 'admin')
        OR COALESCE(my_level, 99) = 0
        OR COALESCE(my_level, 99) = 1
      )
  ),
  expected AS (
    SELECT t.id AS reviewee_id, COUNT(*)::int AS n
    FROM targets t
    JOIN public.eo_ea_quarterly_pairs p ON p.reviewee_employee_id = t.id
    GROUP BY t.id
  ),
  resp AS (
    SELECT
      r.reviewee_id,
      COUNT(*) FILTER (WHERE r.status = 'submitted')::int AS submitted_n,
      COUNT(*) FILTER (WHERE r.status = 'draft')::int AS draft_n,
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'reviewer_id', r.reviewer_id,
          'reviewer_name', rev.name,
          'status', r.status,
          'submitted_at', r.submitted_at,
          'avg_score', (
            SELECT ROUND(AVG(a.score)::numeric, 2)
            FROM public.assessment_answers a
            JOIN public.assessment_questions q ON q.id = a.question_id
            WHERE a.response_id = r.id
              AND a.score IS NOT NULL AND NOT a.no_opportunity AND q.question_type = 'scored'
          ),
          'score_pct', (
            SELECT ROUND((AVG(a.score)::numeric / 5) * 100, 0)
            FROM public.assessment_answers a
            JOIN public.assessment_questions q ON q.id = a.question_id
            WHERE a.response_id = r.id
              AND a.score IS NOT NULL AND NOT a.no_opportunity AND q.question_type = 'scored'
          )
        ) ORDER BY r.submitted_at DESC NULLS LAST
      ) FILTER (WHERE true), '[]'::jsonb) AS subs
    FROM public.assessment_responses r
    JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'ea_quarterly'
    JOIN public.employees rev ON rev.id = r.reviewer_id
    WHERE r.period = _period
      AND r.reviewee_id IN (SELECT id FROM targets)
    GROUP BY r.reviewee_id
  )
  SELECT
    t.id,
    t.name,
    t.role,
    COALESCE(ex.n, 0),
    COALESCE(rp.submitted_n, 0),
    COALESCE(rp.draft_n, 0),
    CASE
      WHEN COALESCE(rp.submitted_n, 0) >= COALESCE(ex.n, 0) AND COALESCE(ex.n, 0) > 0 THEN 'complete'
      WHEN COALESCE(rp.submitted_n, 0) > 0 THEN 'partial'
      WHEN COALESCE(rp.draft_n, 0) > 0 THEN 'in_progress'
      ELSE 'todo'
    END,
    COALESCE(rp.subs, '[]'::jsonb)
  FROM targets t
  LEFT JOIN expected ex ON ex.reviewee_id = t.id
  LEFT JOIN resp rp ON rp.reviewee_id = t.id
  ORDER BY t.name;
END;
$$;

COMMENT ON FUNCTION public.get_eo_ea_quarterly_status_roster(text) IS
  'L0/L1/admin: EA quarterly completion status per L2 reviewee for a quarter.';

GRANT EXECUTE ON FUNCTION public.get_eo_ea_quarterly_status_roster(text) TO authenticated;

-- Directory insight: include EA quarterly submissions for the selected colleague.
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
  ea_subs jsonb;
  ea_expected int;
  ea_submitted int;
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

  SELECT COUNT(*)::int INTO ea_expected
  FROM public.eo_ea_quarterly_pairs p
  WHERE p.reviewee_employee_id = _employee_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'reviewer_id', r.reviewer_id,
    'reviewer_name', rev.name,
    'status', r.status,
    'submitted_at', r.submitted_at,
    'avg_score', (
      SELECT ROUND(AVG(a.score)::numeric, 2)
      FROM public.assessment_answers a
      JOIN public.assessment_questions q ON q.id = a.question_id
      WHERE a.response_id = r.id
        AND a.score IS NOT NULL AND NOT a.no_opportunity AND q.question_type = 'scored'
    ),
    'score_pct', (
      SELECT ROUND((AVG(a.score)::numeric / 5) * 100, 0)
      FROM public.assessment_answers a
      JOIN public.assessment_questions q ON q.id = a.question_id
      WHERE a.response_id = r.id
        AND a.score IS NOT NULL AND NOT a.no_opportunity AND q.question_type = 'scored'
    )
  ) ORDER BY r.submitted_at DESC NULLS LAST), '[]'::jsonb)
  INTO ea_subs
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'ea_quarterly'
  JOIN public.employees rev ON rev.id = r.reviewer_id
  WHERE r.reviewee_id = _employee_id AND r.period = _period_quarter;

  SELECT COUNT(*)::int INTO ea_submitted
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'ea_quarterly'
  WHERE r.reviewee_id = _employee_id AND r.period = _period_quarter AND r.status = 'submitted';

  RETURN jsonb_build_object(
    'employee_id', _employee_id,
    'name', target.name,
    'hierarchy_level', target.hierarchy_level,
    'monthly_self_status', monthly_status,
    'executive_self_status', exec_status,
    'peer_360_released', COALESCE(released, false),
    'peer_360_sections', COALESCE(peer_rows, '[]'::jsonb),
    'peer_360_by_relation', COALESCE(peer_by_rel, '[]'::jsonb),
    'can_view_360', can_view_360,
    'ea_quarterly_expected', COALESCE(ea_expected, 0),
    'ea_quarterly_submitted', COALESCE(ea_submitted, 0),
    'ea_quarterly_status', CASE
      WHEN COALESCE(ea_expected, 0) > 0 AND COALESCE(ea_submitted, 0) >= ea_expected THEN 'complete'
      WHEN COALESCE(ea_submitted, 0) > 0 THEN 'partial'
      WHEN EXISTS (
        SELECT 1 FROM public.assessment_responses r
        JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'ea_quarterly'
        WHERE r.reviewee_id = _employee_id AND r.period = _period_quarter AND r.status = 'draft'
      ) THEN 'in_progress'
      ELSE 'todo'
    END,
    'ea_quarterly_submissions', COALESCE(ea_subs, '[]'::jsonb)
  );
END;
$$;

-- Also notify every other configured EA line manager (e.g. Uche when Omotola submits Favour).
CREATE OR REPLACE FUNCTION public.boom_route_discussions_for_response(_response_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  subj record;
  bunmi uuid;
  omotola uuid;
  other_mgr uuid;
BEGIN
  SELECT
    ar.id,
    ar.reviewer_id,
    ar.reviewee_id,
    ar.period,
    ar.status,
    f.code AS form_code
  INTO r
  FROM public.assessment_responses ar
  JOIN public.assessment_forms f ON f.id = ar.form_id
  WHERE ar.id = _response_id;

  IF r.id IS NULL OR r.status <> 'submitted' THEN
    RETURN;
  END IF;

  bunmi := public.eo_employee_id_by_email('bunmi.akinyemiju@peopleos.co');
  omotola := public.eo_employee_id_by_email('omotola.akinyemiju@venturegardengroup.com');

  SELECT id, hierarchy_level, manager_id INTO subj
  FROM public.employees
  WHERE id = r.reviewee_id;

  IF subj.id IS NULL THEN
    RETURN;
  END IF;

  IF r.form_code = 'monthly_self' AND r.reviewer_id = r.reviewee_id THEN
    IF subj.hierarchy_level >= 2 THEN
      IF subj.manager_id IS NOT NULL THEN
        PERFORM public.boom_upsert_result_discussion('monthly_self', r.period, subj.id, subj.manager_id, r.id);
      END IF;
      IF bunmi IS NOT NULL THEN
        PERFORM public.boom_upsert_result_discussion('monthly_self', r.period, subj.id, bunmi, r.id);
      END IF;
      IF omotola IS NOT NULL THEN
        PERFORM public.boom_upsert_result_discussion('monthly_self', r.period, subj.id, omotola, r.id);
      END IF;
    ELSIF subj.hierarchy_level = 1 THEN
      IF bunmi IS NOT NULL THEN
        PERFORM public.boom_upsert_result_discussion('monthly_self', r.period, subj.id, bunmi, r.id);
      END IF;
    END IF;
    RETURN;
  END IF;

  IF r.form_code = 'executive' AND r.reviewer_id = r.reviewee_id THEN
    IF bunmi IS NOT NULL THEN
      PERFORM public.boom_upsert_result_discussion('executive', r.period, subj.id, bunmi, r.id);
    END IF;
    RETURN;
  END IF;

  IF r.form_code = 'ea_quarterly' AND r.reviewer_id <> r.reviewee_id THEN
    PERFORM public.boom_upsert_result_discussion('ea_quarterly', r.period, r.reviewee_id, r.reviewer_id, r.id);
    IF bunmi IS NOT NULL AND bunmi <> r.reviewer_id THEN
      PERFORM public.boom_upsert_result_discussion('ea_quarterly', r.period, r.reviewee_id, bunmi, r.id);
    END IF;
    IF omotola IS NOT NULL AND omotola <> r.reviewer_id THEN
      PERFORM public.boom_upsert_result_discussion('ea_quarterly', r.period, r.reviewee_id, omotola, r.id);
    END IF;
    FOR other_mgr IN
      SELECT p.reviewer_employee_id
      FROM public.eo_ea_quarterly_pairs p
      WHERE p.reviewee_employee_id = r.reviewee_id
        AND p.reviewer_employee_id <> r.reviewer_id
        AND (bunmi IS NULL OR p.reviewer_employee_id <> bunmi)
        AND (omotola IS NULL OR p.reviewer_employee_id <> omotola)
    LOOP
      PERFORM public.boom_upsert_result_discussion('ea_quarterly', r.period, r.reviewee_id, other_mgr, r.id);
    END LOOP;
    RETURN;
  END IF;
END;
$$;

-- Backfill EA discussion facilitators for co-managers on already-submitted reviews.
DO $$
DECLARE
  rid uuid;
BEGIN
  FOR rid IN
    SELECT ar.id
    FROM public.assessment_responses ar
    JOIN public.assessment_forms f ON f.id = ar.form_id
    WHERE ar.status = 'submitted'
      AND f.code = 'ea_quarterly'
  LOOP
    PERFORM public.boom_route_discussions_for_response(rid);
  END LOOP;
END $$;

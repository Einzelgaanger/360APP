-- Directory: L1 sees all L2 colleagues; insight dialog must not use pod-only oversight rules.
-- Pod-scoped 360 remains on get_boom_peer360_oversight_* (Discussions roster).

CREATE OR REPLACE FUNCTION public.get_eo_directory_roster()
RETURNS TABLE (
  employee_id uuid,
  name text,
  email text,
  role text,
  department text,
  department_code text,
  manager_name text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  my_level int;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN; END IF;

  SELECT e.hierarchy_level INTO my_level FROM public.employees e WHERE e.id = me;
  IF my_level IS NULL OR my_level > 1 THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN; END IF;
  END IF;

  IF NOT (public.has_role(auth.uid(), 'admin') OR COALESCE(my_level, 99) <= 1) THEN RETURN; END IF;

  RETURN QUERY
  SELECT e.id, e.name, e.email, e.role, e.department, e.department_code, m.name
  FROM public.employees e
  LEFT JOIN public.employees m ON m.id = e.manager_id
  WHERE e.subsidiary_id = '11111111-1111-1111-1111-111111111111'
    AND e.hierarchy_level = 2
    AND e.eo_appraisal_active
  ORDER BY e.department_code, e.name;
END;
$$;

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

  -- 360 in directory: L1 → all L2; L0 → L2 only (not peer L1 leads); self/admin always.
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
      'section', q.section,
      'avg_score', ROUND(AVG(a.score)::numeric, 2),
      'response_count', COUNT(a.score)::int
    )), '[]'::jsonb) INTO peer_rows
    FROM public.assessment_answers a
    JOIN public.assessment_questions q ON q.id = a.question_id
    JOIN public.assessment_responses r ON r.id = a.response_id
    JOIN public.assessment_forms f ON f.id = r.form_id
    WHERE r.reviewee_id = _employee_id AND r.period = _period_quarter AND r.status = 'submitted'
      AND f.code = 'peer_360' AND a.score IS NOT NULL AND NOT a.no_opportunity
    GROUP BY q.section;

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

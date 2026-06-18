-- L2+ team members (below functional leads): only monthly self + full-roster peer 360.
-- L0/L1 keep executive self, EA quarterly, and other forms per existing flags.

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
DECLARE
  me uuid;
  my_level int;
  my_sub uuid;
  my_self_perf boolean;
  eo uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  SELECT e.id, e.hierarchy_level, e.subsidiary_id, e.appraisal_self_performance
  INTO me, my_level, my_sub, my_self_perf
  FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email)
  WHERE p.id = auth.uid()
  LIMIT 1;

  IF me IS NULL THEN RETURN; END IF;

  IF my_sub = eo THEN
    RETURN QUERY
    WITH peer_targets AS (
      SELECT e.id AS rid
      FROM public.employees e
      WHERE e.subsidiary_id = eo
        AND e.eo_appraisal_active
        AND public.boom_peer_360_allowed(me, e.id)
    ),
    targets AS (
      SELECT 'monthly_self'::text AS fc, me AS rid
      UNION ALL
      SELECT 'peer_360', pt.rid FROM peer_targets pt
      UNION ALL
      SELECT 'executive', me
      WHERE my_level < 2 AND COALESCE(my_self_perf, false)
      UNION ALL
      SELECT 'ea_quarterly', e.id
      FROM public.employees e
      WHERE my_level < 2
        AND e.manager_id = me
        AND e.role ILIKE '%EA%'
        AND e.eo_appraisal_active
    ),
    dedup AS (SELECT DISTINCT fc, rid FROM targets)
    SELECT
      f.code, f.title, emp.id, emp.name, emp.role, emp.department, f.anonymous, r.id,
      COALESCE(r.status, 'todo')
    FROM dedup d
    JOIN public.assessment_forms f ON f.code = d.fc
    JOIN public.employees emp ON emp.id = d.rid
    LEFT JOIN public.assessment_responses r
      ON r.form_id = f.id AND r.reviewer_id = me AND r.reviewee_id = emp.id
      AND r.period = (CASE WHEN f.code = 'monthly_self' THEN _period_month ELSE _period_quarter END)
    ORDER BY f.code, emp.name;
    RETURN;
  END IF;

  -- Legacy non-EO subsidiaries: prior dept/manager rules
  RETURN QUERY
  WITH targets AS (
    SELECT 'executive'::text AS assign_code, me AS rid
    WHERE my_level IN (0, 1)
    UNION ALL
    SELECT 'peer_360', e.id FROM public.employees e
    WHERE EXISTS (SELECT 1 FROM public.employees x WHERE x.id = me AND x.manager_id IS NOT NULL AND e.id = x.manager_id)
    UNION ALL
    SELECT 'peer_360', e.id FROM public.employees e
    JOIN public.employees me_e ON me_e.id = me
    WHERE me_e.department IS NOT NULL AND e.department = me_e.department AND e.id <> me AND e.hierarchy_level >= my_level
    UNION ALL
    SELECT 'peer_360', e.id FROM public.employees e WHERE e.manager_id = me
    UNION ALL
    SELECT 'ea_quarterly', e.id FROM public.employees e
    WHERE e.manager_id = me AND e.role ILIKE '%Executive Assistant%'
    UNION ALL
    SELECT 'monthly_self', me
  ),
  dedup AS (SELECT DISTINCT assign_code, rid FROM targets)
  SELECT
    f.code, f.title, e.id, e.name, e.role, e.department, f.anonymous, r.id, COALESCE(r.status, 'todo')
  FROM dedup d
  JOIN public.assessment_forms f ON f.code = d.assign_code
  JOIN public.employees e ON e.id = d.rid
  LEFT JOIN public.assessment_responses r
    ON r.form_id = f.id AND r.reviewer_id = me AND r.reviewee_id = e.id
    AND r.period = (CASE WHEN f.code = 'monthly_self' THEN _period_month ELSE _period_quarter END)
  ORDER BY f.code, e.name;
END;
$$;

COMMENT ON FUNCTION public.get_review_assignments(text, text) IS
  'BOOM task list. EO L2+ team members receive monthly_self + peer_360 only; L0/L1 also get executive/EA per flags.';

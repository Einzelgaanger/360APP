-- get_review_assignments: use profiles.employee_id (same fix as current_employee_id).

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
  eo uuid := '11111111-1111-1111-1111-111111111111';
  exec_form_id uuid;
  bunmi uuid;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN; END IF;

  SELECT e.hierarchy_level, e.subsidiary_id INTO my_level, my_sub
  FROM public.employees e WHERE e.id = me;

  SELECT id INTO exec_form_id FROM public.assessment_forms WHERE code = 'executive' LIMIT 1;
  SELECT id INTO bunmi FROM public.employees WHERE lower(email) = lower('bunmi.akinyemiju@peopleos.co') LIMIT 1;

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
      WHERE public.boom_monthly_self_allowed(me)
      UNION ALL
      SELECT 'peer_360', pt.rid FROM peer_targets pt
      UNION ALL
      SELECT 'executive', me
      WHERE public.boom_executive_self_allowed(me)
      UNION ALL
      SELECT 'ea_quarterly', e.id
      FROM public.eo_ea_quarterly_pairs p
      JOIN public.employees e ON e.id = p.reviewee_employee_id
      WHERE p.reviewer_employee_id = me
        AND p.review_mode = 'standard'
        AND e.eo_appraisal_active
      UNION ALL
      SELECT 'ea_quarterly', e.id
      FROM public.eo_ea_quarterly_pairs p
      JOIN public.employees e ON e.id = p.reviewee_employee_id
      WHERE p.reviewer_employee_id = me
        AND me = bunmi
        AND p.review_mode = 'epa_gceo'
        AND public.boom_bunmi_ea_quarterly_l1(e.id)
        AND e.eo_appraisal_active
      UNION ALL
      SELECT 'epa_gceo_assessor', e.id
      FROM public.eo_ea_quarterly_pairs p
      JOIN public.employees e ON e.id = p.reviewee_employee_id
      WHERE p.reviewer_employee_id = me
        AND p.review_mode = 'epa_gceo'
        AND e.eo_appraisal_active
    ),
    dedup AS (SELECT DISTINCT fc, rid FROM targets)
    SELECT
      f.code,
      CASE WHEN d.fc = 'epa_gceo_assessor' THEN 'Executive Performance Assessment (GCEO assessor)' ELSE f.title END,
      emp.id,
      emp.name,
      emp.role,
      emp.department,
      false,
      COALESCE(ar.id, sr.id),
      CASE
        WHEN d.fc = 'epa_gceo_assessor' THEN
          CASE
            WHEN ar.status = 'submitted' THEN 'submitted'
            WHEN ar.id IS NOT NULL THEN 'draft'
            WHEN sr.status = 'submitted' THEN 'todo'
            WHEN sr.id IS NOT NULL THEN 'waiting_self'
            ELSE 'waiting_self'
          END
        ELSE COALESCE(r.status, 'todo')
      END
    FROM dedup d
    JOIN public.assessment_forms f ON f.code = CASE WHEN d.fc = 'epa_gceo_assessor' THEN 'executive' ELSE d.fc END
    JOIN public.employees emp ON emp.id = d.rid
    LEFT JOIN public.assessment_responses r
      ON r.form_id = f.id AND r.reviewer_id = me AND r.reviewee_id = emp.id
      AND r.period = (CASE WHEN d.fc = 'monthly_self' THEN _period_month ELSE _period_quarter END)
      AND d.fc NOT IN ('epa_gceo_assessor')
    LEFT JOIN public.assessment_responses sr
      ON sr.form_id = exec_form_id AND sr.reviewee_id = emp.id AND sr.reviewer_id = emp.id
      AND sr.period = _period_quarter AND d.fc = 'epa_gceo_assessor'
    LEFT JOIN public.assessment_assessor_reviews ar
      ON ar.self_response_id = sr.id AND ar.assessor_employee_id = me AND d.fc = 'epa_gceo_assessor'
    ORDER BY f.code, emp.name;
    RETURN;
  END IF;

  RETURN QUERY
  WITH targets AS (
    SELECT 'executive'::text AS assign_code, me AS rid
    WHERE public.boom_executive_self_allowed(me)
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
    WHERE public.boom_monthly_self_allowed(me)
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

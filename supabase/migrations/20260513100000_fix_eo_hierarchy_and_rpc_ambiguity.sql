-- 1) Subsidiary-level convention: Executive Office uses lower hierarchy_level = more senior (0 = GCEO).
--    Legacy / other subsidiaries default to higher number = more senior (old app assumption).

ALTER TABLE public.subsidiaries
  ADD COLUMN IF NOT EXISTS hierarchy_lower_is_senior boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.subsidiaries.hierarchy_lower_is_senior IS
  'When true, employees.hierarchy_level: lower value = more senior (EO pilot). When false, higher value = more senior (legacy VGG pools).';

UPDATE public.subsidiaries
SET hierarchy_lower_is_senior = true
WHERE id = '11111111-1111-1111-1111-111111111111'
   OR name = 'Executive Office of the GCEO';

-- 2) Fix PL/pgSQL ambiguity: RETURNS TABLE(form_code ...) creates a variable "form_code" that
--    clashes with CTE column "form_code" (error: column reference "form_code" is ambiguous).

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
    SELECT 'executive'::text AS assign_code, e.id AS rid
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
END $$;

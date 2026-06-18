-- EA quarterly (manager review): explicit line-manager → report pairs for the EO pilot.
-- Only listed managers receive ea_quarterly tasks; reviewees are determined by this matrix.

CREATE TABLE IF NOT EXISTS public.eo_ea_quarterly_pairs (
  reviewer_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewee_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  PRIMARY KEY (reviewer_employee_id, reviewee_employee_id),
  CONSTRAINT eo_ea_quarterly_pairs_no_self CHECK (reviewer_employee_id <> reviewee_employee_id)
);

ALTER TABLE public.eo_ea_quarterly_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read EA quarterly pairs"
  ON public.eo_ea_quarterly_pairs FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.eo_employee_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id
  FROM public.employees e
  WHERE e.subsidiary_id = '11111111-1111-1111-1111-111111111111'
    AND lower(e.email) = lower(trim(_email))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.boom_ea_quarterly_allowed(_reviewer uuid, _reviewee uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.eo_ea_quarterly_pairs p
    WHERE p.reviewer_employee_id = _reviewer
      AND p.reviewee_employee_id = _reviewee
  );
$$;

COMMENT ON FUNCTION public.boom_ea_quarterly_allowed(uuid, uuid) IS
  'True when reviewer is an EO line manager configured to complete ea_quarterly for reviewee.';

-- Replace matrix on re-run (idempotent for pilot updates).
TRUNCATE public.eo_ea_quarterly_pairs;

WITH pairs(reviewer_email, reviewee_email) AS (
  VALUES
    -- Bunmi → L1 leads
    ('bunmi.akinyemiju@peopleos.co', 'uche.ukonu@venturegardengroup.com'),
    ('bunmi.akinyemiju@peopleos.co', 'gisele.karakezi@venturegardengroup.com'),
    ('bunmi.akinyemiju@peopleos.co', 'omotola.akinyemiju@venturegardengroup.com'),
    -- Ayomide → technical reports
    ('adeosun.ayomide@venturegardengroup.com', 'dorathy.akor@venturegardengroup.com'),
    ('adeosun.ayomide@venturegardengroup.com', 'tobi.bankole@venturegardengroup.com'),
    -- Uche
    ('uche.ukonu@venturegardengroup.com', 'chukwuka.monyei@venturegardengroup.com'),
    ('uche.ukonu@venturegardengroup.com', 'melissa.omede@venturegardengroup.com'),
    ('uche.ukonu@venturegardengroup.com', 'baluku.dounnah@venturegardengroup.com'),
    ('uche.ukonu@venturegardengroup.com', 'regina.ottoh-ebhonu@venturegardengroup.com'),
    ('uche.ukonu@venturegardengroup.com', 'favour.oyekanmi@venturegardengroup.com'),
    ('uche.ukonu@venturegardengroup.com', 'ekemudeme.iriyang@venturegardengroup.com'),
    ('uche.ukonu@venturegardengroup.com', 'adeyinka.oshin@venturegardengroup.com'),
    ('uche.ukonu@venturegardengroup.com', 'adeosun.ayomide@venturegardengroup.com'),
    -- Omotola
    ('omotola.akinyemiju@venturegardengroup.com', 'oluwatobiloba.ijamakinwa@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'gideon.abiona@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'brenda.nafula@vgplatform.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'chukwuka.monyei@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'melissa.omede@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'baluku.dounnah@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'regina.ottoh-ebhonu@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'favour.oyekanmi@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'ekemudeme.iriyang@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'adeyinka.oshin@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'dorathy.akor@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'tobi.bankole@venturegardengroup.com'),
    ('omotola.akinyemiju@venturegardengroup.com', 'adeosun.ayomide@venturegardengroup.com'),
    -- Gisele
    ('gisele.karakezi@venturegardengroup.com', 'oluwatobiloba.ijamakinwa@venturegardengroup.com'),
    ('gisele.karakezi@venturegardengroup.com', 'gideon.abiona@venturegardengroup.com'),
    ('gisele.karakezi@venturegardengroup.com', 'brenda.nafula@vgplatform.com')
)
INSERT INTO public.eo_ea_quarterly_pairs (reviewer_employee_id, reviewee_employee_id)
SELECT
  public.eo_employee_id_by_email(p.reviewer_email),
  public.eo_employee_id_by_email(p.reviewee_email)
FROM pairs p
WHERE public.eo_employee_id_by_email(p.reviewer_email) IS NOT NULL
  AND public.eo_employee_id_by_email(p.reviewee_email) IS NOT NULL;

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
      WHERE e.subsidiary_id = eo
        AND e.eo_appraisal_active
        AND public.boom_ea_quarterly_allowed(me, e.id)
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
  'BOOM tasks. EO L2+ get monthly_self + peer_360; line managers also get ea_quarterly per eo_ea_quarterly_pairs.';

GRANT EXECUTE ON FUNCTION public.boom_ea_quarterly_allowed(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eo_employee_id_by_email(text) TO authenticated;

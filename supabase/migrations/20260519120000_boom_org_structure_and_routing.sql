-- BOOM EO org chart: hierarchy, department_code, appraisal flags, comment flow, assignment routing.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS department_code text,
  ADD COLUMN IF NOT EXISTS secondary_manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS eo_appraisal_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS appraisal_self_performance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS appraisal_gives_comments boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS appraisal_receives_comments boolean NOT NULL DEFAULT false;

ALTER TABLE public.assessment_responses
  ADD COLUMN IF NOT EXISTS reviewer_relation text;

COMMENT ON COLUMN public.employees.department_code IS 'EO routing pod: l0, l1_*, general_ops, central_ops, brand_comms, technical';
COMMENT ON COLUMN public.assessment_responses.reviewer_relation IS 'up | down | lateral | self for analytics';

-- ---------- EO pilot roster (subsidiary Executive Office of the GCEO) ----------
DO $$
DECLARE
  eo uuid := '11111111-1111-1111-1111-111111111111';
  bunmi uuid;
  kunmi uuid;
  demola uuid;
  omotola uuid;
  uche uuid;
  gisele uuid;
  deyi uuid;
  ayomide uuid;
BEGIN
  SELECT id INTO bunmi FROM public.employees WHERE lower(email) = lower('bunmi.akinyemiju@peopleos.co') AND subsidiary_id = eo;
  SELECT id INTO kunmi FROM public.employees WHERE lower(email) = lower('kunmi.demuren@peopleos.co') AND subsidiary_id = eo;
  SELECT id INTO omotola FROM public.employees WHERE lower(email) = lower('omotola.akinyemiju@venturegardengroup.com') AND subsidiary_id = eo;
  SELECT id INTO uche FROM public.employees WHERE lower(email) = lower('uche.ukonu@venturegardengroup.com') AND subsidiary_id = eo;
  SELECT id INTO gisele FROM public.employees WHERE lower(email) = lower('gisele.karakezi@venturegardengroup.com') AND subsidiary_id = eo;
  SELECT id INTO deyi FROM public.employees WHERE lower(email) = lower('deyi.dipeolu@venturegardengroup.com') AND subsidiary_id = eo;
  SELECT id INTO ayomide FROM public.employees WHERE lower(email) = lower('adeosun.ayomide@venturegardengroup.com') AND subsidiary_id = eo;

  IF NOT EXISTS (
    SELECT 1 FROM public.employees WHERE subsidiary_id = eo AND lower(email) = lower('demola.idowu@venturegardengroup.com')
  ) THEN
    INSERT INTO public.employees (subsidiary_id, name, email, role, department, department_code, hierarchy_level,
      appraisal_self_performance, appraisal_gives_comments, appraisal_receives_comments, eo_appraisal_active)
    VALUES (eo, 'Demola Idowu', 'demola.idowu@venturegardengroup.com', 'Executive Leadership', 'Executive Office', 'l0',
      0, true, true, false, true);
  END IF;

  SELECT id INTO demola FROM public.employees WHERE lower(email) = lower('demola.idowu@venturegardengroup.com') AND subsidiary_id = eo;

  UPDATE public.employees SET eo_appraisal_active = false
  WHERE subsidiary_id = eo AND lower(email) = lower('oreoluwa.ifia@peopleos.co');

  UPDATE public.employees SET
    hierarchy_level = 0, department_code = 'l0', department = 'Executive Office',
    appraisal_self_performance = true, appraisal_gives_comments = false, appraisal_receives_comments = false,
    manager_id = NULL, secondary_manager_id = NULL, eo_appraisal_active = true
  WHERE id = bunmi;

  UPDATE public.employees SET
    hierarchy_level = 0, department_code = 'l0', department = 'Executive Office',
    appraisal_self_performance = true, appraisal_gives_comments = true, appraisal_receives_comments = false,
    manager_id = bunmi, eo_appraisal_active = true
  WHERE id = kunmi;

  UPDATE public.employees SET
    hierarchy_level = 0, department_code = 'l0', department = 'Executive Office',
    appraisal_self_performance = true, appraisal_gives_comments = true, appraisal_receives_comments = false,
    manager_id = bunmi, eo_appraisal_active = true
  WHERE id = demola;

  UPDATE public.employees SET
    hierarchy_level = 1, department_code = 'l1_omotola', department = 'Executive Office',
    appraisal_self_performance = false, appraisal_gives_comments = false, appraisal_receives_comments = true,
    manager_id = bunmi, secondary_manager_id = NULL, eo_appraisal_active = true
  WHERE id = omotola;

  UPDATE public.employees SET
    hierarchy_level = 1, department_code = 'l1_uche', department = 'Executive Office',
    appraisal_self_performance = true, appraisal_gives_comments = true, appraisal_receives_comments = true,
    manager_id = bunmi, eo_appraisal_active = true
  WHERE id = uche;

  UPDATE public.employees SET
    hierarchy_level = 1, department_code = 'l1_gisele', department = 'Executive Office',
    appraisal_self_performance = true, appraisal_gives_comments = true, appraisal_receives_comments = true,
    manager_id = bunmi, eo_appraisal_active = true
  WHERE id = gisele;

  UPDATE public.employees SET
    hierarchy_level = 1, department_code = 'l1_deyi', department = 'Executive Office',
    appraisal_self_performance = true, appraisal_gives_comments = true, appraisal_receives_comments = true,
    manager_id = bunmi, eo_appraisal_active = true
  WHERE id = deyi;

  UPDATE public.employees e SET
    hierarchy_level = 2,
    manager_id = kunmi,
    department_code = COALESCE(e.department_code, 'top_office'),
    appraisal_receives_comments = true,
    eo_appraisal_active = true
  WHERE subsidiary_id = eo AND lower(email) = lower('eniola.olawale@peopleos.co');

  UPDATE public.employees e SET
    hierarchy_level = 2, department_code = 'general_ops', department = 'Executive Office',
    manager_id = omotola, secondary_manager_id = uche,
    appraisal_receives_comments = true, eo_appraisal_active = true
  WHERE subsidiary_id = eo AND lower(email) IN (
    lower('adeyinka.oshin@venturegardengroup.com'),
    lower('favour.oyekanmi@venturegardengroup.com'),
    lower('adeosun.ayomide@venturegardengroup.com')
  );

  UPDATE public.employees e SET
    hierarchy_level = 2, department_code = 'central_ops',
    manager_id = uche, secondary_manager_id = NULL,
    appraisal_receives_comments = true, eo_appraisal_active = true
  WHERE subsidiary_id = eo AND lower(email) IN (
    lower('regina.ottoh-ebhonu@venturegardengroup.com'),
    lower('melissa.omede@venturegardengroup.com'),
    lower('baluku.dounnah@venturegardengroup.com'),
    lower('chukwuka.monyei@venturegardengroup.com')
  );

  UPDATE public.employees e SET
    hierarchy_level = 2, department_code = 'brand_comms',
    manager_id = gisele, secondary_manager_id = NULL,
    appraisal_receives_comments = true, eo_appraisal_active = true
  WHERE subsidiary_id = eo AND lower(email) IN (
    lower('oluwatobiloba.ijamakinwa@venturegardengroup.com'),
    lower('brenda.nafula@vgplatform.com'),
    lower('gideon.abiona@venturegardengroup.com')
  );

  UPDATE public.employees e SET
    hierarchy_level = 2, department_code = 'technical',
    manager_id = ayomide, secondary_manager_id = NULL,
    appraisal_receives_comments = true, eo_appraisal_active = true
  WHERE subsidiary_id = eo AND lower(email) IN (
    lower('dorathy.akor@venturegardengroup.com'),
    lower('tobi.bankole@venturegardengroup.com')
  );
END $$;

-- Technical reports to Ayomide (override manager for dorathy/tobi)
UPDATE public.employees e SET manager_id = sub.mgr
FROM (
  SELECT id AS mgr FROM public.employees WHERE lower(email) = lower('adeosun.ayomide@venturegardengroup.com')
) sub
WHERE lower(e.email) IN (lower('dorathy.akor@venturegardengroup.com'), lower('tobi.bankole@venturegardengroup.com'));

UPDATE public.employees SET is_epa_assessor = true, is_eo_lead_assessor = true
WHERE lower(email) IN (
  lower('bunmi.akinyemiju@peopleos.co'),
  lower('kunmi.demuren@peopleos.co'),
  lower('demola.idowu@venturegardengroup.com')
);

UPDATE public.employees SET is_epa_assessor = false
WHERE hierarchy_level >= 2 AND subsidiary_id = '11111111-1111-1111-1111-111111111111';

-- ---------- Peer comments (orange → blue) ----------
CREATE TABLE IF NOT EXISTS public.assessment_peer_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewee_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period text NOT NULL,
  comment_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reviewer_employee_id, reviewee_employee_id, period)
);

ALTER TABLE public.assessment_peer_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviewer manages own comments" ON public.assessment_peer_comments;
CREATE POLICY "Reviewer manages own comments" ON public.assessment_peer_comments
  FOR ALL TO authenticated
  USING (reviewer_employee_id = public.current_employee_id())
  WITH CHECK (reviewer_employee_id = public.current_employee_id());

DROP POLICY IF EXISTS "Admin all comments" ON public.assessment_peer_comments;
CREATE POLICY "Admin all comments" ON public.assessment_peer_comments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Receive own comments when submitted" ON public.assessment_peer_comments;
CREATE POLICY "Receive own comments when submitted" ON public.assessment_peer_comments
  FOR SELECT TO authenticated
  USING (
    reviewee_employee_id = public.current_employee_id()
    AND status = 'submitted'
  );

DROP POLICY IF EXISTS "L1 directory read comments on L2" ON public.assessment_peer_comments;
CREATE POLICY "L1 directory read comments on L2" ON public.assessment_peer_comments
  FOR SELECT TO authenticated
  USING (
    status = 'submitted'
    AND EXISTS (
      SELECT 1 FROM public.employees me
      JOIN public.employees ee ON ee.id = reviewee_employee_id
      WHERE me.id = public.current_employee_id()
        AND me.hierarchy_level <= 1
        AND ee.hierarchy_level = 2
        AND me.subsidiary_id = '11111111-1111-1111-1111-111111111111'
    )
  );

-- ---------- L1 → L2 pod visibility for 360 ----------
CREATE OR REPLACE FUNCTION public.boom_l1_can_review_l2(_reviewer_code text, _reviewee_code text)
RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _reviewer_code = 'l1_deyi' THEN _reviewee_code IN ('general_ops', 'central_ops', 'brand_comms', 'technical')
    WHEN _reviewer_code = 'l1_uche' THEN _reviewee_code IN ('general_ops', 'central_ops', 'technical')
    WHEN _reviewer_code = 'l1_gisele' THEN _reviewee_code IN ('general_ops', 'central_ops', 'brand_comms', 'technical')
    WHEN _reviewer_code = 'l1_omotola' THEN _reviewee_code = 'general_ops'
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.boom_peer_360_allowed(
  _reviewer uuid,
  _reviewee uuid
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  eo uuid := '11111111-1111-1111-1111-111111111111';
  r record;
  e record;
BEGIN
  IF _reviewer = _reviewee THEN RETURN false; END IF;

  SELECT id, hierarchy_level, department_code, manager_id, subsidiary_id, eo_appraisal_active
  INTO r FROM public.employees WHERE id = _reviewer;
  SELECT id, hierarchy_level, department_code, manager_id, subsidiary_id, eo_appraisal_active
  INTO e FROM public.employees WHERE id = _reviewee;

  IF r.id IS NULL OR e.id IS NULL THEN RETURN false; END IF;
  IF r.subsidiary_id <> eo OR e.subsidiary_id <> eo THEN RETURN false; END IF;
  IF NOT r.eo_appraisal_active OR NOT e.eo_appraisal_active THEN RETURN false; END IF;

  -- L0 ↔ L0
  IF r.hierarchy_level = 0 AND e.hierarchy_level = 0 THEN RETURN true; END IF;
  -- L0 → L1
  IF r.hierarchy_level = 0 AND e.hierarchy_level = 1 THEN RETURN true; END IF;
  -- L1 → L0
  IF r.hierarchy_level = 1 AND e.hierarchy_level = 0 THEN RETURN true; END IF;
  -- L1 ↔ L1
  IF r.hierarchy_level = 1 AND e.hierarchy_level = 1 THEN RETURN true; END IF;
  -- L1 → L2
  IF r.hierarchy_level = 1 AND e.hierarchy_level = 2 THEN
    RETURN public.boom_l1_can_review_l2(r.department_code, e.department_code);
  END IF;
  -- L2 → L1 (primary manager only)
  IF r.hierarchy_level = 2 AND e.hierarchy_level = 1 AND e.id = r.manager_id THEN RETURN true; END IF;
  -- L2 ↔ L2
  IF r.hierarchy_level = 2 AND e.hierarchy_level = 2 THEN RETURN true; END IF;
  -- L2 → direct reports
  IF r.hierarchy_level = 2 AND e.hierarchy_level = 2 AND e.manager_id = _reviewer THEN RETURN true; END IF;
  -- L2 ↛ L0
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.boom_comment_allowed(_reviewer uuid, _reviewee uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  e record;
BEGIN
  IF _reviewer = _reviewee THEN RETURN false; END IF;
  SELECT appraisal_gives_comments, hierarchy_level, subsidiary_id, eo_appraisal_active INTO r
  FROM public.employees WHERE id = _reviewer;
  SELECT appraisal_receives_comments, hierarchy_level, subsidiary_id, eo_appraisal_active INTO e
  FROM public.employees WHERE id = _reviewee;
  IF NOT COALESCE(r.appraisal_gives_comments, false) OR NOT COALESCE(e.appraisal_receives_comments, false) THEN
    RETURN false;
  END IF;
  IF NOT r.eo_appraisal_active OR NOT e.eo_appraisal_active THEN RETURN false; END IF;
  IF e.hierarchy_level <= r.hierarchy_level THEN RETURN false; END IF;
  IF r.hierarchy_level = 0 THEN RETURN true; END IF;
  IF r.hierarchy_level = 1 AND e.hierarchy_level = 2 THEN
    RETURN public.boom_l1_can_review_l2(
      (SELECT department_code FROM public.employees WHERE id = _reviewer),
      (SELECT department_code FROM public.employees WHERE id = _reviewee)
    );
  END IF;
  RETURN false;
END;
$$;

-- ---------- Assignments (replaces EO routing in get_review_assignments) ----------
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
      SELECT 'executive', me
      WHERE COALESCE(my_self_perf, false)
      UNION ALL
      SELECT 'peer_360', pt.rid FROM peer_targets pt
      UNION ALL
      SELECT 'ea_quarterly', e.id
      FROM public.employees e
      WHERE e.manager_id = me AND e.role ILIKE '%EA%' AND e.eo_appraisal_active
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

-- Comment obligations for orange reviewers
CREATE OR REPLACE FUNCTION public.get_boom_comment_assignments(_period text)
RETURNS TABLE (
  reviewee_id uuid,
  reviewee_name text,
  reviewee_role text,
  reviewee_department text,
  comment_id uuid,
  status text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid;
BEGIN
  SELECT e.id INTO me FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email)
  WHERE p.id = auth.uid() LIMIT 1;
  IF me IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT e.id, e.name, e.role, e.department, c.id, COALESCE(c.status, 'todo')
  FROM public.employees e
  LEFT JOIN public.assessment_peer_comments c
    ON c.reviewee_employee_id = e.id AND c.reviewer_employee_id = me AND c.period = _period
  WHERE public.boom_comment_allowed(me, e.id)
  ORDER BY e.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_boom_comment_assignments(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.boom_peer_360_allowed(uuid, uuid) TO authenticated;

-- EO directory (L0/L1): list L2 team
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
DECLARE me uuid;
  my_level int;
BEGIN
  SELECT e.id, e.hierarchy_level INTO me, my_level FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email) WHERE p.id = auth.uid() LIMIT 1;
  IF me IS NULL OR my_level > 1 THEN RETURN; END IF;
  IF NOT (public.has_role(auth.uid(), 'admin') OR my_level <= 1) THEN RETURN; END IF;

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

GRANT EXECUTE ON FUNCTION public.get_eo_directory_roster() TO authenticated;

-- ---------- Reviewer relation (reviewee perspective: up | down | lateral | self) ----------
CREATE OR REPLACE FUNCTION public.boom_reviewer_relation(
  _reviewer uuid,
  _reviewee uuid
)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  rev_level int;
  revw_level int;
BEGIN
  IF _reviewer = _reviewee THEN RETURN 'self'; END IF;
  SELECT hierarchy_level INTO rev_level FROM public.employees WHERE id = _reviewer;
  SELECT hierarchy_level INTO revw_level FROM public.employees WHERE id = _reviewee;
  IF rev_level IS NULL OR revw_level IS NULL THEN RETURN NULL; END IF;
  IF rev_level < revw_level THEN RETURN 'up'; END IF;
  IF rev_level > revw_level THEN RETURN 'down'; END IF;
  RETURN 'lateral';
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_set_assessment_reviewer_relation()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.reviewer_relation := public.boom_reviewer_relation(NEW.reviewer_id, NEW.reviewee_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_assessment_reviewer_relation ON public.assessment_responses;
CREATE TRIGGER set_assessment_reviewer_relation
  BEFORE INSERT OR UPDATE OF reviewer_id, reviewee_id ON public.assessment_responses
  FOR EACH ROW EXECUTE FUNCTION public.trg_set_assessment_reviewer_relation();

UPDATE public.assessment_responses r
SET reviewer_relation = public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)
WHERE r.reviewer_relation IS NULL;

-- ---------- L0 executive overview (heatmaps + L1 inbound) ----------
CREATE OR REPLACE FUNCTION public.get_eo_executive_overview(_period_quarter text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  my_level int;
  eo uuid := '11111111-1111-1111-1111-111111111111';
  released boolean;
  l1_inbound jsonb;
  l2_peer jsonb;
  l1_rated jsonb;
  l2_receive jsonb;
BEGIN
  SELECT e.id, e.hierarchy_level INTO me, my_level FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email) WHERE p.id = auth.uid() LIMIT 1;
  IF me IS NULL OR NOT (public.has_role(auth.uid(), 'admin') OR my_level = 0) THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT public.peer_360_results_released(_period_quarter) INTO released;

  -- L1 → L0 anonymous inbound (relation down from L1 reviewer to L0 reviewee)
  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'reviewee_name'), '[]'::jsonb) INTO l1_inbound
  FROM (
    SELECT jsonb_build_object(
      'reviewee_id', l0.id,
      'reviewee_name', l0.name,
      'avg_score', ROUND(AVG(a.score)::numeric, 2),
      'response_count', COUNT(DISTINCT r.id)::int
    ) AS row
    FROM public.employees l0
    JOIN public.assessment_responses r ON r.reviewee_id = l0.id AND r.period = _period_quarter AND r.status = 'submitted'
    JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'peer_360'
    JOIN public.employees rev ON rev.id = r.reviewer_id AND rev.hierarchy_level = 1
    JOIN public.assessment_answers a ON a.response_id = r.id AND a.score IS NOT NULL AND NOT a.no_opportunity
    WHERE l0.subsidiary_id = eo AND l0.hierarchy_level = 0 AND l0.eo_appraisal_active
    GROUP BY l0.id, l0.name
    HAVING COUNT(DISTINCT r.id) >= 1
  ) sub;

  -- L2 lateral peer scores received (how peers rate each other)
  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'name'), '[]'::jsonb) INTO l2_peer
  FROM (
    SELECT jsonb_build_object(
      'employee_id', e.id,
      'name', e.name,
      'department_code', e.department_code,
      'avg_score', ROUND(AVG(a.score)::numeric, 2),
      'response_count', COUNT(DISTINCT r.id)::int
    ) AS row
    FROM public.employees e
    JOIN public.assessment_responses r ON r.reviewee_id = e.id AND r.period = _period_quarter AND r.status = 'submitted'
      AND COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'lateral'
    JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'peer_360'
    JOIN public.assessment_answers a ON a.response_id = r.id AND a.score IS NOT NULL AND NOT a.no_opportunity
    WHERE e.subsidiary_id = eo AND e.hierarchy_level = 2 AND e.eo_appraisal_active
    GROUP BY e.id, e.name, e.department_code
  ) sub;

  -- L1 rated by L2 (up) vs L1 (lateral)
  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'name'), '[]'::jsonb) INTO l1_rated
  FROM (
    SELECT jsonb_build_object(
      'employee_id', l1.id,
      'name', l1.name,
      'department_code', l1.department_code,
      'from_l2_avg', ROUND(AVG(a.score) FILTER (
        WHERE COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'up'
      )::numeric, 2),
      'from_l2_count', COUNT(DISTINCT r.id) FILTER (
        WHERE COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'up'
      )::int,
      'from_l1_avg', ROUND(AVG(a.score) FILTER (
        WHERE COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'lateral'
      )::numeric, 2),
      'from_l1_count', COUNT(DISTINCT r.id) FILTER (
        WHERE COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'lateral'
      )::int
    ) AS row
    FROM public.employees l1
    LEFT JOIN public.assessment_responses r ON r.reviewee_id = l1.id AND r.period = _period_quarter AND r.status = 'submitted'
    LEFT JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'peer_360'
    LEFT JOIN public.assessment_answers a ON a.response_id = r.id AND a.score IS NOT NULL AND NOT a.no_opportunity
    WHERE l1.subsidiary_id = eo AND l1.hierarchy_level = 1 AND l1.eo_appraisal_active
    GROUP BY l1.id, l1.name, l1.department_code
  ) sub;

  -- Each L2: scores from L1 (up) vs L2 peers (lateral)
  SELECT COALESCE(jsonb_agg(row ORDER BY row->>'name'), '[]'::jsonb) INTO l2_receive
  FROM (
    SELECT jsonb_build_object(
      'employee_id', e.id,
      'name', e.name,
      'department_code', e.department_code,
      'from_l1_avg', ROUND(AVG(a.score) FILTER (
        WHERE COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'up'
      )::numeric, 2),
      'from_l1_count', COUNT(DISTINCT r.id) FILTER (
        WHERE COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'up'
      )::int,
      'from_l2_avg', ROUND(AVG(a.score) FILTER (
        WHERE COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'lateral'
      )::numeric, 2),
      'from_l2_count', COUNT(DISTINCT r.id) FILTER (
        WHERE COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) = 'lateral'
      )::int
    ) AS row
    FROM public.employees e
    LEFT JOIN public.assessment_responses r ON r.reviewee_id = e.id AND r.period = _period_quarter AND r.status = 'submitted'
    LEFT JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'peer_360'
    LEFT JOIN public.assessment_answers a ON a.response_id = r.id AND a.score IS NOT NULL AND NOT a.no_opportunity
    WHERE e.subsidiary_id = eo AND e.hierarchy_level = 2 AND e.eo_appraisal_active
    GROUP BY e.id, e.name, e.department_code
  ) sub;

  RETURN jsonb_build_object(
    'period', _period_quarter,
    'peer_360_released', COALESCE(released, false),
    'l1_inbound_to_l0', COALESCE(l1_inbound, '[]'::jsonb),
    'l2_peer_scores', COALESCE(l2_peer, '[]'::jsonb),
    'l1_rated_breakdown', COALESCE(l1_rated, '[]'::jsonb),
    'l2_receive_split', COALESCE(l2_receive, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_eo_executive_overview(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.boom_reviewer_relation(uuid, uuid) TO authenticated;

-- Extend employee insight with 360 breakdown by relation
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
BEGIN
  SELECT e.id, e.hierarchy_level INTO me, my_level FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email) WHERE p.id = auth.uid() LIMIT 1;
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  SELECT * INTO target FROM public.employees WHERE id = _employee_id;
  IF target.id IS NULL THEN RETURN '{}'::jsonb; END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR my_level = 0
    OR (my_level = 1 AND target.hierarchy_level = 2)
    OR me = _employee_id
  ) THEN
    RETURN '{}'::jsonb;
  END IF;

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

  IF released OR my_level <= 1 OR public.has_role(auth.uid(), 'admin') THEN
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
    'peer_360_by_relation', COALESCE(peer_by_rel, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_eo_employee_insight(uuid, text, text) TO authenticated;

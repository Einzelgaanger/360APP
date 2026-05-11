-- EPA v2 (routing + HR artefacts): OKR text per executive/period, formal gate record, EA recommendation row,
-- and executive assignments simplified to self-only for L0/L1.
-- GCEO/EO Lead assessor tables + get_epa_assessor_tasks live in 20260518100000_epa_gceo_assessor_addon.sql (non-destructive add-on).

-- ---------- OKR text (EO Lead / admin maintains) ----------
CREATE TABLE IF NOT EXISTS public.executive_period_okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period text NOT NULL,
  slot_index int NOT NULL CHECK (slot_index >= 1 AND slot_index <= 8),
  objective_text text NOT NULL DEFAULT '',
  key_result_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period, slot_index)
);

CREATE INDEX IF NOT EXISTS executive_period_okrs_emp_period_idx
  ON public.executive_period_okrs (employee_id, period);

ALTER TABLE public.executive_period_okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees read own OKR slots"
  ON public.executive_period_okrs FOR SELECT TO authenticated
  USING (
    employee_id = public.current_employee_id()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage OKR slots"
  ON public.executive_period_okrs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- Gate decision (HR / joint record) ----------
CREATE TABLE IF NOT EXISTS public.assessment_gate_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('pass', 'concern', 'improvement_required')),
  rationale text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period)
);

ALTER TABLE public.assessment_gate_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gate decisions"
  ON public.assessment_gate_decisions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Executives read own gate decision"
  ON public.assessment_gate_decisions FOR SELECT TO authenticated
  USING (employee_id = public.current_employee_id());

-- ---------- EA recommendation (parity with paper footer) ----------
CREATE TABLE IF NOT EXISTS public.ea_quarterly_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.assessment_responses(id) ON DELETE CASCADE UNIQUE,
  recommendation text NOT NULL DEFAULT 'none' CHECK (recommendation IN (
    'none', 'promote', 'salary_review', 'spot_bonus', 'confirm_resource', 'growth_coaching', 'pip', 'demotion', 'other'
  )),
  notes text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ea_quarterly_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and admins EA recommendation"
  ON public.ea_quarterly_recommendations FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.assessment_responses r
      WHERE r.id = response_id AND r.reviewer_id = public.current_employee_id()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.assessment_responses r
      WHERE r.id = response_id AND r.reviewer_id = public.current_employee_id()
    )
  );

-- ---------- Routing: executive = self only for L0/L1 ----------
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
    SELECT 'executive'::text AS assign_code, me AS rid
    WHERE my_level IN (0, 1)
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

-- RPC: upsert gate (admin)
CREATE OR REPLACE FUNCTION public.upsert_assessment_gate_decision(
  _employee_id uuid,
  _period text,
  _decision text,
  _rationale text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF length(trim(COALESCE(_rationale, ''))) < 20 THEN
    RAISE EXCEPTION 'rationale_too_short';
  END IF;
  INSERT INTO public.assessment_gate_decisions (employee_id, period, decision, rationale, created_by)
  VALUES (_employee_id, _period, _decision, trim(_rationale), auth.uid())
  ON CONFLICT (employee_id, period) DO UPDATE SET
    decision = EXCLUDED.decision,
    rationale = EXCLUDED.rationale,
    created_by = EXCLUDED.created_by,
    created_at = now();
END $$;

GRANT EXECUTE ON FUNCTION public.upsert_assessment_gate_decision(uuid, text, text, text) TO authenticated;

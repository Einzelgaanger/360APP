-- HR / admin gate: aggregated peer 360 results are hidden from reviewees until a release row exists.

CREATE TABLE public.assessment_period_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.assessment_forms(id) ON DELETE CASCADE,
  period text NOT NULL,
  released_at timestamptz NOT NULL DEFAULT now(),
  released_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  UNIQUE(form_id, period)
);

CREATE INDEX IF NOT EXISTS assessment_period_releases_form_period_idx
  ON public.assessment_period_releases(form_id, period);

ALTER TABLE public.assessment_period_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins select assessment releases" ON public.assessment_period_releases
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert assessment releases" ON public.assessment_period_releases
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete assessment releases" ON public.assessment_period_releases
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.assessment_period_releases IS
  'Aggregate / reviewee-visible results for a form+period are allowed only after HR/admin creates a release row.';

-- Any signed-in user can ask whether a period is released (for UX copy only).
CREATE OR REPLACE FUNCTION public.peer_360_results_released(_period text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assessment_period_releases pr
    JOIN public.assessment_forms f ON f.id = pr.form_id
    WHERE f.code = 'peer_360' AND pr.period = _period
  );
$$;

GRANT EXECUTE ON FUNCTION public.peer_360_results_released(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.release_assessment_period(_form_code text, _period text, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE fid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT id INTO fid FROM public.assessment_forms WHERE code = _form_code LIMIT 1;
  IF fid IS NULL THEN
    RAISE EXCEPTION 'unknown form code: %', _form_code;
  END IF;
  INSERT INTO public.assessment_period_releases (form_id, period, released_by, note)
  VALUES (fid, _period, auth.uid(), _note)
  ON CONFLICT (form_id, period) DO UPDATE SET
    released_at = now(),
    released_by = EXCLUDED.released_by,
    note = COALESCE(EXCLUDED.note, public.assessment_period_releases.note);
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_assessment_period(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.unrelease_assessment_period(_form_code text, _period text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE fid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT id INTO fid FROM public.assessment_forms WHERE code = _form_code LIMIT 1;
  IF fid IS NULL THEN RETURN; END IF;
  DELETE FROM public.assessment_period_releases WHERE form_id = fid AND period = _period;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unrelease_assessment_period(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_360_results(_period text)
RETURNS TABLE (
  question_id uuid,
  question_text text,
  section text,
  avg_score numeric,
  response_count int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE me uuid; cnt int;
BEGIN
  SELECT e.id INTO me FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email)
  WHERE p.id = auth.uid() LIMIT 1;
  IF me IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.assessment_period_releases pr
    JOIN public.assessment_forms f ON f.id = pr.form_id
    WHERE f.code = 'peer_360' AND pr.period = _period
  ) THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO cnt FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted' AND f.code = 'peer_360';
  IF cnt < 3 THEN RETURN; END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.section,
    ROUND(AVG(a.score)::numeric, 2),
    COUNT(a.score)::int
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
    AND f.code = 'peer_360' AND a.score IS NOT NULL AND NOT a.no_opportunity
  GROUP BY q.id, q.question_text, q.section
  ORDER BY q.section;
END;
$$;

COMMENT ON FUNCTION public.get_my_360_results(text) IS
  'Aggregated anonymous 360 scores for the current user; requires HR release for the period plus minimum response count.';

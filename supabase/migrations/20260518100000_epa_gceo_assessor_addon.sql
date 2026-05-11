-- Non-destructive EPA add-on: GCEO / EO Lead dual assessor storage + read paths + task RPC only.
-- Safe to apply on top of an existing BOOM schema without changing get_review_assignments or other routing.
-- Idempotent: DROP POLICY IF EXISTS before CREATE POLICY so re-runs and overlaps with older combined migrations do not fail.

-- ---------- Employee flag ----------
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_epa_assessor boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.employees.is_epa_assessor IS
  'GCEO / EO Lead (or Group HR) — may submit EPA assessor scores on executives'' self assessments.';

UPDATE public.employees SET is_epa_assessor = true
WHERE name IN ('Bunmi Akinyemiju', 'Kunmi Demuren');

-- ---------- Assessor review bundle ----------
CREATE TABLE IF NOT EXISTS public.assessment_assessor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  self_response_id uuid NOT NULL REFERENCES public.assessment_responses(id) ON DELETE CASCADE,
  assessor_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (self_response_id, assessor_employee_id)
);

CREATE TABLE IF NOT EXISTS public.assessment_assessor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessor_review_id uuid NOT NULL REFERENCES public.assessment_assessor_reviews(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessor_review_id, question_id)
);

CREATE INDEX IF NOT EXISTS assessment_assessor_reviews_self_idx
  ON public.assessment_assessor_reviews (self_response_id);

ALTER TABLE public.assessment_assessor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_assessor_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Assessors read own review rows" ON public.assessment_assessor_reviews;
CREATE POLICY "Assessors read own review rows"
  ON public.assessment_assessor_reviews FOR SELECT TO authenticated
  USING (
    assessor_employee_id = public.current_employee_id()
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Assessors insert own reviews" ON public.assessment_assessor_reviews;
CREATE POLICY "Assessors insert own reviews"
  ON public.assessment_assessor_reviews FOR INSERT TO authenticated
  WITH CHECK (
    assessor_employee_id = public.current_employee_id()
    AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = assessor_employee_id AND e.is_epa_assessor)
  );

DROP POLICY IF EXISTS "Assessors update own draft reviews" ON public.assessment_assessor_reviews;
CREATE POLICY "Assessors update own draft reviews"
  ON public.assessment_assessor_reviews FOR UPDATE TO authenticated
  USING (
    assessor_employee_id = public.current_employee_id()
    AND status = 'draft'
  )
  WITH CHECK (
    assessor_employee_id = public.current_employee_id()
  );

DROP POLICY IF EXISTS "Admin all assessor reviews" ON public.assessment_assessor_reviews;
CREATE POLICY "Admin all assessor reviews"
  ON public.assessment_assessor_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Assessors read ratings via review" ON public.assessment_assessor_ratings;
CREATE POLICY "Assessors read ratings via review"
  ON public.assessment_assessor_ratings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_assessor_reviews r
      WHERE r.id = assessor_review_id
        AND (r.assessor_employee_id = public.current_employee_id() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "Assessors write ratings on own draft review" ON public.assessment_assessor_ratings;
CREATE POLICY "Assessors write ratings on own draft review"
  ON public.assessment_assessor_ratings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessment_assessor_reviews r
      WHERE r.id = assessor_review_id
        AND r.assessor_employee_id = public.current_employee_id()
        AND r.status = 'draft'
    )
  );

DROP POLICY IF EXISTS "Assessors update ratings on own draft review" ON public.assessment_assessor_ratings;
CREATE POLICY "Assessors update ratings on own draft review"
  ON public.assessment_assessor_ratings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_assessor_reviews r
      WHERE r.id = assessor_review_id
        AND r.assessor_employee_id = public.current_employee_id()
        AND r.status = 'draft'
    )
  );

DROP POLICY IF EXISTS "Admin all assessor ratings" ON public.assessment_assessor_ratings;
CREATE POLICY "Admin all assessor ratings"
  ON public.assessment_assessor_ratings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Submitted executive self answers/responses readable by EPA assessors (do not use reviewee_id = current_employee() — leaks peer_360).
DROP POLICY IF EXISTS "EPA assessors read executive self answers" ON public.assessment_answers;
CREATE POLICY "EPA assessors read executive self answers"
  ON public.assessment_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessment_responses resp
      JOIN public.assessment_forms af ON af.id = resp.form_id
      JOIN public.employees assessor ON assessor.id = public.current_employee_id()
      WHERE resp.id = assessment_answers.response_id
        AND af.code = 'executive'
        AND resp.reviewer_id = resp.reviewee_id
        AND resp.status = 'submitted'
        AND assessor.is_epa_assessor = true
    )
    OR EXISTS (
      SELECT 1 FROM public.assessment_responses r2
      WHERE r2.id = assessment_answers.response_id
        AND (
          r2.reviewer_id = public.current_employee_id()
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "EPA assessors read executive self responses" ON public.assessment_responses;
CREATE POLICY "EPA assessors read executive self responses"
  ON public.assessment_responses FOR SELECT TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.assessment_forms f
        WHERE f.id = form_id AND f.code = 'executive'
      )
      AND reviewer_id = reviewee_id
      AND status = 'submitted'
      AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = public.current_employee_id() AND e.is_epa_assessor)
    )
    OR reviewer_id = public.current_employee_id()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.get_epa_assessor_tasks(_period text)
RETURNS TABLE (
  reviewee_id uuid,
  reviewee_name text,
  reviewee_role text,
  self_response_id uuid,
  assessor_review_id uuid,
  assessor_status text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid; am_assessor boolean;
BEGIN
  SELECT e.id, COALESCE(e.is_epa_assessor, false)
  INTO me, am_assessor
  FROM public.employees e
  JOIN public.profiles p ON lower(p.email) = lower(e.email)
  WHERE p.id = auth.uid()
  LIMIT 1;
  IF me IS NULL OR NOT am_assessor THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.role,
    sr.id,
    ar.id,
    COALESCE(ar.status, 'todo')
  FROM public.assessment_responses sr
  JOIN public.assessment_forms f ON f.id = sr.form_id AND f.code = 'executive'
  JOIN public.employees e ON e.id = sr.reviewee_id
  LEFT JOIN public.assessment_assessor_reviews ar
    ON ar.self_response_id = sr.id AND ar.assessor_employee_id = me
  WHERE sr.reviewer_id = sr.reviewee_id
    AND sr.period = _period
    AND sr.status = 'submitted'
    AND sr.reviewee_id <> me
    AND (
      e.hierarchy_level = 1
      OR (e.hierarchy_level = 0 AND e.id <> me)
    )
  ORDER BY e.name;
END $$;

GRANT EXECUTE ON FUNCTION public.get_epa_assessor_tasks(text) TO authenticated;

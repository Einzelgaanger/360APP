-- Resolve employee identity from profiles.employee_id first (corporate email migration left
-- stale @peopleos.co addresses on profiles while employee_id remained correct).

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.employee_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.employee_id IS NOT NULL
    ),
    (
      SELECT e.id
      FROM public.employees e
      JOIN public.profiles p ON lower(p.email) = lower(e.email)
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  );
$$;

COMMENT ON FUNCTION public.current_employee_id() IS
  'Logged-in user employee row: prefers profiles.employee_id, falls back to email match.';

-- Comments tab used a duplicate email-only lookup.
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
  me := public.current_employee_id();
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

-- 360 results RPC duplicated the same email-only join.
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
DECLARE
  me uuid;
  cnt int;
  min_peers int := 1;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::int INTO cnt
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me
    AND r.period = _period
    AND r.status = 'submitted'
    AND f.code = 'peer_360';

  IF cnt < min_peers THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.question_text,
    q.section,
    ROUND(AVG(a.score)::numeric, 2),
    COUNT(a.score)::int
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me
    AND r.period = _period
    AND r.status = 'submitted'
    AND f.code = 'peer_360'
    AND a.score IS NOT NULL
    AND NOT a.no_opportunity
  GROUP BY q.id, q.question_text, q.section
  ORDER BY q.section;
END;
$$;

-- Align profile display emails with employees where employee_id is linked.
UPDATE public.profiles p
SET email = lower(e.email)
FROM public.employees e
WHERE p.employee_id = e.id
  AND e.email IS NOT NULL
  AND lower(coalesce(p.email, '')) <> lower(e.email);

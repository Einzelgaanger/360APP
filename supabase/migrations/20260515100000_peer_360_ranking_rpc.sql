-- Leaderboard data: peer_360 responses are RLS-scoped to reviewer/admin, but org rankings
-- need aggregate scores (same openness as legacy survey_responses SELECT for authenticated).

CREATE OR REPLACE FUNCTION public.list_peer_360_ranking_detail()
RETURNS TABLE (
  reviewee_id uuid,
  response_id uuid,
  score int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.reviewee_id, r.id, a.score
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id
  JOIN public.assessment_answers a ON a.response_id = r.id
  WHERE f.code = 'peer_360'
    AND r.status = 'submitted'
    AND a.score IS NOT NULL
    AND NOT a.no_opportunity;
$$;

GRANT EXECUTE ON FUNCTION public.list_peer_360_ranking_detail() TO authenticated;

COMMENT ON FUNCTION public.list_peer_360_ranking_detail IS
  'Likert scores from submitted BOOM peer_360 reviews for org leaderboard; mirrors legacy survey visibility for authenticated users.';

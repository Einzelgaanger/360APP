-- Peer 360: keep recipient (subject) views fully anonymous — no facilitator identity,
-- no per-peer answer blocks. Facilitators/admins keep oversight detail.

CREATE OR REPLACE FUNCTION public.get_boom_discussion_inbox(
  _period_quarter text DEFAULT NULL,
  _period_month text DEFAULT NULL
)
RETURNS TABLE (
  discussion_id uuid,
  form_code text,
  period text,
  subject_id uuid,
  subject_name text,
  facilitator_id uuid,
  facilitator_name text,
  source_response_id uuid,
  message_count bigint,
  last_message_at timestamptz,
  viewer_role text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.form_code,
    d.period,
    d.subject_employee_id,
    subj.name,
    CASE
      WHEN d.form_code = 'peer_360' AND d.subject_employee_id = me THEN NULL
      ELSE d.facilitator_employee_id
    END,
    CASE
      WHEN d.form_code = 'peer_360' AND d.subject_employee_id = me THEN 'Anonymous 360 feedback'
      ELSE fac.name
    END,
    d.source_response_id,
    COUNT(m.id),
    MAX(m.created_at),
    CASE
      WHEN d.subject_employee_id = me THEN 'subject'
      ELSE 'facilitator'
    END
  FROM public.boom_result_discussions d
  JOIN public.employees subj ON subj.id = d.subject_employee_id
  JOIN public.employees fac ON fac.id = d.facilitator_employee_id
  LEFT JOIN public.boom_discussion_messages m ON m.discussion_id = d.id
  WHERE (d.subject_employee_id = me OR d.facilitator_employee_id = me)
    AND (
      (d.form_code = 'monthly_self' AND (_period_month IS NULL OR d.period = _period_month))
      OR (d.form_code <> 'monthly_self' AND (_period_quarter IS NULL OR d.period = _period_quarter))
    )
  GROUP BY d.id, subj.name, fac.name
  ORDER BY MAX(m.created_at) DESC NULLS LAST, d.updated_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_boom_discussion_thread(_discussion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  d record;
  msgs jsonb;
  payload jsonb;
  is_subject boolean;
  is_facilitator boolean;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  SELECT * INTO d
  FROM public.boom_result_discussions
  WHERE id = _discussion_id;

  IF d.id IS NULL THEN RETURN '{}'::jsonb; END IF;
  IF NOT public.boom_discussion_participant(d.id, me) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN '{}'::jsonb;
  END IF;

  is_subject := d.subject_employee_id = me;
  is_facilitator := d.facilitator_employee_id = me OR public.has_role(auth.uid(), 'admin');

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'author_id', CASE
      WHEN d.form_code = 'peer_360' AND is_subject AND m.author_employee_id <> me
        THEN NULL
      ELSE m.author_employee_id
    END,
    'author_name', CASE
      WHEN d.form_code = 'peer_360' AND is_subject AND m.author_employee_id <> me
        THEN 'Leadership'
      ELSE e.name
    END,
    'body', m.body,
    'created_at', m.created_at,
    'is_me', m.author_employee_id = me
  ) ORDER BY m.created_at), '[]'::jsonb)
  INTO msgs
  FROM public.boom_discussion_messages m
  JOIN public.employees e ON e.id = m.author_employee_id
  WHERE m.discussion_id = d.id;

  IF d.form_code = 'peer_360' THEN
    IF is_facilitator AND NOT is_subject THEN
      -- Manager/admin oversight: section averages + anonymised Peer 1/2/… blocks
      payload := public.get_boom_peer360_oversight_detail(d.subject_employee_id, d.period);
    ELSIF is_subject THEN
      -- Recipient: aggregate dashboard only (never per-reviewer identity or blocks)
      payload := public.get_my_360_dashboard(d.period);
      -- Strip any accidental peer_feedback key if present
      payload := payload - 'peer_feedback';
    ELSE
      payload := jsonb_build_object(
        'subject_view', true,
        'message', 'Anonymous peer 360 feedback for this thread is only visible to participants.'
      );
    END IF;
  ELSIF d.source_response_id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'section', q.section,
      'question', q.question_text,
      'question_type', q.question_type,
      'score', a.score,
      'text_answer', a.text_answer,
      'no_opportunity', a.no_opportunity
    ) ORDER BY q.section_order, q.sort_order), '[]'::jsonb)
    INTO payload
    FROM public.assessment_answers a
    JOIN public.assessment_questions q ON q.id = a.question_id
    WHERE a.response_id = d.source_response_id;
  ELSE
    payload := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'discussion_id', d.id,
    'form_code', d.form_code,
    'period', d.period,
    'subject_id', d.subject_employee_id,
    'subject_name', (SELECT name FROM public.employees WHERE id = d.subject_employee_id),
    -- Hide facilitator identity from peer_360 recipients (they are not the peer reviewers)
    'facilitator_id', CASE WHEN d.form_code = 'peer_360' AND is_subject THEN NULL ELSE d.facilitator_employee_id END,
    'facilitator_name', CASE
      WHEN d.form_code = 'peer_360' AND is_subject THEN 'Leadership'
      ELSE (SELECT name FROM public.employees WHERE id = d.facilitator_employee_id)
    END,
    'source_response_id', d.source_response_id,
    'viewer_role', CASE WHEN is_subject THEN 'subject' ELSE 'facilitator' END,
    'results', payload,
    'messages', msgs,
    'anonymous_peer_360', d.form_code = 'peer_360'
  );
END;
$$;

COMMENT ON FUNCTION public.get_boom_discussion_thread(uuid) IS
  'Discussion thread. Peer 360 recipients only see anonymous aggregates; facilitators see Peer 1/2 labels without names.';

-- Subjects must never receive per-peer answer blocks (even via direct RPC call).
CREATE OR REPLACE FUNCTION public.get_boom_peer360_oversight_detail(_reviewee_id uuid, _period text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  sections jsonb;
  narratives jsonb;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  -- Recipients of the 360 never get oversight detail about themselves.
  IF me = _reviewee_id THEN
    RETURN '{}'::jsonb;
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR public.boom_peer360_oversight_subject_allowed(me, _reviewee_id)
    OR EXISTS (
      SELECT 1 FROM public.boom_result_discussions d
      WHERE d.form_code = 'peer_360'
        AND d.subject_employee_id = _reviewee_id
        AND d.period = _period
        AND d.facilitator_employee_id = me
    )
  ) THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'section', q.section,
    'avg_score', ROUND(AVG(a.score)::numeric, 2),
    'response_count', COUNT(a.score)::int
  )), '[]'::jsonb)
  INTO sections
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = _reviewee_id AND r.period = _period AND r.status = 'submitted'
    AND f.code = 'peer_360' AND a.score IS NOT NULL AND NOT a.no_opportunity
  GROUP BY q.section;

  SELECT COALESCE(jsonb_agg(peer_block), '[]'::jsonb)
  INTO narratives
  FROM (
    SELECT jsonb_build_object(
      'peer_label', 'Peer ' || row_number() OVER (ORDER BY r.submitted_at NULLS LAST, r.id),
      'answers', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'section', q.section,
          'question', q.question_text,
          'score', a.score,
          'text_answer', a.text_answer
        ) ORDER BY q.section_order, q.sort_order), '[]'::jsonb)
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        WHERE a.response_id = r.id
      )
    ) AS peer_block
    FROM public.assessment_responses r
    JOIN public.assessment_forms f ON f.id = r.form_id
    WHERE r.reviewee_id = _reviewee_id AND r.period = _period AND r.status = 'submitted'
      AND f.code = 'peer_360'
  ) sub;

  RETURN jsonb_build_object(
    'sections', COALESCE(sections, '[]'::jsonb),
    'peer_feedback', COALESCE(narratives, '[]'::jsonb)
  );
END;
$$;

-- Recipients must only read comment text, never reviewer_employee_id, via this helper (optional UI use).
CREATE OR REPLACE FUNCTION public.get_my_anonymous_peer_comments(_period text)
RETURNS TABLE (comment_text text, submitted_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.comment_text, c.submitted_at
  FROM public.assessment_peer_comments c
  WHERE c.reviewee_employee_id = public.current_employee_id()
    AND c.status = 'submitted'
    AND c.period = _period
  ORDER BY c.submitted_at NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_anonymous_peer_comments(text) TO authenticated;

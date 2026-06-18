-- BOOM result discussions: route submitted assessments to facilitators and enable threaded chat
-- with the subject (assessment owner). Covers monthly_self, executive, ea_quarterly, peer_360.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.boom_result_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_code text NOT NULL CHECK (form_code IN ('monthly_self', 'executive', 'ea_quarterly', 'peer_360')),
  period text NOT NULL,
  subject_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  facilitator_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  source_response_id uuid REFERENCES public.assessment_responses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT boom_result_discussions_no_self_facilitator CHECK (subject_employee_id <> facilitator_employee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS boom_result_discussions_unique_with_response_idx
  ON public.boom_result_discussions (form_code, period, subject_employee_id, facilitator_employee_id, source_response_id)
  WHERE source_response_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS boom_result_discussions_unique_peer360_idx
  ON public.boom_result_discussions (form_code, period, subject_employee_id, facilitator_employee_id)
  WHERE source_response_id IS NULL;

CREATE INDEX IF NOT EXISTS boom_result_discussions_subject_idx
  ON public.boom_result_discussions(subject_employee_id, period);
CREATE INDEX IF NOT EXISTS boom_result_discussions_facilitator_idx
  ON public.boom_result_discussions(facilitator_employee_id, period);

CREATE TABLE IF NOT EXISTS public.boom_discussion_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES public.boom_result_discussions(id) ON DELETE CASCADE,
  author_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS boom_discussion_messages_discussion_idx
  ON public.boom_discussion_messages(discussion_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.boom_is_oversight_viewer(_employee uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = _employee
      AND lower(e.email) IN (
        lower('bunmi.akinyemiju@peopleos.co'),
        lower('omotola.akinyemiju@venturegardengroup.com')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.boom_discussion_participant(_discussion uuid, _employee uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.boom_result_discussions d
    WHERE d.id = _discussion
      AND (_employee = d.subject_employee_id OR _employee = d.facilitator_employee_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.boom_upsert_result_discussion(
  _form_code text,
  _period text,
  _subject uuid,
  _facilitator uuid,
  _source_response uuid
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  did uuid;
BEGIN
  IF _subject IS NULL OR _facilitator IS NULL OR _subject = _facilitator THEN
    RETURN NULL;
  END IF;

  SELECT d.id INTO did
  FROM public.boom_result_discussions d
  WHERE d.form_code = _form_code
    AND d.period = _period
    AND d.subject_employee_id = _subject
    AND d.facilitator_employee_id = _facilitator
    AND (
      (_source_response IS NULL AND d.source_response_id IS NULL)
      OR d.source_response_id = _source_response
    )
  LIMIT 1;

  IF did IS NOT NULL THEN
    UPDATE public.boom_result_discussions SET updated_at = now() WHERE id = did;
    RETURN did;
  END IF;

  INSERT INTO public.boom_result_discussions (
    form_code, period, subject_employee_id, facilitator_employee_id, source_response_id
  )
  VALUES (_form_code, _period, _subject, _facilitator, _source_response)
  RETURNING id INTO did;

  RETURN did;
END;
$$;

CREATE OR REPLACE FUNCTION public.boom_route_discussions_for_response(_response_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  subj record;
  bunmi uuid;
  omotola uuid;
BEGIN
  SELECT
    ar.id,
    ar.reviewer_id,
    ar.reviewee_id,
    ar.period,
    ar.status,
    f.code AS form_code
  INTO r
  FROM public.assessment_responses ar
  JOIN public.assessment_forms f ON f.id = ar.form_id
  WHERE ar.id = _response_id;

  IF r.id IS NULL OR r.status <> 'submitted' THEN
    RETURN;
  END IF;

  bunmi := public.eo_employee_id_by_email('bunmi.akinyemiju@peopleos.co');
  omotola := public.eo_employee_id_by_email('omotola.akinyemiju@venturegardengroup.com');

  SELECT id, hierarchy_level, manager_id INTO subj
  FROM public.employees
  WHERE id = r.reviewee_id;

  IF subj.id IS NULL THEN
    RETURN;
  END IF;

  -- Monthly self: L2+ → line manager + Bunmi + Omotola; L1 → Bunmi only
  IF r.form_code = 'monthly_self' AND r.reviewer_id = r.reviewee_id THEN
    IF subj.hierarchy_level >= 2 THEN
      IF subj.manager_id IS NOT NULL THEN
        PERFORM public.boom_upsert_result_discussion('monthly_self', r.period, subj.id, subj.manager_id, r.id);
      END IF;
      IF bunmi IS NOT NULL THEN
        PERFORM public.boom_upsert_result_discussion('monthly_self', r.period, subj.id, bunmi, r.id);
      END IF;
      IF omotola IS NOT NULL THEN
        PERFORM public.boom_upsert_result_discussion('monthly_self', r.period, subj.id, omotola, r.id);
      END IF;
    ELSIF subj.hierarchy_level = 1 THEN
      IF bunmi IS NOT NULL THEN
        PERFORM public.boom_upsert_result_discussion('monthly_self', r.period, subj.id, bunmi, r.id);
      END IF;
    END IF;
    RETURN;
  END IF;

  -- Executive self (L1 leads): Bunmi only
  IF r.form_code = 'executive' AND r.reviewer_id = r.reviewee_id THEN
    IF bunmi IS NOT NULL THEN
      PERFORM public.boom_upsert_result_discussion('executive', r.period, subj.id, bunmi, r.id);
    END IF;
    RETURN;
  END IF;

  -- EA quarterly manager review: subject = reviewee; facilitators = reviewer + Bunmi + Omotola
  IF r.form_code = 'ea_quarterly' AND r.reviewer_id <> r.reviewee_id THEN
    PERFORM public.boom_upsert_result_discussion('ea_quarterly', r.period, r.reviewee_id, r.reviewer_id, r.id);
    IF bunmi IS NOT NULL AND bunmi <> r.reviewer_id THEN
      PERFORM public.boom_upsert_result_discussion('ea_quarterly', r.period, r.reviewee_id, bunmi, r.id);
    END IF;
    IF omotola IS NOT NULL AND omotola <> r.reviewer_id THEN
      PERFORM public.boom_upsert_result_discussion('ea_quarterly', r.period, r.reviewee_id, omotola, r.id);
    END IF;
    RETURN;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_boom_route_discussions_on_submit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.boom_route_discussions_for_response(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_boom_route_discussions_on_submit ON public.assessment_responses;
CREATE TRIGGER trg_boom_route_discussions_on_submit
  AFTER INSERT OR UPDATE OF status ON public.assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_boom_route_discussions_on_submit();

-- Backfill threads for already-submitted responses
DO $$
DECLARE
  rid uuid;
BEGIN
  FOR rid IN
    SELECT ar.id
    FROM public.assessment_responses ar
    JOIN public.assessment_forms f ON f.id = ar.form_id
    WHERE ar.status = 'submitted'
      AND f.code IN ('monthly_self', 'executive', 'ea_quarterly')
  LOOP
    PERFORM public.boom_route_discussions_for_response(rid);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.boom_result_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boom_discussion_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read discussions"
  ON public.boom_result_discussions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR subject_employee_id = public.current_employee_id()
    OR facilitator_employee_id = public.current_employee_id()
  );

CREATE POLICY "Oversight insert peer 360 discussions"
  ON public.boom_result_discussions FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      form_code = 'peer_360'
      AND public.boom_is_oversight_viewer(facilitator_employee_id)
      AND facilitator_employee_id = public.current_employee_id()
    )
  );

CREATE POLICY "Participants read messages"
  ON public.boom_discussion_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.boom_discussion_participant(discussion_id, public.current_employee_id())
  );

CREATE POLICY "Participants post messages"
  ON public.boom_discussion_messages FOR INSERT TO authenticated
  WITH CHECK (
    author_employee_id = public.current_employee_id()
    AND public.boom_discussion_participant(discussion_id, public.current_employee_id())
  );

-- ---------------------------------------------------------------------------
-- Inbox + thread RPCs
-- ---------------------------------------------------------------------------

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
    d.facilitator_employee_id,
    fac.name,
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

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'author_id', m.author_employee_id,
    'author_name', e.name,
    'body', m.body,
    'created_at', m.created_at,
    'is_me', m.author_employee_id = me
  ) ORDER BY m.created_at), '[]'::jsonb)
  INTO msgs
  FROM public.boom_discussion_messages m
  JOIN public.employees e ON e.id = m.author_employee_id
  WHERE m.discussion_id = d.id;

  IF d.form_code = 'peer_360' THEN
    IF d.facilitator_employee_id = me OR public.has_role(auth.uid(), 'admin') THEN
      payload := public.get_boom_peer360_oversight_detail(d.subject_employee_id, d.period);
    ELSE
      payload := jsonb_build_object(
        'subject_view', true,
        'message', 'Leadership is discussing your 360 peer feedback with you here. Aggregated scores are released to you separately after HR review.'
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
    'facilitator_id', d.facilitator_employee_id,
    'facilitator_name', (SELECT name FROM public.employees WHERE id = d.facilitator_employee_id),
    'source_response_id', d.source_response_id,
    'viewer_role', CASE WHEN d.subject_employee_id = me THEN 'subject' ELSE 'facilitator' END,
    'results', payload,
    'messages', msgs
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.post_boom_discussion_message(_discussion_id uuid, _body text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  mid uuid;
  trimmed text;
BEGIN
  me := public.current_employee_id();
  trimmed := trim(_body);
  IF me IS NULL OR trimmed = '' THEN
    RAISE EXCEPTION 'invalid message' USING ERRCODE = '22023';
  END IF;
  IF NOT public.boom_discussion_participant(_discussion_id, me) AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.boom_discussion_messages (discussion_id, author_employee_id, body)
  VALUES (_discussion_id, me, trimmed)
  RETURNING id INTO mid;

  UPDATE public.boom_result_discussions SET updated_at = now() WHERE id = _discussion_id;

  RETURN mid;
END;
$$;

-- ---------------------------------------------------------------------------
-- Peer 360 oversight (Bunmi + Omotola)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_boom_peer360_oversight_roster(_period text)
RETURNS TABLE (
  employee_id uuid,
  employee_name text,
  employee_role text,
  peer_response_count int,
  discussion_id uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  eo uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  me := public.current_employee_id();
  IF me IS NULL OR NOT public.boom_is_oversight_viewer(me) THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.role,
    (
      SELECT COUNT(*)::int
      FROM public.assessment_responses r
      JOIN public.assessment_forms f ON f.id = r.form_id
      WHERE r.reviewee_id = e.id AND r.period = _period AND r.status = 'submitted' AND f.code = 'peer_360'
    ),
    d.id
  FROM public.employees e
  LEFT JOIN public.boom_result_discussions d
    ON d.subject_employee_id = e.id
    AND d.facilitator_employee_id = me
    AND d.form_code = 'peer_360'
    AND d.period = _period
    AND d.source_response_id IS NULL
  WHERE e.subsidiary_id = eo AND e.eo_appraisal_active AND e.id <> me
  ORDER BY e.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.open_boom_peer360_discussion(_subject_id uuid, _period text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  did uuid;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL OR NOT public.boom_is_oversight_viewer(me) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  did := public.boom_upsert_result_discussion('peer_360', _period, _subject_id, me, NULL);
  RETURN did;
END;
$$;

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

  IF NOT (
    public.boom_is_oversight_viewer(me)
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.boom_result_discussions d
      WHERE d.form_code = 'peer_360'
        AND d.subject_employee_id = _reviewee_id
        AND d.period = _period
        AND (d.subject_employee_id = me OR d.facilitator_employee_id = me)
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

GRANT EXECUTE ON FUNCTION public.boom_is_oversight_viewer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_boom_discussion_inbox(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_boom_discussion_thread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_boom_discussion_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_boom_peer360_oversight_roster(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_boom_peer360_discussion(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_boom_peer360_oversight_detail(uuid, text) TO authenticated;

COMMENT ON TABLE public.boom_result_discussions IS
  'One discussion thread per facilitator↔subject per submitted assessment (or peer 360 oversight).';

-- BOOM discussion email notifications + richer anonymous 360 dashboard for employees.

-- ---------------------------------------------------------------------------
-- Email helpers (uses existing pgmq transactional_emails queue)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.boom_employee_login_email(_employee uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (
      SELECT lower(p.email)
      FROM public.profiles p
      JOIN public.employees e ON lower(p.email) = lower(e.email)
      WHERE e.id = _employee
      LIMIT 1
    ),
    (SELECT lower(email) FROM public.employees WHERE id = _employee)
  );
$$;

CREATE OR REPLACE FUNCTION public.boom_form_email_label(_form_code text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _form_code
    WHEN 'monthly_self' THEN 'Monthly self-assessment'
    WHEN 'executive' THEN 'Executive performance assessment'
    WHEN 'ea_quarterly' THEN 'EA quarterly evaluation'
    WHEN 'peer_360' THEN '360 Peer review'
    ELSE 'BOOM assessment'
  END;
$$;

CREATE OR REPLACE FUNCTION public.boom_queue_transactional_email(
  _to_employee uuid,
  _subject_line text,
  _html_body text,
  _template text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recip text;
  mid text;
BEGIN
  recip := public.boom_employee_login_email(_to_employee);
  IF recip IS NULL OR recip = '' THEN
    RETURN;
  END IF;

  mid := 'boom-' || _template || '-' || replace(gen_random_uuid()::text, '-', '');

  PERFORM public.enqueue_email(
    'transactional_emails',
    jsonb_build_object(
      'to', recip,
      'subject', _subject_line,
      'html', _html_body,
      'label', _template,
      'template_name', _template,
      'message_id', mid,
      'queued_at', to_jsonb(now()),
      'metadata', _metadata
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'boom_queue_transactional_email failed for %: %', _to_employee, SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.boom_notify_discussion_created(_discussion_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d record;
  subj_name text;
  fac_name text;
  form_label text;
  hub_url text := 'https://appraisal.vgg.app/hub?tab=survey&boomTab=discussions';
  fac_html text;
  subj_html text;
BEGIN
  SELECT * INTO d FROM public.boom_result_discussions WHERE id = _discussion_id;
  IF d.id IS NULL THEN RETURN; END IF;

  SELECT name INTO subj_name FROM public.employees WHERE id = d.subject_employee_id;
  SELECT name INTO fac_name FROM public.employees WHERE id = d.facilitator_employee_id;
  form_label := public.boom_form_email_label(d.form_code);

  fac_html := format(
    '<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#1a1a1a">
      <h2 style="margin:0 0 12px">BOOM results ready for discussion</h2>
      <p><strong>%s</strong> submitted their <strong>%s</strong> for <strong>%s</strong>.</p>
      <p>Open the discussion to review their responses and chat with them (results stay in the thread).</p>
      <p style="margin:24px 0"><a href="%s" style="background:#0070f3;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">Open discussion</a></p>
      <p style="color:#666;font-size:13px">VGG Appraisal · Executive Office BOOM</p>
    </body></html>',
    subj_name, form_label, d.period, hub_url
  );

  subj_html := format(
    '<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#1a1a1a">
      <h2 style="margin:0 0 12px">Discussion opened on your BOOM results</h2>
      <p><strong>%s</strong> can now discuss your <strong>%s</strong> (<strong>%s</strong>) with you.</p>
      <p>Join the conversation in the BOOM hub — each leader has a separate thread with you.</p>
      <p style="margin:24px 0"><a href="%s" style="background:#0070f3;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">Open my discussions</a></p>
      <p style="color:#666;font-size:13px">Peer 360 scores on your dashboard are always anonymous aggregates.</p>
    </body></html>',
    fac_name, form_label, d.period, hub_url
  );

  PERFORM public.boom_queue_transactional_email(
    d.facilitator_employee_id,
    format('BOOM: %s — %s ready to discuss', subj_name, form_label),
    fac_html,
    'boom_discussion_facilitator',
    jsonb_build_object('discussion_id', d.id, 'form_code', d.form_code, 'period', d.period)
  );

  PERFORM public.boom_queue_transactional_email(
    d.subject_employee_id,
    format('BOOM: Discussion with %s on your %s', fac_name, form_label),
    subj_html,
    'boom_discussion_subject',
    jsonb_build_object('discussion_id', d.id, 'form_code', d.form_code, 'period', d.period)
  );
END;
$$;

-- Notify after each discussion thread is created/updated
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
  is_new boolean := false;
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

  is_new := true;

  IF is_new AND did IS NOT NULL THEN
    PERFORM public.boom_notify_discussion_created(did);
  END IF;

  RETURN did;
END;
$$;

-- ---------------------------------------------------------------------------
-- Anonymous 360 dashboard bundle (scores + narrative themes)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_360_dashboard(_period text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  released boolean;
  peer_cnt int;
  min_peers int := 3;
  sections jsonb;
  narratives jsonb;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  released := public.peer_360_results_released(_period);

  SELECT COUNT(*)::int INTO peer_cnt
  FROM public.assessment_responses r
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted' AND f.code = 'peer_360';

  IF NOT released THEN
    RETURN jsonb_build_object(
      'released', false,
      'peer_count', peer_cnt,
      'min_peers_required', min_peers,
      'sections', '[]'::jsonb,
      'start_doing', '[]'::jsonb,
      'stop_doing', '[]'::jsonb,
      'continue_doing', '[]'::jsonb,
      'themes', '[]'::jsonb
    );
  END IF;

  IF peer_cnt < min_peers THEN
    RETURN jsonb_build_object(
      'released', true,
      'peer_count', peer_cnt,
      'min_peers_required', min_peers,
      'sections', '[]'::jsonb,
      'start_doing', '[]'::jsonb,
      'stop_doing', '[]'::jsonb,
      'continue_doing', '[]'::jsonb,
      'themes', '[]'::jsonb
    );
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'section', q.section,
    'avg_score', ROUND(AVG(a.score)::numeric, 2),
    'response_count', COUNT(a.score)::int
  ) ORDER BY q.section), '[]'::jsonb)
  INTO sections
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
    AND f.code = 'peer_360' AND a.score IS NOT NULL AND NOT a.no_opportunity
  GROUP BY q.section;

  -- Anonymous written peer feedback (no reviewer identity)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('text', trim(a.text_answer)) ORDER BY r.submitted_at NULLS LAST), '[]'::jsonb)
  INTO narratives
  FROM public.assessment_answers a
  JOIN public.assessment_questions q ON q.id = a.question_id
  JOIN public.assessment_responses r ON r.id = a.response_id
  JOIN public.assessment_forms f ON f.id = r.form_id
  WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
    AND f.code = 'peer_360'
    AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> '';

  RETURN jsonb_build_object(
    'released', true,
    'peer_count', peer_cnt,
    'min_peers_required', min_peers,
    'sections', COALESCE(sections, '[]'::jsonb),
    'start_doing', (
      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
          AND f.code = 'peer_360' AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%start%'
      ) s
    ),
    'stop_doing', (
      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
          AND f.code = 'peer_360' AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%stop%'
      ) s
    ),
    'continue_doing', (
      SELECT COALESCE(jsonb_agg(x ORDER BY ord), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('text', trim(a.text_answer), 'direction', 'peer') AS x,
               row_number() OVER (ORDER BY r.submitted_at NULLS LAST) AS ord
        FROM public.assessment_answers a
        JOIN public.assessment_questions q ON q.id = a.question_id
        JOIN public.assessment_responses r ON r.id = a.response_id
        JOIN public.assessment_forms f ON f.id = r.form_id
        WHERE r.reviewee_id = me AND r.period = _period AND r.status = 'submitted'
          AND f.code = 'peer_360' AND a.text_answer IS NOT NULL AND trim(a.text_answer) <> ''
          AND lower(q.question_text) LIKE '%continue%'
      ) s
    ),
    'themes', COALESCE(narratives, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_360_dashboard(text) TO authenticated;

COMMENT ON FUNCTION public.get_my_360_dashboard(text) IS
  'Anonymous peer 360 dashboard: section averages + narrative buckets after HR release and minimum peer count.';

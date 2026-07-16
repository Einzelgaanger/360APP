-- In-app + email notifications when an assessment is submitted.
-- Recipients: reviewee for peer_360 (anonymous) and ea_quarterly; facilitators for self forms.

CREATE TABLE IF NOT EXISTS public.boom_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  form_code text NOT NULL,
  period text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text NOT NULL DEFAULT '/hub?tab=survey&boomTab=discussions',
  source_response_id uuid REFERENCES public.assessment_responses(id) ON DELETE SET NULL,
  actor_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  email_queued boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT boom_notifications_event_type_chk CHECK (
    event_type IN (
      'peer_360_received',
      'ea_quarterly_received',
      'monthly_self_submitted',
      'executive_submitted',
      'assessment_submitted'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS boom_notifications_dedupe_idx
  ON public.boom_notifications (recipient_employee_id, source_response_id, event_type)
  WHERE source_response_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS boom_notifications_recipient_created_idx
  ON public.boom_notifications (recipient_employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS boom_notifications_recipient_unread_idx
  ON public.boom_notifications (recipient_employee_id)
  WHERE read_at IS NULL;

ALTER TABLE public.boom_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recipients read own boom notifications" ON public.boom_notifications;
CREATE POLICY "Recipients read own boom notifications"
  ON public.boom_notifications FOR SELECT TO authenticated
  USING (recipient_employee_id = public.current_employee_id());

DROP POLICY IF EXISTS "Recipients update own boom notifications" ON public.boom_notifications;
CREATE POLICY "Recipients update own boom notifications"
  ON public.boom_notifications FOR UPDATE TO authenticated
  USING (recipient_employee_id = public.current_employee_id())
  WITH CHECK (recipient_employee_id = public.current_employee_id());

GRANT SELECT, UPDATE ON public.boom_notifications TO authenticated;
GRANT ALL ON public.boom_notifications TO service_role;

-- ---------------------------------------------------------------------------
-- Insert helper (deduped) + optional email
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.boom_create_notification(
  _recipient uuid,
  _event_type text,
  _form_code text,
  _period text,
  _title text,
  _body text,
  _href text,
  _source_response uuid,
  _actor uuid,
  _send_email boolean,
  _email_subject text,
  _email_html text,
  _email_template text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  nid uuid;
BEGIN
  IF _recipient IS NULL THEN
    RETURN NULL;
  END IF;
  IF _actor IS NOT NULL AND _recipient = _actor AND _event_type IN ('peer_360_received', 'ea_quarterly_received') THEN
    RETURN NULL;
  END IF;

  IF _source_response IS NOT NULL THEN
    SELECT n.id INTO nid
    FROM public.boom_notifications n
    WHERE n.recipient_employee_id = _recipient
      AND n.source_response_id = _source_response
      AND n.event_type = _event_type
    LIMIT 1;
    IF nid IS NOT NULL THEN
      RETURN NULL;
    END IF;
  END IF;

  INSERT INTO public.boom_notifications (
    recipient_employee_id, event_type, form_code, period, title, body, href,
    source_response_id, actor_employee_id, email_queued
  )
  VALUES (
    _recipient, _event_type, _form_code, _period, _title, _body, COALESCE(_href, '/hub?tab=survey'),
    _source_response, _actor, false
  )
  RETURNING id INTO nid;

  IF nid IS NULL THEN
    RETURN NULL;
  END IF;

  IF _send_email AND _email_subject IS NOT NULL AND _email_html IS NOT NULL THEN
    PERFORM public.boom_queue_transactional_email(
      _recipient,
      _email_subject,
      _email_html,
      COALESCE(_email_template, 'boom_assessment_notify'),
      jsonb_build_object(
        'notification_id', nid,
        'form_code', _form_code,
        'period', _period,
        'event_type', _event_type,
        'response_id', _source_response
      )
    );
    UPDATE public.boom_notifications SET email_queued = true WHERE id = nid;
  END IF;

  RETURN nid;
END;
$$;

-- ---------------------------------------------------------------------------
-- Main: notify on assessment submit
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.boom_notify_assessment_submitted(_response_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  reviewee_name text;
  reviewer_name text;
  form_label text;
  hub_discuss text := 'https://appraisal.vgg.app/hub?tab=survey&boomTab=discussions';
  hub_360 text := 'https://appraisal.vgg.app/hub?tab=dashboard';
  hub_app text := 'https://appraisal.vgg.app/hub?tab=survey';
  title text;
  body text;
  email_subj text;
  email_html text;
  fac uuid;
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

  SELECT name INTO reviewee_name FROM public.employees WHERE id = r.reviewee_id;
  SELECT name INTO reviewer_name FROM public.employees WHERE id = r.reviewer_id;
  form_label := public.boom_form_email_label(r.form_code);
  bunmi := public.eo_employee_id_by_email('bunmi.akinyemiju@peopleos.co');
  omotola := public.eo_employee_id_by_email('omotola.akinyemiju@venturegardengroup.com');

  -- Peer 360: notify reviewee only, anonymously (never name the reviewer).
  IF r.form_code = 'peer_360' AND r.reviewer_id <> r.reviewee_id THEN
    title := 'New anonymous 360 feedback';
    body := format(
      'A colleague submitted 360 peer feedback about you for %s. Your dashboard updates with anonymous aggregates only — reviewers are never named.',
      r.period
    );
    email_subj := format('BOOM: New anonymous 360 feedback (%s)', r.period);
    email_html := format(
      '<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#1a1a1a">
        <h2 style="margin:0 0 12px">New anonymous 360 feedback</h2>
        <p>Hi %s,</p>
        <p>A colleague has submitted <strong>360 peer feedback</strong> about you for <strong>%s</strong>.</p>
        <p>Your My Dashboard and 360 results update with <strong>anonymous aggregated scores and themes only</strong>. Individual reviewers are never shown.</p>
        <p style="margin:24px 0"><a href="%s" style="background:#0b3d2e;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">View my dashboard</a></p>
        <p style="color:#666;font-size:13px">VGG Appraisal · Executive Office</p>
      </body></html>',
      COALESCE(split_part(reviewee_name, ' ', 1), 'there'), r.period, hub_360
    );
    PERFORM public.boom_create_notification(
      r.reviewee_id, 'peer_360_received', r.form_code, r.period,
      title, body, '/hub?tab=dashboard',
      r.id, NULL, -- actor omitted so UI never leaks reviewer
      true, email_subj, email_html, 'boom_peer360_received'
    );
    RETURN;
  END IF;

  -- EA quarterly: notify the reviewee (manager name is OK — not anonymous).
  IF r.form_code = 'ea_quarterly' AND r.reviewer_id <> r.reviewee_id THEN
    title := 'EA quarterly evaluation completed';
    body := format(
      '%s submitted your EA quarterly evaluation for %s. Open Discussions to review the results.',
      COALESCE(reviewer_name, 'Your manager'), r.period
    );
    email_subj := format('BOOM: Your EA quarterly evaluation is ready (%s)', r.period);
    email_html := format(
      '<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px;margin:24px auto;padding:24px;color:#1a1a1a">
        <h2 style="margin:0 0 12px">Your EA quarterly evaluation is ready</h2>
        <p>Hi %s,</p>
        <p><strong>%s</strong> has submitted your <strong>EA quarterly evaluation</strong> for <strong>%s</strong>.</p>
        <p>Open Discussions in the Appraisal hub to view the scores and start a conversation.</p>
        <p style="margin:24px 0"><a href="%s" style="background:#0b3d2e;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">Open discussions</a></p>
        <p style="color:#666;font-size:13px">VGG Appraisal · Executive Office</p>
      </body></html>',
      COALESCE(split_part(reviewee_name, ' ', 1), 'there'),
      COALESCE(reviewer_name, 'Your manager'), r.period, hub_discuss
    );
    PERFORM public.boom_create_notification(
      r.reviewee_id, 'ea_quarterly_received', r.form_code, r.period,
      title, body, '/hub?tab=survey&boomTab=discussions',
      r.id, r.reviewer_id,
      true, email_subj, email_html, 'boom_ea_quarterly_received'
    );
    RETURN;
  END IF;

  -- Monthly self: notify line manager + Bunmi/Omotola (in-app; email already sent via discussion create).
  IF r.form_code = 'monthly_self' AND r.reviewer_id = r.reviewee_id THEN
    title := format('%s submitted monthly self-assessment', COALESCE(reviewee_name, 'A colleague'));
    body := format('Monthly self-assessment for %s is ready to discuss.', r.period);
    FOR fac IN
      SELECT DISTINCT x FROM unnest(ARRAY[
        (SELECT manager_id FROM public.employees WHERE id = r.reviewee_id),
        bunmi,
        omotola
      ]) AS t(x)
      WHERE x IS NOT NULL AND x <> r.reviewee_id
    LOOP
      -- L1 monthly only goes to Bunmi (match discussion routing roughly for L2+)
      IF (SELECT hierarchy_level FROM public.employees WHERE id = r.reviewee_id) = 1 AND fac <> bunmi THEN
        CONTINUE;
      END IF;
      PERFORM public.boom_create_notification(
        fac, 'monthly_self_submitted', r.form_code, r.period,
        title, body, '/hub?tab=survey&boomTab=discussions',
        r.id, r.reviewee_id,
        false, NULL, NULL, NULL
      );
    END LOOP;
    RETURN;
  END IF;

  -- Executive self: notify Bunmi in-app.
  IF r.form_code = 'executive' AND r.reviewer_id = r.reviewee_id THEN
    IF bunmi IS NOT NULL AND bunmi <> r.reviewee_id THEN
      title := format('%s submitted executive self-assessment', COALESCE(reviewee_name, 'A colleague'));
      body := format('Executive performance self-assessment for %s is ready.', r.period);
      PERFORM public.boom_create_notification(
        bunmi, 'executive_submitted', r.form_code, r.period,
        title, body, '/hub?tab=survey&boomTab=discussions',
        r.id, r.reviewee_id,
        false, NULL, NULL, NULL
      );
    END IF;
    RETURN;
  END IF;
END;
$$;

-- Hook into existing submit trigger
CREATE OR REPLACE FUNCTION public.tg_boom_route_discussions_on_submit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.boom_route_discussions_for_response(NEW.id);
    PERFORM public.boom_notify_assessment_submitted(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPCs for the hub UI
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_boom_notifications(_limit int DEFAULT 30)
RETURNS TABLE (
  id uuid,
  event_type text,
  form_code text,
  period text,
  title text,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz,
  is_unread boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    n.id,
    n.event_type,
    n.form_code,
    n.period,
    n.title,
    n.body,
    n.href,
    n.read_at,
    n.created_at,
    (n.read_at IS NULL) AS is_unread
  FROM public.boom_notifications n
  WHERE n.recipient_employee_id = public.current_employee_id()
  ORDER BY n.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 30), 100));
$$;

CREATE OR REPLACE FUNCTION public.get_my_boom_notification_unread_count()
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::int
  FROM public.boom_notifications n
  WHERE n.recipient_employee_id = public.current_employee_id()
    AND n.read_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.mark_boom_notification_read(_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.boom_notifications
  SET read_at = COALESCE(read_at, now())
  WHERE id = _notification_id
    AND recipient_employee_id = public.current_employee_id();
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_boom_notifications_read()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n int;
BEGIN
  UPDATE public.boom_notifications
  SET read_at = now()
  WHERE recipient_employee_id = public.current_employee_id()
    AND read_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.boom_create_notification(uuid, text, text, text, text, text, text, uuid, uuid, boolean, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.boom_notify_assessment_submitted(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_boom_notifications(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_boom_notification_unread_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_boom_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_boom_notifications_read() TO authenticated;

COMMENT ON TABLE public.boom_notifications IS
  'In-app notifications for assessment submissions; peer_360 never stores reviewer as actor for recipient rows.';

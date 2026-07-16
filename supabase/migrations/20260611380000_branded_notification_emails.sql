-- Brand transactional BOOM emails to match auth welcome/invite templates
-- (cream paper, VGG green accent, logo, professional footer).

CREATE OR REPLACE FUNCTION public.boom_branded_email_html(
  _eyebrow text,
  _heading text,
  _body_html text,
  _cta_label text,
  _cta_url text,
  _footer_note text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  logo text := 'https://appraisal.vgg.app/vgg-logo.webp';
  year text := to_char(CURRENT_DATE, 'YYYY');
  footer text;
BEGIN
  footer := COALESCE(
    _footer_note,
    'If you were not expecting this message, you may safely ignore it.'
  );

  RETURN format(
$html$<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f7f3eb;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f7f3eb;">
    <tr>
      <td align="center" style="padding:28px 16px 40px;">
        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
          <tr>
            <td style="padding:0 0 18px;border-bottom:1px solid #cfd8d2;margin:0 0 16px;">
              <img src="%s" alt="Venture Garden Group" width="140" style="display:block;border:0;outline:none;margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:4px;padding:34px 28px;border:1px solid #cfd8d2;border-top:6px solid #2e6f20;">
              <p style="font-size:10px;font-weight:700;color:#2e6f20;margin:0 0 12px;text-transform:uppercase;letter-spacing:2px;">%s</p>
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;color:#10211a;margin:0 0 18px;line-height:1.15;letter-spacing:0;">%s</h1>
              <div style="font-size:15px;color:#4a5f55;line-height:1.7;margin:0 0 26px;">%s</div>
              <table role="presentation" width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 28px;">
                    <a href="%s" style="background-color:#2e6f20;color:#fbf8f1;font-size:13px;font-weight:700;border-radius:4px;padding:14px 28px;text-decoration:none;display:inline-block;text-transform:uppercase;letter-spacing:1.4px;">%s</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:10px;color:#6f7f77;text-align:center;margin:0 0 8px;letter-spacing:1.6px;text-transform:uppercase;">— or copy this link into your browser —</p>
              <p style="font-size:11px;color:#2e6f20;word-break:break-all;margin:0;text-align:center;">%s</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0;">
              <hr style="border:none;border-top:1px solid #cfd8d2;margin:0 0 14px;" />
              <p style="font-size:12px;color:#6f7f77;text-align:left;margin:0 0 8px;line-height:1.5;">%s</p>
              <p style="font-size:11px;color:#8c9993;text-align:left;margin:0;text-transform:uppercase;letter-spacing:1.2px;">© %s Venture Garden Group. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>$html$,
    logo,
    COALESCE(_eyebrow, 'VGG 360° Appraisal'),
    COALESCE(_heading, 'Update'),
    COALESCE(_body_html, ''),
    COALESCE(_cta_url, 'https://appraisal.vgg.app/hub'),
    COALESCE(_cta_label, 'Open appraisal'),
    COALESCE(_cta_url, 'https://appraisal.vgg.app/hub'),
    footer,
    year
  );
END;
$$;

COMMENT ON FUNCTION public.boom_branded_email_html(text, text, text, text, text, text) IS
  'HTML wrapper matching VGG auth email branding for transactional BOOM notifications.';

-- Re-apply assessment submit notifications with branded HTML
CREATE OR REPLACE FUNCTION public.boom_notify_assessment_submitted(_response_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  reviewee_name text;
  reviewer_name text;
  first_name text;
  hub_discuss text := 'https://appraisal.vgg.app/hub?tab=survey&boomTab=discussions';
  hub_360 text := 'https://appraisal.vgg.app/hub?tab=dashboard';
  title text;
  body text;
  email_subj text;
  email_html text;
  body_inner text;
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
  first_name := COALESCE(NULLIF(split_part(COALESCE(reviewee_name, ''), ' ', 1), ''), 'there');
  bunmi := public.eo_employee_id_by_email('bunmi.akinyemiju@peopleos.co');
  omotola := public.eo_employee_id_by_email('omotola.akinyemiju@venturegardengroup.com');

  IF r.form_code = 'peer_360' AND r.reviewer_id <> r.reviewee_id THEN
    title := 'New anonymous 360 feedback';
    body := format(
      'A colleague submitted 360 peer feedback about you for %s. Your dashboard updates with anonymous aggregates only — reviewers are never named.',
      r.period
    );
    email_subj := format('VGG 360° Appraisal · New anonymous 360 feedback (%s)', r.period);
    body_inner := format(
      '<p style="margin:0 0 14px;">Hi %s,</p>
       <p style="margin:0 0 14px;">A colleague has submitted <strong>360 peer feedback</strong> about you for <strong>%s</strong>.</p>
       <p style="margin:0;">Your My Dashboard and 360 results update with <strong>anonymous aggregated scores and themes only</strong>. Individual reviewers are never shown.</p>',
      first_name, r.period
    );
    email_html := public.boom_branded_email_html(
      'VGG 360° Appraisal / Peer 360',
      'New anonymous 360 feedback',
      body_inner,
      'View my dashboard',
      hub_360,
      'Peer reviewers stay anonymous. This message does not identify who submitted.'
    );
    PERFORM public.boom_create_notification(
      r.reviewee_id, 'peer_360_received', r.form_code, r.period,
      title, body, '/hub?tab=dashboard',
      r.id, NULL,
      true, email_subj, email_html, 'boom_peer360_received'
    );
    RETURN;
  END IF;

  IF r.form_code = 'ea_quarterly' AND r.reviewer_id <> r.reviewee_id THEN
    title := 'EA quarterly evaluation completed';
    body := format(
      '%s submitted your EA quarterly evaluation for %s. Open Discussions to review the results.',
      COALESCE(reviewer_name, 'Your manager'), r.period
    );
    email_subj := format('VGG 360° Appraisal · Your EA quarterly evaluation is ready (%s)', r.period);
    body_inner := format(
      '<p style="margin:0 0 14px;">Hi %s,</p>
       <p style="margin:0 0 14px;"><strong>%s</strong> has submitted your <strong>EA quarterly evaluation</strong> for <strong>%s</strong>.</p>
       <p style="margin:0;">Open Discussions in the Appraisal hub to view the scores and start a conversation.</p>',
      first_name, COALESCE(reviewer_name, 'Your manager'), r.period
    );
    email_html := public.boom_branded_email_html(
      'VGG 360° Appraisal / EA Quarterly',
      'Your EA quarterly evaluation is ready',
      body_inner,
      'Open discussions',
      hub_discuss,
      'You are receiving this because an evaluation about you was submitted in the Executive Office appraisal workspace.'
    );
    PERFORM public.boom_create_notification(
      r.reviewee_id, 'ea_quarterly_received', r.form_code, r.period,
      title, body, '/hub?tab=survey&boomTab=discussions',
      r.id, r.reviewer_id,
      true, email_subj, email_html, 'boom_ea_quarterly_received'
    );
    RETURN;
  END IF;

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

-- Brand discussion-created emails the same way
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
  fac_body text;
  subj_body text;
BEGIN
  SELECT * INTO d FROM public.boom_result_discussions WHERE id = _discussion_id;
  IF d.id IS NULL THEN RETURN; END IF;

  SELECT name INTO subj_name FROM public.employees WHERE id = d.subject_employee_id;
  SELECT name INTO fac_name FROM public.employees WHERE id = d.facilitator_employee_id;
  form_label := public.boom_form_email_label(d.form_code);

  -- Peer 360: never name the facilitator as if they filled the 360 for the subject email.
  IF d.form_code = 'peer_360' THEN
    fac_body := format(
      '<p style="margin:0 0 14px;">Anonymous peer 360 results for <strong>%s</strong> (%s) are ready to discuss.</p>
       <p style="margin:0;">Open the discussion to review aggregated feedback. Peer reviewers remain unnamed.</p>',
      subj_name, d.period
    );
    fac_html := public.boom_branded_email_html(
      'VGG 360° Appraisal / Discussion',
      '360 results ready for discussion',
      fac_body,
      'Open discussion',
      hub_url,
      'You are receiving this as a discussion facilitator in the Executive Office appraisal workspace.'
    );
    subj_body := format(
      '<p style="margin:0 0 14px;">A discussion thread is open on your <strong>anonymous 360 feedback</strong> for <strong>%s</strong>.</p>
       <p style="margin:0;">Join the conversation in the Appraisal hub. Peer reviewers are never named on your results.</p>',
      d.period
    );
    subj_html := public.boom_branded_email_html(
      'VGG 360° Appraisal / Discussion',
      'Discussion opened on your 360 results',
      subj_body,
      'Open my discussions',
      hub_url,
      'Peer 360 scores on your dashboard are always anonymous aggregates.'
    );
    PERFORM public.boom_queue_transactional_email(
      d.facilitator_employee_id,
      format('VGG 360° Appraisal · 360 discussion — %s (%s)', subj_name, d.period),
      fac_html,
      'boom_discussion_facilitator',
      jsonb_build_object('discussion_id', d.id, 'form_code', d.form_code, 'period', d.period)
    );
    PERFORM public.boom_queue_transactional_email(
      d.subject_employee_id,
      format('VGG 360° Appraisal · Discussion on your anonymous 360 (%s)', d.period),
      subj_html,
      'boom_discussion_subject',
      jsonb_build_object('discussion_id', d.id, 'form_code', d.form_code, 'period', d.period)
    );
    RETURN;
  END IF;

  fac_body := format(
    '<p style="margin:0 0 14px;"><strong>%s</strong> submitted their <strong>%s</strong> for <strong>%s</strong>.</p>
     <p style="margin:0;">Open the discussion to review their responses and chat with them.</p>',
    subj_name, form_label, d.period
  );
  fac_html := public.boom_branded_email_html(
    'VGG 360° Appraisal / Discussion',
    'Results ready for discussion',
    fac_body,
    'Open discussion',
    hub_url,
    'You are receiving this as a discussion facilitator in the Executive Office appraisal workspace.'
  );

  subj_body := format(
    '<p style="margin:0 0 14px;"><strong>%s</strong> can now discuss your <strong>%s</strong> (<strong>%s</strong>) with you.</p>
     <p style="margin:0;">Join the conversation in the Appraisal hub — each leader has a separate thread with you.</p>',
    fac_name, form_label, d.period
  );
  subj_html := public.boom_branded_email_html(
    'VGG 360° Appraisal / Discussion',
    'Discussion opened on your results',
    subj_body,
    'Open my discussions',
    hub_url,
    'You are receiving this because a discussion was opened on your submitted assessment.'
  );

  PERFORM public.boom_queue_transactional_email(
    d.facilitator_employee_id,
    format('VGG 360° Appraisal · %s — %s ready to discuss', subj_name, form_label),
    fac_html,
    'boom_discussion_facilitator',
    jsonb_build_object('discussion_id', d.id, 'form_code', d.form_code, 'period', d.period)
  );

  PERFORM public.boom_queue_transactional_email(
    d.subject_employee_id,
    format('VGG 360° Appraisal · Discussion with %s on your %s', fac_name, form_label),
    subj_html,
    'boom_discussion_subject',
    jsonb_build_object('discussion_id', d.id, 'form_code', d.form_code, 'period', d.period)
  );
END;
$$;

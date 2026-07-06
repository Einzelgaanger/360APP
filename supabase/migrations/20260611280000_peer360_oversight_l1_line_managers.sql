-- Peer 360 oversight visibility:
--   L0 (Bunmi): L2 team only — not L1 leads (Uche, Gisele, Omotola, Deyi).
--   L1 (Uche, Gisele, Omotola, Deyi): L2 in their pod(s), incl. reviews from Bunmi/Omotola above.

CREATE OR REPLACE FUNCTION public.boom_peer360_oversight_subject_allowed(_viewer uuid, _subject uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v record;
  s record;
  eo uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  IF _viewer IS NULL OR _subject IS NULL OR _viewer = _subject THEN
    RETURN false;
  END IF;

  SELECT id, hierarchy_level, department_code, subsidiary_id, eo_appraisal_active
  INTO v
  FROM public.employees
  WHERE id = _viewer;

  SELECT id, hierarchy_level, department_code, manager_id, secondary_manager_id, subsidiary_id, eo_appraisal_active
  INTO s
  FROM public.employees
  WHERE id = _subject;

  IF v.id IS NULL OR s.id IS NULL THEN RETURN false; END IF;
  IF v.subsidiary_id <> eo OR s.subsidiary_id <> eo THEN RETURN false; END IF;
  IF NOT COALESCE(v.eo_appraisal_active, false) OR NOT COALESCE(s.eo_appraisal_active, false) THEN RETURN false; END IF;

  -- Executive (L0): anonymous 360 about L2 only — not peer L1 leads.
  IF v.hierarchy_level = 0 THEN
    RETURN s.hierarchy_level = 2;
  END IF;

  -- L1 line leads: their pod L2 (direct/secondary manager or department routing).
  IF v.hierarchy_level = 1 THEN
    IF s.hierarchy_level <> 2 THEN RETURN false; END IF;
    IF s.manager_id = _viewer OR s.secondary_manager_id = _viewer THEN RETURN true; END IF;
    RETURN public.boom_l1_can_review_l2(v.department_code, s.department_code);
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.boom_peer360_oversight_subject_allowed(uuid, uuid) IS
  'Who may view anonymous peer-360 oversight for a subject: L0→L2 only; L1→their pod L2.';

CREATE OR REPLACE FUNCTION public.boom_has_peer360_oversight_access(_viewer uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = _viewer
      AND e.subsidiary_id = '11111111-1111-1111-1111-111111111111'
      AND COALESCE(e.eo_appraisal_active, false)
      AND e.hierarchy_level <= 1
  );
$$;

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
  IF me IS NULL OR NOT public.boom_has_peer360_oversight_access(me) THEN RETURN; END IF;

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
  WHERE e.subsidiary_id = eo
    AND e.eo_appraisal_active
    AND e.id <> me
    AND public.boom_peer360_oversight_subject_allowed(me, e.id)
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
  IF me IS NULL OR NOT public.boom_peer360_oversight_subject_allowed(me, _subject_id) THEN
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
    public.has_role(auth.uid(), 'admin')
    OR public.boom_peer360_oversight_subject_allowed(me, _reviewee_id)
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

-- Directory drill-down: same pod rules; L0 cannot open L1 360 aggregates.
CREATE OR REPLACE FUNCTION public.get_eo_employee_insight(
  _employee_id uuid,
  _period_quarter text,
  _period_month text
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid;
  target record;
  monthly_status text;
  exec_status text;
  peer_rows jsonb;
  peer_by_rel jsonb;
  released boolean;
  can_view_360 boolean;
BEGIN
  me := public.current_employee_id();
  IF me IS NULL THEN RETURN '{}'::jsonb; END IF;

  SELECT * INTO target FROM public.employees WHERE id = _employee_id;
  IF target.id IS NULL THEN RETURN '{}'::jsonb; END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin')
    OR me = _employee_id
    OR public.boom_peer360_oversight_subject_allowed(me, _employee_id)
  ) THEN
    RETURN '{}'::jsonb;
  END IF;

  can_view_360 := public.has_role(auth.uid(), 'admin')
    OR me = _employee_id
    OR public.boom_peer360_oversight_subject_allowed(me, _employee_id);

  SELECT COALESCE(r.status, 'todo') INTO monthly_status
  FROM public.assessment_forms f
  LEFT JOIN public.assessment_responses r
    ON r.form_id = f.id AND r.reviewer_id = _employee_id AND r.reviewee_id = _employee_id
    AND r.period = _period_month
  WHERE f.code = 'monthly_self' LIMIT 1;

  SELECT COALESCE(r.status, 'todo') INTO exec_status
  FROM public.assessment_forms f
  LEFT JOIN public.assessment_responses r
    ON r.form_id = f.id AND r.reviewer_id = _employee_id AND r.reviewee_id = _employee_id
    AND r.period = _period_quarter
  WHERE f.code = 'executive' LIMIT 1;

  SELECT public.peer_360_results_released(_period_quarter) INTO released;

  IF can_view_360 AND (released OR public.has_role(auth.uid(), 'admin') OR me = _employee_id OR EXISTS (
    SELECT 1 FROM public.employees v WHERE v.id = me AND v.hierarchy_level <= 1
  )) THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'section', q.section,
      'avg_score', ROUND(AVG(a.score)::numeric, 2),
      'response_count', COUNT(a.score)::int
    )), '[]'::jsonb) INTO peer_rows
    FROM public.assessment_answers a
    JOIN public.assessment_questions q ON q.id = a.question_id
    JOIN public.assessment_responses r ON r.id = a.response_id
    JOIN public.assessment_forms f ON f.id = r.form_id
    WHERE r.reviewee_id = _employee_id AND r.period = _period_quarter AND r.status = 'submitted'
      AND f.code = 'peer_360' AND a.score IS NOT NULL AND NOT a.no_opportunity
    GROUP BY q.section;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'relation', rel,
      'avg_score', avg_score,
      'response_count', response_count
    )), '[]'::jsonb) INTO peer_by_rel
    FROM (
      SELECT
        COALESCE(r.reviewer_relation, public.boom_reviewer_relation(r.reviewer_id, r.reviewee_id)) AS rel,
        ROUND(AVG(a.score)::numeric, 2) AS avg_score,
        COUNT(DISTINCT r.id)::int AS response_count
      FROM public.assessment_responses r
      JOIN public.assessment_forms f ON f.id = r.form_id AND f.code = 'peer_360'
      JOIN public.assessment_answers a ON a.response_id = r.id AND a.score IS NOT NULL AND NOT a.no_opportunity
      WHERE r.reviewee_id = _employee_id AND r.period = _period_quarter AND r.status = 'submitted'
      GROUP BY rel
      HAVING COUNT(DISTINCT r.id) >= 1
    ) rel_agg;
  ELSE
    peer_rows := '[]'::jsonb;
    peer_by_rel := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'employee_id', _employee_id,
    'name', target.name,
    'hierarchy_level', target.hierarchy_level,
    'monthly_self_status', monthly_status,
    'executive_self_status', exec_status,
    'peer_360_released', COALESCE(released, false),
    'peer_360_sections', COALESCE(peer_rows, '[]'::jsonb),
    'peer_360_by_relation', COALESCE(peer_by_rel, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.boom_peer360_oversight_subject_allowed(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.boom_has_peer360_oversight_access(uuid) TO authenticated;

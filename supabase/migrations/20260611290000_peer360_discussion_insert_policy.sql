-- Allow L1 line managers (Uche, etc.) to create peer-360 discussion threads for their pod.

DROP POLICY IF EXISTS "Oversight insert peer 360 discussions" ON public.boom_result_discussions;

CREATE POLICY "Oversight insert peer 360 discussions"
  ON public.boom_result_discussions FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      form_code = 'peer_360'
      AND facilitator_employee_id = public.current_employee_id()
      AND public.boom_peer360_oversight_subject_allowed(facilitator_employee_id, subject_employee_id)
    )
  );

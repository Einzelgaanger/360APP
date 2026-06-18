-- 360 Peer review: full roster (everyone reviews everyone) + display roles for key EO colleagues.

-- Re-assert full-roster rule (idempotent).
CREATE OR REPLACE FUNCTION public.boom_peer_360_allowed(
  _reviewer uuid,
  _reviewee uuid
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  eo uuid := '11111111-1111-1111-1111-111111111111';
  r record;
  e record;
BEGIN
  IF _reviewer = _reviewee THEN
    RETURN false;
  END IF;

  SELECT id, subsidiary_id, eo_appraisal_active
  INTO r
  FROM public.employees
  WHERE id = _reviewer;

  SELECT id, subsidiary_id, eo_appraisal_active
  INTO e
  FROM public.employees
  WHERE id = _reviewee;

  IF r.id IS NULL OR e.id IS NULL THEN
    RETURN false;
  END IF;

  IF r.subsidiary_id <> eo OR e.subsidiary_id <> eo THEN
    RETURN false;
  END IF;

  IF NOT r.eo_appraisal_active OR NOT e.eo_appraisal_active THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.boom_peer_360_allowed(uuid, uuid) IS
  'EO peer 360: any active EO colleague may review any other active EO colleague (except self).';

UPDATE public.assessment_forms
SET
  title = '360 Peer review',
  description = 'Anonymous peer feedback — every active EO colleague can review every other colleague (not yourself).'
WHERE code = 'peer_360';

-- Display roles shown in Tasks → 360 Peer review list.
UPDATE public.employees
SET role = 'Executive'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (
    lower('kunmi.demuren@peopleos.co'),
    lower('demola.idowu@venturegardengroup.com')
  );

UPDATE public.employees
SET role = 'Executive Office Manager'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) = lower('omotola.akinyemiju@venturegardengroup.com');

UPDATE public.employees
SET
  name = 'Udeme Inyang',
  role = 'EA - Itinerary and Calendar Management',
  department = 'Executive Office',
  hierarchy_level = 2,
  department_code = 'general_ops',
  eo_appraisal_active = true,
  appraisal_receives_comments = true
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (
    lower('ekemudeme.iriyang@venturegardengroup.com'),
    lower('udeme.inyang@peopleos.co')
  );

UPDATE public.employees e
SET
  manager_id = uche.id,
  secondary_manager_id = omotola.id
FROM public.employees uche, public.employees omotola
WHERE e.subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(e.email) = lower('ekemudeme.iriyang@venturegardengroup.com')
  AND lower(uche.email) = lower('uche.ukonu@venturegardengroup.com')
  AND lower(omotola.email) = lower('omotola.akinyemiju@venturegardengroup.com');

UPDATE public.employees
SET role = 'Technical Assistant'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (
    lower('tobi.bankole@venturegardengroup.com'),
    lower('dorathy.akor@venturegardengroup.com')
  );

-- Ensure L0 executives stay in the pilot roster.
UPDATE public.employees
SET eo_appraisal_active = true
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (
    lower('kunmi.demuren@peopleos.co'),
    lower('demola.idowu@venturegardengroup.com'),
    lower('omotola.akinyemiju@venturegardengroup.com'),
    lower('ekemudeme.iriyang@venturegardengroup.com'),
    lower('tobi.bankole@venturegardengroup.com'),
    lower('dorathy.akor@venturegardengroup.com')
  );

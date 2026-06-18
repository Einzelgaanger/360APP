-- EO pilot: full-roster 360 — every active colleague can review every other (not self).
-- Comments and other forms still use org-chart rules via boom_comment_allowed.

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

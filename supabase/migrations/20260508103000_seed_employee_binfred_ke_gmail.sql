-- Seed employee: Alfred maweu Test — binfred.ke@gmail.com
-- Idempotent by email (matches employees_email_lower_unique on lower(email)).
-- Profiles row links after Auth signup (auth.users.id) or manual upsert.

DO $$
DECLARE
  v_sub uuid;
BEGIN
  SELECT id INTO v_sub FROM public.subsidiaries WHERE name = 'Unlisted' LIMIT 1;

  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'subsidiaries row with name Unlisted not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE lower(trim(coalesce(e.email, ''))) = lower(trim('binfred.ke@gmail.com'))
  ) THEN
    INSERT INTO public.employees (name, email, department, subsidiary_id)
    VALUES ('Alfred maweu Test', 'binfred.ke@gmail.com', NULL, v_sub);
  ELSE
    UPDATE public.employees e
    SET
      name = 'Alfred maweu Test',
      subsidiary_id = COALESCE(e.subsidiary_id, v_sub)
    WHERE lower(trim(coalesce(e.email, ''))) = lower(trim('binfred.ke@gmail.com'));
  END IF;
END $$;

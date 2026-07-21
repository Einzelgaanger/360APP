-- Eniola was still on @peopleos.co; activate uses corporate email.
UPDATE public.employees
SET email = 'eniola.olawale@venturegardengroup.com',
    eo_appraisal_active = true,
    updated_at = now()
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (
    lower('eniola.olawale@peopleos.co'),
    lower('eniola.olawale@venturegardengroup.com')
  );

UPDATE public.profiles p
SET email = 'eniola.olawale@venturegardengroup.com'
FROM public.employees e
WHERE e.id = p.employee_id
  AND lower(e.email) = lower('eniola.olawale@venturegardengroup.com')
  AND lower(coalesce(p.email, '')) <> lower('eniola.olawale@venturegardengroup.com');

-- Correct Udeme / Ekemudeme corporate email (local part: ekemudeme.inyang).

UPDATE public.employees
SET
  email = 'ekemudeme.inyang@venturegardengroup.com',
  name = COALESCE(NULLIF(trim(name), ''), 'Ekemudeme Inyang')
WHERE lower(email) IN (
  lower('ekemudeme.iriyang@venturegardengroup.com'),
  lower('udeme.inyang@peopleos.co'),
  lower('ekemudeme.inyang@venturegardengroup.com')
)
OR lower(name) IN (lower('Udeme Inyang'), lower('Ekemudeme Iriyang'), lower('Ekemudeme Inyang'));

UPDATE public.profiles p
SET email = 'ekemudeme.inyang@venturegardengroup.com'
FROM public.employees e
WHERE p.employee_id = e.id
  AND lower(e.email) = lower('ekemudeme.inyang@venturegardengroup.com');

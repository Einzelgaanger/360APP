-- Executive Office + Central Ops roster: corporate emails (venturegardengroup.com / vgplatform.com).
-- Idempotent: matches previous @peopleos.co seed rows and already-migrated addresses.
--
-- Auth + profiles: run `npm run seed:demo-auth` after this migration so Supabase Auth users exist for
-- the new emails. Retire or delete old @peopleos.co Auth users in the dashboard if they are no longer needed.

UPDATE public.employees SET
  email = 'uche.ukonu@venturegardengroup.com',
  role = 'Chief of Staff',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('uche.ukonu@peopleos.co'), lower('uche.ukonu@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'tobi.bankole@venturegardengroup.com',
  role = 'Technical Assistant',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('tobi.bankole@peopleos.co'), lower('tobi.bankole@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'dorathy.akor@venturegardengroup.com',
  role = 'Technical Assistant',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('dorathy.akor@peopleos.co'), lower('dorathy.akor@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'adeosun.ayomide@venturegardengroup.com',
  role = 'Technical Lead',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('ayomide.adeosun@peopleos.co'), lower('adeosun.ayomide@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'gisele.karakezi@venturegardengroup.com',
  name = 'Gisele Ishema Karekezi',
  role = 'Group head - Brand, Growth and Strategic',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND (
    lower(email) IN (lower('gisele.karekezi@peopleos.co'), lower('gisele.karakezi@venturegardengroup.com'))
    OR name = 'Gisele Karekezi'
  );

UPDATE public.employees SET
  email = 'oluwatobiloba.ijamakinwa@venturegardengroup.com',
  name = 'Oluwatobiloba Ijamakinwa',
  role = 'Executive Assistant — Brands and comms',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('oluwatobi.ijamakinwa@peopleos.co'), lower('oluwatobiloba.ijamakinwa@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'brenda.nafula@vgplatform.com',
  role = 'Executive Assistant — Brands and comms',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('brenda.nafula@peopleos.co'), lower('brenda.nafula@vgplatform.com'));

UPDATE public.employees SET
  email = 'gideon.abiona@venturegardengroup.com',
  name = 'Gideon Abiona',
  role = 'Visual Associate - Brands & Coms',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND (
    lower(email) IN (lower('abiona.gideon@peopleos.co'), lower('gideon.abiona@venturegardengroup.com'))
    OR name IN ('Abiona Gideon', 'Gideon Abiona')
  );

UPDATE public.employees SET
  email = 'favour.oyekanmi@venturegardengroup.com',
  role = 'Executive Assistant — Itinerary and Calendar Management',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('favour.oyekanmi@peopleos.co'), lower('favour.oyekanmi@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'ekemudeme.iriyang@venturegardengroup.com',
  name = 'Ekemudeme Iriyang',
  role = 'Executive Assistant — Itinerary and Calendar Management',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND (
    lower(email) IN (lower('udeme.inyang@peopleos.co'), lower('ekemudeme.iriyang@venturegardengroup.com'))
    OR name IN ('Udeme Inyang', 'Ekemudeme Iriyang')
  );

UPDATE public.employees SET
  email = 'omotola.akinyemiju@venturegardengroup.com',
  role = 'Executive Office Lead',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('omotola.akinyemiju@peopleos.co'), lower('omotola.akinyemiju@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'adeyinka.oshin@venturegardengroup.com',
  role = 'Executive Operations Support',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('adeyinka.oshin@peopleos.co'), lower('adeyinka.oshin@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'deyi.dipeolu@venturegardengroup.com',
  role = 'Chief of Staff Portfolio, Capital & Investment',
  department = 'Executive Office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('deyi.dipeolu@peopleos.co'), lower('deyi.dipeolu@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'regina.ottoh-ebhonu@venturegardengroup.com',
  role = 'Associate product officer, strategy and growth',
  department = 'Central Ops - Executive office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('regina.ottoh-ebhonu@peopleos.co'), lower('regina.ottoh-ebhonu@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'melissa.omede@venturegardengroup.com',
  role = 'Senior Analyst Operations & Execution',
  department = 'Central Ops - Executive office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('melissa.omede@peopleos.co'), lower('melissa.omede@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'baluku.dounnah@venturegardengroup.com',
  role = 'Manager, Operations and Execution',
  department = 'Central Ops - Executive office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(email) IN (lower('baluku.duannah@peopleos.co'), lower('baluku.dounnah@venturegardengroup.com'));

UPDATE public.employees SET
  email = 'chukwuka.monyei@venturegardengroup.com',
  name = 'Chukwuka Monyei',
  role = 'Associate, Operations and Execution',
  department = 'Central Ops - Executive office'
WHERE subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND (
    lower(email) IN (lower('chuka.monyei@peopleos.co'), lower('chukwuka.monyei@venturegardengroup.com'))
    OR name IN ('Chuka Monyei', 'Chukwuka Monyei')
  );

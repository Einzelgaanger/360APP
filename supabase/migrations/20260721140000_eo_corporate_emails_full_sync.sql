-- Ensure EO pilot login emails match corporate addresses used at activate/login.
-- Bunmi intentionally remains on peopleos.co.

UPDATE public.employees e
SET email = v.new_email,
    eo_appraisal_active = true
FROM (
  VALUES
    ('eniola.olawale@peopleos.co', 'eniola.olawale@venturegardengroup.com'),
    ('kunmi.demuren@peopleos.co', 'kunmi.demuren@venturegardengroup.com'),
    ('demola.idowu@peopleos.co', 'demola.idowu@venturegardengroup.com'),
    ('uche.ukonu@peopleos.co', 'uche.ukonu@venturegardengroup.com'),
    ('omotola.akinyemiju@peopleos.co', 'omotola.akinyemiju@venturegardengroup.com'),
    ('gisele.karekezi@peopleos.co', 'gisele.karakezi@venturegardengroup.com'),
    ('gisele.karakezi@peopleos.co', 'gisele.karakezi@venturegardengroup.com'),
    ('deyi.dipeolu@peopleos.co', 'deyi.dipeolu@venturegardengroup.com'),
    ('tobi.bankole@peopleos.co', 'tobi.bankole@venturegardengroup.com'),
    ('dorathy.akor@peopleos.co', 'dorathy.akor@venturegardengroup.com'),
    ('ayomide.adeosun@peopleos.co', 'adeosun.ayomide@venturegardengroup.com'),
    ('adeosun.ayomide@peopleos.co', 'adeosun.ayomide@venturegardengroup.com'),
    ('brenda.nafula@peopleos.co', 'brenda.nafula@vgplatform.com'),
    ('oluwatobi.ijamakinwa@peopleos.co', 'oluwatobiloba.ijamakinwa@venturegardengroup.com'),
    ('oluwatobiloba.ijamakinwa@peopleos.co', 'oluwatobiloba.ijamakinwa@venturegardengroup.com'),
    ('gideon.abiona@peopleos.co', 'gideon.abiona@venturegardengroup.com'),
    ('chukwuka.monyei@peopleos.co', 'chukwuka.monyei@venturegardengroup.com'),
    ('melissa.omede@peopleos.co', 'melissa.omede@venturegardengroup.com'),
    ('baluku.dounnah@peopleos.co', 'baluku.dounnah@venturegardengroup.com'),
    ('regina.ottoh-ebhonu@peopleos.co', 'regina.ottoh-ebhonu@venturegardengroup.com'),
    ('favour.oyekanmi@peopleos.co', 'favour.oyekanmi@venturegardengroup.com'),
    ('ekemudeme.iriyang@peopleos.co', 'ekemudeme.iriyang@venturegardengroup.com'),
    ('udeme.inyang@peopleos.co', 'ekemudeme.iriyang@venturegardengroup.com'),
    ('adeyinka.oshin@peopleos.co', 'adeyinka.oshin@venturegardengroup.com')
) AS v(old_email, new_email)
WHERE e.subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND lower(e.email) = lower(v.old_email);

-- Align profiles.email with linked employee corporate email
UPDATE public.profiles p
SET email = lower(e.email)
FROM public.employees e
WHERE p.employee_id = e.id
  AND e.subsidiary_id = '11111111-1111-1111-1111-111111111111'
  AND e.eo_appraisal_active IS TRUE
  AND e.email IS NOT NULL
  AND lower(coalesce(p.email, '')) <> lower(e.email);


-- Step 1: Remove duplicates (keep oldest per email)
DELETE FROM employees WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY created_at ASC) as rn
    FROM employees
  ) ranked WHERE rn > 1
);

-- Step 2: Remove service accounts
DELETE FROM employees WHERE lower(email) IN (
  'accounting1@venturegardengroup.com','accounts@venturegardengroup.com',
  'jenkins@venturegardengroup.com','sonarqube@venturegardengroup.com',
  'azure.admin@venturegardengroup.com','churpy.dashboard@venturegardengroup.com',
  'data@venturegardengroup.com','event_rsvp@venturegardengroup.com',
  'manageshares@venturegardengroup.com','payfersupport@venturegardengroup.com',
  'pensionenquiries@venturegardengroup.com','testing101@gardenventures.org',
  'testing911@gardenventures.org','nicole6.ejim@gardenventures.org',
  'john.doe@venturegardengroup.com'
);

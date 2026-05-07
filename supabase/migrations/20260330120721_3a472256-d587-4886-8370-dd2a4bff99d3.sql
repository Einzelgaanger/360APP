
CREATE TEMP TABLE _xls (name text, email text, department text, subsidiary_id uuid);

-- We'll update in a simpler way: just run the updates directly
-- First remove any remaining duplicates
DELETE FROM employees WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY created_at ASC) as rn
    FROM employees
  ) ranked WHERE rn > 1
);

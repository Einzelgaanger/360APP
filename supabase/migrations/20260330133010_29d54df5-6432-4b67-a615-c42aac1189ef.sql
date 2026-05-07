-- Add manager_id to employees for reporting relationships
ALTER TABLE employees ADD COLUMN manager_id uuid REFERENCES employees(id) ON DELETE SET NULL;
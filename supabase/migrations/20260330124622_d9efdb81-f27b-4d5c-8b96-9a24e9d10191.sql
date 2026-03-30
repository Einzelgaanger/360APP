
-- Allow service role and admins to update employees
CREATE POLICY "Admins can update employees"
ON employees FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Grant update to anon/authenticated for service role operations
GRANT UPDATE ON employees TO anon, authenticated;

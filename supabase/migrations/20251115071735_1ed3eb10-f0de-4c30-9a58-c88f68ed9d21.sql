-- Allow users to view profiles in their company
CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT p.company_id
    FROM profiles p
    WHERE p.id = auth.uid()
  )
);
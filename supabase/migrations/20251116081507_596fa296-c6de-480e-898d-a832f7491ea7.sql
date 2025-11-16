-- Allow users to update their company when changing email domain
CREATE POLICY "Users can update their own company"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
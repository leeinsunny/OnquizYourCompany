-- Fix RLS policies for profiles table to allow viewing company members
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Create permissive policies (OR condition)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (company_id = get_user_company_id(auth.uid()));
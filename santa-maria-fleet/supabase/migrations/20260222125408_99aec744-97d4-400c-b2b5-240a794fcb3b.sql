
-- Drop restrictive SELECT policies on profiles
DROP POLICY IF EXISTS "Admins and frota can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recreate as PERMISSIVE (default) so they work with OR logic
CREATE POLICY "Admins and frota can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'frota'::app_role));

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);


-- Allow super_admin to insert/update/delete user_roles
CREATE POLICY "Super admin can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

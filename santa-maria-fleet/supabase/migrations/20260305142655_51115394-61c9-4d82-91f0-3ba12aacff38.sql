
-- Fix fuel_records RLS: convert restrictive to permissive + add delete policy
DROP POLICY IF EXISTS "co_create_fuel" ON public.fuel_records;
DROP POLICY IF EXISTS "co_manage_fuel" ON public.fuel_records;
DROP POLICY IF EXISTS "co_view_fuel" ON public.fuel_records;
DROP POLICY IF EXISTS "sa_fuel" ON public.fuel_records;

-- Super admin full access
CREATE POLICY "sa_fuel" ON public.fuel_records FOR ALL TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Admin/frota full access (view, edit, delete)
CREATE POLICY "co_manage_fuel" ON public.fuel_records FOR ALL TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')))
WITH CHECK (company_id = get_user_company_id(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));

-- Any authenticated user can insert their own record
CREATE POLICY "co_create_fuel" ON public.fuel_records FOR INSERT TO authenticated
WITH CHECK (auth.uid() = registrado_por_user_id);

-- Motorista can view own records
CREATE POLICY "motorista_view_fuel" ON public.fuel_records FOR SELECT TO authenticated
USING (company_id = get_user_company_id(auth.uid()) AND auth.uid() = motorista_id);

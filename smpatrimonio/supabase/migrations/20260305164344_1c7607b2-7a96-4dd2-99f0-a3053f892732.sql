
-- Drop all restrictive policies and recreate as permissive

-- units
DROP POLICY IF EXISTS "Admin/Patrimonio can manage units" ON public.units;
DROP POLICY IF EXISTS "Authenticated can view units" ON public.units;
CREATE POLICY "Admin/Patrimonio can manage units" ON public.units FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view units" ON public.units FOR SELECT TO authenticated USING (true);

-- sectors
DROP POLICY IF EXISTS "Admin/Patrimonio can manage sectors" ON public.sectors;
DROP POLICY IF EXISTS "Authenticated can view sectors" ON public.sectors;
CREATE POLICY "Admin/Patrimonio can manage sectors" ON public.sectors FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view sectors" ON public.sectors FOR SELECT TO authenticated USING (true);

-- rooms
DROP POLICY IF EXISTS "Admin/Patrimonio can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated can view rooms" ON public.rooms;
CREATE POLICY "Admin/Patrimonio can manage rooms" ON public.rooms FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view rooms" ON public.rooms FOR SELECT TO authenticated USING (true);

-- categories
DROP POLICY IF EXISTS "Admin/Patrimonio can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can view categories" ON public.categories;
CREATE POLICY "Admin/Patrimonio can manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view categories" ON public.categories FOR SELECT TO authenticated USING (true);

-- items
DROP POLICY IF EXISTS "Admin/Patrimonio can manage items" ON public.items;
DROP POLICY IF EXISTS "Authenticated can view items" ON public.items;
CREATE POLICY "Admin/Patrimonio can manage items" ON public.items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view items" ON public.items FOR SELECT TO authenticated USING (true);

-- movements
DROP POLICY IF EXISTS "Admin/Patrimonio can create movements" ON public.movements;
DROP POLICY IF EXISTS "Authenticated can view movements" ON public.movements;
CREATE POLICY "Admin/Patrimonio can create movements" ON public.movements FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view movements" ON public.movements FOR SELECT TO authenticated USING (true);

-- maintenances
DROP POLICY IF EXISTS "Admin/Patrimonio can manage maintenances" ON public.maintenances;
DROP POLICY IF EXISTS "Authenticated can view maintenances" ON public.maintenances;
CREATE POLICY "Admin/Patrimonio can manage maintenances" ON public.maintenances FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view maintenances" ON public.maintenances FOR SELECT TO authenticated USING (true);

-- inventories
DROP POLICY IF EXISTS "Admin/Patrimonio/Inventario can manage inventories" ON public.inventories;
DROP POLICY IF EXISTS "Authenticated can view inventories" ON public.inventories;
CREATE POLICY "Admin/Patrimonio/Inventario can manage inventories" ON public.inventories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role) OR has_role(auth.uid(), 'inventario'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role) OR has_role(auth.uid(), 'inventario'::app_role));
CREATE POLICY "Authenticated can view inventories" ON public.inventories FOR SELECT TO authenticated USING (true);

-- inventory_scans
DROP POLICY IF EXISTS "Admin/Patrimonio/Inventario can insert scans" ON public.inventory_scans;
DROP POLICY IF EXISTS "Authenticated can view scans" ON public.inventory_scans;
CREATE POLICY "Admin/Patrimonio/Inventario can insert scans" ON public.inventory_scans FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role) OR has_role(auth.uid(), 'inventario'::app_role));
CREATE POLICY "Authenticated can view scans" ON public.inventory_scans FOR SELECT TO authenticated USING (true);

-- item_attachments
DROP POLICY IF EXISTS "Admin/Patrimonio can manage attachments" ON public.item_attachments;
DROP POLICY IF EXISTS "Authenticated can view attachments" ON public.item_attachments;
CREATE POLICY "Admin/Patrimonio can manage attachments" ON public.item_attachments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view attachments" ON public.item_attachments FOR SELECT TO authenticated USING (true);

-- item_audit_logs
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.item_audit_logs;
DROP POLICY IF EXISTS "Authenticated can view audit logs" ON public.item_audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.item_audit_logs FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Authenticated can view audit logs" ON public.item_audit_logs FOR SELECT TO authenticated USING (true);

-- app_settings
DROP POLICY IF EXISTS "Admin can manage settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated can view settings" ON public.app_settings;
CREATE POLICY "Admin can manage settings" ON public.app_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view settings" ON public.app_settings FOR SELECT TO authenticated USING (true);

-- label_templates
DROP POLICY IF EXISTS "Admin can manage label templates" ON public.label_templates;
DROP POLICY IF EXISTS "Authenticated can view label templates" ON public.label_templates;
CREATE POLICY "Admin can manage label templates" ON public.label_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view label templates" ON public.label_templates FOR SELECT TO authenticated USING (true);

-- printer_profiles
DROP POLICY IF EXISTS "Admin can manage printer profiles" ON public.printer_profiles;
DROP POLICY IF EXISTS "Authenticated can view printer profiles" ON public.printer_profiles;
CREATE POLICY "Admin can manage printer profiles" ON public.printer_profiles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view printer profiles" ON public.printer_profiles FOR SELECT TO authenticated USING (true);

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Auto-assign admin role to first user via trigger
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin();

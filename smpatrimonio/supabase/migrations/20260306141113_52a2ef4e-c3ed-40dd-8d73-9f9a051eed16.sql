
-- Fix items policies
DROP POLICY IF EXISTS "Admin/Patrimonio can manage items" ON public.items;
DROP POLICY IF EXISTS "Authenticated can view items" ON public.items;

CREATE POLICY "Admin/Patrimonio can manage items" ON public.items AS PERMISSIVE
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));

CREATE POLICY "Authenticated can view items" ON public.items AS PERMISSIVE
  FOR SELECT TO authenticated USING (true);

-- kits
DROP POLICY IF EXISTS "Admin/Patrimonio can manage kits" ON public.kits;
DROP POLICY IF EXISTS "Authenticated can view kits" ON public.kits;
CREATE POLICY "Admin/Patrimonio can manage kits" ON public.kits AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view kits" ON public.kits AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- kit_items
DROP POLICY IF EXISTS "Admin/Patrimonio can manage kit items" ON public.kit_items;
DROP POLICY IF EXISTS "Authenticated can view kit items" ON public.kit_items;
CREATE POLICY "Admin/Patrimonio can manage kit items" ON public.kit_items AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view kit items" ON public.kit_items AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- movements
DROP POLICY IF EXISTS "Admin/Patrimonio can create movements" ON public.movements;
DROP POLICY IF EXISTS "Authenticated can view movements" ON public.movements;
CREATE POLICY "Admin/Patrimonio can create movements" ON public.movements AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view movements" ON public.movements AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- inventories
DROP POLICY IF EXISTS "Admin/Patrimonio/Inventario can manage inventories" ON public.inventories;
DROP POLICY IF EXISTS "Authenticated can view inventories" ON public.inventories;
CREATE POLICY "Admin/Patrimonio/Inventario can manage inventories" ON public.inventories AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role) OR has_role(auth.uid(), 'inventario'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role) OR has_role(auth.uid(), 'inventario'::app_role));
CREATE POLICY "Authenticated can view inventories" ON public.inventories AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- inventory_scans
DROP POLICY IF EXISTS "Admin/Patrimonio/Inventario can insert scans" ON public.inventory_scans;
DROP POLICY IF EXISTS "Authenticated can view scans" ON public.inventory_scans;
CREATE POLICY "Admin/Patrimonio/Inventario can insert scans" ON public.inventory_scans AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role) OR has_role(auth.uid(), 'inventario'::app_role));
CREATE POLICY "Authenticated can view scans" ON public.inventory_scans AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- categories
DROP POLICY IF EXISTS "Admin/Patrimonio can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated can view categories" ON public.categories;
CREATE POLICY "Admin/Patrimonio can manage categories" ON public.categories AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view categories" ON public.categories AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- rooms
DROP POLICY IF EXISTS "Admin/Patrimonio can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated can view rooms" ON public.rooms;
CREATE POLICY "Admin/Patrimonio can manage rooms" ON public.rooms AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view rooms" ON public.rooms AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- sectors
DROP POLICY IF EXISTS "Admin/Patrimonio can manage sectors" ON public.sectors;
DROP POLICY IF EXISTS "Authenticated can view sectors" ON public.sectors;
CREATE POLICY "Admin/Patrimonio can manage sectors" ON public.sectors AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view sectors" ON public.sectors AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- units
DROP POLICY IF EXISTS "Admin/Patrimonio can manage units" ON public.units;
DROP POLICY IF EXISTS "Authenticated can view units" ON public.units;
CREATE POLICY "Admin/Patrimonio can manage units" ON public.units AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view units" ON public.units AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- maintenances
DROP POLICY IF EXISTS "Admin/Patrimonio can manage maintenances" ON public.maintenances;
DROP POLICY IF EXISTS "Authenticated can view maintenances" ON public.maintenances;
CREATE POLICY "Admin/Patrimonio can manage maintenances" ON public.maintenances AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view maintenances" ON public.maintenances AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- item_attachments
DROP POLICY IF EXISTS "Admin/Patrimonio can manage attachments" ON public.item_attachments;
DROP POLICY IF EXISTS "Authenticated can view attachments" ON public.item_attachments;
CREATE POLICY "Admin/Patrimonio can manage attachments" ON public.item_attachments AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));
CREATE POLICY "Authenticated can view attachments" ON public.item_attachments AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- app_settings
DROP POLICY IF EXISTS "Admin can manage settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated can view settings" ON public.app_settings;
CREATE POLICY "Admin can manage settings" ON public.app_settings AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view settings" ON public.app_settings AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- label_templates
DROP POLICY IF EXISTS "Admin can manage label templates" ON public.label_templates;
DROP POLICY IF EXISTS "Authenticated can view label templates" ON public.label_templates;
CREATE POLICY "Admin can manage label templates" ON public.label_templates AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view label templates" ON public.label_templates AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- printer_profiles
DROP POLICY IF EXISTS "Admin can manage printer profiles" ON public.printer_profiles;
DROP POLICY IF EXISTS "Authenticated can view printer profiles" ON public.printer_profiles;
CREATE POLICY "Admin can manage printer profiles" ON public.printer_profiles AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view printer profiles" ON public.printer_profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- item_audit_logs
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.item_audit_logs;
DROP POLICY IF EXISTS "Authenticated can view audit logs" ON public.item_audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.item_audit_logs AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Authenticated can view audit logs" ON public.item_audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can insert own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated can insert own notifications" ON public.notifications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid());

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (user_id = auth.uid());

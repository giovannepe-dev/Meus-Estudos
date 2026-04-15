
-- =============================================
-- FIX: Change ALL restrictive policies to permissive
-- Root cause: All policies were RESTRICTIVE, meaning ALL must pass.
-- Regular users fail because they can't be super_admin AND admin AND motorista at the same time.
-- =============================================

-- ========== CHECKOUTS ==========
DROP POLICY IF EXISTS "co_admin_view_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "co_create_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "co_update_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "motorista_view_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "sa_checkouts" ON public.checkouts;

CREATE POLICY "sa_checkouts" ON public.checkouts FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_admin_view_checkouts" ON public.checkouts FOR SELECT TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));
CREATE POLICY "motorista_view_checkouts" ON public.checkouts FOR SELECT TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (auth.uid() = motorista_id));
CREATE POLICY "co_create_checkouts" ON public.checkouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = criado_por_user_id);
CREATE POLICY "co_update_checkouts" ON public.checkouts FOR UPDATE TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota') OR (auth.uid() = motorista_id)));

-- ========== COMPANIES ==========
DROP POLICY IF EXISTS "co_admin_update_company" ON public.companies;
DROP POLICY IF EXISTS "members_view_company" ON public.companies;
DROP POLICY IF EXISTS "sa_companies" ON public.companies;

CREATE POLICY "sa_companies" ON public.companies FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "members_view_company" ON public.companies FOR SELECT TO authenticated USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "co_admin_update_company" ON public.companies FOR UPDATE TO authenticated USING ((id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'));

-- ========== DRIVER_LOCATIONS ==========
DROP POLICY IF EXISTS "co_admin_view_locations" ON public.driver_locations;
DROP POLICY IF EXISTS "driver_insert_location" ON public.driver_locations;
DROP POLICY IF EXISTS "driver_view_own_location" ON public.driver_locations;
DROP POLICY IF EXISTS "sa_locations" ON public.driver_locations;

CREATE POLICY "sa_locations" ON public.driver_locations FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_admin_view_locations" ON public.driver_locations FOR SELECT TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));
CREATE POLICY "driver_view_own_location" ON public.driver_locations FOR SELECT TO authenticated USING ((auth.uid() = motorista_id) AND (company_id = get_user_company_id(auth.uid())));
CREATE POLICY "driver_insert_location" ON public.driver_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = motorista_id);

-- ========== FUEL_RECORDS ==========
DROP POLICY IF EXISTS "co_create_fuel" ON public.fuel_records;
DROP POLICY IF EXISTS "co_manage_fuel" ON public.fuel_records;
DROP POLICY IF EXISTS "co_view_fuel" ON public.fuel_records;
DROP POLICY IF EXISTS "sa_fuel" ON public.fuel_records;

CREATE POLICY "sa_fuel" ON public.fuel_records FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_view_fuel" ON public.fuel_records FOR SELECT TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota') OR (auth.uid() = motorista_id)));
CREATE POLICY "co_create_fuel" ON public.fuel_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = registrado_por_user_id);
CREATE POLICY "co_manage_fuel" ON public.fuel_records FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota'))) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));

-- ========== INCIDENTS ==========
DROP POLICY IF EXISTS "co_create_incidents" ON public.incidents;
DROP POLICY IF EXISTS "co_manage_incidents" ON public.incidents;
DROP POLICY IF EXISTS "co_view_incidents" ON public.incidents;
DROP POLICY IF EXISTS "sa_incidents" ON public.incidents;

CREATE POLICY "sa_incidents" ON public.incidents FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_view_incidents" ON public.incidents FOR SELECT TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota') OR (auth.uid() = motorista_id)));
CREATE POLICY "co_create_incidents" ON public.incidents FOR INSERT TO authenticated WITH CHECK (auth.uid() = registrado_por_user_id);
CREATE POLICY "co_manage_incidents" ON public.incidents FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota'))) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));

-- ========== INSPECTIONS ==========
DROP POLICY IF EXISTS "co_manage_inspections" ON public.inspections;
DROP POLICY IF EXISTS "co_view_inspections" ON public.inspections;
DROP POLICY IF EXISTS "sa_inspections" ON public.inspections;

CREATE POLICY "sa_inspections" ON public.inspections FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_view_inspections" ON public.inspections FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "co_manage_inspections" ON public.inspections FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota'))) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));

-- ========== KM_DIVERGENCES ==========
DROP POLICY IF EXISTS "co_insert_km" ON public.km_divergences;
DROP POLICY IF EXISTS "co_manage_km" ON public.km_divergences;
DROP POLICY IF EXISTS "motorista_view_km" ON public.km_divergences;
DROP POLICY IF EXISTS "sa_km" ON public.km_divergences;

CREATE POLICY "sa_km" ON public.km_divergences FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_manage_km" ON public.km_divergences FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota'))) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));
CREATE POLICY "motorista_view_km" ON public.km_divergences FOR SELECT TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (auth.uid() = motorista_id));
CREATE POLICY "co_insert_km" ON public.km_divergences FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ========== MAINTENANCE ==========
DROP POLICY IF EXISTS "co_manage_maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "co_view_maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "sa_maintenance" ON public.maintenance;

CREATE POLICY "sa_maintenance" ON public.maintenance FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_view_maintenance" ON public.maintenance FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "co_manage_maintenance" ON public.maintenance FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota'))) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));

-- ========== MONTHLY_CLOSINGS ==========
DROP POLICY IF EXISTS "co_admin_closings" ON public.monthly_closings;
DROP POLICY IF EXISTS "co_view_closings" ON public.monthly_closings;
DROP POLICY IF EXISTS "sa_closings" ON public.monthly_closings;

CREATE POLICY "sa_closings" ON public.monthly_closings FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_view_closings" ON public.monthly_closings FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "co_admin_closings" ON public.monthly_closings FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin')) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'));

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "co_admin_frota_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "co_admin_manage_profiles" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_insert" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_select" ON public.profiles;
DROP POLICY IF EXISTS "own_profile_update" ON public.profiles;
DROP POLICY IF EXISTS "sa_profiles" ON public.profiles;

CREATE POLICY "sa_profiles" ON public.profiles FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "co_admin_frota_view_profiles" ON public.profiles FOR SELECT TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));
CREATE POLICY "co_admin_manage_profiles" ON public.profiles FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin')) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'));

-- ========== SETTINGS ==========
DROP POLICY IF EXISTS "co_admin_settings" ON public.settings;
DROP POLICY IF EXISTS "co_view_settings" ON public.settings;
DROP POLICY IF EXISTS "sa_settings" ON public.settings;

CREATE POLICY "sa_settings" ON public.settings FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_view_settings" ON public.settings FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "co_admin_settings" ON public.settings FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin')) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'admin'));

-- ========== SUPER_ADMINS ==========
DROP POLICY IF EXISTS "sa_super_admins" ON public.super_admins;

CREATE POLICY "sa_super_admins" ON public.super_admins FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

-- ========== TRAFFIC_TICKETS ==========
DROP POLICY IF EXISTS "co_manage_tickets" ON public.traffic_tickets;
DROP POLICY IF EXISTS "motorista_view_tickets" ON public.traffic_tickets;
DROP POLICY IF EXISTS "sa_tickets" ON public.traffic_tickets;

CREATE POLICY "sa_tickets" ON public.traffic_tickets FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_manage_tickets" ON public.traffic_tickets FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota'))) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));
CREATE POLICY "motorista_view_tickets" ON public.traffic_tickets FOR SELECT TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (auth.uid() = motorista_id));

-- ========== USER_ROLES ==========
DROP POLICY IF EXISTS "co_admin_roles" ON public.user_roles;
DROP POLICY IF EXISTS "own_role_insert" ON public.user_roles;
DROP POLICY IF EXISTS "own_role_select" ON public.user_roles;
DROP POLICY IF EXISTS "sa_roles" ON public.user_roles;

CREATE POLICY "sa_roles" ON public.user_roles FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "own_role_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_role_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "co_admin_roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') AND (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = user_roles.user_id AND p.company_id = get_user_company_id(auth.uid())))) WITH CHECK (has_role(auth.uid(), 'admin') AND (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = user_roles.user_id AND p.company_id = get_user_company_id(auth.uid()))));

-- ========== VEHICLE_BOOKINGS ==========
DROP POLICY IF EXISTS "co_create_bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "co_delete_bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "co_update_bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "co_view_bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "sa_bookings" ON public.vehicle_bookings;

CREATE POLICY "sa_bookings" ON public.vehicle_bookings FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_view_bookings" ON public.vehicle_bookings FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "co_create_bookings" ON public.vehicle_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = motorista_id);
CREATE POLICY "co_update_bookings" ON public.vehicle_bookings FOR UPDATE TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND ((auth.uid() = motorista_id) OR has_role(auth.uid(), 'admin')));
CREATE POLICY "co_delete_bookings" ON public.vehicle_bookings FOR DELETE TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND ((auth.uid() = motorista_id) OR has_role(auth.uid(), 'admin')));

-- ========== VEHICLES ==========
DROP POLICY IF EXISTS "co_manage_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "co_view_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "sa_vehicles" ON public.vehicles;

CREATE POLICY "sa_vehicles" ON public.vehicles FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "co_view_vehicles" ON public.vehicles FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "co_manage_vehicles" ON public.vehicles FOR ALL TO authenticated USING ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota'))) WITH CHECK ((company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota')));

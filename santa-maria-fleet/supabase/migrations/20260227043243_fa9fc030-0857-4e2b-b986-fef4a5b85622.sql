
-- ============================================
-- MULTI-TENANT MIGRATION (reordered)
-- ============================================

-- 1. Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  slug text UNIQUE NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  max_usuarios integer DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Create super_admins table
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 3. is_super_admin (no dependency on company_id)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id) $$;

-- 4. Add company_id to ALL tables (nullable first)
ALTER TABLE public.profiles ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.vehicles ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.checkouts ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.fuel_records ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.incidents ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.inspections ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.maintenance ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.traffic_tickets ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.vehicle_bookings ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.km_divergences ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.settings ADD COLUMN company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.monthly_closings ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- 5. NOW create functions that reference company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.auto_set_company_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.get_user_company_id(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Create default company and migrate existing data
INSERT INTO public.companies (id, nome, slug) VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Padrão', 'empresa-padrao');

UPDATE public.profiles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.vehicles SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.checkouts SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.fuel_records SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.incidents SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.inspections SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.maintenance SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.traffic_tickets SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.vehicle_bookings SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.km_divergences SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.settings SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.monthly_closings SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;

-- 7. Make NOT NULL
ALTER TABLE public.profiles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.vehicles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.checkouts ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.fuel_records ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.incidents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.inspections ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.maintenance ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.traffic_tickets ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.vehicle_bookings ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.km_divergences ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.settings ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.monthly_closings ALTER COLUMN company_id SET NOT NULL;

-- 8. Auto-set triggers
CREATE TRIGGER auto_company_vehicles BEFORE INSERT ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_checkouts BEFORE INSERT ON public.checkouts FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_fuel BEFORE INSERT ON public.fuel_records FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_incidents BEFORE INSERT ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_inspections BEFORE INSERT ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_maintenance BEFORE INSERT ON public.maintenance FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_tickets BEFORE INSERT ON public.traffic_tickets FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_bookings BEFORE INSERT ON public.vehicle_bookings FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_km BEFORE INSERT ON public.km_divergences FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_settings BEFORE INSERT ON public.settings FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();
CREATE TRIGGER auto_company_closings BEFORE INSERT ON public.monthly_closings FOR EACH ROW EXECUTE FUNCTION public.auto_set_company_id();

-- 9. Register super admin
INSERT INTO public.super_admins (user_id)
SELECT id FROM auth.users WHERE email = 'giovannepe@gmail.com'
ON CONFLICT DO NOTHING;

-- 10. RLS for new tables
CREATE POLICY "sa_companies" ON public.companies FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "members_view_company" ON public.companies FOR SELECT USING (id = public.get_user_company_id(auth.uid()));
CREATE POLICY "sa_super_admins" ON public.super_admins FOR ALL USING (public.is_super_admin(auth.uid()));

-- 11. Drop and recreate ALL RLS policies with company isolation

-- PROFILES
DROP POLICY IF EXISTS "Admins and frota can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "sa_profiles" ON public.profiles FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_admin_frota_view_profiles" ON public.profiles FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "co_admin_manage_profiles" ON public.profiles FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_profile_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- VEHICLES
DROP POLICY IF EXISTS "Admin and frota can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;

CREATE POLICY "sa_vehicles" ON public.vehicles FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_manage_vehicles" ON public.vehicles FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "co_view_vehicles" ON public.vehicles FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

-- CHECKOUTS
DROP POLICY IF EXISTS "Admin and frota can update checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Admin and frota can view all checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Authenticated can create checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "Motoristas can view own checkouts" ON public.checkouts;

CREATE POLICY "sa_checkouts" ON public.checkouts FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_admin_view_checkouts" ON public.checkouts FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "co_update_checkouts" ON public.checkouts FOR UPDATE
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota') OR auth.uid() = motorista_id));
CREATE POLICY "co_create_checkouts" ON public.checkouts FOR INSERT WITH CHECK (auth.uid() = criado_por_user_id);
CREATE POLICY "motorista_view_checkouts" ON public.checkouts FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) AND auth.uid() = motorista_id);

-- FUEL_RECORDS
DROP POLICY IF EXISTS "Admin and frota can update fuel records" ON public.fuel_records;
DROP POLICY IF EXISTS "Authenticated can create fuel records" ON public.fuel_records;
DROP POLICY IF EXISTS "Authenticated can view fuel records" ON public.fuel_records;

CREATE POLICY "sa_fuel" ON public.fuel_records FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_manage_fuel" ON public.fuel_records FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "co_create_fuel" ON public.fuel_records FOR INSERT WITH CHECK (auth.uid() = registrado_por_user_id);
CREATE POLICY "co_view_fuel" ON public.fuel_records FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota') OR auth.uid() = motorista_id));

-- INCIDENTS
DROP POLICY IF EXISTS "Admin and frota can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Create incidents" ON public.incidents;
DROP POLICY IF EXISTS "View incidents" ON public.incidents;

CREATE POLICY "sa_incidents" ON public.incidents FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_manage_incidents" ON public.incidents FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "co_create_incidents" ON public.incidents FOR INSERT WITH CHECK (auth.uid() = registrado_por_user_id);
CREATE POLICY "co_view_incidents" ON public.incidents FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota') OR auth.uid() = motorista_id));

-- INSPECTIONS
DROP POLICY IF EXISTS "Admin and frota can manage inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated can view inspections" ON public.inspections;

CREATE POLICY "sa_inspections" ON public.inspections FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_manage_inspections" ON public.inspections FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "co_view_inspections" ON public.inspections FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

-- MAINTENANCE
DROP POLICY IF EXISTS "Admin and frota can manage maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "View maintenance" ON public.maintenance;

CREATE POLICY "sa_maintenance" ON public.maintenance FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_manage_maintenance" ON public.maintenance FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "co_view_maintenance" ON public.maintenance FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

-- TRAFFIC_TICKETS
DROP POLICY IF EXISTS "Admin and frota can manage traffic_tickets" ON public.traffic_tickets;
DROP POLICY IF EXISTS "Motoristas can view own traffic_tickets" ON public.traffic_tickets;

CREATE POLICY "sa_tickets" ON public.traffic_tickets FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_manage_tickets" ON public.traffic_tickets FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "motorista_view_tickets" ON public.traffic_tickets FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) AND auth.uid() = motorista_id);

-- VEHICLE_BOOKINGS
DROP POLICY IF EXISTS "Authenticated can view all bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Owner or admin can delete bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Owner or admin can update bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.vehicle_bookings;

CREATE POLICY "sa_bookings" ON public.vehicle_bookings FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_view_bookings" ON public.vehicle_bookings FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "co_create_bookings" ON public.vehicle_bookings FOR INSERT WITH CHECK (auth.uid() = motorista_id);
CREATE POLICY "co_update_bookings" ON public.vehicle_bookings FOR UPDATE
  USING (company_id = public.get_user_company_id(auth.uid()) AND (auth.uid() = motorista_id OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "co_delete_bookings" ON public.vehicle_bookings FOR DELETE
  USING (company_id = public.get_user_company_id(auth.uid()) AND (auth.uid() = motorista_id OR public.has_role(auth.uid(), 'admin')));

-- KM_DIVERGENCES
DROP POLICY IF EXISTS "Admin and frota can delete km_divergences" ON public.km_divergences;
DROP POLICY IF EXISTS "Admin and frota can update km_divergences" ON public.km_divergences;
DROP POLICY IF EXISTS "Admin and frota can view km_divergences" ON public.km_divergences;
DROP POLICY IF EXISTS "Authenticated can insert km_divergences" ON public.km_divergences;
DROP POLICY IF EXISTS "Motorista can view own km_divergences" ON public.km_divergences;

CREATE POLICY "sa_km" ON public.km_divergences FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_manage_km" ON public.km_divergences FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')));
CREATE POLICY "co_insert_km" ON public.km_divergences FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "motorista_view_km" ON public.km_divergences FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()) AND auth.uid() = motorista_id);

-- SETTINGS
DROP POLICY IF EXISTS "Admin can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated can view settings" ON public.settings;

CREATE POLICY "sa_settings" ON public.settings FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_admin_settings" ON public.settings FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "co_view_settings" ON public.settings FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

-- MONTHLY_CLOSINGS
DROP POLICY IF EXISTS "Admin can manage monthly_closings" ON public.monthly_closings;
DROP POLICY IF EXISTS "Authenticated can view monthly_closings" ON public.monthly_closings;

CREATE POLICY "sa_closings" ON public.monthly_closings FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_admin_closings" ON public.monthly_closings FOR ALL
  USING (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "co_view_closings" ON public.monthly_closings FOR SELECT
  USING (company_id = public.get_user_company_id(auth.uid()));

-- USER_ROLES
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "sa_roles" ON public.user_roles FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "co_admin_roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin') AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = user_roles.user_id AND p.company_id = public.get_user_company_id(auth.uid())
  ));
CREATE POLICY "own_role_select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_role_insert" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Update handle_new_user for multi-tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _empresa_slug text;
BEGIN
  _empresa_slug := NEW.raw_user_meta_data->>'empresa_slug';
  
  IF _empresa_slug IS NOT NULL AND _empresa_slug != '' THEN
    SELECT id INTO _company_id FROM public.companies WHERE slug = _empresa_slug AND ativo = true;
    IF _company_id IS NULL THEN
      RAISE EXCEPTION 'Empresa não encontrada ou inativa';
    END IF;
  ELSE
    INSERT INTO public.companies (nome, slug)
    VALUES (
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'empresa_nome', ''), 'Empresa de ' || COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)),
      LOWER(REPLACE(NEW.id::text, '-', ''))
    )
    RETURNING id INTO _company_id;
  END IF;

  INSERT INTO public.profiles (user_id, nome, email, setor, telefone, ativo, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'setor',
    NEW.raw_user_meta_data->>'telefone',
    false,
    _company_id
  );
  
  IF _empresa_slug IS NULL OR _empresa_slug = '' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'motorista');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 13. Performance indexes
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_vehicles_company ON public.vehicles(company_id);
CREATE INDEX idx_checkouts_company ON public.checkouts(company_id);
CREATE INDEX idx_fuel_company ON public.fuel_records(company_id);
CREATE INDEX idx_incidents_company ON public.incidents(company_id);
CREATE INDEX idx_inspections_company ON public.inspections(company_id);
CREATE INDEX idx_maintenance_company ON public.maintenance(company_id);
CREATE INDEX idx_tickets_company ON public.traffic_tickets(company_id);
CREATE INDEX idx_bookings_company ON public.vehicle_bookings(company_id);
CREATE INDEX idx_km_company ON public.km_divergences(company_id);
CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_companies_ativo ON public.companies(ativo);

-- 14. Updated_at trigger for companies
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

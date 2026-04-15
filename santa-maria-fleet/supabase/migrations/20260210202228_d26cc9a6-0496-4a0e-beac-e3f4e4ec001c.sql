
-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'frota', 'motorista');
CREATE TYPE public.vehicle_type AS ENUM ('carro', 'moto', 'van', 'ambulancia', 'outro');
CREATE TYPE public.vehicle_status AS ENUM ('disponivel', 'em_uso', 'manutencao', 'indisponivel');
CREATE TYPE public.fuel_type AS ENUM ('gasolina', 'etanol', 'diesel', 'outro');
CREATE TYPE public.checkout_status AS ENUM ('aberto', 'fechado', 'pendente_ajuste');
CREATE TYPE public.incident_type AS ENUM ('arranhao', 'amassado', 'pneu', 'mecanica', 'eletrica', 'multa', 'outro');
CREATE TYPE public.severity_level AS ENUM ('leve', 'media', 'grave');
CREATE TYPE public.incident_status AS ENUM ('aberta', 'em_andamento', 'resolvida');
CREATE TYPE public.maintenance_status AS ENUM ('agendada', 'realizada');

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. USER ROLES TABLE
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. VEHICLES TABLE
-- =============================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL UNIQUE,
  prefixo TEXT,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  tipo vehicle_type NOT NULL DEFAULT 'carro',
  status vehicle_status NOT NULL DEFAULT 'disponivel',
  km_atual NUMERIC NOT NULL DEFAULT 0,
  capacidade_tanque_litros NUMERIC,
  tipo_combustivel_padrao fuel_type,
  data_ultima_revisao DATE,
  km_ultima_revisao NUMERIC,
  proxima_revisao_km NUMERIC,
  alerta_revisao_km_intervalo NUMERIC DEFAULT 10000,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CHECKOUTS TABLE
-- =============================================
CREATE TABLE public.checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id),
  motorista_id UUID NOT NULL REFERENCES auth.users(id),
  criado_por_user_id UUID NOT NULL REFERENCES auth.users(id),
  data_hora_retirada TIMESTAMPTZ NOT NULL DEFAULT now(),
  motivo_uso TEXT NOT NULL,
  destino_rota TEXT,
  km_retirada NUMERIC NOT NULL,
  foto_hodometro_retirada TEXT NOT NULL,
  nivel_combustivel_retirada TEXT,
  assinatura_retirada TEXT NOT NULL,
  data_hora_devolucao TIMESTAMPTZ,
  km_devolucao NUMERIC,
  foto_hodometro_devolucao TEXT,
  nivel_combustivel_devolucao TEXT,
  assinatura_devolucao TEXT,
  km_rodado NUMERIC,
  status checkout_status NOT NULL DEFAULT 'aberto',
  observacoes_retirada TEXT,
  observacoes_devolucao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. FUEL RECORDS TABLE
-- =============================================
CREATE TABLE public.fuel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id),
  motorista_id UUID NOT NULL REFERENCES auth.users(id),
  registrado_por_user_id UUID NOT NULL REFERENCES auth.users(id),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo_combustivel fuel_type NOT NULL,
  litros NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  km_no_abastecimento NUMERIC,
  posto_nome TEXT,
  comprovante_foto TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. INCIDENTS TABLE
-- =============================================
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id),
  motorista_id UUID NOT NULL REFERENCES auth.users(id),
  checkout_id UUID REFERENCES public.checkouts(id),
  registrado_por_user_id UUID NOT NULL REFERENCES auth.users(id),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo incident_type NOT NULL,
  descricao TEXT NOT NULL,
  gravidade severity_level NOT NULL DEFAULT 'leve',
  fotos TEXT[] NOT NULL DEFAULT '{}',
  veiculo_imobilizado BOOLEAN NOT NULL DEFAULT false,
  custo_estimado NUMERIC,
  custo_final NUMERIC,
  status incident_status NOT NULL DEFAULT 'aberta',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. MAINTENANCE TABLE
-- =============================================
CREATE TABLE public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id),
  tipo_servico TEXT NOT NULL,
  descricao TEXT,
  data_agendada DATE,
  data_realizada DATE,
  km_na_manutencao NUMERIC,
  custo NUMERIC,
  comprovante_foto TEXT,
  status maintenance_status NOT NULL DEFAULT 'agendada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. SETTINGS TABLE
-- =============================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manutencao_intervalo_km_padrao NUMERIC NOT NULL DEFAULT 10000,
  dias_alerta_revisao_antecipado INTEGER DEFAULT 15,
  motivos_padrao TEXT[] NOT NULL DEFAULT ARRAY['Visita domiciliar', 'Transporte de equipe', 'Transporte de paciente', 'Entrega/retirada de material', 'Serviços externos', 'Outro'],
  politica_de_uso TEXT,
  whatsapp_admin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLES
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- =============================================
-- UPDATE TIMESTAMP TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checkouts_updated_at BEFORE UPDATE ON public.checkouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fuel_records_updated_at BEFORE UPDATE ON public.fuel_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS POLICIES: PROFILES
-- =============================================
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins and frota can view all profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES: USER ROLES
-- =============================================
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES: VEHICLES
-- =============================================
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and frota can manage vehicles" ON public.vehicles FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')
);

-- =============================================
-- RLS POLICIES: CHECKOUTS
-- =============================================
CREATE POLICY "Motoristas can view own checkouts" ON public.checkouts FOR SELECT USING (
  auth.uid() = motorista_id
);
CREATE POLICY "Admin and frota can view all checkouts" ON public.checkouts FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')
);
CREATE POLICY "Authenticated can create checkouts" ON public.checkouts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin and frota can update checkouts" ON public.checkouts FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota') OR auth.uid() = motorista_id
);

-- =============================================
-- RLS POLICIES: FUEL RECORDS
-- =============================================
CREATE POLICY "Authenticated can view fuel records" ON public.fuel_records FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota') OR auth.uid() = motorista_id
);
CREATE POLICY "Authenticated can create fuel records" ON public.fuel_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin and frota can update fuel records" ON public.fuel_records FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')
);

-- =============================================
-- RLS POLICIES: INCIDENTS
-- =============================================
CREATE POLICY "View incidents" ON public.incidents FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota') OR auth.uid() = motorista_id
);
CREATE POLICY "Create incidents" ON public.incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin and frota can update incidents" ON public.incidents FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')
);

-- =============================================
-- RLS POLICIES: MAINTENANCE
-- =============================================
CREATE POLICY "View maintenance" ON public.maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and frota can manage maintenance" ON public.maintenance FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'frota')
);

-- =============================================
-- RLS POLICIES: SETTINGS
-- =============================================
CREATE POLICY "Authenticated can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage settings" ON public.settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('fleet-files', 'fleet-files', true);

CREATE POLICY "Authenticated users can upload fleet files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fleet-files');

CREATE POLICY "Anyone can view fleet files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fleet-files');

CREATE POLICY "Authenticated users can update own fleet files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'fleet-files');

CREATE POLICY "Authenticated users can delete own fleet files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fleet-files');

-- =============================================
-- INSERT DEFAULT SETTINGS
-- =============================================
INSERT INTO public.settings (manutencao_intervalo_km_padrao, motivos_padrao, whatsapp_admin)
VALUES (10000, ARRAY['Visita domiciliar', 'Transporte de equipe', 'Transporte de paciente', 'Entrega/retirada de material', 'Serviços externos', 'Outro'], '');

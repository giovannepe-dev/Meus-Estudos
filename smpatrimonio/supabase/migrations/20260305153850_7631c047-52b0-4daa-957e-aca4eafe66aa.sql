
-- Enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'patrimonio', 'inventario', 'gestor');
CREATE TYPE public.tipo_item AS ENUM ('BIOMEDICO', 'TI', 'MOBILIARIO', 'INSTRUMENTAL', 'OUTROS');
CREATE TYPE public.estado_item AS ENUM ('NOVO', 'BOM', 'REGULAR', 'RUIM', 'INSERVIVEL');
CREATE TYPE public.criticidade_item AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE public.status_item AS ENUM ('EM_USO', 'EM_MANUTENCAO', 'BAIXADO', 'EMPRESTADO');
CREATE TYPE public.motivo_movimentacao AS ENUM ('TRANSFERENCIA', 'EMPRESTIMO', 'DEVOLUCAO', 'MANUTENCAO', 'OUTROS');
CREATE TYPE public.tipo_manutencao AS ENUM ('PREVENTIVA', 'CORRETIVA', 'CALIBRACAO');
CREATE TYPE public.status_inventario AS ENUM ('EM_ANDAMENTO', 'CONCLUIDO');
CREATE TYPE public.tombo_mode AS ENUM ('AUTO_SEQUENCIAL', 'MANUAL');
CREATE TYPE public.label_mode AS ENUM ('QRCODE', 'BARCODE', 'BOTH');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Units (Unidades)
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view units" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio can manage units" ON public.units FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio'));

-- Sectors (Setores)
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view sectors" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio can manage sectors" ON public.sectors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio'));

-- Rooms (Salas)
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio can manage rooms" ON public.rooms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio'));

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio can manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio'));

-- Items
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tombo TEXT NOT NULL UNIQUE,
  nome_item TEXT NOT NULL,
  tipo_item tipo_item NOT NULL,
  categoria_id UUID REFERENCES public.categories(id),
  marca TEXT NOT NULL DEFAULT '',
  modelo TEXT NOT NULL DEFAULT '',
  numero_serie TEXT,
  estado estado_item NOT NULL DEFAULT 'NOVO',
  criticidade criticidade_item NOT NULL DEFAULT 'BAIXA',
  status status_item NOT NULL DEFAULT 'EM_USO',
  valor_aquisicao NUMERIC(12,2),
  data_aquisicao DATE,
  data_instalacao DATE,
  sala_atual_id UUID REFERENCES public.rooms(id) NOT NULL,
  responsavel TEXT,
  observacoes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view items" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio can manage items" ON public.items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio'));

-- Item attachments
CREATE TABLE public.item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.item_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view attachments" ON public.item_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio can manage attachments" ON public.item_attachments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio'));

-- Movements
CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  de_sala_id UUID REFERENCES public.rooms(id) NOT NULL,
  para_sala_id UUID REFERENCES public.rooms(id) NOT NULL,
  motivo motivo_movimentacao NOT NULL,
  observacao TEXT,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view movements" ON public.movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio can create movements" ON public.movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio'));

-- Audit logs
CREATE TABLE public.item_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  campo TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.item_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view audit logs" ON public.item_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert audit logs" ON public.item_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Maintenances
CREATE TABLE public.maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_manutencao NOT NULL,
  data DATE NOT NULL,
  custo NUMERIC(12,2),
  fornecedor TEXT,
  anexo_url TEXT,
  observacao TEXT,
  proxima_manutencao_data DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view maintenances" ON public.maintenances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio can manage maintenances" ON public.maintenances FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio'));

-- Inventories
CREATE TABLE public.inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) NOT NULL,
  iniciado_por_usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  status status_inventario NOT NULL DEFAULT 'EM_ANDAMENTO',
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ
);
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view inventories" ON public.inventories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio/Inventario can manage inventories" ON public.inventories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio') OR public.has_role(auth.uid(), 'inventario'));

-- Inventory scans
CREATE TABLE public.inventory_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.inventories(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view scans" ON public.inventory_scans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Patrimonio/Inventario can insert scans" ON public.inventory_scans FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'patrimonio') OR public.has_role(auth.uid(), 'inventario'));

-- Printer profiles
CREATE TABLE public.printer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo_impressao TEXT NOT NULL DEFAULT 'SISTEMA',
  largura_mm NUMERIC(6,2) NOT NULL DEFAULT 50,
  altura_mm NUMERIC(6,2) NOT NULL DEFAULT 25,
  margem_top_mm NUMERIC(6,2) NOT NULL DEFAULT 2,
  margem_left_mm NUMERIC(6,2) NOT NULL DEFAULT 2,
  margem_right_mm NUMERIC(6,2) NOT NULL DEFAULT 2,
  margem_bottom_mm NUMERIC(6,2) NOT NULL DEFAULT 2,
  orientacao TEXT NOT NULL DEFAULT 'retrato',
  escala NUMERIC(4,2) DEFAULT 1,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.printer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view printer profiles" ON public.printer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage printer profiles" ON public.printer_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Label templates
CREATE TABLE public.label_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  largura_mm NUMERIC(6,2) NOT NULL DEFAULT 50,
  altura_mm NUMERIC(6,2) NOT NULL DEFAULT 25,
  elements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.label_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view label templates" ON public.label_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage label templates" ON public.label_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- App settings (single row)
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tombo_mode tombo_mode NOT NULL DEFAULT 'AUTO_SEQUENCIAL',
  tombo_padding INTEGER NOT NULL DEFAULT 6,
  label_mode label_mode NOT NULL DEFAULT 'QRCODE',
  alert_days_before INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage settings" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.app_settings (tombo_mode, tombo_padding, label_mode, alert_days_before)
VALUES ('AUTO_SEQUENCIAL', 6, 'QRCODE', 15);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_label_templates_updated_at BEFORE UPDATE ON public.label_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get next tombo
CREATE OR REPLACE FUNCTION public.get_next_tombo()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _padding INTEGER;
  _max_tombo BIGINT;
BEGIN
  SELECT tombo_padding INTO _padding FROM public.app_settings LIMIT 1;
  SELECT COALESCE(MAX(tombo::BIGINT), 0) INTO _max_tombo FROM public.items WHERE tombo ~ '^\d+$';
  RETURN LPAD((_max_tombo + 1)::TEXT, _padding, '0');
END;
$$;

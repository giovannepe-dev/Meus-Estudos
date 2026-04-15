
-- 1. Create tenants table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  custom_domain text UNIQUE,
  logo_url text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  telegram_chat_id bigint UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Anyone can view active tenants (needed for domain/slug resolution)
CREATE POLICY "Anyone can view active tenants" ON public.tenants
  FOR SELECT TO public USING (true);

-- Tenant owner can update their own tenant
CREATE POLICY "Owner can update own tenant" ON public.tenants
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

-- Admins can manage all tenants
CREATE POLICY "Admins can manage tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can create tenants (auto-cadastro)
CREATE POLICY "Authenticated users can create tenants" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 2. Add tenant_id to existing tables
ALTER TABLE public.products ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.product_tags ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.home_carousels ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.site_settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.telegram_messages ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 3. Create indexes for tenant_id
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_categories_tenant ON public.categories(tenant_id);
CREATE INDEX idx_product_tags_tenant ON public.product_tags(tenant_id);
CREATE INDEX idx_home_carousels_tenant ON public.home_carousels(tenant_id);
CREATE INDEX idx_site_settings_tenant ON public.site_settings(tenant_id);
CREATE INDEX idx_telegram_messages_tenant ON public.telegram_messages(tenant_id);

-- 4. Helper function to check tenant ownership
CREATE OR REPLACE FUNCTION public.is_tenant_owner(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants WHERE id = _tenant_id AND owner_id = _user_id
  )
$$;

-- 5. Drop old policies and create tenant-aware ones for products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT TO public USING (true);

CREATE POLICY "Tenant owner can manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

-- 6. Drop old policies and create tenant-aware ones for categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;

CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT TO public USING (true);

CREATE POLICY "Tenant owner can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

-- 7. Drop old policies and create tenant-aware ones for product_tags
DROP POLICY IF EXISTS "Admins can manage product tags" ON public.product_tags;
DROP POLICY IF EXISTS "Anyone can view product tags" ON public.product_tags;

CREATE POLICY "Anyone can view product tags" ON public.product_tags
  FOR SELECT TO public USING (true);

CREATE POLICY "Tenant owner can manage product tags" ON public.product_tags
  FOR ALL TO authenticated
  USING (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

-- 8. Drop old policies and create tenant-aware ones for home_carousels
DROP POLICY IF EXISTS "Admins can manage home carousels" ON public.home_carousels;
DROP POLICY IF EXISTS "Anyone can view active home carousels" ON public.home_carousels;

CREATE POLICY "Anyone can view active home carousels" ON public.home_carousels
  FOR SELECT TO public USING (true);

CREATE POLICY "Tenant owner can manage home carousels" ON public.home_carousels
  FOR ALL TO authenticated
  USING (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

-- 9. Drop old policies and create tenant-aware ones for site_settings
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "Tenant owner can manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_tenant_owner(auth.uid(), tenant_id) OR public.has_role(auth.uid(), 'admin'));

-- 10. Update trigger for tenants
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

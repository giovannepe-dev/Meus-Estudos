-- ============================================================
-- LaserPro SaaS - Row Level Security (RLS)
-- ============================================================

-- ============================================================
-- FUNÇÕES HELPERS (usadas nas policies)
-- ============================================================

-- Verifica se o usuário atual é superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_superadmin FROM profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Retorna o tenant_id do usuário atual (primeiro tenant ativo)
CREATE OR REPLACE FUNCTION my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_users
  WHERE user_id = auth.uid() AND ativo = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se o usuário pertence ao tenant
CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND ativo = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se é admin do tenant
CREATE OR REPLACE FUNCTION is_tenant_admin(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND ativo = true
      AND role IN ('tenant_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ATIVAR RLS EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE tenants                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_product_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_product_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_category_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_product_visibility  ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_assets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_storefront_sections ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: PROFILES
-- ============================================================

CREATE POLICY "profiles: usuário vê próprio perfil"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_superadmin());

CREATE POLICY "profiles: usuário edita próprio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- POLICIES: TENANTS
-- ============================================================

-- Superadmin vê tudo; tenant_admin vê o próprio
CREATE POLICY "tenants: leitura"
  ON tenants FOR SELECT
  USING (
    is_superadmin()
    OR is_tenant_member(id)
  );

-- Apenas superadmin cria/edita/deleta tenants
CREATE POLICY "tenants: superadmin gerencia"
  ON tenants FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- ============================================================
-- POLICIES: TENANT_SETTINGS
-- ============================================================

-- Vitrine pública pode ler (anon + autenticados)
CREATE POLICY "tenant_settings: leitura pública"
  ON tenant_settings FOR SELECT
  USING (true);

-- Apenas tenant_admin ou superadmin edita
CREATE POLICY "tenant_settings: admin edita"
  ON tenant_settings FOR UPDATE
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

CREATE POLICY "tenant_settings: superadmin insere"
  ON tenant_settings FOR INSERT
  WITH CHECK (is_superadmin());

-- ============================================================
-- POLICIES: TENANT_USERS
-- ============================================================

CREATE POLICY "tenant_users: membro vê do próprio tenant"
  ON tenant_users FOR SELECT
  USING (
    is_superadmin()
    OR is_tenant_member(tenant_id)
  );

CREATE POLICY "tenant_users: superadmin ou admin gerencia"
  ON tenant_users FOR ALL
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  )
  WITH CHECK (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

-- ============================================================
-- POLICIES: GLOBAL_CATEGORIES
-- ============================================================

-- Todos podem ler (incluindo anon para vitrine pública)
CREATE POLICY "global_categories: leitura pública"
  ON global_categories FOR SELECT
  USING (ativa = true OR is_superadmin());

-- Apenas superadmin escreve
CREATE POLICY "global_categories: superadmin escreve"
  ON global_categories FOR INSERT
  WITH CHECK (is_superadmin());

CREATE POLICY "global_categories: superadmin edita"
  ON global_categories FOR UPDATE
  USING (is_superadmin());

CREATE POLICY "global_categories: superadmin deleta"
  ON global_categories FOR DELETE
  USING (is_superadmin());

-- ============================================================
-- POLICIES: GLOBAL_PRODUCTS
-- ============================================================

CREATE POLICY "global_products: leitura pública"
  ON global_products FOR SELECT
  USING (ativo = true OR is_superadmin());

CREATE POLICY "global_products: superadmin escreve"
  ON global_products FOR INSERT
  WITH CHECK (is_superadmin());

CREATE POLICY "global_products: superadmin edita"
  ON global_products FOR UPDATE
  USING (is_superadmin());

CREATE POLICY "global_products: superadmin deleta"
  ON global_products FOR DELETE
  USING (is_superadmin());

-- ============================================================
-- POLICIES: GLOBAL_PRODUCT_TAGS
-- ============================================================

CREATE POLICY "global_product_tags: leitura pública"
  ON global_product_tags FOR SELECT
  USING (true);

CREATE POLICY "global_product_tags: superadmin gerencia"
  ON global_product_tags FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- ============================================================
-- POLICIES: TENANT_CATEGORIES
-- ============================================================

CREATE POLICY "tenant_categories: leitura pública"
  ON tenant_categories FOR SELECT
  USING (ativa = true OR is_superadmin() OR is_tenant_member(tenant_id));

CREATE POLICY "tenant_categories: tenant_admin escreve"
  ON tenant_categories FOR INSERT
  WITH CHECK (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

CREATE POLICY "tenant_categories: tenant_admin edita"
  ON tenant_categories FOR UPDATE
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

CREATE POLICY "tenant_categories: tenant_admin deleta"
  ON tenant_categories FOR DELETE
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

-- ============================================================
-- POLICIES: TENANT_PRODUCTS
-- ============================================================

CREATE POLICY "tenant_products: leitura pública"
  ON tenant_products FOR SELECT
  USING (ativo = true OR is_superadmin() OR is_tenant_member(tenant_id));

CREATE POLICY "tenant_products: tenant_admin escreve"
  ON tenant_products FOR INSERT
  WITH CHECK (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

CREATE POLICY "tenant_products: tenant_admin edita"
  ON tenant_products FOR UPDATE
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

CREATE POLICY "tenant_products: tenant_admin deleta"
  ON tenant_products FOR DELETE
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

-- ============================================================
-- POLICIES: TENANT_PRODUCT_TAGS
-- ============================================================

CREATE POLICY "tenant_product_tags: leitura pública"
  ON tenant_product_tags FOR SELECT
  USING (true);

CREATE POLICY "tenant_product_tags: tenant_admin gerencia"
  ON tenant_product_tags FOR ALL
  USING (
    is_superadmin()
    OR EXISTS (
      SELECT 1 FROM tenant_products tp
      WHERE tp.id = product_id
        AND is_tenant_admin(tp.tenant_id)
    )
  )
  WITH CHECK (
    is_superadmin()
    OR EXISTS (
      SELECT 1 FROM tenant_products tp
      WHERE tp.id = product_id
        AND is_tenant_admin(tp.tenant_id)
    )
  );

-- ============================================================
-- POLICIES: TENANT_CATEGORY_VISIBILITY
-- ============================================================

CREATE POLICY "tenant_cat_vis: tenant vê própria configuração"
  ON tenant_category_visibility FOR SELECT
  USING (
    is_superadmin()
    OR is_tenant_member(tenant_id)
  );

CREATE POLICY "tenant_cat_vis: tenant_admin gerencia"
  ON tenant_category_visibility FOR ALL
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  )
  WITH CHECK (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

-- ============================================================
-- POLICIES: TENANT_PRODUCT_VISIBILITY
-- ============================================================

CREATE POLICY "tenant_prod_vis: tenant vê própria configuração"
  ON tenant_product_visibility FOR SELECT
  USING (
    is_superadmin()
    OR is_tenant_member(tenant_id)
  );

CREATE POLICY "tenant_prod_vis: tenant_admin gerencia"
  ON tenant_product_visibility FOR ALL
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  )
  WITH CHECK (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

-- ============================================================
-- POLICIES: TELEGRAM_ASSETS
-- ============================================================

CREATE POLICY "telegram_assets: superadmin vê tudo"
  ON telegram_assets FOR SELECT
  USING (
    is_superadmin()
    OR (tenant_id IS NOT NULL AND is_tenant_member(tenant_id))
  );

CREATE POLICY "telegram_assets: superadmin gerencia global"
  ON telegram_assets FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- ============================================================
-- POLICIES: TENANT_STOREFRONT_SECTIONS
-- ============================================================

CREATE POLICY "storefront_sections: leitura pública (ativa)"
  ON tenant_storefront_sections FOR SELECT
  USING (ativa = true OR is_superadmin() OR is_tenant_member(tenant_id));

CREATE POLICY "storefront_sections: tenant_admin escreve"
  ON tenant_storefront_sections FOR INSERT
  WITH CHECK (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

CREATE POLICY "storefront_sections: tenant_admin edita"
  ON tenant_storefront_sections FOR UPDATE
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

CREATE POLICY "storefront_sections: tenant_admin deleta"
  ON tenant_storefront_sections FOR DELETE
  USING (
    is_superadmin()
    OR is_tenant_admin(tenant_id)
  );

-- ============================================================
-- STORAGE BUCKETS (executar via Supabase Dashboard ou API)
-- ============================================================

-- Bucket: global-assets (imagens globais - superadmin)
-- Bucket: tenant-assets (imagens por tenant)
-- Bucket: banners (banners dos tenants)

-- Exemplo de policy para storage (via SQL):
/*
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('global-assets', 'global-assets', true),
  ('tenant-assets', 'tenant-assets', true),
  ('banners', 'banners', true);

-- Policy: qualquer um pode ler imagens públicas
CREATE POLICY "storage: leitura pública global-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'global-assets');

-- Policy: superadmin faz upload em global-assets
CREATE POLICY "storage: superadmin upload global"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'global-assets' AND is_superadmin());

-- Policy: tenant_admin faz upload na pasta do próprio tenant
CREATE POLICY "storage: tenant upload própria pasta"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND is_tenant_admin((storage.foldername(name))[1]::UUID)
  );
*/

-- ============================================================
-- DADOS INICIAIS: superadmin seed
-- ============================================================

-- Execute após criar o usuário no Supabase Auth:
-- UPDATE profiles SET is_superadmin = true WHERE id = 'SEU_USER_ID';

-- ============================================================
-- LaserPro SaaS - Índices e Triggers
-- ============================================================

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================

-- Tenants
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Tenant Users
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);

-- Global Categories
CREATE INDEX idx_global_categories_slug ON global_categories(slug);
CREATE INDEX idx_global_categories_ativa ON global_categories(ativa);
CREATE INDEX idx_global_categories_ordem ON global_categories(ordem);

-- Global Products
CREATE INDEX idx_global_products_slug ON global_products(slug);
CREATE INDEX idx_global_products_categoria ON global_products(categoria_id);
CREATE INDEX idx_global_products_ativo ON global_products(ativo);
CREATE INDEX idx_global_products_destaque ON global_products(destaque);
CREATE INDEX idx_global_products_novidade ON global_products(novidade);
CREATE INDEX idx_global_products_search ON global_products USING GIN(search_vector);

-- Global Product Tags (busca por tag)
CREATE INDEX idx_global_product_tags_tag ON global_product_tags(tag);
CREATE INDEX idx_global_product_tags_product ON global_product_tags(product_id);

-- Tenant Categories
CREATE INDEX idx_tenant_categories_tenant ON tenant_categories(tenant_id);
CREATE INDEX idx_tenant_categories_slug ON tenant_categories(tenant_id, slug);

-- Tenant Products
CREATE INDEX idx_tenant_products_tenant ON tenant_products(tenant_id);
CREATE INDEX idx_tenant_products_slug ON tenant_products(tenant_id, slug);
CREATE INDEX idx_tenant_products_categoria ON tenant_products(categoria_id);
CREATE INDEX idx_tenant_products_search ON tenant_products USING GIN(search_vector);

-- Tenant Product Tags
CREATE INDEX idx_tenant_product_tags_tag ON tenant_product_tags(tag);
CREATE INDEX idx_tenant_product_tags_product ON tenant_product_tags(product_id);

-- Visibility
CREATE INDEX idx_tenant_cat_vis_tenant ON tenant_category_visibility(tenant_id);
CREATE INDEX idx_tenant_prod_vis_tenant ON tenant_product_visibility(tenant_id);

-- Telegram Assets
CREATE INDEX idx_telegram_assets_tenant ON telegram_assets(tenant_id);

-- Tenant Storefront Sections
CREATE INDEX idx_tenant_storefront_sections_tenant ON tenant_storefront_sections(tenant_id);
CREATE INDEX idx_tenant_storefront_sections_ordem ON tenant_storefront_sections(tenant_id, ordem);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tenant_users_updated_at
  BEFORE UPDATE ON tenant_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_global_categories_updated_at
  BEFORE UPDATE ON global_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_global_products_updated_at
  BEFORE UPDATE ON global_products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tenant_categories_updated_at
  BEFORE UPDATE ON tenant_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tenant_products_updated_at
  BEFORE UPDATE ON tenant_products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tenant_storefront_sections_updated_at
  BEFORE UPDATE ON tenant_storefront_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGERS: search_vector automático (busca full-text)
-- ============================================================

-- Global Products
CREATE OR REPLACE FUNCTION update_global_product_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.nome, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.descricao, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.arquivo, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_global_products_search
  BEFORE INSERT OR UPDATE ON global_products
  FOR EACH ROW EXECUTE FUNCTION update_global_product_search();

-- Tenant Products
CREATE OR REPLACE FUNCTION update_tenant_product_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.nome, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.descricao, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.arquivo, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenant_products_search
  BEFORE INSERT OR UPDATE ON tenant_products
  FOR EACH ROW EXECUTE FUNCTION update_tenant_product_search();

-- ============================================================
-- TRIGGER: criar profile automaticamente ao criar usuário
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auth_users_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: criar tenant_settings ao criar tenant
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_tenant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_settings (tenant_id, nome_site)
  VALUES (NEW.id, NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_settings
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION handle_new_tenant();

-- ============================================================
-- FUNÇÃO UTILITÁRIA: gerar slug único
-- ============================================================

CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := lower(input_text);
  result := regexp_replace(result, '[áàãâä]', 'a', 'g');
  result := regexp_replace(result, '[éèêë]', 'e', 'g');
  result := regexp_replace(result, '[íìîï]', 'i', 'g');
  result := regexp_replace(result, '[óòõôö]', 'o', 'g');
  result := regexp_replace(result, '[úùûü]', 'u', 'g');
  result := regexp_replace(result, '[ç]', 'c', 'g');
  result := regexp_replace(result, '[^a-z0-9\s-]', '', 'g');
  result := regexp_replace(result, '\s+', '-', 'g');
  result := regexp_replace(result, '-+', '-', 'g');
  result := trim(both '-' from result);
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- VIEW: catálogo combinado por tenant (global + próprio)
-- ============================================================

CREATE OR REPLACE VIEW v_tenant_catalog_products AS
  -- Produtos globais visíveis para o tenant
  SELECT
    gp.id,
    'global' AS source,
    tu.tenant_id,
    gp.nome,
    gp.slug,
    gp.descricao,
    gp.arquivo,
    gp.imagem_url,
    gp.preco,
    gp.destaque,
    gp.personalizavel,
    gp.novidade,
    gp.ordem,
    gc.nome AS categoria_nome,
    gc.slug AS categoria_slug,
    gc.emoji AS categoria_emoji,
    gp.search_vector,
    gp.created_at
  FROM global_products gp
  LEFT JOIN global_categories gc ON gc.id = gp.categoria_id
  CROSS JOIN tenants tu
  WHERE gp.ativo = true
    AND gc.ativa = true
    AND NOT EXISTS (
      SELECT 1 FROM tenant_product_visibility tpv
      WHERE tpv.tenant_id = tu.id
        AND tpv.product_id = gp.id
        AND tpv.hidden = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM tenant_category_visibility tcv
      WHERE tcv.tenant_id = tu.id
        AND tcv.category_id = gc.id
        AND tcv.hidden = true
    )

  UNION ALL

  -- Produtos próprios do tenant
  SELECT
    tp.id,
    'tenant' AS source,
    tp.tenant_id,
    tp.nome,
    tp.slug,
    tp.descricao,
    tp.arquivo,
    tp.imagem_url,
    tp.preco,
    tp.destaque,
    tp.personalizavel,
    tp.novidade,
    tp.ordem,
    tc.nome AS categoria_nome,
    tc.slug AS categoria_slug,
    tc.emoji AS categoria_emoji,
    tp.search_vector,
    tp.created_at
  FROM tenant_products tp
  LEFT JOIN tenant_categories tc ON tc.id = tp.categoria_id
  WHERE tp.ativo = true;

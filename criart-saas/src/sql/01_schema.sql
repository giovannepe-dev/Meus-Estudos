-- ============================================================
-- LaserPro SaaS - Schema Principal
-- Versão: 1.0.0
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca full-text otimizada

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('superadmin', 'tenant_admin', 'tenant_staff');
CREATE TYPE tenant_status AS ENUM ('active', 'inactive', 'suspended', 'trial');
CREATE TYPE plan_type AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- ============================================================
-- 1. TENANTS
-- ============================================================

CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,         -- URL: laserpro.com/t/minha-empresa
  name          TEXT NOT NULL,
  status        tenant_status NOT NULL DEFAULT 'trial',
  plan          plan_type NOT NULL DEFAULT 'free',
  plan_days     INT DEFAULT 30,               -- dias do plano contratado
  plan_expires_at TIMESTAMPTZ,                -- data de expiração do plano
  owner_email   TEXT,                        -- email do responsável/dono da empresa
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. TENANT_SETTINGS (identidade visual por tenant)
-- ============================================================

CREATE TABLE tenant_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  nome_site       TEXT NOT NULL DEFAULT '',
  slogan          TEXT,
  descricao       TEXT,
  whatsapp        TEXT,
  instagram       TEXT,
  logo_url        TEXT,
  banner_url      TEXT,
  cor_destaque    TEXT NOT NULL DEFAULT '#7C3AED',
  mostrar_preco   BOOLEAN NOT NULL DEFAULT false,
  mensagem_padrao TEXT NOT NULL DEFAULT 'Olá! Gostaria de fazer um orçamento:',
  meta_title      TEXT,
  meta_description TEXT,
  custom_domain   TEXT UNIQUE,
  cnpj            VARCHAR(20),                -- CNPJ da empresa (opcional)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. TENANT_USERS (vínculo usuário <-> tenant)
-- ============================================================

CREATE TABLE tenant_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'tenant_staff',
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- ============================================================
-- 4. GLOBAL_CATEGORIES (biblioteca do superadmin)
-- ============================================================

CREATE TABLE global_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  emoji       TEXT,
  descricao   TEXT,
  imagem_url  TEXT,
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativa       BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. GLOBAL_PRODUCTS (produtos da biblioteca global)
-- ============================================================

CREATE TABLE global_products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id    UUID REFERENCES global_categories(id) ON DELETE SET NULL,
  nome            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  descricao       TEXT,
  arquivo         TEXT,                  -- nome do arquivo MDF/laser
  imagem_url      TEXT,
  preco           NUMERIC(10,2),
  destaque        BOOLEAN NOT NULL DEFAULT false,
  personalizavel  BOOLEAN NOT NULL DEFAULT false,
  novidade        BOOLEAN NOT NULL DEFAULT false,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  ordem           INTEGER NOT NULL DEFAULT 0,
  -- busca otimizada
  search_vector   TSVECTOR,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. GLOBAL_PRODUCT_TAGS
-- ============================================================

CREATE TABLE global_product_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES global_products(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  UNIQUE(product_id, tag)
);

-- ============================================================
-- 7. TENANT_CATEGORIES (categorias próprias do tenant)
-- ============================================================

CREATE TABLE tenant_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  emoji       TEXT,
  descricao   TEXT,
  imagem_url  TEXT,
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativa       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- ============================================================
-- 8. TENANT_PRODUCTS (produtos próprios do tenant)
-- ============================================================

CREATE TABLE tenant_products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categoria_id    UUID REFERENCES tenant_categories(id) ON DELETE SET NULL,
  nome            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  descricao       TEXT,
  arquivo         TEXT,
  imagem_url      TEXT,
  preco           NUMERIC(10,2),
  destaque        BOOLEAN NOT NULL DEFAULT false,
  personalizavel  BOOLEAN NOT NULL DEFAULT false,
  novidade        BOOLEAN NOT NULL DEFAULT false,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  ordem           INTEGER NOT NULL DEFAULT 0,
  search_vector   TSVECTOR,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- ============================================================
-- 9. TENANT_PRODUCT_TAGS
-- ============================================================

CREATE TABLE tenant_product_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES tenant_products(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  UNIQUE(product_id, tag)
);

-- ============================================================
-- 10. TENANT_CATEGORY_VISIBILITY
-- Controla quais categorias globais cada tenant oculta
-- ============================================================

CREATE TABLE tenant_category_visibility (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES global_categories(id) ON DELETE CASCADE,
  hidden      BOOLEAN NOT NULL DEFAULT true,   -- true = ocultar do tenant
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, category_id)
);

-- ============================================================
-- 11. TENANT_PRODUCT_VISIBILITY
-- Controla quais produtos globais cada tenant oculta
-- ============================================================

CREATE TABLE tenant_product_visibility (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES global_products(id) ON DELETE CASCADE,
  hidden      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, product_id)
);

-- ============================================================
-- 12. TELEGRAM_ASSETS (webhook e integração bot)
-- ============================================================

CREATE TABLE telegram_assets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,   -- NULL = global
  product_id    UUID,                                              -- pode ser global ou tenant
  product_type  TEXT CHECK (product_type IN ('global', 'tenant')),
  file_id       TEXT,          -- Telegram file_id para reuso
  file_type     TEXT,          -- photo, document, etc
  caption       TEXT,
  synced_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. TENANT_STOREFRONT_SECTIONS (carrosseis configuráveis vitrine)
-- ============================================================

CREATE TABLE tenant_storefront_sections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,               -- título do carrossel (ex: "Destaca dos")
  category_source TEXT NOT NULL CHECK (category_source IN ('global', 'tenant')),
  category_id     UUID NOT NULL,               -- referencia global_categories ou tenant_categories
  ordem           INTEGER NOT NULL DEFAULT 0,  -- ordem de exibição
  ativa           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUPERADMIN PROFILE (metadado extra no auth.users)
-- ============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  is_superadmin BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

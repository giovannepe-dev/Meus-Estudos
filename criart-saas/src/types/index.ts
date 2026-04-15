// ============================================================
// CriArt Oficina Digital SaaS - Tipos TypeScript
// Gerado a partir do schema Supabase
// ============================================================

// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'superadmin' | 'tenant_admin' | 'tenant_staff'
export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'trial'
export type PlanType = 'free' | 'starter' | 'professional' | 'enterprise'
export type ProductSource = 'global' | 'tenant'

// ============================================================
// DATABASE TYPES (espelham as tabelas do Supabase)
// ============================================================

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_superadmin: boolean
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  slug: string
  name: string
  status: TenantStatus
  plan: PlanType
  plan_days: number
  plan_expires_at: string | null
  owner_email: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // relations (joins opcionais)
  settings?: TenantSettings
}

export interface TenantSettings {
  id: string
  tenant_id: string
  nome_site: string
  slogan: string | null
  descricao: string | null
  whatsapp: string | null
  instagram: string | null
  logo_url: string | null
  banner_url: string | null
  cor_destaque: string
  mostrar_preco: boolean
  mensagem_padrao: string
  meta_title: string | null
  meta_description: string | null
  custom_domain: string | null
  cnpj: string | null
  created_at: string
  updated_at: string
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: UserRole
  ativo: boolean
  created_at: string
  updated_at: string
  // relations
  tenant?: Tenant
  profile?: Profile
}

export interface GlobalCategory {
  id: string
  nome: string
  slug: string
  emoji: string | null
  descricao: string | null
  imagem_url: string | null
  ordem: number
  ativa: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  // relations
  products?: GlobalProduct[]
  _count?: { products: number }
}

export interface GlobalProduct {
  id: string
  categoria_id: string | null
  nome: string
  slug: string
  descricao: string | null
  arquivo: string | null
  imagem_url: string | null
  preco: number | null
  destaque: boolean
  personalizavel: boolean
  novidade: boolean
  ativo: boolean
  ordem: number
  created_by: string | null
  created_at: string
  updated_at: string
  // relations
  categoria?: GlobalCategory
  tags?: GlobalProductTag[]
}

export interface GlobalProductTag {
  id: string
  product_id: string
  tag: string
}

export interface TenantCategory {
  id: string
  tenant_id: string
  nome: string
  slug: string
  emoji: string | null
  descricao: string | null
  imagem_url: string | null
  ordem: number
  ativa: boolean
  created_at: string
  updated_at: string
  // relations
  products?: TenantProduct[]
}

export interface TenantProduct {
  id: string
  tenant_id: string
  categoria_id: string | null
  nome: string
  slug: string
  descricao: string | null
  arquivo: string | null
  imagem_url: string | null
  preco: number | null
  destaque: boolean
  personalizavel: boolean
  novidade: boolean
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
  // relations
  categoria?: TenantCategory
  tags?: TenantProductTag[]
}

export interface TenantProductTag {
  id: string
  product_id: string
  tag: string
}

export interface TenantCategoryVisibility {
  id: string
  tenant_id: string
  category_id: string
  hidden: boolean
  created_at: string
}

export interface TenantProductVisibility {
  id: string
  tenant_id: string
  product_id: string
  hidden: boolean
  created_at: string
}

export interface TelegramAsset {
  id: string
  tenant_id: string | null
  product_id: string | null
  product_type: 'global' | 'tenant' | null
  file_id: string | null
  file_type: string | null
  caption: string | null
  synced_at: string | null
  created_at: string
}

export interface TenantStorefrontSection {
  id: string
  tenant_id: string
  title: string
  category_source: 'global' | 'tenant'
  category_id: string
  ordem: number
  ativa: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// PRODUTO UNIFICADO (view v_tenant_catalog_products)
// Combina produtos globais visíveis + produtos do tenant
// ============================================================

export interface CatalogProduct {
  id: string
  source: ProductSource
  tenant_id: string
  nome: string
  slug: string
  descricao: string | null
  arquivo: string | null
  imagem_url: string | null
  preco: number | null
  destaque: boolean
  personalizavel: boolean
  novidade: boolean
  ordem: number
  categoria_nome: string | null
  categoria_slug: string | null
  categoria_emoji: string | null
  created_at: string
  // enriquecido no front
  tags?: string[]
}

// ============================================================
// CARRINHO
// ============================================================

export interface CartItem {
  id: string                  // unique cart item id (uuid client-side)
  product: CatalogProduct
  quantidade: number
  observacao: string
}

export interface Cart {
  items: CartItem[]
  tenantSlug: string
}

// ============================================================
// FORMULÁRIOS (React Hook Form + Zod)
// ============================================================

export interface TenantFormData {
  slug: string
  name: string
  status: TenantStatus
  plan: PlanType
}

export interface TenantSettingsFormData {
  nome_site: string
  slogan?: string
  descricao?: string
  whatsapp?: string
  instagram?: string
  cor_destaque: string
  mostrar_preco: boolean
  mensagem_padrao: string
  meta_title?: string
  meta_description?: string
}

export interface GlobalCategoryFormData {
  nome: string
  slug?: string        // auto-gerado se vazio
  emoji?: string
  descricao?: string
  ordem: number
  ativa: boolean
}

export interface GlobalProductFormData {
  categoria_id?: string
  nome: string
  slug?: string
  descricao?: string
  arquivo?: string
  preco?: number
  destaque: boolean
  personalizavel: boolean
  novidade: boolean
  ativo: boolean
  ordem: number
  tags: string[]
}

export type TenantCategoryFormData = Omit<GlobalCategoryFormData, 'slug'> & {
  slug?: string
}

export type TenantProductFormData = GlobalProductFormData & {
  tenant_categoria_id?: string
}

// ============================================================
// PAGINAÇÃO
// ============================================================

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ============================================================
// FILTROS DO CATÁLOGO
// ============================================================

export interface CatalogFilters {
  search?: string
  categoriaSlug?: string
  destaque?: boolean
  novidade?: boolean
  personalizavel?: boolean
  source?: ProductSource | 'all'
}

// ============================================================
// WHATSAPP
// ============================================================

export interface WhatsAppOrderItem {
  nome: string
  arquivo: string | null
  categoria: string | null
  quantidade: number
  preco: number | null
  observacao: string
}

export interface WhatsAppOrderPayload {
  settings: TenantSettings
  items: WhatsAppOrderItem[]
  totalEstimado: number | null
  mostrarPreco: boolean
}

// ============================================================
// DASHBOARD ADMIN
// ============================================================

export interface SuperadminDashboard {
  totalTenants: number
  activeTenants: number
  totalGlobalProducts: number
  totalGlobalCategories: number
  recentTenants: Tenant[]
}

export interface TenantDashboard {
  totalProducts: number        // próprios + globais visíveis
  totalOwnProducts: number
  totalCategories: number
  featuredProducts: number
  hiddenGlobalProducts: number
  hiddenGlobalCategories: number
}

// ============================================================
// SUPABASE DATABASE TYPE (gerado pelo CLI, estrutura base)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      tenants: {
        Row: Tenant
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'settings'>
        Update: Partial<Omit<Tenant, 'id' | 'settings'>>
      }
      tenant_settings: {
        Row: TenantSettings
        Insert: Omit<TenantSettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TenantSettings, 'id' | 'tenant_id'>>
      }
      tenant_users: {
        Row: TenantUser
        Insert: Omit<TenantUser, 'id' | 'created_at' | 'updated_at' | 'tenant' | 'profile'>
        Update: Partial<Omit<TenantUser, 'id' | 'tenant' | 'profile'>>
      }
      global_categories: {
        Row: GlobalCategory
        Insert: Omit<GlobalCategory, 'id' | 'created_at' | 'updated_at' | 'products' | '_count'>
        Update: Partial<Omit<GlobalCategory, 'id' | 'products' | '_count'>>
      }
      global_products: {
        Row: GlobalProduct
        Insert: Omit<GlobalProduct, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'tags'>
        Update: Partial<Omit<GlobalProduct, 'id' | 'categoria' | 'tags'>>
      }
      global_product_tags: {
        Row: GlobalProductTag
        Insert: Omit<GlobalProductTag, 'id'>
        Update: Partial<GlobalProductTag>
      }
      tenant_categories: {
        Row: TenantCategory
        Insert: Omit<TenantCategory, 'id' | 'created_at' | 'updated_at' | 'products'>
        Update: Partial<Omit<TenantCategory, 'id' | 'products'>>
      }
      tenant_products: {
        Row: TenantProduct
        Insert: Omit<TenantProduct, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'tags'>
        Update: Partial<Omit<TenantProduct, 'id' | 'categoria' | 'tags'>>
      }
      tenant_product_tags: {
        Row: TenantProductTag
        Insert: Omit<TenantProductTag, 'id'>
        Update: Partial<TenantProductTag>
      }
      tenant_category_visibility: {
        Row: TenantCategoryVisibility
        Insert: Omit<TenantCategoryVisibility, 'id' | 'created_at'>
        Update: Partial<TenantCategoryVisibility>
      }
      tenant_product_visibility: {
        Row: TenantProductVisibility
        Insert: Omit<TenantProductVisibility, 'id' | 'created_at'>
        Update: Partial<TenantProductVisibility>
      }
      telegram_assets: {
        Row: TelegramAsset
        Insert: Omit<TelegramAsset, 'id' | 'created_at'>
        Update: Partial<Omit<TelegramAsset, 'id'>>
      }
    }
    Views: {
      v_tenant_catalog_products: {
        Row: CatalogProduct
      }
    }
    Functions: {
      is_superadmin: { Returns: boolean }
      my_tenant_id: { Returns: string }
      is_tenant_member: { Args: { p_tenant_id: string }; Returns: boolean }
      is_tenant_admin: { Args: { p_tenant_id: string }; Returns: boolean }
      generate_slug: { Args: { input_text: string }; Returns: string }
    }
  }
}

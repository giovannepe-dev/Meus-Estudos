# ============================================================
# LaserPro SaaS — Estrutura Completa do Projeto
# Next.js 15 App Router + TypeScript + Tailwind + Supabase
# ============================================================

laserpro/
├── .env.local                        # variáveis de ambiente
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts                     # proteção de rotas + tenant lookup
│
├── public/
│   ├── logo.svg
│   └── og-default.png
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   │
│   │   ├── (public)/                 # Rotas públicas (vitrine)
│   │   │   └── [tenantSlug]/
│   │   │       ├── layout.tsx        # carrega tenant_settings, aplica tema
│   │   │       ├── page.tsx          # Home da vitrine
│   │   │       ├── catalogo/
│   │   │       │   └── page.tsx      # Catálogo completo
│   │   │       ├── categoria/
│   │   │       │   └── [slug]/
│   │   │       │       └── page.tsx  # Categoria + produtos
│   │   │       ├── produto/
│   │   │       │   └── [slug]/
│   │   │       │       └── page.tsx  # Produto individual
│   │   │       └── carrinho/
│   │   │           └── page.tsx      # Carrinho + finalização
│   │   │
│   │   ├── (auth)/                   # Rotas de autenticação
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── cadastro/
│   │   │   │   └── page.tsx
│   │   │   └── reset-senha/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (superadmin)/             # Painel superadmin
│   │   │   └── superadmin/
│   │   │       ├── layout.tsx        # sidebar superadmin
│   │   │       ├── page.tsx          # Dashboard
│   │   │       ├── tenants/
│   │   │       │   ├── page.tsx      # Lista tenants
│   │   │       │   ├── novo/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx  # Editar tenant
│   │   │       │       └── configuracoes/
│   │   │       │           └── page.tsx
│   │   │       ├── categorias/
│   │   │       │   ├── page.tsx      # Lista categorias globais
│   │   │       │   ├── nova/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       ├── produtos/
│   │   │       │   ├── page.tsx      # Lista produtos globais
│   │   │       │   ├── novo/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       └── configuracoes/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (tenant)/                 # Painel tenant
│   │   │   └── admin/
│   │   │       ├── layout.tsx        # sidebar tenant
│   │   │       ├── page.tsx          # Dashboard tenant
│   │   │       ├── categorias/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── nova/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       ├── produtos/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── novo/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       ├── biblioteca/
│   │   │       │   └── page.tsx      # Ocultar/mostrar global
│   │   │       ├── equipe/
│   │   │       │   └── page.tsx      # Gerenciar usuários do tenant
│   │   │       └── configuracoes/
│   │   │           └── page.tsx      # Editar tenant_settings
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── webhooks/
│   │   │   │   └── telegram/
│   │   │   │       └── route.ts      # Webhook bot Telegram
│   │   │   ├── catalog/
│   │   │   │   └── [tenantSlug]/
│   │   │   │       └── route.ts      # API pública do catálogo
│   │   │   └── admin/
│   │   │       ├── tenants/
│   │   │       │   └── route.ts
│   │   │       └── upload/
│   │   │           └── route.ts      # Upload para Supabase Storage
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sheet.tsx             # mobile drawer
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (demais shadcn)
│   │   │
│   │   ├── storefront/               # Componentes da vitrine pública
│   │   │   ├── StorefrontHeader.tsx
│   │   │   ├── StorefrontHero.tsx
│   │   │   ├── StorefrontFooter.tsx
│   │   │   ├── CategoryGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── CatalogFilters.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   └── FeaturedSection.tsx
│   │   │
│   │   ├── cart/                     # Carrinho
│   │   │   ├── CartDrawer.tsx        # drawer lateral mobile
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   ├── CartButton.tsx        # botão flutuante
│   │   │   └── WhatsAppCheckout.tsx  # finalização
│   │   │
│   │   ├── admin/                    # Componentes admin compartilhados
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── AdminHeader.tsx
│   │   │   ├── DataTable.tsx         # tabela paginada reutilizável
│   │   │   ├── ImageUpload.tsx       # upload + preview
│   │   │   ├── TagInput.tsx          # input de tags
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── StatusBadge.tsx
│   │   │
│   │   ├── superadmin/               # Específicos do superadmin
│   │   │   ├── TenantCard.tsx
│   │   │   ├── TenantForm.tsx
│   │   │   ├── GlobalProductForm.tsx
│   │   │   ├── GlobalCategoryForm.tsx
│   │   │   └── SuperadminStats.tsx
│   │   │
│   │   ├── tenant/                   # Específicos do tenant
│   │   │   ├── TenantProductForm.tsx
│   │   │   ├── TenantCategoryForm.tsx
│   │   │   ├── LibraryVisibility.tsx # ocultar itens globais
│   │   │   ├── TenantStats.tsx
│   │   │   └── SettingsForm.tsx
│   │   │
│   │   └── shared/                   # Compartilhados
│   │       ├── ThemeProvider.tsx
│   │       ├── TenantThemeWrapper.tsx
│   │       ├── AuthGuard.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── SEOHead.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # createBrowserClient
│   │   │   ├── server.ts             # createServerClient (SSR)
│   │   │   ├── middleware.ts         # createMiddlewareClient
│   │   │   └── admin.ts              # createClient com service_role
│   │   │
│   │   ├── queries/                  # Funções de query TanStack Query
│   │   │   ├── tenants.ts
│   │   │   ├── globalProducts.ts
│   │   │   ├── globalCategories.ts
│   │   │   ├── tenantProducts.ts
│   │   │   ├── tenantCategories.ts
│   │   │   ├── tenantSettings.ts
│   │   │   └── catalog.ts            # view combinada
│   │   │
│   │   ├── mutations/                # Funções de mutação
│   │   │   ├── tenants.ts
│   │   │   ├── globalProducts.ts
│   │   │   ├── tenantProducts.ts
│   │   │   ├── visibility.ts
│   │   │   └── settings.ts
│   │   │
│   │   ├── hooks/                    # React hooks customizados
│   │   │   ├── useAuth.ts
│   │   │   ├── useCart.ts            # zustand
│   │   │   ├── useTenant.ts
│   │   │   ├── useCatalog.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── useInfiniteScroll.ts
│   │   │
│   │   ├── store/                    # Zustand stores
│   │   │   ├── cartStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── slug.ts               # geração de slugs
│   │   │   ├── whatsapp.ts           # formatação de mensagem
│   │   │   ├── currency.ts           # formatação BRL
│   │   │   ├── image.ts              # helpers de imagem
│   │   │   └── cn.ts                 # clsx + tailwind-merge
│   │   │
│   │   └── validations/              # Schemas Zod
│   │       ├── tenant.ts
│   │       ├── product.ts
│   │       ├── category.ts
│   │       └── settings.ts
│   │
│   └── types/
│       ├── index.ts                  # tipos principais (ver arquivo separado)
│       └── supabase.ts               # gerado por: supabase gen types
│
├── supabase/                         # Supabase local / migrations
│   ├── config.toml
│   └── migrations/
│       ├── 20240101000000_schema.sql
│       ├── 20240101000001_indexes_triggers.sql
│       └── 20240101000002_rls_policies.sql
│
└── docs/
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    └── DEPLOY.md

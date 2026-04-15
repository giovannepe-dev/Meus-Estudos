# LaserPro SaaS — Arquitetura e Deploy

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript 5 |
| UI | Tailwind CSS + shadcn/ui |
| Banco | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| State | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| Deploy | Vercel |

---

## Fluxo Multi-Tenant

```
Visitante acessa: laserpro.com/vitrine/minha-empresa
                         ↓
          middleware.ts verifica tenant slug
                         ↓
          layout.tsx carrega tenant_settings
                         ↓
     aplica tema (cor, logo, banner) via CSS variables
                         ↓
    vitrine combina: global visível + próprios do tenant
```

---

## Hierarquia de Acesso

```
superadmin
  ├── CRUD completo: tenants
  ├── CRUD completo: global_categories
  ├── CRUD completo: global_products
  └── visualiza todos os dados

tenant_admin
  ├── Edita: tenant_settings (do próprio tenant)
  ├── CRUD: tenant_categories (do próprio tenant)
  ├── CRUD: tenant_products (do próprio tenant)
  ├── Gerencia: visibilidade de global no próprio tenant
  └── Gerencia: tenant_users (do próprio tenant)

tenant_staff (opcional)
  ├── Visualiza: produtos e categorias do tenant
  └── NÃO pode editar configurações ou criar/excluir

visitante público
  └── Lê apenas dados ativos e visíveis para o tenant
```

---

## Catálogo Combinado (View SQL)

A view `v_tenant_catalog_products` combina:

1. **Produtos Globais** visíveis para o tenant
   - Filtra `ativo = true` e `global_categories.ativa = true`
   - Exclui produtos em `tenant_product_visibility WHERE hidden = true`
   - Exclui produtos cuja categoria esteja em `tenant_category_visibility WHERE hidden = true`

2. **Produtos do Tenant** (próprios)
   - Filtra `ativo = true` e `tenant_id = :tenantId`

---

## Rotas do App

### Públicas (vitrine)
```
/vitrine/[tenantSlug]                   → Home do tenant
/vitrine/[tenantSlug]/catalogo          → Catálogo completo
/vitrine/[tenantSlug]/categoria/[slug]  → Produtos por categoria
/vitrine/[tenantSlug]/produto/[slug]    → Produto individual
/vitrine/[tenantSlug]/carrinho          → Carrinho + WhatsApp
```

### Autenticação
```
/login          → Login
/cadastro       → Registro
/reset-senha    → Resetar senha
```

### Painel Superadmin
```
/superadmin                     → Dashboard
/superadmin/tenants             → Lista de tenants
/superadmin/tenants/novo        → Criar tenant
/superadmin/tenants/[id]        → Editar tenant
/superadmin/categorias          → Categorias globais
/superadmin/produtos            → Produtos globais
/superadmin/configuracoes       → Config sistema
```

### Painel Tenant Admin
```
/admin                          → Dashboard
/admin/categorias               → Categorias próprias
/admin/produtos                 → Produtos próprios
/admin/biblioteca               → Ocultar/mostrar global
/admin/equipe                   → Usuários do tenant
/admin/configuracoes            → Identidade visual
```

### API Routes
```
POST /api/webhooks/telegram     → Webhook bot Telegram
GET  /api/webhooks/telegram     → Configura webhook
GET  /api/catalog/[tenantSlug]  → API pública do catálogo
```

---

## Supabase Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `global-assets` | ✅ | Imagens produtos/categorias globais |
| `tenant-assets` | ✅ | Imagens produtos/categorias do tenant |
| `banners` | ✅ | Banners e logos dos tenants |

### Estrutura de pastas

```
global-assets/
  products/[product-id]/[filename]
  categories/[category-id]/[filename]

tenant-assets/
  [tenant-id]/products/[product-id]/[filename]
  [tenant-id]/categories/[category-id]/[filename]

banners/
  [tenant-id]/banner.[ext]
  [tenant-id]/logo.[ext]
```

---

## Deploy na Vercel

1. Fork/clone o repositório
2. Conectar ao Vercel
3. Configurar variáveis de ambiente:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_APP_URL
   TELEGRAM_BOT_TOKEN
   TELEGRAM_WEBHOOK_SECRET
   ```
4. Deploy automático ao push

---

## Setup Inicial do Banco

```bash
# 1. Criar projeto no Supabase
# 2. Executar os SQLs na ordem:
psql -f sql/01_schema.sql
psql -f sql/02_indexes_triggers.sql
psql -f sql/03_rls_policies.sql

# 3. Criar usuário superadmin no Supabase Auth
# 4. Marcar como superadmin:
UPDATE profiles SET is_superadmin = true WHERE id = 'SEU_USER_ID';

# 5. Criar buckets de storage no dashboard do Supabase
```

---

## Escalabilidade

- **Busca**: `pg_trgm` + `tsvector` full-text para milhares de produtos
- **Paginação**: cursor-based via TanStack Query infinite scroll
- **Cache**: TanStack Query com staleTime configurado por contexto
- **Imagens**: Next.js `<Image>` com otimização automática
- **RLS**: queries filtradas no banco, sem N+1 no servidor
- **View combinada**: SQL eficiente, índices em todas as colunas de filtro

---

## Próximas Etapas (Roadmap)

- [ ] Domínio customizado por tenant (via custom_domain + Vercel)
- [ ] Planos e billing (Stripe)
- [ ] Analytics por tenant
- [ ] Export CSV de produtos
- [ ] API pública por tenant com token
- [ ] PWA para vitrine
- [ ] Notificações push para orçamentos

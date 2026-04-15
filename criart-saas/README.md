# CriArt — Plataforma SaaS para Personalização LASER e Papelaria

> Projeto desenvolvido com auxílio de IA (Claude) como parte do meu aprendizado prático em desenvolvimento web full-stack.

## Sobre o Projeto

O **CriArt** é uma plataforma SaaS multi-tenant voltada para empreendedores que trabalham com personalização LASER, sublimação e papelaria digital. Cada cliente recebe uma **vitrine personalizada** com sua própria marca, catálogo de produtos, calculadora de orçamentos e integração direta com WhatsApp.

### Problema que resolve
Profissionais de personalização perdem tempo enviando fotos de produtos um a um pelo WhatsApp. O CriArt entrega uma vitrine online profissional em minutos, com catálogo organizado e pedidos chegando automaticamente.

## Funcionalidades

- **Multi-tenancy** — cada lojista tem seu próprio slug (ex: `/vitrine/minha-loja`)
- **Catálogo com +24.000 produtos** — busca, filtros, paginação
- **Papelaria Digital** — 429 temas organizados de A a Z
- **88 categorias** — laser, sublimação, papelaria, brindes e mais
- **Calculadora de orçamentos** — gera PDF para o cliente
- **Arquivos de produção para download** — CDR, SVG, PDF, PNG, AI, LightBurn, Studio
- **Autenticação completa** — login, cadastro, reset de senha via Supabase Auth
- **Painel administrativo** — gestão de produtos, categorias, vitrine e equipe
- **Sistema de planos SaaS** — mensal (R$47) e anual (R$300) com controle de acesso
- **Integração Telegram** — geração de convites, controle de membros via bot
- **Landing page** — página de vendas responsiva com seções e pricing

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

| Categoria | Tecnologias |
|-----------|-------------|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS v4, Radix UI |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Storage) |
| **Estado** | Zustand, TanStack React Query |
| **Forms** | React Hook Form + Zod |
| **IA** | Anthropic Claude API (classificação de produtos) |
| **Deploy** | Vercel |
| **Outros** | jsPDF, Lucide Icons, Sonner |

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/          # Login, cadastro, reset de senha
│   ├── (public)/        # Vitrine pública por tenant
│   │   └── vitrine/[tenantSlug]/
│   │       ├── catalogo/
│   │       ├── papelaria/
│   │       └── produto/[slug]/
│   ├── (tenant)/        # Painel admin do lojista
│   │   └── admin/
│   ├── (superadmin)/    # Painel superadmin
│   └── api/             # API Routes (Telegram, Supabase, etc.)
├── components/          # Componentes reutilizáveis
├── lib/                 # Utilitários, hooks, Supabase client
└── types/               # Tipos TypeScript globais
supabase/
└── migrations/          # Migrations do banco de dados
```

## Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/giovannepe-dev/criart-saas.git
cd criart-saas

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha as variáveis no .env.local

# Rode em modo desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

> As demais variáveis (Telegram, Anthropic) são opcionais para rodar as funcionalidades básicas.

## O que Aprendi

- Arquitetura **multi-tenant** com Row Level Security (RLS) no PostgreSQL
- **App Router** do Next.js 16 com Server Components, Server Actions e Route Handlers
- Autenticação com **Supabase Auth** (SSR, cookies, middleware)
- Gerenciamento de estado global com **Zustand** e cache de servidor com **React Query**
- Deploy contínuo na **Vercel** com variáveis de ambiente e domínios customizados
- Integração com **APIs externas** (Telegram Bot API, Anthropic Claude)
- Geração de PDF no browser com **jsPDF**

## Desenvolvedor

**Giovanne Pedroso** — Desenvolvedor Frontend em formação  
[LinkedIn](https://www.linkedin.com/in/giovanne-pedroso) · [GitHub](https://github.com/giovannepe-dev)

---

*Projeto desenvolvido com auxílio de IA como ferramenta de aprendizado e produtividade.*

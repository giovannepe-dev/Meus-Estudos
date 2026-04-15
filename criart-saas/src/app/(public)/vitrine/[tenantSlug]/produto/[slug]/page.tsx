import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getTenantBySlug } from '@/lib/supabase/queries'
import { ProductDetailClient } from './ProductDetailClient'

interface Props {
  params: Promise<{ tenantSlug: string; slug: string }>
  searchParams: Promise<{ src?: string }>
}

async function fetchProduct(supabase: any, tenantId: string, slug: string, src?: string) {
  // 1. Tenta tenant primeiro (ou forçado por ?src=tenant)
  if (src !== 'global') {
    const { data } = await supabase
      .from('tenant_products')
      .select('*, categoria:tenant_categories(id, nome, slug, emoji), tags:tenant_product_tags(tag)')
      .eq('tenant_id', tenantId).eq('slug', slug).eq('ativo', true).single()
    if (data) return { ...data, source: 'tenant' }
  }
  // 2. Fallback para global (também cobre ?src=global)
  const { data } = await supabase
    .from('global_products')
    .select('*, categoria:global_categories(id, nome, slug, emoji), tags:global_product_tags(tag)')
    .eq('slug', slug).eq('ativo', true).single()
  if (data) return { ...data, source: 'global' }
  return null
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { tenantSlug, slug } = await params
  const { src } = await searchParams
  const [tenant, supabase] = await Promise.all([getTenantBySlug(tenantSlug), createClient()])
  if (!tenant) return {}
  const settings = (tenant as any).settings
  const nomeSite = settings?.nome_site ?? tenant.name
  const product = await fetchProduct(supabase, tenant.id, slug, src)
  if (!product) return { title: nomeSite }
  const tags = (product.tags ?? []).map((t: any) => t.tag ?? t).filter(Boolean).slice(0, 5).join(', ')
  const desc = [product.categoria?.nome, tags].filter(Boolean).join(' · ')
  return {
    title: product.nome,
    description: desc || `${product.nome} — ${nomeSite}`,
    openGraph: {
      title: `${product.nome} — ${nomeSite}`,
      description: desc || undefined,
      images: product.imagem_url ? [{ url: product.imagem_url }] : [],
    },
  }
}

export default async function ProdutoPage({ params, searchParams }: Props) {
  const { tenantSlug, slug } = await params
  const { src } = await searchParams
  const supabase = await createClient()

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) notFound()

  const settings = (tenant as any).settings
  const accentColor = settings?.cor_destaque ?? '#ea580c'

  const product = await fetchProduct(supabase, tenant.id, slug, src)
  const isGlobal = product?.source === 'global'

  if (!product) notFound()

  // Produtos relacionados (mesma categoria, sem o atual)
  let related: any[] = []
  if (product.categoria?.id) {
    if (isGlobal) {
      const { data } = await supabase
        .from('global_products')
        .select('id, nome, slug, imagem_url, numero, codigo, preco, destaque, novidade, categoria:global_categories(nome, slug, emoji)')
        .eq('categoria_id', product.categoria.id)
        .eq('ativo', true)
        .neq('id', product.id)
        .limit(4)
      related = (data ?? []).map(p => ({ ...p, source: 'global' }))
    } else {
      const { data } = await supabase
        .from('tenant_products')
        .select('id, nome, slug, imagem_url, numero, codigo, preco, destaque, novidade, categoria:tenant_categories(nome, slug, emoji)')
        .eq('tenant_id', tenant.id)
        .eq('categoria_id', product.categoria.id)
        .eq('ativo', true)
        .neq('id', product.id)
        .limit(4)
      related = (data ?? []).map(p => ({ ...p, source: 'tenant' }))
    }
  }

  return (
    <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <Link href={`/vitrine/${tenantSlug}/catalogo`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--lp-ink-3)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Voltar ao catálogo
        </Link>
        {product.categoria && (
          <>
            <span style={{ color: 'var(--lp-ink-4)' }}>/</span>
            <Link href={`/vitrine/${tenantSlug}/catalogo?${isGlobal ? 'gcat' : 'categoria'}=${product.categoria.slug}`}
              style={{ fontSize: '14px', color: 'var(--lp-ink-3)', textDecoration: 'none' }}>
              {product.categoria.emoji} {product.categoria.nome}
            </Link>
          </>
        )}
      </div>

      <ProductDetailClient
        product={product}
        settings={settings}
        accentColor={accentColor}
        tenantSlug={tenantSlug}
        related={related}
      />
    </div>
  )
}

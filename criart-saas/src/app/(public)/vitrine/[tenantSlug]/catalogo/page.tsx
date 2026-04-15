export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/supabase/queries'
import { ProductCard } from '@/components/storefront/ProductCard'
import { CategoryIcon } from '@/components/storefront/CategoryIcon'
import { MobileFilter } from './MobileFilter'
import { CatalogoSearchInput } from './CatalogoSearchInput'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { expandSearchTerm, calculateRelevanceScore } from '@/lib/search-engine'

const PER_PAGE = 48

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ categoria?: string; gcat?: string; destaque?: string; q?: string; page?: string; view?: string }>
}

export default async function CatalogoPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params
  const { categoria, gcat, destaque, q, page: pageStr, view } = await searchParams
  const supabase = await createClient()
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const showOnlyCategories = view === 'categories'

  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) notFound()

  const settings = (tenant as any).settings
  const accentColor = settings?.cor_destaque ?? '#ea580c'
  const tenantId = tenant.id

  const [hiddenCatsRes, hiddenProdsRes] = await Promise.all([
    supabase.from('tenant_category_visibility').select('category_id').eq('tenant_id', tenantId),
    supabase.from('tenant_product_visibility').select('product_id').eq('tenant_id', tenantId),
  ])
  const hiddenCatIds = new Set((hiddenCatsRes.data ?? []).map((r: any) => r.category_id))
  const hiddenProdIds = new Set((hiddenProdsRes.data ?? []).map((r: any) => r.product_id))

  const { data: tenantCats } = await supabase
    .from('tenant_categories')
    .select('id, nome, slug, emoji')
    .eq('tenant_id', tenantId).eq('ativa', true).order('ordem')

  const { data: globalCatsAll } = await supabase
    .from('global_categories')
    .select('id, nome, slug, emoji')
    .eq('ativa', true).order('ordem')

  const globalCats = (globalCatsAll ?? []).filter(c => !hiddenCatIds.has(c.id))
  // IDs de TODAS as categorias ativas — usado para filtrar produtos em categorias desativadas
  const activeCatIds = (globalCatsAll ?? []).map(c => c.id)

  // --- Busca por código numérico (#6037 ou 6037) ---
  const codigoMatch = q?.trim().replace(/^#/, '').match(/^\d+$/)
  const codigoBusca = codigoMatch ? parseInt(codigoMatch[0], 10) : null

  // --- Fetch com paginação ---
  const from = (currentPage - 1) * PER_PAGE
  const to = from + PER_PAGE - 1
  let products: any[] = []
  let totalCount = 0

  if (codigoBusca !== null) {
    // Busca exata por código — ignora filtros de categoria/destaque
    const [tenantRes, globalRes] = await Promise.all([
      supabase
        .from('tenant_products')
        .select('*, categoria:tenant_categories(nome, slug, emoji), tags:tenant_product_tags(tag)')
        .eq('tenant_id', tenantId).eq('ativo', true).eq('numero', codigoBusca),
      supabase
        .from('global_products')
        .select('*, categoria:global_categories(nome, slug, emoji), tags:global_product_tags(tag)')
        .eq('ativo', true).eq('numero', codigoBusca),
    ])
    products = [
      ...(tenantRes.data ?? []).map(p => ({ ...p, source: 'tenant' })),
      ...(globalRes.data ?? []).filter(p => !hiddenProdIds.has(p.id)).map(p => ({ ...p, source: 'global' })),
    ]
    totalCount = products.length
  } else if (gcat) {
    const globalCat = globalCats.find(c => c.slug === gcat)
    if (globalCat) {
      let q2 = supabase
        .from('global_products')
        .select('*, categoria:global_categories(nome, slug, emoji), tags:global_product_tags(tag)', { count: 'exact' })
        .eq('categoria_id', globalCat.id).eq('ativo', true).order('ordem')
        .range(from, to)
      if (destaque === 'true') q2 = q2.eq('destaque', true)
      if (q) q2 = q2.ilike('nome', `%${q}%`)
      const { data, count } = await q2
      products = (data ?? []).filter(p => !hiddenProdIds.has(p.id)).map(p => ({ ...p, source: 'global' }))
      totalCount = count ?? 0
    }
  } else if (categoria) {
    const cat = tenantCats?.find(c => c.slug === categoria)
    if (cat) {
      let q2 = supabase
        .from('tenant_products')
        .select('*, categoria:tenant_categories(nome, slug, emoji), tags:tenant_product_tags(tag)', { count: 'exact' })
        .eq('tenant_id', tenantId).eq('categoria_id', cat.id).eq('ativo', true)
        .order('created_at', { ascending: false })
        .range(from, to)
      if (destaque === 'true') q2 = q2.eq('destaque', true)
      if (q) q2 = q2.ilike('nome', `%${q}%`)
      const { data, count } = await q2
      products = (data ?? []).map(p => ({ ...p, source: 'tenant' }))
      totalCount = count ?? 0
    }
  } else {
    // Todos: tenant + global — busca contagem total de cada um
    const [tenantCount, globalCount] = await Promise.all([
      (() => {
        let q2 = supabase
          .from('tenant_products')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId).eq('ativo', true)
        if (destaque === 'true') q2 = q2.eq('destaque', true)
        if (q) q2 = q2.ilike('nome', `%${q}%`)
        return q2
      })(),
      (() => {
        let q2 = supabase
          .from('global_products')
          .select('id', { count: 'exact', head: true })
          .eq('ativo', true)
        if (activeCatIds.length > 0) q2 = q2.in('categoria_id', activeCatIds)
        if (destaque === 'true') q2 = q2.eq('destaque', true)
        if (q) q2 = q2.ilike('nome', `%${q}%`)
        return q2
      })(),
    ])

    const nTenant = tenantCount.count ?? 0
    const nGlobal = globalCount.count ?? 0
    totalCount = nTenant + nGlobal

    // Determinar de qual tabela puxar os itens desta página
    // Tenant products vêm primeiro
    if (from < nTenant) {
      // Página ainda inclui tenant products
      const tenantFrom = from
      const tenantTo = Math.min(to, nTenant - 1)
      let q2 = supabase
        .from('tenant_products')
        .select('*, categoria:tenant_categories(nome, slug, emoji), tags:tenant_product_tags(tag)')
        .eq('tenant_id', tenantId).eq('ativo', true)
        .order('created_at', { ascending: false })
        .range(tenantFrom, tenantTo)
      if (destaque === 'true') q2 = q2.eq('destaque', true)
      if (q) q2 = q2.ilike('nome', `%${q}%`)
      const { data } = await q2
      products.push(...(data ?? []).map(p => ({ ...p, source: 'tenant' })))

      // Se esta página precisa de global products também
      const remainingSlots = PER_PAGE - products.length
      if (remainingSlots > 0) {
        let q3 = supabase
          .from('global_products')
          .select('*, categoria:global_categories(nome, slug, emoji), tags:global_product_tags(tag)')
          .eq('ativo', true).order('ordem')
          .range(0, remainingSlots - 1)
        if (activeCatIds.length > 0) q3 = q3.in('categoria_id', activeCatIds)
        if (destaque === 'true') q3 = q3.eq('destaque', true)
        if (q) q3 = q3.ilike('nome', `%${q}%`)
        const { data: gData } = await q3
        products.push(...(gData ?? []).filter(p => !hiddenProdIds.has(p.id)).map(p => ({ ...p, source: 'global' })))
      }
    } else {
      // Página é toda de global products
      const globalFrom = from - nTenant
      const globalTo = globalFrom + PER_PAGE - 1
      let q2 = supabase
        .from('global_products')
        .select('*, categoria:global_categories(nome, slug, emoji), tags:global_product_tags(tag)')
        .eq('ativo', true).order('ordem')
        .range(globalFrom, globalTo)
      if (activeCatIds.length > 0) q2 = q2.in('categoria_id', activeCatIds)
      if (destaque === 'true') q2 = q2.eq('destaque', true)
      if (q) q2 = q2.ilike('nome', `%${q}%`)
      const { data } = await q2
      products = (data ?? []).filter(p => !hiddenProdIds.has(p.id)).map(p => ({ ...p, source: 'global' }))
    }
  }

  // Ordena por relevância se houver busca
  if (q && products.length > 0) {
    const searchTerms = expandSearchTerm(q)
    products = products.sort((a, b) => {
      const tagsA = (a.tags?.map((t: any) => typeof t === 'string' ? t : t.tag) ?? []) as string[]
      const tagsB = (b.tags?.map((t: any) => typeof t === 'string' ? t : t.tag) ?? []) as string[]

      const scoreA = calculateRelevanceScore(a.nome, tagsA, searchTerms)
      const scoreB = calculateRelevanceScore(b.nome, tagsB, searchTerms)

      return scoreB - scoreA // Maior score primeiro
    })
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE)

  // ── Busca de papelaria (só quando há query e vitrine_papelaria está ativa) ──
  const vitrinePapelaria = settings?.vitrine_papelaria !== false
  let papelariaResults: { id: string; nome: string; slug: string; foto: string | null }[] = []
  if (q && vitrinePapelaria && !categoria && !gcat) {
    const { data: hiddenColsData } = await supabase
      .from('tenant_hidden_collections')
      .select('collection_id')
      .eq('tenant_id', tenantId)
    const hiddenColIds = new Set((hiddenColsData ?? []).map((r: any) => r.collection_id))

    const { data: colData } = await supabase
      .from('global_collections')
      .select('id, nome, slug')
      .eq('ativo', true)
      .not('parent_id', 'is', null)
      .ilike('nome', `%${q}%`)
      .order('nome')
      .limit(16)

    const visible = (colData ?? []).filter((c: any) => !hiddenColIds.has(c.id))
    if (visible.length > 0) {
      const ids = visible.map((c: any) => c.id)
      const { data: imgs } = await supabase
        .from('global_collection_images')
        .select('collection_id, imagem_url')
        .in('collection_id', ids)
        .order('ordem')
      const coverMap: Record<string, string> = {}
      for (const img of imgs ?? []) {
        if (!coverMap[img.collection_id]) coverMap[img.collection_id] = img.imagem_url
      }
      papelariaResults = visible.map((c: any) => ({ id: c.id, nome: c.nome, slug: c.slug, foto: coverMap[c.id] ?? null }))
    }
  }

  const catAtual = tenantCats?.find(c => c.slug === categoria)
  const gcatAtual = globalCats.find(c => c.slug === gcat)
  const pageTitle = catAtual
    ? `${catAtual.emoji ?? ''} ${catAtual.nome}`
    : gcatAtual
      ? `${gcatAtual.emoji ?? ''} ${gcatAtual.nome}`
      : destaque === 'true' ? '⭐ Destaques' : 'Catálogo'

  // Montar query string base para links de paginação
  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (categoria) sp.set('categoria', categoria)
    if (gcat) sp.set('gcat', gcat)
    if (destaque) sp.set('destaque', destaque)
    if (q) sp.set('q', q)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/vitrine/${tenantSlug}/catalogo${qs ? `?${qs}` : ''}`
  }

  // Se view=categories, renderizar apenas categorias
  if (showOnlyCategories) {
    const allCats = [
      ...(tenantCats ?? []).map(c => ({ ...c, source: 'tenant' as const })),
      ...globalCats.map(c => ({ ...c, source: 'global' as const })),
    ]

    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Todas as Categorias
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
          {allCats.map((cat: any) => {
            const href = cat.source === 'global'
              ? `/vitrine/${tenantSlug}/catalogo?gcat=${cat.slug}`
              : `/vitrine/${tenantSlug}/catalogo?categoria=${cat.slug}`
            return (
              <Link key={`${cat.source}-${cat.id}`} href={href} style={{ textDecoration: 'none' }} className="cat-card">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 16px', borderRadius: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 200ms ease', cursor: 'pointer' }} className="cat-card-inner">
                  <CategoryIcon nome={cat.nome} emoji={cat.emoji} imagem_url={cat.imagem_url} size={56} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--lp-ink-2)', lineHeight: 1.3, letterSpacing: '0.02em' }}>{cat.nome}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          {pageTitle}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)' }}>
          {totalCount.toLocaleString('pt-BR')} produto{totalCount !== 1 ? 's' : ''}
          {totalPages > 1 && ` — página ${currentPage} de ${totalPages}`}
        </p>
      </div>

      <MobileFilter
        tenantSlug={tenantSlug}
        tenantCats={tenantCats ?? []}
        globalCats={globalCats}
        current={gcat ? `gcat:${gcat}` : categoria ? `cat:${categoria}` : ''}
      />

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }} className="catalogo-layout">
        {/* Sidebar */}
        <aside style={{ width: '200px', flexShrink: 0, position: 'sticky', top: '80px' }} className="catalogo-sidebar">
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-ink-4)', marginBottom: '12px' }}>
            Categorias
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link href={`/vitrine/${tenantSlug}/catalogo`}
              style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                fontWeight: !categoria && !gcat && destaque !== 'true' ? 600 : 500,
                background: !categoria && !gcat && destaque !== 'true' ? `${accentColor}18` : 'transparent',
                color: !categoria && !gcat && destaque !== 'true' ? accentColor : 'var(--lp-ink-2)' }}>
              Todos
            </Link>
            <Link href={`/vitrine/${tenantSlug}/catalogo?destaque=true`}
              style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
                fontWeight: destaque === 'true' ? 600 : 500,
                background: destaque === 'true' ? `${accentColor}18` : 'transparent',
                color: destaque === 'true' ? accentColor : 'var(--lp-ink-2)' }}>
              ⭐ Destaques
            </Link>

            {tenantCats && tenantCats.length > 0 && (
              <>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-ink-4)', padding: '10px 12px 4px' }}>
                  Minhas categorias
                </p>
                {tenantCats.map(cat => (
                  <Link key={cat.id} href={`/vitrine/${tenantSlug}/catalogo?categoria=${cat.slug}`}
                    style={{ textDecoration: 'none', padding: '7px 10px', borderRadius: '8px', fontSize: '13px',
                      fontWeight: categoria === cat.slug ? 600 : 500,
                      background: categoria === cat.slug ? `${accentColor}18` : 'transparent',
                      color: categoria === cat.slug ? accentColor : 'var(--lp-ink-2)',
                      display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CategoryIcon nome={cat.nome} emoji={cat.emoji} size={22} />
                    {cat.nome}
                  </Link>
                ))}
              </>
            )}

            {globalCats.length > 0 && (
              <>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-ink-4)', padding: '10px 12px 4px' }}>
                  Catálogo CriArt Oficina Digital
                </p>
                {globalCats.map(cat => (
                  <Link key={cat.id} href={`/vitrine/${tenantSlug}/catalogo?gcat=${cat.slug}`}
                    style={{ textDecoration: 'none', padding: '7px 10px', borderRadius: '8px', fontSize: '13px',
                      fontWeight: gcat === cat.slug ? 600 : 500,
                      background: gcat === cat.slug ? `${accentColor}18` : 'transparent',
                      color: gcat === cat.slug ? accentColor : 'var(--lp-ink-2)',
                      display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CategoryIcon nome={cat.nome} emoji={cat.emoji} size={22} />
                    {cat.nome}
                  </Link>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* Produtos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <CatalogoSearchInput
            tenantSlug={tenantSlug}
            defaultValue={q ?? ''}
            categoria={categoria}
            gcat={gcat}
            accentColor={accentColor}
          />

          {products.length === 0 && papelariaResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ fontSize: '15px', color: 'var(--lp-ink-3)', marginBottom: '12px' }}>Nenhum produto encontrado</p>
              <Link href={`/vitrine/${tenantSlug}/catalogo`} style={{ fontSize: '14px', color: accentColor, textDecoration: 'none', fontWeight: 500 }}>
                Ver todos os produtos →
              </Link>
            </div>
          ) : (
            <>
              {products.length > 0 && (
                <>
                  <div className="product-grid">
                    {products.map((p: any) => (
                      <ProductCard
                        key={`${p.source}-${p.id}`}
                        product={p}
                        tenantSlug={tenantSlug}
                        accentColor={accentColor}
                        mostrarPreco={settings?.mostrar_preco ?? false}
                      />
                    ))}
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '40px', flexWrap: 'wrap' }}>
                      {currentPage > 1 && (
                        <Link href={pageUrl(currentPage - 1)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1.5px solid var(--lp-border)', textDecoration: 'none', color: 'var(--lp-ink-2)' }}>
                          <ChevronLeft size={16} />
                        </Link>
                      )}

                      {paginationRange(currentPage, totalPages).map((p, i) =>
                        p === '...' ? (
                          <span key={`dot-${i}`} style={{ padding: '0 4px', color: 'var(--lp-ink-4)', fontSize: '13px' }}>...</span>
                        ) : (
                          <Link key={p} href={pageUrl(p as number)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: '36px', height: '36px', padding: '0 8px',
                              borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                              textDecoration: 'none',
                              background: p === currentPage ? accentColor : 'transparent',
                              color: p === currentPage ? 'white' : 'var(--lp-ink-2)',
                              border: p === currentPage ? 'none' : '1.5px solid var(--lp-border)',
                            }}>
                            {p}
                          </Link>
                        )
                      )}

                      {currentPage < totalPages && (
                        <Link href={pageUrl(currentPage + 1)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1.5px solid var(--lp-border)', textDecoration: 'none', color: 'var(--lp-ink-2)' }}>
                          <ChevronRight size={16} />
                        </Link>
                      )}
                    </nav>
                  )}
                </>
              )}

              {/* Papelaria Digital results */}
              {papelariaResults.length > 0 && (
                <div style={{ marginTop: products.length > 0 ? '48px' : '0' }}>
                  {products.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--lp-border)', marginBottom: '24px' }} />
                  )}
                  <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-ink-4)', marginBottom: '4px' }}>
                    Papelaria Digital
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--lp-ink-3)', marginBottom: '16px' }}>
                    {papelariaResults.length} coleç{papelariaResults.length !== 1 ? 'ões' : 'ão'} encontrada{papelariaResults.length !== 1 ? 's' : ''}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' }}>
                    {papelariaResults.map(col => (
                      <Link key={col.id} href={`/vitrine/${tenantSlug}/papelaria/${col.slug}`} style={{ textDecoration: 'none' }}>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--lp-border)', background: 'var(--lp-surface-2)', transition: 'border-color 200ms ease' }}>
                          {col.foto ? (
                            <img src={col.foto} alt={col.nome} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', aspectRatio: '1', background: 'var(--lp-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                              🖨️
                            </div>
                          )}
                          <div style={{ padding: '10px 12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink)', lineHeight: 1.3, margin: 0 }}>{col.nome}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Gera array de páginas: [1, 2, '...', 10, 11, 12, '...', 50] */
function paginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '...')[] = []

  // Sempre mostra primeira
  pages.push(1)

  // Range ao redor da página atual
  const rangeStart = Math.max(2, current - 1)
  const rangeEnd = Math.min(total - 1, current + 1)

  if (rangeStart > 2) pages.push('...')
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
  if (rangeEnd < total - 1) pages.push('...')

  // Sempre mostra última
  pages.push(total)

  return pages
}

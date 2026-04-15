export const dynamic = 'force-dynamic' // sempre fresh, sem cache ISR

import type React from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star, Sparkles } from 'lucide-react'
import { getTenantBySlug } from '@/lib/supabase/queries'
import { ProductCarousel } from '@/components/storefront/ProductCarousel'
import { CategoryIcon } from '@/components/storefront/CategoryIcon'
import { BentoHeroCard } from '@/components/storefront/BentoHeroCard'
import { ScrollReveal } from '@/components/storefront/ScrollReveal'
import { StaggerGrid } from '@/components/storefront/StaggerGrid'
import { LaserScanCanvas } from '@/components/storefront/LaserScanCanvas'
import { PixelWaveCanvas } from '@/components/storefront/PixelWaveCanvas'
import { AuroraCanvas } from '@/components/storefront/AuroraCanvas'
import { GradientMeshCanvas } from '@/components/storefront/GradientMeshCanvas'
import { FloatingOrbsCanvas } from '@/components/storefront/FloatingOrbsCanvas'
import { AntigravityCanvas } from '@/components/storefront/AntigravityCanvas'
import { MagneticCursorCanvas } from '@/components/storefront/MagneticCursorCanvas'
import { AnimatedStats } from '@/components/storefront/AnimatedStats'
import { StorefrontSearchBar } from '@/components/storefront/StorefrontSearchBar'

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function StorefrontHome({ params }: Props) {
  const { tenantSlug } = await params
  const supabase = await createClient()
  const tenant = await getTenantBySlug(tenantSlug)

  if (!tenant) notFound()

  const settings = (tenant as any).settings
  const accentColor = settings?.cor_destaque ?? '#ea580c'
  const tenantId = tenant.id
  const vitrineLaser = settings?.vitrine_laser !== false
  const vitrinePapelaria = settings?.vitrine_papelaria !== false

  // IDs ocultos pelo tenant
  const [hiddenCatsRes, hiddenProdsRes, hiddenColsRes] = await Promise.all([
    supabase.from('tenant_category_visibility').select('category_id').eq('tenant_id', tenantId),
    supabase.from('tenant_product_visibility').select('product_id').eq('tenant_id', tenantId),
    supabase.from('tenant_hidden_collections').select('collection_id').eq('tenant_id', tenantId),
  ])
  const hiddenCatIds = new Set((hiddenCatsRes.data ?? []).map((r: any) => r.category_id))
  const hiddenProdIds = new Set((hiddenProdsRes.data ?? []).map((r: any) => r.product_id))
  const hiddenColIds = new Set((hiddenColsRes.data ?? []).map((r: any) => r.collection_id))

  // Fetch storefront sections
  const { data: sections } = await supabase
    .from('tenant_storefront_sections')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('ativa', true)
    .order('ordem')

  const hasSections = sections && sections.length > 0

  // Categorias do tenant
  const { data: tenantCats } = await supabase
    .from('tenant_categories')
    .select('id, nome, slug, emoji, imagem_url')
    .eq('tenant_id', tenantId)
    .eq('ativa', true)
    .order('ordem')
    .limit(8)

  // Categorias globais (não ocultas) — sem limit para ter todos os IDs ativos
  const { data: globalCatsAll } = await supabase
    .from('global_categories')
    .select('id, nome, slug, emoji, imagem_url')
    .eq('ativa', true)
    .order('ordem')

  const globalCats = (globalCatsAll ?? []).filter(c => !hiddenCatIds.has(c.id))
  // IDs de TODAS as categorias ativas — filtra produtos de categorias desativadas no código
  const activeCatIds = (globalCatsAll ?? []).map(c => c.id)

  // Merge categorias: próprias primeiro, depois globais
  const allCats = [
    ...(tenantCats ?? []).map(c => ({ ...c, source: 'tenant' })),
    ...globalCats.map(c => ({ ...c, source: 'global' })),
  ].slice(0, 12)

  // Contar total de categorias (não ocultas)
  const [tenantCatCount, globalCatCount] = vitrineLaser
    ? await Promise.all([
        supabase.from('tenant_categories').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('ativa', true),
        supabase.from('global_categories').select('id', { count: 'exact' }).eq('ativa', true),
      ])
    : [{ count: 0, data: [] }, { count: 0, data: [] }]
  const totalCategoryCount = vitrineLaser
    ? (tenantCatCount.count ?? 0) + ((globalCatCount.count ?? 0) - ((globalCatCount.data ?? []).filter(c => hiddenCatIds.has(c.id)).length))
    : 0

  // Contar total de produtos (não ocultos) — só se vitrine laser ativa
  const [tenantProdCount, globalProdCount] = vitrineLaser
    ? await Promise.all([
        supabase.from('tenant_products').select('id', { count: 'exact' }).eq('tenant_id', tenantId).eq('ativo', true),
        supabase.from('global_products').select('id', { count: 'exact' }).eq('ativo', true),
      ])
    : [{ count: 0, data: [] }, { count: 0, data: [] }]
  const totalProductCount = vitrineLaser
    ? (tenantProdCount.count ?? 0) + ((globalProdCount.count ?? 0) - ((globalProdCount.data ?? []).filter(p => hiddenProdIds.has(p.id)).length))
    : 0

  // Contar temas de papelaria — só se vitrine papelaria ativa
  const { count: papelariaThemeCount } = vitrinePapelaria
    ? await supabase
        .from('global_collections')
        .select('id', { count: 'exact' })
        .eq('ativo', true)
        .not('parent_id', 'is', null)
    : { count: 0 }

  // Produtos para homepage — quando não há seções configuradas
  // Busca qualquer produto ativo, destaques primeiro
  let featuredProducts: any[] = []
  if (!hasSections) {
    const [tenantProds, globalProds] = await Promise.all([
      supabase
        .from('tenant_products')
        .select('*, categoria:tenant_categories(nome, slug, emoji), tags:tenant_product_tags(tag)')
        .eq('tenant_id', tenantId)
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12),
      (() => {
        let q = supabase
          .from('global_products')
          .select('*, categoria:global_categories(nome, slug, emoji), tags:global_product_tags(tag)')
          .eq('ativo', true)
          .order('destaque', { ascending: false })
          .order('ordem')
          .limit(12)
        if (activeCatIds.length > 0) q = q.in('categoria_id', activeCatIds)
        return q
      })(),
    ])

    const globalFiltered = (globalProds.data ?? []).filter(p => !hiddenProdIds.has(p.id))
    featuredProducts = [
      ...(tenantProds.data ?? []).map(p => ({ ...p, source: 'tenant' })),
      ...globalFiltered.map(p => ({ ...p, source: 'global' })),
    ].slice(0, 12)
  }

  // Coleções de Papelaria
  const papelariaOnlyMode = vitrinePapelaria && !vitrineLaser
  const papelariaLimit = papelariaOnlyMode ? 12 : 12

  const fetchColGroup = async (from: number, to: number) => {
    const { data: raw } = await supabase
      .from('global_collections')
      .select('id, nome, slug')
      .eq('ativo', true)
      .not('parent_id', 'is', null)
      .order('nome')
      .range(from, to)
    const visible = (raw ?? []).filter(c => !hiddenColIds.has(c.id))
    const ids = visible.map(c => c.id)
    const { data: imgs } = ids.length > 0
      ? await supabase.from('global_collection_images').select('collection_id, imagem_url, ordem').in('collection_id', ids).order('ordem')
      : { data: [] }
    const imgMap: Record<string, string[]> = {}
    for (const img of imgs ?? []) {
      if (!imgMap[img.collection_id]) imgMap[img.collection_id] = []
      if (imgMap[img.collection_id].length < 4) imgMap[img.collection_id].push(img.imagem_url)
    }
    return visible.map(c => ({ ...c, fotos: imgMap[c.id] ?? [] }))
  }

  const [collections, papelariaGroup2, papelariaGroup3, papelariaGroup4] = await Promise.all([
    vitrinePapelaria ? fetchColGroup(0, 11) : Promise.resolve([]),
    papelariaOnlyMode ? fetchColGroup(12, 23) : Promise.resolve([]),
    papelariaOnlyMode ? fetchColGroup(24, 35) : Promise.resolve([]),
    papelariaOnlyMode ? fetchColGroup(36, 40) : Promise.resolve([]),
  ])

  // Novidades — mistura produtos recentes + kits de papelaria
  const novidadesProds: any[] = []
  const novidadesKits: any[] = []

  if (vitrineLaser) {
    const [tp, gp] = await Promise.all([
      supabase.from('tenant_products').select('id, nome, slug, imagem_url, numero, codigo, categoria:tenant_categories(nome, emoji)').eq('tenant_id', tenantId).eq('ativo', true).order('created_at', { ascending: false }).limit(6),
      (() => {
        let q = supabase.from('global_products').select('id, nome, slug, imagem_url, numero, codigo, categoria:global_categories(nome, emoji)').eq('ativo', true).order('created_at', { ascending: false }).limit(6)
        if (activeCatIds.length > 0) q = q.in('categoria_id', activeCatIds)
        return q
      })(),
    ])
    novidadesProds.push(
      ...(tp.data ?? []).map(p => ({ ...p, _type: 'product', source: 'tenant' })),
      ...(gp.data ?? []).filter(p => !hiddenProdIds.has(p.id)).map(p => ({ ...p, _type: 'product', source: 'global' })),
    )
  }

  if (vitrinePapelaria) {
    const kitsNovidades = await fetchColGroup(48, 59)
    novidadesKits.push(...kitsNovidades.map(k => ({ ...k, _type: 'kit' })))
  }

  // Intercala produtos e kits: prod, kit, prod, kit...
  const novidades: any[] = []
  const maxLen = Math.max(novidadesProds.length, novidadesKits.length)
  for (let i = 0; i < maxLen && novidades.length < 12; i++) {
    if (novidadesProds[i]) novidades.push(novidadesProds[i])
    if (novidadesKits[i]) novidades.push(novidadesKits[i])
  }

  // Função auxiliar para buscar produtos de uma seção configurada
  const getProductsForSection = async (categoryId: string, source: 'global' | 'tenant') => {
    if (source === 'global') {
      // Seção de categoria global inativa não deve renderizar produtos
      if (activeCatIds.length > 0 && !activeCatIds.includes(categoryId)) return []
      const { data } = await supabase
        .from('global_products')
        .select('*, categoria:global_categories(nome, slug, emoji), tags:global_product_tags(tag)')
        .eq('categoria_id', categoryId)
        .eq('ativo', true)
        .limit(8)
      return (data ?? []).filter(p => !hiddenProdIds.has(p.id)).map(p => ({ ...p, source: 'global' }))
    } else {
      const { data } = await supabase
        .from('tenant_products')
        .select('*, categoria:tenant_categories(nome, slug, emoji), tags:tenant_product_tags(tag)')
        .eq('tenant_id', tenantId)
        .eq('categoria_id', categoryId)
        .eq('ativo', true)
        .limit(8)
      return (data ?? []).map(p => ({ ...p, source: 'tenant' }))
    }
  }

  const bannerStyle = settings?.banner_style ?? 'grafite'
  const PAGE_THEMES = ['elegante', 'luxury', 'terracota', 'grafite'] as const
  type PageTheme = typeof PAGE_THEMES[number]
  const isPageTheme = (PAGE_THEMES as readonly string[]).includes(bannerStyle)
  const pageThemeClass = isPageTheme ? `vt-${bannerStyle}` : ''

  function heroBg(theme: string, accent: string): React.CSSProperties {
    // O linear-gradient de base fica na página inteira (CSS .vt-*).
    // Aqui só os glows e padrões específicos do hero.
    switch (theme) {
      case 'elegante':
        return {
          backgroundImage: [
            `radial-gradient(ellipse at 10% 0%, rgba(160,140,255,0.28) 0%, transparent 52%)`,
            `radial-gradient(ellipse at 92% 100%, rgba(100,80,200,0.18) 0%, transparent 45%)`,
            `linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)`,
            `linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)`,
          ].join(','),
          backgroundSize: '100% 100%, 100% 100%, 52px 52px, 52px 52px',
        }
      case 'luxury':
        return {
          backgroundImage: [
            `radial-gradient(ellipse at 65% 18%, rgba(212,175,55,0.35) 0%, transparent 52%)`,
            `radial-gradient(ellipse at 8% 82%, rgba(150,120,30,0.18) 0%, transparent 45%)`,
            `repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(212,175,55,0.10) 59px, rgba(212,175,55,0.10) 60px)`,
          ].join(','),
          backgroundSize: '100% 100%, 100% 100%, 100% 60px',
        }
      case 'terracota':
        return {
          backgroundImage: [
            `radial-gradient(ellipse at 25% 22%, rgba(230,110,30,0.40) 0%, transparent 52%)`,
            `radial-gradient(ellipse at 80% 80%, rgba(180,70,20,0.22) 0%, transparent 45%)`,
            `radial-gradient(circle at 1px 1px, rgba(255,160,60,0.10) 1px, transparent 0)`,
          ].join(','),
          backgroundSize: '100% 100%, 100% 100%, 28px 28px',
        }
      case 'grafite':
        return {
          backgroundImage: [
            `radial-gradient(ellipse at 50% 0%, rgba(80,150,230,0.32) 0%, transparent 52%)`,
            `radial-gradient(ellipse at 0% 100%, rgba(40,80,150,0.18) 0%, transparent 45%)`,
            `radial-gradient(circle at 1px 1px, rgba(148,180,220,0.10) 1px, transparent 0)`,
          ].join(','),
          backgroundSize: '100% 100%, 100% 100%, 26px 26px',
        }
      default:
        return {}
    }
  }

  function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
  }

  return (
    <div className={`sf-dark-page${pageThemeClass ? ` ${pageThemeClass}` : ''}`} style={{ paddingTop: '0' }}>
      <div className="sf-glow" />

      {/* HERO */}
      <section
        className={isPageTheme ? '' : 'laser-sweep'}
        style={{ position: 'relative', overflow: 'hidden', minHeight: 'clamp(280px, 60vw, 500px)' }}
      >
        {/* Temas de página — fundos estáticos CSS */}
        {isPageTheme && (
          <div style={{ position: 'absolute', inset: 0, ...heroBg(bannerStyle, accentColor) }} />
        )}

        {/* Efeitos animados — só quando não é tema de página */}
        {!isPageTheme && bannerStyle === 'pixel' && <PixelWaveCanvas accentColor={accentColor} />}
        {!isPageTheme && bannerStyle === 'aurora' && <AuroraCanvas accentColor={accentColor} />}
        {!isPageTheme && bannerStyle === 'gradient' && <GradientMeshCanvas accentColor={accentColor} />}
        {!isPageTheme && bannerStyle === 'orbs' && <FloatingOrbsCanvas accentColor={accentColor} />}
        {!isPageTheme && bannerStyle === 'antigravity' && <AntigravityCanvas accentColor={accentColor} />}
        {!isPageTheme && bannerStyle === 'magnetic' && <MagneticCursorCanvas accentColor={accentColor} />}
        {!isPageTheme && bannerStyle === 'static' && <div style={{ position: 'absolute', inset: 0, backgroundColor: accentColor, opacity: 0.1 }} />}
        {!isPageTheme && (bannerStyle === 'laser' || !['pixel','aurora','gradient','orbs','antigravity','magnetic','static'].includes(bannerStyle)) && <LaserScanCanvas accentColor={accentColor} />}

        {/* Imagem de fundo — flui normalmente, sem corte */}
        {settings?.banner_url ? (
          <Image
            src={settings.banner_url}
            alt=""
            width={1440}
            height={600}
            priority
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              transform: `scale(${(settings.banner_zoom ?? 100) / 100})`,
              transformOrigin: 'center top',
            }}
          />
        ) : (
          <div style={{ minHeight: '500px', background: isPageTheme ? undefined : `linear-gradient(135deg, ${accentColor}33 0%, #050505 100%)` }} />
        )}

        {/* Overlay de opacidade */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${settings?.banner_url ? (settings?.banner_opacity ?? 0.5) : (isPageTheme ? 0 : 0.3)})` }} />
        {!isPageTheme && <div style={{ position: 'absolute', inset: 0, opacity: .08, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.8) 1px, transparent 0)', backgroundSize: '28px 28px' }} />}

        {/* Conteúdo sobreposto */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: 'clamp(20px, 5vw, 40px) 24px' }} className="vitrine-hero-section">
            <div style={{ maxWidth: 'clamp(280px, 90vw, 520px)' }}>
              {settings?.slogan && (
                <p style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px', padding: '6px 12px',
                  borderRadius: '999px', background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.9)' }}>
                  <Sparkles size={12} /> {settings.slogan}
                </p>
              )}
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800, color: 'white', lineHeight: 1.05, marginBottom: '16px' }} className="vitrine-hero-title">
                {settings?.nome_site ?? tenant.name}
              </h1>
              {settings?.descricao && (
                <p style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', color: 'rgba(255,255,255,.8)', marginBottom: 'clamp(12px, 3vw, 24px)', lineHeight: 1.7 }} className="vitrine-hero-desc">
                  {settings.descricao}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                {vitrineLaser && (
                  <Link href={`/vitrine/${tenantSlug}/catalogo`}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                      color: 'white', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.35)',
                      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,.3)', letterSpacing: '0.02em' }}>
                    Ver catálogo <ArrowRight size={16} />
                  </Link>
                )}
                {settings?.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                      color: 'white', background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,.35)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR animada */}
      <AnimatedStats stats={[
        ...(vitrineLaser ? [
          { value: totalProductCount, suffix: '', label: 'Produtos' },
          { value: totalCategoryCount, suffix: '', label: 'Categorias' },
        ] : []),
        ...(vitrinePapelaria ? [
          { value: papelariaThemeCount ?? 0, suffix: '', label: 'Kits de Papelaria' },
        ] : []),
      ]} />

      {/* BUSCA — só para vitrine laser */}
      {vitrineLaser && <section style={{ background: 'var(--lp-base)', borderBottom: '1px solid var(--lp-border)', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <StorefrontSearchBar tenantSlug={tenantSlug} accentColor={accentColor} placeholder={`Buscar em ${totalProductCount}+ produtos...`} />
        </div>
      </section>}

      {/* NOVIDADES — mix de produtos e kits */}
      {novidades.length > 0 && (
        <section style={{ borderTop: '1px solid var(--lp-border)', background: 'var(--lp-base)', padding: '48px 16px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🆕</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em' }}>Novidades</h2>
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {novidades.map((item: any) => item._type === 'product' ? (
                <Link key={`prod-${item.id}`} href={`/vitrine/${tenantSlug}/produto/${item.slug}`} style={{ textDecoration: 'none', flexShrink: 0, width: '180px' }}>
                  <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}>
                    <div style={{ aspectRatio: '1', background: 'var(--lp-surface-2)', overflow: 'hidden' }}>
                      {item.imagem_url
                        ? <img src={item.imagem_url} alt={item.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>{item.categoria?.emoji ?? '✨'}</div>
                      }
                    </div>
                    <div style={{ padding: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Laser</span>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink)', lineHeight: 1.3, margin: '3px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{item.nome}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link key={`kit-${item.id}`} href={`/vitrine/${tenantSlug}/papelaria/${item.slug}`} style={{ textDecoration: 'none', flexShrink: 0, width: '180px' }}>
                  <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}>
                    <div style={{ aspectRatio: '1', background: 'var(--lp-surface-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                      {item.fotos.length === 0 ? <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎨</div>
                        : item.fotos.length === 1 ? <img src={item.fotos[0]} alt={item.nome} style={{ gridColumn: '1/-1', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        : [0,1,2,3].map((i: number) => item.fotos[i] ? <img key={i} src={item.fotos[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <div key={i} style={{ background: 'var(--lp-surface-2)' }} />)}
                    </div>
                    <div style={{ padding: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Papelaria</span>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink)', lineHeight: 1.3, margin: '3px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{item.nome}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CARROSSEIS CONFIGURADOS — primeiro usa bento, demais carrossel */}
      {vitrineLaser && hasSections && sections.map(async (section: any, idx: number) => {
        const products = await getProductsForSection(section.category_id, section.category_source)
        const isFirst = idx === 0
        const bentoItems = isFirst ? products.slice(0, 4) : []
        const restItems = isFirst ? products.slice(4) : products
        return (
          <section key={section.id} style={{ position: 'relative', borderTop: '1px solid var(--lp-border)', background: 'var(--lp-base)' }}>
            {/* Tema animado como fundo */}
            {settings?.banner_style === 'pixel' && <PixelWaveCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'aurora' && <AuroraCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'gradient' && <GradientMeshCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'orbs' && <FloatingOrbsCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'antigravity' && <AntigravityCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'magnetic' && <MagneticCursorCanvas accentColor={accentColor} />}
            {!settings?.banner_style || settings?.banner_style === 'laser' ? <LaserScanCanvas accentColor={accentColor} /> : null}
            {settings?.banner_style === 'static' && <div style={{ position: 'absolute', inset: 0, backgroundColor: accentColor, opacity: 0.1 }} />}

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '48px 16px' }}>
              <ScrollReveal>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--lp-ink)', marginBottom: '28px' }}>
                  {section.title}
                </h2>
              </ScrollReveal>
              {products.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', textAlign: 'center', padding: '40px' }}>
                  Nenhum produto nesta categoria
                </p>
              ) : isFirst ? (
                <>
                  <div className="bento-destaque-grid">
                    {bentoItems[0] && <div className="bento-item-main"><BentoHeroCard product={bentoItems[0]} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} isMain /></div>}
                    {bentoItems[1] && <div className="bento-item-sm1"><BentoHeroCard product={bentoItems[1]} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} /></div>}
                    {bentoItems[2] && <div className="bento-item-sm2"><BentoHeroCard product={bentoItems[2]} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} /></div>}
                    {bentoItems[3] && <div className="bento-item-wide"><BentoHeroCard product={bentoItems[3]} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} /></div>}
                  </div>
                  {restItems.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                      <ProductCarousel products={restItems} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} />
                    </div>
                  )}
                </>
              ) : (
                <ProductCarousel products={restItems} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} />
              )}
            </div>
          </section>
        )
      })}

      {/* CATEGORIAS */}
      {vitrineLaser && allCats.length > 0 && (
        <section style={{ position: 'relative', borderTop: '1px solid var(--lp-border)', background: 'var(--lp-base)' }}>
          {settings?.banner_style === 'gradient' && <GradientMeshCanvas accentColor={accentColor} />}
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '48px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--lp-ink)' }}>Categorias</h2>
              <Link href={`/vitrine/${tenantSlug}/catalogo?view=categories`} style={{ fontSize: '14px', fontWeight: 500, color: accentColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ver tudo <ArrowRight size={14} />
              </Link>
            </div>
            <StaggerGrid style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }} className="cat-grid">
              {allCats.map((cat: any) => {
                const href = cat.source === 'global'
                  ? `/vitrine/${tenantSlug}/catalogo?gcat=${cat.slug}`
                  : `/vitrine/${tenantSlug}/catalogo?categoria=${cat.slug}`
                return (
                  <Link key={`${cat.source}-${cat.id}`} href={href} style={{ textDecoration: 'none' }} className="cat-card">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 12px', borderRadius: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 200ms ease' }} className="cat-card-inner">
                      <CategoryIcon nome={cat.nome} emoji={cat.emoji} imagem_url={cat.imagem_url} size={48} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lp-ink-2)', lineHeight: 1.3, letterSpacing: '0.02em' }}>{cat.nome}</span>
                    </div>
                  </Link>
                )
              })}
            </StaggerGrid>
          </div>
        </section>
      )}

      {/* PRODUTOS — bento grid editorial quando não há carrosseis configurados */}
      {vitrineLaser && !hasSections && featuredProducts.length > 0 && (() => {
        const bentoItems = featuredProducts.slice(0, 4)
        const extraItems = featuredProducts.slice(4)
        return (
          <section style={{ position: 'relative', borderTop: '1px solid var(--lp-border)', background: 'var(--lp-base)' }}>
            {/* Tema animado como fundo */}
            {settings?.banner_style === 'pixel' && <PixelWaveCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'aurora' && <AuroraCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'gradient' && <GradientMeshCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'orbs' && <FloatingOrbsCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'antigravity' && <AntigravityCanvas accentColor={accentColor} />}
            {settings?.banner_style === 'magnetic' && <MagneticCursorCanvas accentColor={accentColor} />}
            {!settings?.banner_style || settings?.banner_style === 'laser' ? <LaserScanCanvas accentColor={accentColor} /> : null}
            {settings?.banner_style === 'static' && <div style={{ position: 'absolute', inset: 0, backgroundColor: accentColor, opacity: 0.1 }} />}

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '48px 16px' }}>
              <ScrollReveal>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Star size={18} style={{ color: accentColor, fill: accentColor }} />
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em' }}>
                      {featuredProducts.some(p => p.destaque) ? 'Destaques' : 'Produtos'}
                    </h2>
                  </div>
                </div>
              </ScrollReveal>

              {/* Bento grid */}
              <ScrollReveal delay={100} direction="scale">
              <div className="bento-destaque-grid">
                {/* Card principal (2x2) */}
                <div className="bento-item-main">
                  <BentoHeroCard product={bentoItems[0]} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} isMain />
                </div>
                {/* Pequeno 1 */}
                {bentoItems[1] && (
                  <div className="bento-item-sm1">
                    <BentoHeroCard product={bentoItems[1]} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} />
                  </div>
                )}
                {/* Pequeno 2 */}
                {bentoItems[2] && (
                  <div className="bento-item-sm2">
                    <BentoHeroCard product={bentoItems[2]} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} />
                  </div>
                )}
                {/* Wide (2x1) */}
                {bentoItems[3] && (
                  <div className="bento-item-wide">
                    <BentoHeroCard product={bentoItems[3]} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} />
                  </div>
                )}
              </div>

              </ScrollReveal>

              {/* Produtos extras em carousel */}
              {extraItems.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <ProductCarousel products={extraItems} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={settings?.mostrar_preco ?? false} />
                </div>
              )}
            </div>
          </section>
        )
      })()}

      {/* CARROSSEL PAPELARIA */}
      {vitrinePapelaria && collections.length > 0 && (
        <section style={{ borderTop: '1px solid var(--lp-border)', background: 'var(--lp-base)', padding: '48px 16px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  🎨
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em' }}>
                  Papelaria
                </h2>
              </div>
              <Link href={`/vitrine/${tenantSlug}/papelaria`} style={{ fontSize: '14px', fontWeight: 500, color: accentColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            {/* Carrossel horizontal de coleções */}
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {collections.map(kit => (
                <Link
                  key={kit.id}
                  href={`/vitrine/${tenantSlug}/papelaria/${kit.slug}`}
                  style={{ textDecoration: 'none', flexShrink: 0, width: '200px' }}
                >
                  <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}>
                    {/* Mosaico 2x2 */}
                    <div style={{ aspectRatio: '1', background: 'var(--lp-surface-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                      {kit.fotos.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎨</div>
                      ) : kit.fotos.length === 1 ? (
                        <img src={kit.fotos[0]} alt={kit.nome} style={{ gridColumn: '1/-1', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                      ) : (
                        [0, 1, 2, 3].map(i => (
                          kit.fotos[i]
                            ? <img key={i} src={kit.fotos[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                            : <div key={i} style={{ background: 'var(--lp-surface-2)' }} />
                        ))
                      )}
                    </div>
                    <div style={{ padding: '10px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink)', lineHeight: 1.3, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                        {kit.nome}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PAPELARIA grupos extras — só quando papelaria é a única vitrine ativa */}
      {papelariaOnlyMode && papelariaGroup2.length > 0 && (
        <section style={{ borderTop: '1px solid var(--lp-border)', background: 'var(--lp-base)', padding: '48px 16px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✨</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em' }}>Mais Kits</h2>
              </div>
              <Link href={`/vitrine/${tenantSlug}/papelaria`} style={{ fontSize: '14px', fontWeight: 500, color: accentColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {papelariaGroup2.map(kit => (
                <Link key={kit.id} href={`/vitrine/${tenantSlug}/papelaria/${kit.slug}`} style={{ textDecoration: 'none', flexShrink: 0, width: '200px' }}>
                  <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}>
                    <div style={{ aspectRatio: '1', background: 'var(--lp-surface-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                      {kit.fotos.length === 0 ? <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎨</div>
                        : kit.fotos.length === 1 ? <img src={kit.fotos[0]} alt={kit.nome} style={{ gridColumn: '1/-1', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        : [0,1,2,3].map(i => kit.fotos[i] ? <img key={i} src={kit.fotos[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <div key={i} style={{ background: 'var(--lp-surface-2)' }} />)}
                    </div>
                    <div style={{ padding: '10px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink)', lineHeight: 1.3, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{kit.nome}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {papelariaOnlyMode && papelariaGroup3.length > 0 && (
        <section style={{ borderTop: '1px solid var(--lp-border)', background: 'var(--lp-base)', padding: '48px 16px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🌟</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em' }}>Explorar</h2>
              </div>
              <Link href={`/vitrine/${tenantSlug}/papelaria`} style={{ fontSize: '14px', fontWeight: 500, color: accentColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
              {papelariaGroup3.map(kit => (
                <Link key={kit.id} href={`/vitrine/${tenantSlug}/papelaria/${kit.slug}`} style={{ textDecoration: 'none', flexShrink: 0, width: '200px' }}>
                  <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}>
                    <div style={{ aspectRatio: '1', background: 'var(--lp-surface-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                      {kit.fotos.length === 0 ? <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎨</div>
                        : kit.fotos.length === 1 ? <img src={kit.fotos[0]} alt={kit.nome} style={{ gridColumn: '1/-1', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        : [0,1,2,3].map(i => kit.fotos[i] ? <img key={i} src={kit.fotos[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <div key={i} style={{ background: 'var(--lp-surface-2)' }} />)}
                    </div>
                    <div style={{ padding: '10px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink)', lineHeight: 1.3, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{kit.nome}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PAPELARIA — vitrine do catálogo completo (5 destaques + botão) */}
      {papelariaOnlyMode && (
        <section style={{ borderTop: '1px solid var(--lp-border)', background: 'var(--lp-base)', padding: '48px 16px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {papelariaGroup4.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '40px' }}>
                {papelariaGroup4.map(kit => (
                  <Link key={kit.id} href={`/vitrine/${tenantSlug}/papelaria/${kit.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}>
                      <div style={{ aspectRatio: '1', background: 'var(--lp-surface-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                        {kit.fotos.length === 0 ? <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎨</div>
                          : kit.fotos.length === 1 ? <img src={kit.fotos[0]} alt={kit.nome} style={{ gridColumn: '1/-1', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                          : [0,1,2,3].map(i => kit.fotos[i] ? <img key={i} src={kit.fotos[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /> : <div key={i} style={{ background: 'var(--lp-surface-2)' }} />)}
                      </div>
                      <div style={{ padding: '10px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink)', lineHeight: 1.3, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{kit.nome}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 20px', borderRadius: '20px', background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`, border: `1.5px solid ${accentColor}30` }}>
              <p style={{ fontSize: '15px', color: 'var(--lp-ink-3)', margin: 0 }}>Tem muito mais esperando por você!</p>
              <Link
                href={`/vitrine/${tenantSlug}/papelaria`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '16px 36px', borderRadius: '14px',
                  background: accentColor, color: 'white',
                  fontWeight: 700, fontSize: '16px', textDecoration: 'none',
                  letterSpacing: '-0.01em', boxShadow: `0 8px 32px ${accentColor}44`,
                }}
              >
                Não achou o que queria? Veja o catálogo completo <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA — Explore o catálogo completo */}
      {vitrineLaser && <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(48px, 8vw, 80px) 16px' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}08 100%)`, borderTop: `1px solid ${accentColor}33`, borderBottom: `1px solid ${accentColor}33` }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.8) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
          <ScrollReveal>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'white', marginBottom: '8px', opacity: 0.8 }}>Catálogo completo</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: '560px' }}>Explore nosso catálogo completo</h2>
            <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255,255,255,0.85)', maxWidth: '460px', lineHeight: 1.7, marginTop: '12px' }}>Tudo o que você precisa em um só lugar. Navegue pelo catálogo e encontre o produto certo para o seu projeto.</p>
            <Link href={`/vitrine/${tenantSlug}/catalogo`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 36px', borderRadius: '14px', background: accentColor, color: 'white', fontWeight: 700, fontSize: '16px', textDecoration: 'none', letterSpacing: '-0.01em', boxShadow: `0 8px 32px ${accentColor}55`, marginTop: '16px' }} className="cta-catalog-btn">
              Ver Catálogo <ArrowRight size={20} />
            </Link>
          </ScrollReveal>
        </div>
      </section>}

      {/* FOOTER */}
      <section style={{ position: 'relative', borderTop: '1px solid var(--lp-border)', background: 'var(--lp-surface)', padding: '64px 16px 32px' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '48px', marginBottom: '48px' }}>
            {/* Sobre */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--lp-ink)', marginBottom: '12px' }}>
                {settings?.nome_site ?? tenant.name}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', lineHeight: 1.7, maxWidth: '340px' }}>
                {settings?.descricao ?? `${tenant.name} — sua loja de qualidade e confiança.`}
              </p>
              <div style={{ marginTop: '20px', height: '3px', width: '48px', background: accentColor, borderRadius: '2px' }} />
            </div>

          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--lp-border)', marginBottom: '24px' }} />

          {/* Copyright row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--lp-ink-3)' }}>© {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.</p>
            <p style={{ fontSize: '12px', color: 'var(--lp-ink-3)' }}>Criado com <span style={{ color: accentColor, fontWeight: 600 }}>CriArt Oficina Digital</span></p>
          </div>
        </div>
      </section>
    </div>
  )
}

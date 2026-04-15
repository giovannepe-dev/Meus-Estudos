import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, FolderOpen, Star, EyeOff, ArrowRight, Zap, Plus, Library, MessageSquare, Eye } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { VisitasChart } from '@/components/admin/VisitasChart'

export const metadata: Metadata = { title: 'Dashboard' }

function pad2(n: number) { return n.toString().padStart(2, '0') }

export default async function TenantDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tu } = await supabase
    .from('tenant_users').select('tenant_id, tenant:tenants(*, settings:tenant_settings(*))')
    .eq('user_id', user.id).eq('ativo', true).single()
  if (!tu) redirect('/login')

  const tenantId = tu.tenant_id
  const settings = (tu.tenant as any)?.settings
  const nomeSite = settings?.nome_site ?? (tu.tenant as any)?.name ?? 'Minha Loja'
  const accentColor = settings?.cor_destaque ?? '#ea580c'

  const hoje = new Date()
  const sevenDaysAgo = new Date(hoje)
  sevenDaysAgo.setDate(hoje.getDate() - 6)
  const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${pad2(sevenDaysAgo.getMonth() + 1)}-${pad2(sevenDaysAgo.getDate())}`
  const hojeStr = `${hoje.getFullYear()}-${pad2(hoje.getMonth() + 1)}-${pad2(hoje.getDate())}`

  const [
    { count: totalProdutos },
    { count: totalCategorias },
    { count: destaques },
    { count: hiddenTotal },
    { count: orcamentosNovos },
    { data: recentProducts },
    { data: viewsHoje },
    { data: views7d },
  ] = await Promise.all([
    supabase.from('tenant_products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('ativo', true),
    supabase.from('tenant_categories').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('ativa', true),
    supabase.from('tenant_products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('destaque', true),
    supabase.from('tenant_product_visibility').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('hidden', true),
    supabase.from('tenant_orcamentos').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'novo'),
    supabase.from('tenant_products')
      .select('id, nome, imagem_url, destaque, ativo, categoria:tenant_categories(nome, emoji)')
      .eq('tenant_id', tenantId).eq('ativo', true)
      .order('created_at', { ascending: false }).limit(6),
    supabase.from('tenant_page_views').select('views').eq('tenant_id', tenantId).eq('date', hojeStr).single(),
    supabase.from('tenant_page_views').select('date, views').eq('tenant_id', tenantId).gte('date', sevenDaysAgoStr).order('date'),
  ])

  const visitasHoje = viewsHoje?.views ?? 0

  const stats = [
    { label: 'Meus produtos', value: totalProdutos ?? 0, icon: Package, color: 'var(--lp-violet)', bg: 'var(--lp-violet-pale)', href: '/admin/produtos' },
    { label: 'Categorias', value: totalCategorias ?? 0, icon: FolderOpen, color: 'var(--lp-amber)', bg: 'var(--lp-amber-pale)', href: '/admin/categorias' },
    { label: 'Em destaque', value: destaques ?? 0, icon: Star, color: 'var(--lp-success)', bg: 'var(--lp-success-pale)', href: '/admin/produtos' },
    { label: 'Itens ocultos', value: hiddenTotal ?? 0, icon: EyeOff, color: 'var(--lp-ink-3)', bg: 'var(--lp-surface-2)', href: '/admin/biblioteca' },
    { label: 'Orçamentos novos', value: orcamentosNovos ?? 0, icon: MessageSquare, color: '#ea580c', bg: 'rgba(234,88,12,.1)', href: '/admin/orcamentos' },
    { label: 'Visitas hoje', value: visitasHoje, icon: Eye, color: 'var(--lp-success)', bg: 'var(--lp-success-pale)', href: '/admin' },
  ]

  const hasProducts = (totalProdutos ?? 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1100px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
          Olá! 👋
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
          Gerenciando <strong style={{ color: 'var(--lp-ink)' }}>{nomeSite}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats-grid">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
              <div className="card admin-stat-card" style={{ cursor: 'pointer', padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* Topo: ícone + indicador */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                  {stat.label === 'Orçamentos novos' && (orcamentosNovos ?? 0) > 0 ? (
                    <span style={{ padding: '3px 10px', borderRadius: '999px', background: '#ea580c', color: 'white', fontSize: '10px', fontWeight: 700 }}>
                      {orcamentosNovos} novo{(orcamentosNovos ?? 0) > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <ArrowRight size={13} style={{ color: 'var(--lp-ink-4)' }} />
                  )}
                </div>
                {/* Base: número grande + label */}
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 800, color: 'var(--lp-ink)', lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--lp-ink-3)', marginTop: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stat.label}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Gráfico de visitas */}
      <VisitasChart data={views7d ?? []} />

      {/* Produtos recentes */}
      {hasProducts && recentProducts && recentProducts.length > 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.01em' }}>
              Produtos recentes
            </h2>
            <Link href="/admin/produtos" style={{ fontSize: '13px', color: 'var(--lp-violet)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>
          <div className="dashboard-products-grid">
            {recentProducts.map((product: any) => (
              <Link key={product.id} href={`/admin/produtos/${product.id}`} style={{ textDecoration: 'none' }}>
                <div className="card card-hover-lift" style={{ overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', height: '100px', background: 'var(--lp-surface-2)' }}>
                    {product.imagem_url
                      ? <Image src={product.imagem_url} alt={product.nome} fill style={{ objectFit: 'cover' }} sizes="200px" />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={28} style={{ color: 'var(--lp-ink-4)' }} />
                        </div>}
                    {product.destaque && (
                      <span style={{ position: 'absolute', top: '6px', right: '6px', background: accentColor, color: 'white', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                        ★ destaque
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    {product.categoria && (
                      <p style={{ fontSize: '10px', color: 'var(--lp-ink-4)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.categoria.emoji} {product.categoria.nome}
                      </p>
                    )}
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.nome}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--lp-violet-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={24} style={{ color: 'var(--lp-violet)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)', marginBottom: '8px' }}>
            Configure sua loja
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Adicione produtos, configure sua vitrine e comece a receber pedidos pelo WhatsApp.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/admin/produtos/novo" style={{ textDecoration: 'none' }}>
              <button className="btn-primary"><Plus size={15} /> Adicionar produto</button>
            </Link>
            <Link href="/admin/biblioteca" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary"><Library size={15} /> Ver biblioteca global</button>
            </Link>
            <Link href="/admin/vitrine" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary"><Zap size={15} /> Configurar vitrine</button>
            </Link>
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      {hasProducts && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/produtos/novo" style={{ textDecoration: 'none' }}>
            <button className="btn-primary"><Plus size={15} /> Novo produto</button>
          </Link>
          <Link href="/admin/vitrine" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary"><Zap size={15} /> Configurar vitrine</button>
          </Link>
          <Link href="/admin/orcamentos" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ position: 'relative' }}>
              <MessageSquare size={15} /> Ver orçamentos
              {(orcamentosNovos ?? 0) > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '16px', height: '16px', borderRadius: '50%', background: '#ea580c', color: 'white', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {orcamentosNovos}
                </span>
              )}
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

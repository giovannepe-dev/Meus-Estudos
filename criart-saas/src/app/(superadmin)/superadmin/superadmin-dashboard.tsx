'use client'

import { Building2, Package, FolderOpen, ArrowRight, Zap, Star, Palette } from 'lucide-react'
import Link from 'next/link'

interface Props {
  stats: { tenants: number; active: number; products: number; categories: number; colecoes: number }
  recentTenants: any[]
}

export default function SuperadminDashboard({ stats, recentTenants }: Props) {
  const statCards = [
    { label: 'Empresas', value: stats.tenants, sub: `${stats.active} ativas`, icon: Building2, color: 'var(--lp-violet)', bg: 'var(--lp-violet-pale)', href: '/superadmin/tenants' },
    { label: 'Produtos globais', value: stats.products, sub: 'na biblioteca', icon: Package, color: 'var(--lp-amber)', bg: 'var(--lp-amber-pale)', href: '/superadmin/produtos' },
    { label: 'Categorias globais', value: stats.categories, sub: 'ativas', icon: FolderOpen, color: 'var(--lp-success)', bg: 'var(--lp-success-pale)', href: '/superadmin/categorias' },
    { label: 'Kits Papelaria', value: stats.colecoes, sub: 'coleções ativas', icon: Palette, color: '#ec4899', bg: '#fdf2f8', href: '/superadmin/papelaria' },
  ]

  const quickActions = [
    { label: 'Nova empresa', href: '/superadmin/tenants/novo', icon: Building2 },
    { label: 'Nova categoria', href: '/superadmin/categorias/nova', icon: FolderOpen },
    { label: 'Novo produto global', href: '/superadmin/produtos/novo', icon: Package },
  ]

  const statusLabel: Record<string, string> = { active: 'Ativa', trial: 'Trial', inactive: 'Inativa', suspended: 'Suspensa' }
  const statusClass: Record<string, string> = { active: 'badge-green', trial: 'badge-amber', inactive: 'badge-gray', suspended: 'badge-red' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>Visão geral da plataforma CriArt Oficina Digital.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {statCards.map(stat => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '20px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: stat.bg }}>
                    <Icon size={16} style={{ color: stat.color }} />
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--lp-ink-4)' }} />
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'var(--lp-ink)' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--lp-ink-3)', marginTop: '2px' }}>{stat.label}</p>
                <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)', marginTop: '2px' }}>{stat.sub}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Ações rápidas */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Zap size={16} style={{ color: 'var(--lp-amber)' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)' }}>Ações rápidas</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {quickActions.map(a => {
              const Icon = a.icon
              return (
                <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
                  <div className="quick-action-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--lp-violet-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} style={{ color: 'var(--lp-violet)' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--lp-ink-2)' }}>{a.label}</span>
                    <ArrowRight size={14} style={{ color: 'var(--lp-ink-4)', marginLeft: 'auto' }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Empresas recentes */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={16} style={{ color: 'var(--lp-amber)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)' }}>Empresas recentes</h2>
            </div>
            <Link href="/superadmin/tenants" style={{ fontSize: '13px', color: 'var(--lp-violet)', textDecoration: 'none' }}>Ver todas →</Link>
          </div>

          {recentTenants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginBottom: '12px' }}>Nenhuma empresa cadastrada ainda.</p>
              <Link href="/superadmin/tenants/novo">
                <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                  + Cadastrar empresa
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentTenants.map((t: any) => (
                <Link key={t.id} href={`/superadmin/tenants/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div className="quick-action-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: t.settings?.cor_destaque ?? 'var(--lp-violet)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {(t.settings?.nome_site ?? t.name).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--lp-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.settings?.nome_site ?? t.name}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)' }}>/{t.slug}</p>
                    </div>
                    <span className={`badge ${statusClass[t.status] ?? 'badge-gray'}`}>{statusLabel[t.status] ?? t.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

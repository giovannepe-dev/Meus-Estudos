'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Package, Library, Users, Settings, ExternalLink, Store, Zap, X, Calculator, Inbox, Palette } from 'lucide-react'
import { useSidebarStore } from '@/lib/store/sidebarStore'

interface Props { user: any; profile: any; tenant: any; orcamentosNovos?: number }

const baseNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/categorias', label: 'Categorias', icon: FolderOpen },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/papelaria', label: 'Papelaria', icon: Palette, requiresPapelaria: true },
  { href: '/admin/biblioteca', label: 'Biblioteca Global', icon: Library },
  { href: '/admin/vitrine', label: 'Vitrine', icon: Store },
  { href: '/admin/orcamentos', label: 'Orçamentos', icon: Inbox, exact: true },
  { href: '/admin/orcamentos/calculadora', label: 'Calculadora', icon: Calculator },
  { href: '/admin/equipe', label: 'Equipe', icon: Users },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export function TenantSidebar({ user, profile, tenant, orcamentosNovos = 0 }: Props) {
  const pathname = usePathname()
  const { open, close } = useSidebarStore()
  const settings = tenant?.settings
  const nomeSite = settings?.nome_site ?? tenant?.name ?? 'Minha Loja'
  const vitrinePapelaria = settings?.vitrine_papelaria !== false
  const nav = baseNav.filter(item => !item.requiresPapelaria || vitrinePapelaria)
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href)
  const initial = profile?.full_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={close}
        />
      )}

      <aside className={`admin-sidebar admin-sidebar-light${open ? ' sidebar-open' : ''}`}>
        {/* Header */}
        <div style={{
          height: '60px', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 16px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
          background: 'white',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            background: '#0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(15,23,42,.25)',
          }}>
            <Zap size={20} color="white" strokeWidth={2.5} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700,
              color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
            }}>{nomeSite}</p>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Painel Admin</p>
          </div>
          {/* Botão fechar (mobile only) */}
          <button onClick={close} className="sidebar-close-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '6px', display: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 10px 6px',
          }}>Menu</p>

          {nav.map(item => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            const showBadge = item.href === '/admin/orcamentos' && orcamentosNovos > 0
            return (
              <Link key={item.href} href={item.href} onClick={close}
                className={`sidebar-link-light ${active ? 'active' : ''}`}>
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                {showBadge && (
                  <span style={{ minWidth: '18px', height: '18px', borderRadius: '9px', background: '#ea580c', color: 'white', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>
                    {orcamentosNovos}
                  </span>
                )}
              </Link>
            )
          })}

          <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 4px' }} />

          <a href={`/vitrine/${tenant?.slug}`} target="_blank" rel="noopener"
            onClick={close} className="sidebar-link-light" style={{ color: '#94a3b8' }}>
            <ExternalLink size={14} />
            <span>Abrir vitrine</span>
          </a>
        </nav>

        {/* Perfil */}
        <div style={{ padding: '10px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px',
            background: '#f1f5f9',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #ea580c, #c2410c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid rgba(255,255,255,.6)',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{initial}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name ?? 'Admin'}
              </p>
              <p style={{ fontSize: '10px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

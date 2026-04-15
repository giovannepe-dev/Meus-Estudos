'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, FolderOpen, Package, Settings, Store, Zap, Inbox, Palette } from 'lucide-react'

interface Props { user: any; profile: any }

const nav = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/superadmin/tenants', label: 'Empresas', icon: Building2 },
  { href: '/superadmin/vitrine', label: 'Vitrine Global', icon: Store },
  { href: '/superadmin/categorias', label: 'Categorias', icon: FolderOpen },
  { href: '/superadmin/produtos', label: 'Produtos', icon: Package },
  { href: '/superadmin/papelaria', label: 'Papelaria', icon: Palette },
  { href: '/superadmin/solicitacoes', label: 'Solicitações', icon: Inbox },
  { href: '/superadmin/configuracoes', label: 'Configurações', icon: Settings },
]

export function SuperadminSidebar({ user, profile }: Props) {
  const pathname = usePathname()
  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href)
  const initial = profile?.full_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <aside style={{
      width: '232px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh',
      background: 'var(--sidebar-bg)',
    }}>
      {/* Logo */}
      <div style={{
        height: '60px', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 16px', borderBottom: '1px solid var(--sidebar-border)',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, #ea580c, #c2410c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(234,88,12,.5)',
        }}>
          <Zap size={16} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 800,
            color: 'white', letterSpacing: '-0.03em',
          }}>CriArt Oficina Digital</p>
          <span style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
            color: '#f97316', background: 'rgba(234,88,12,.25)',
            padding: '1px 8px', borderRadius: '999px',
          }}>SUPERADMIN</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        <p style={{
          fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.3)',
          textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 10px 6px',
        }}>Gestão</p>

        {nav.map(item => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Perfil */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,.07)',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #ea580c, #c2410c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(234,88,12,.4)',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{initial}</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name ?? 'Superadmin'}
            </p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

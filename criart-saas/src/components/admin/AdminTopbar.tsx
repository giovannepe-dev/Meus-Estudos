'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Bell, Menu, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useSidebarStore } from '@/lib/store/sidebarStore'

interface Props { user: any; profile: any; expiresAt?: string | null }

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/categorias': 'Categorias',
  '/admin/produtos': 'Produtos',
  '/admin/biblioteca': 'Biblioteca Global',
  '/admin/vitrine': 'Vitrine',
  '/admin/equipe': 'Equipe',
  '/admin/configuracoes': 'Configurações',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/admin/produtos/')) return 'Produto'
  return ''
}

export function AdminTopbar({ user, profile, expiresAt }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleSidebar = useSidebarStore(s => s.toggle)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!expiresAt) return
    const diff = new Date(expiresAt).getTime() - Date.now()
    setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [expiresAt])

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? '?'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Admin'
  const pageTitle = getPageTitle(pathname)

  return (
    <header style={{
      height: '60px', borderBottom: '1px solid var(--lp-border)',
      background: 'var(--lp-surface)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', flexShrink: 0, gap: '12px',
    }}>

      {/* Hambúrguer (mobile only) */}
      <button onClick={toggleSidebar} className="sidebar-hamburger"
        style={{
          display: 'none', width: '36px', height: '36px', borderRadius: '10px',
          border: '1px solid var(--lp-border)', background: 'var(--lp-surface-2)',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--lp-ink-2)', flexShrink: 0,
        }}>
        <Menu size={18} />
      </button>

      {/* Page title */}
      {pageTitle && (
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink-2)', letterSpacing: '-0.01em' }} className="topbar-title">
          {pageTitle}
        </p>
      )}

      <div style={{ flex: 1 }} />

      {/* Plano — chip discreto, só aparece quando ≤ 30 dias */}
      {daysLeft !== null && daysLeft <= 30 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '999px', flexShrink: 0,
          background: daysLeft <= 7 ? 'rgba(234,88,12,.12)' : 'rgba(251,191,36,.12)',
          border: `1px solid ${daysLeft <= 7 ? 'rgba(234,88,12,.3)' : 'rgba(251,191,36,.3)'}`,
          fontSize: '11px', fontWeight: 600,
          color: daysLeft <= 7 ? '#ea580c' : '#b45309',
        }}>
          <AlertCircle size={11} />
          {daysLeft <= 0 ? 'Plano expirado' : `${daysLeft}d restantes`}
        </div>
      )}

      {/* Notificações */}
      <button style={{
        width: '34px', height: '34px', borderRadius: '9px', border: '1px solid var(--lp-border)',
        background: 'var(--lp-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--lp-ink-3)', flexShrink: 0,
      }}>
        <Bell size={14} />
      </button>

      {/* Avatar + menu */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px 5px 6px',
          borderRadius: '999px', background: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)',
          cursor: 'pointer',
        }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'var(--gradient-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{initial}</span>
          </div>
          <span style={{
            fontSize: '13px', fontWeight: 500, color: 'var(--lp-ink)',
            maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }} className="topbar-name">
            {firstName}
          </span>
        </button>

        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '220px',
              background: 'var(--lp-surface)', border: '1px solid var(--lp-border)',
              borderRadius: '14px', boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--lp-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--gradient-violet)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{initial}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name ?? 'Usuário'}</p>
                    <p style={{ fontSize: '11px', color: 'var(--lp-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                  </div>
                </div>
              </div>
              <div style={{ padding: '6px' }}>
                <button onClick={handleSignOut} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '9px', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--lp-danger)', fontSize: '13px', fontWeight: 500,
                }}>
                  <LogOut size={15} />
                  Sair da conta
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

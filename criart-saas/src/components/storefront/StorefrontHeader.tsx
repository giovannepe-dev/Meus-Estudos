'use client'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Palette } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/lib/store/cartStore'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { LaserIcon } from '@/components/shared/LaserIcon'

interface Props { tenant: any; settings: any; tenantSlug: string }

export function StorefrontHeader({ tenant, settings, tenantSlug }: Props) {
  const [cartOpen, setCartOpen] = useState(false)
  const totalItems = useCartStore(s => s.totalItems())
  const accentColor = settings?.cor_destaque ?? '#ea580c'
  const nomeSite = settings?.nome_site ?? tenant.name

  return (
    <>
      <nav className="sf-pill-nav">
        {/* Logo */}
        <Link href={`/vitrine/${tenantSlug}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {settings?.logo_url
            ? <Image src={settings.logo_url} alt={nomeSite} width={80} height={30} style={{ width: 'auto', height: '30px', maxWidth: '80px', objectFit: 'contain' }} />
            : <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 14px ${accentColor}66` }}>
                <LaserIcon style={{ width: '16px', height: '16px', color: 'white' }} />
              </div>}
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
            {nomeSite}
          </span>
        </Link>


        {/* Link Papelaria */}
        {settings?.vitrine_papelaria !== false && (
          <Link
            href={`/vitrine/${tenantSlug}/papelaria`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9999px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.9)', fontSize: '13px', fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
            className="sf-papelaria-nav-btn"
          >
            <Palette size={14} />
            Papelaria
          </Link>
        )}

        {/* Ações direita */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {settings?.instagram && (
            <a href={`https://instagram.com/${settings.instagram.replace('@', '')}`} target="_blank" rel="noopener"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.7)', flexShrink: 0, textDecoration: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          )}

          {/* Carrinho — esconde no mobile (mobile bar cuida disso) */}
          <button onClick={() => setCartOpen(true)} className="sf-pill-cart-btn"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', background: accentColor, border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0, boxShadow: `0 4px 16px ${accentColor}44` }}>
            <ShoppingCart size={14} />
            {totalItems > 0 ? `${totalItems > 9 ? '9+' : totalItems}` : 'Carrinho'}
          </button>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} settings={settings} tenantSlug={tenantSlug} tenantId={tenant.id} />
    </>
  )
}

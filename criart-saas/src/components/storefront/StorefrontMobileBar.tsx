'use client'
import Link from 'next/link'
import { Home, ShoppingCart, Grid3x3, Palette } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/lib/store/cartStore'
import { CartDrawer } from '@/components/cart/CartDrawer'

interface Props { tenantSlug: string; settings: any; tenant: any; accentColor: string }

export function StorefrontMobileBar({ tenantSlug, settings, tenant, accentColor }: Props) {
  const [cartOpen, setCartOpen] = useState(false)
  const totalItems = useCartStore(s => s.totalItems())

  return (
    <>
      <div className="sf-mobile-bar">
        <Link href={`/vitrine/${tenantSlug}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,.6)', textDecoration: 'none', padding: '8px 12px' }}>
          <Home size={24} />
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Início</span>
        </Link>

        {settings?.vitrine_papelaria !== false && (
          <Link href={`/vitrine/${tenantSlug}/papelaria`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,.6)', textDecoration: 'none', padding: '8px 12px' }}>
            <Palette size={24} />
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Papelaria</span>
          </Link>
        )}

        <Link href={`/vitrine/${tenantSlug}/catalogo`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: accentColor, boxShadow: `0 8px 24px ${accentColor}66`, color: 'white', textDecoration: 'none', marginTop: '-8px', border: '3px solid rgba(8,8,8,0.95)', flexShrink: 0 }}>
          <Grid3x3 size={24} />
        </Link>

        <button onClick={() => setCartOpen(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '8px 12px' }}>
          <ShoppingCart size={24} />
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Carrinho</span>
          {totalItems > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-8px', width: '16px', height: '16px', borderRadius: '50%', background: accentColor, color: 'white', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </button>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} settings={settings} tenantSlug={tenantSlug} tenantId={tenant.id} />
    </>
  )
}

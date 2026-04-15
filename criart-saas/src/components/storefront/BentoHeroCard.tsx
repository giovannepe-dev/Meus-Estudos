'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Package } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { toast } from 'sonner'

interface Props {
  product: any
  tenantSlug: string
  accentColor: string
  mostrarPreco?: boolean
  isMain?: boolean
}

export function BentoHeroCard({ product, tenantSlug, accentColor, mostrarPreco, isMain }: Props) {
  const addItem = useCartStore(s => s.addItem)
  const cardRef = useRef<HTMLDivElement>(null)
  const [imgError, setImgError] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    addItem(product)
    toast.success(`${product.nome} adicionado!`, { duration: 2000 })
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * (isMain ? 14 : 10)
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * (isMain ? -14 : -10)
    cardRef.current.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) scale3d(1.025,1.025,1.025)`
  }

  function handleMouseLeave() {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
  }

  return (
    <Link
      href={`/vitrine/${tenantSlug}/produto/${product.slug}${product.source === 'global' ? '?src=global' : ''}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <div
        ref={cardRef}
        className={`bento-hero-card tilt-card${isMain ? ' laser-sweep' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          height: '100%',
          borderRadius: isMain ? '28px' : '20px',
          overflow: 'hidden',
          cursor: 'pointer',
          background: 'var(--lp-surface-2)',
          border: '1.5px solid var(--lp-border)',
          boxShadow: 'var(--shadow-sm)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Imagem de fundo */}
        {product.imagem_url && !imgError ? (
          <img
            src={product.imagem_url}
            alt={product.nome}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            className="bento-hero-img"
            loading={isMain ? 'eager' : 'lazy'}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lp-surface-2)' }}>
            <Package size={isMain ? 64 : 40} style={{ color: 'var(--lp-ink-4)' }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)',
          zIndex: 1,
        }} />

        {/* Badge destaque */}
        {isMain && product.destaque && (
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 6 }}>
            <span style={{
              background: accentColor, color: 'white',
              fontSize: '10px', fontWeight: 800,
              padding: '4px 14px', borderRadius: '999px',
              letterSpacing: '0.07em', textTransform: 'uppercase',
              boxShadow: `0 4px 14px ${accentColor}66`,
            }}>
              O MAIS PEDIDO
            </span>
          </div>
        )}

        {/* Conteúdo no bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMain ? '24px' : '14px', zIndex: 6 }}>
          {product.categoria && (
            <p style={{
              fontSize: '10px', fontWeight: 600,
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '4px',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {product.categoria.emoji} {product.categoria.nome}
            </p>
          )}
          {product.numero && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', marginBottom: '2px', display: 'block' }}>
              #{product.numero}
            </span>
          )}
          <h3 style={{
            fontSize: isMain ? '22px' : '14px',
            fontWeight: 700, color: 'white',
            marginBottom: isMain ? '16px' : '10px',
            lineHeight: 1.25,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>
            {product.nome}
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {mostrarPreco && product.preco != null && (
              <span style={{ fontSize: isMain ? '18px' : '14px', fontWeight: 700, color: 'white' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
              </span>
            )}
            <button
              onClick={handleAdd}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: isMain ? '10px 18px' : '7px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white',
                fontSize: isMain ? '13px' : '11px',
                fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.background = `${accentColor}CC`
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = accentColor
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'
              }}
            >
              <ShoppingCart size={isMain ? 14 : 11} /> Pedir
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

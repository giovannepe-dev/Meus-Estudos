'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Star, Sparkles, Package } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { toast } from 'sonner'

interface Props { product: any; tenantSlug: string; accentColor: string; mostrarPreco?: boolean }

export function ProductCard({ product, tenantSlug, accentColor, mostrarPreco }: Props) {
  const addItem = useCartStore(s => s.addItem)
  const tags = product.tags?.map((t: any) => t.tag ?? t) ?? []
  const [imgError, setImgError] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    addItem(product)
    toast.success(`${product.nome} adicionado!`, { duration: 2000 })
  }

  return (
    <Link href={`/vitrine/${tenantSlug}/produto/${product.slug}${product.source === 'global' ? '?src=global' : ''}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 200ms' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)' }}>

        {/* Imagem */}
        <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--lp-surface-2)', overflow: 'hidden' }}>
          {product.imagem_url && !imgError
            ? <img src={product.imagem_url} alt={product.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" onError={() => setImgError(true)} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={36} style={{ color: 'var(--lp-ink-4)' }} /></div>}

          {/* Badges */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {product.destaque && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: accentColor, color: 'white' }}>
                <Star size={9} style={{ fill: 'white' }} /> Destaque
              </span>
            )}
            {product.novidade && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'var(--lp-amber)', color: 'white' }}>
                <Sparkles size={9} /> Novo
              </span>
            )}
          </div>

        </div>

        {/* Info */}
        <div style={{ padding: '12px' }}>
          {product.categoria && (
            <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', color: accentColor }}>
              {product.categoria.emoji} {product.categoria.nome}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
            {product.numero && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-ink-4)', fontFamily: 'monospace', flexShrink: 0 }}>
                #{product.numero}
              </span>
            )}
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)', lineHeight: 1.3,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: 0 }}>
              {product.nome}
            </p>
          </div>
          {product.arquivo && (
            <p style={{ fontSize: '10px', color: 'var(--lp-ink-4)', fontFamily: 'monospace', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📄 {product.arquivo}
            </p>
          )}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {tags.slice(0, 3).map((tag: string) => (
                <span key={tag} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', background: 'var(--lp-surface-2)', color: 'var(--lp-ink-3)' }}>{tag}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {mostrarPreco && product.preco != null && (
              <span style={{ fontSize: '16px', fontWeight: 800, color: accentColor }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
              </span>
            )}
            <button onClick={handleAdd}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px',
                background: accentColor, color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'all 180ms', width: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 12px ${accentColor}40` }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}>
              <ShoppingCart size={15} /> Pedir
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ShoppingCart, Plus, Check, ChevronLeft } from 'lucide-react'

interface CartItem {
  id: string
  nome: string
  slug: string
}

interface Props {
  collection: { id: string; nome: string; slug: string; descricao: string | null }
  parent: { id: string; nome: string; slug: string } | null
  images: { id: string; imagem_url: string; ordem: number }[]
  settings: any
  accentColor: string
  tenantSlug: string
}

function getCartKey(tenantSlug: string) {
  return `papelaria_cart_${tenantSlug}`
}

function getCart(tenantSlug: string): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(getCartKey(tenantSlug)) ?? '[]')
  } catch {
    return []
  }
}

function saveCart(tenantSlug: string, items: CartItem[]) {
  localStorage.setItem(getCartKey(tenantSlug), JSON.stringify(items))
}

export function CollectionDetailClient({ collection, parent, images, settings, accentColor, tenantSlug }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [inCart, setInCart] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [showCart, setShowCart] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [personalizacao, setPersonalizacao] = useState('')

  useEffect(() => {
    const cart = getCart(tenantSlug)
    setCartItems(cart)
    setCartCount(cart.length)
    setInCart(cart.some(i => i.id === collection.id))
  }, [tenantSlug, collection.id])

  function toggleCart() {
    const cart = getCart(tenantSlug)
    let newCart: CartItem[]
    if (inCart) {
      newCart = cart.filter(i => i.id !== collection.id)
    } else {
      newCart = [...cart, { id: collection.id, nome: collection.nome, slug: collection.slug }]
    }
    saveCart(tenantSlug, newCart)
    setCartItems(newCart)
    setCartCount(newCart.length)
    setInCart(!inCart)
  }

  function removeFromCart(id: string) {
    const newCart = cartItems.filter(i => i.id !== id)
    saveCart(tenantSlug, newCart)
    setCartItems(newCart)
    setCartCount(newCart.length)
    if (id === collection.id) setInCart(false)
  }

  function handleEnviarWhatsApp() {
    if (!settings?.whatsapp) return
    const numero = settings.whatsapp.replace(/\D/g, '')
    const temas = cartItems.map(i => `• ${i.nome}`).join('\n')
    const msg = [
      `Olá! Gostaria de solicitar os seguintes temas de papelaria:`,
      `\n${temas}`,
      personalizacao ? `\n\n📝 *Personalização:*\n${personalizacao}` : '',
    ].join('')
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const parentHref = parent
    ? `/vitrine/${tenantSlug}/papelaria/${parent.slug}`
    : `/vitrine/${tenantSlug}/papelaria`

  const parentNome = parent?.nome ?? 'Papelaria'

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>

      {/* Botão voltar */}
      <Link
        href={parentHref}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', padding: '8px 16px', borderRadius: '10px', background: 'var(--lp-surface-2)', border: '1.5px solid var(--lp-border)', fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink-2)', textDecoration: 'none' }}
      >
        <ChevronLeft size={16} /> {parentNome}
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            {collection.nome}
          </h1>
          {collection.descricao && (
            <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>{collection.descricao}</p>
          )}
          <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)', marginTop: '4px' }}>
            {images.length} imagem{images.length !== 1 ? 'ns' : ''} neste kit
          </p>
        </div>

        {/* Botão adicionar ao carrinho */}
        <button
          onClick={toggleCart}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
            border: `2px solid ${accentColor}`,
            color: inCart ? 'white' : accentColor,
            background: inCart ? accentColor : 'transparent',
            cursor: 'pointer', transition: 'all 200ms', flexShrink: 0,
          }}
        >
          {inCart ? <Check size={16} /> : <Plus size={16} />}
          {inCart ? 'Adicionado' : 'Adicionar ao carrinho'}
        </button>
      </div>

      {/* Grid de imagens */}
      {images.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--lp-ink-4)', border: '2px dashed var(--lp-border)', borderRadius: '16px' }}>
          <p style={{ fontSize: '14px' }}>Imagens em breve.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '40px' }}>
          {images.map(img => (
            <div
              key={img.id}
              onClick={() => setLightbox(img.imagem_url)}
              style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', cursor: 'zoom-in', border: '1.5px solid var(--lp-border)', background: 'var(--lp-surface-2)' }}
            >
              <img
                src={img.imagem_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms' }}
                loading="lazy"
                onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <X size={20} />
          </button>
          <img src={lightbox} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }} />
        </div>
      )}

      {/* Carrinho flutuante */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
          {!showCart ? (
            <button
              onClick={() => setShowCart(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 20px', borderRadius: '999px', fontSize: '14px', fontWeight: 700,
                color: 'white', background: accentColor, border: 'none', cursor: 'pointer',
                boxShadow: `0 4px 20px ${accentColor}66`,
              }}
            >
              <ShoppingCart size={18} />
              {cartCount} tema{cartCount !== 1 ? 's' : ''} selecionado{cartCount !== 1 ? 's' : ''}
            </button>
          ) : (
            <div style={{ width: '340px', background: 'var(--lp-surface)', border: '1.5px solid var(--lp-border)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              {/* Header do carrinho */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--lp-border)' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--lp-ink)' }}>
                  Temas selecionados ({cartCount})
                </span>
                <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lp-ink-3)', display: 'flex', alignItems: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Lista de itens */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px 0' }}>
                {cartItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--lp-ink)', fontWeight: 500 }}>{item.nome}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lp-ink-4)', display: 'flex', alignItems: 'center', padding: '2px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Personalização */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--lp-border)' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--lp-ink-2)', display: 'block', marginBottom: '6px' }}>
                  Personalização (nome, cor, data...)
                </label>
                <textarea
                  value={personalizacao}
                  onChange={e => setPersonalizacao(e.target.value)}
                  placeholder="Ex: Nome da criança, cor preferida, data do evento..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px', border: '1.5px solid var(--lp-border)', borderRadius: '10px',
                    fontSize: '13px', color: 'var(--lp-ink)', fontFamily: 'var(--font-body)', resize: 'vertical',
                    outline: 'none', background: 'var(--lp-base)', lineHeight: 1.5, boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = accentColor }}
                  onBlur={e => { e.target.style.borderColor = 'var(--lp-border)' }}
                />
              </div>

              {/* Botão WhatsApp */}
              {settings?.whatsapp ? (
                <div style={{ padding: '0 20px 20px' }}>
                  <button
                    onClick={handleEnviarWhatsApp}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                      color: 'white', background: '#25D366', border: 'none', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Solicitar via WhatsApp
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

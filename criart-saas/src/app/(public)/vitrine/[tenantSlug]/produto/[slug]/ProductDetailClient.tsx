'use client'

import { useState } from 'react'

import { ShoppingCart, Plus, Minus, Star, Sparkles, Package, MessageSquare, Check, Share2, Download } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { toast } from 'sonner'
import { ProductCard } from '@/components/storefront/ProductCard'

interface Props {
  product: any
  settings: any
  accentColor: string
  tenantSlug: string
  related: any[]
}

export function ProductDetailClient({ product, settings, accentColor, tenantSlug, related }: Props) {
  const addItem = useCartStore(s => s.addItem)
  const [quantidade, setQuantidade] = useState(1)
  const [personalizacao, setPersonalizacao] = useState('')
  const [mostrarPersonalizacao, setMostrarPersonalizacao] = useState(false)
  const [added, setAdded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const mostrarPreco = settings?.mostrar_preco ?? false
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const imgSrc = product.imagem_url ?? null

  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) {
      navigator.share({ title: product.nome, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!')).catch(() => {})
    }
  }

  function handleAdd() {
    addItem({ ...product, observacao_inicial: personalizacao }, quantidade)
    setAdded(true)
    toast.success(`${product.nome} adicionado ao carrinho!`)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
      {/* Produto principal */}
      <div style={{ marginBottom: '64px' }} className="product-detail-grid">

        {/* Imagem */}
        <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--lp-surface-2)', border: '1.5px solid var(--lp-border)', aspectRatio: '1', position: 'relative' }}>
          {imgSrc && !imgError ? (
            <img src={imgSrc} alt={product.nome} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={80} style={{ color: 'var(--lp-ink-4)' }} />
            </div>
          )}
          {/* Badges */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {product.destaque && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: accentColor, color: 'white' }}>
                <Star size={11} style={{ fill: 'white' }} /> Destaque
              </span>
            )}
            {product.novidade && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: 'var(--lp-amber)', color: 'white' }}>
                <Sparkles size={11} /> Novo
              </span>
            )}
          </div>

          {/* Botão de compartilhar */}
          <button
            onClick={handleShare}
            style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', color: 'white', transition: 'background 180ms' }}
            title="Compartilhar produto"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = accentColor }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.45)' }}
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {product.numero && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--lp-ink-4)', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '6px', background: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)' }}>
                #{product.numero}
              </span>
            )}
            {product.categoria && (
              <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor, margin: 0 }}>
                {product.categoria.emoji} {product.categoria.nome}
              </p>
            )}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: 'var(--lp-ink)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {product.nome}
          </h1>

          {product.descricao && (
            <p style={{ fontSize: '15px', color: 'var(--lp-ink-3)', lineHeight: 1.7 }}>{product.descricao}</p>
          )}

          {product.tags && product.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {product.tags.map((t: { tag: string }, i: number) => (
                <span key={i} style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: `${accentColor}18`, color: accentColor, letterSpacing: '0.02em' }}>
                  {t.tag}
                </span>
              ))}
            </div>
          )}

          {mostrarPreco && product.preco != null && (
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: accentColor }}>
              {fmt(product.preco)}
            </p>
          )}

          {/* Quantidade */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quantidade
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--lp-surface)', border: '1.5px solid var(--lp-border)', borderRadius: '12px', padding: '4px' }}>
              <button onClick={() => setQuantidade(q => Math.max(1, q - 1))}
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: quantidade === 1 ? 'transparent' : 'var(--lp-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lp-ink-2)' }}>
                <Minus size={14} />
              </button>
              <span style={{ width: '48px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)' }}>
                {quantidade}
              </span>
              <button onClick={() => setQuantidade(q => q + 1)}
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: 'none', background: 'var(--lp-surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Personalização */}
          {product.personalizavel !== false && (
            <div style={{ borderRadius: '14px', border: `1.5px solid ${mostrarPersonalizacao ? accentColor : 'var(--lp-border)'}`, overflow: 'hidden', transition: 'border-color 200ms' }}>
              <button
                onClick={() => setMostrarPersonalizacao(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: mostrarPersonalizacao ? `${accentColor}10` : 'var(--lp-surface)', border: 'none', cursor: 'pointer', transition: 'background 200ms' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={16} style={{ color: mostrarPersonalizacao ? accentColor : 'var(--lp-ink-3)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: mostrarPersonalizacao ? accentColor : 'var(--lp-ink-2)' }}>
                    Quero personalização
                  </span>
                </div>
                <span style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: mostrarPersonalizacao ? accentColor : 'var(--lp-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 200ms',
                }}>
                  {mostrarPersonalizacao && <Check size={11} color="white" />}
                </span>
              </button>
              {mostrarPersonalizacao && (
                <div style={{ padding: '4px 16px 16px' }}>
                  <textarea
                    value={personalizacao}
                    onChange={e => setPersonalizacao(e.target.value)}
                    placeholder="Ex: Escrever o nome 'Maria' na frente, cor branca, fonte cursiva... Descreva como você quer o produto."
                    rows={4}
                    style={{ width: '100%', padding: '12px', border: '1.5px solid var(--lp-border)', borderRadius: '10px', fontSize: '14px', color: 'var(--lp-ink)', fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none', background: 'var(--lp-base)', lineHeight: 1.6, boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = accentColor }}
                    onBlur={e => { e.target.style.borderColor = 'var(--lp-border)' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginTop: '6px' }}>
                    Suas informações serão enviadas no pedido pelo WhatsApp.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Arquivo DXF */}
          {product.arquivo && (
            <a
              href={product.arquivo}
              download
              target="_blank"
              rel="noopener"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: accentColor, background: `${accentColor}12`, border: `1.5px solid ${accentColor}30`, textDecoration: 'none', transition: 'background 180ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accentColor}22` }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accentColor}12` }}
            >
              <Download size={16} />
              Baixar arquivo DXF
            </a>
          )}

          {/* Botão adicionar */}
          <button
            onClick={handleAdd}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '16px', borderRadius: '14px', fontSize: '15px', fontWeight: 700,
              color: 'white', border: 'none', cursor: 'pointer',
              background: added ? '#10B981' : `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
              boxShadow: added ? '0 6px 20px rgba(16,185,129,.35)' : `0 6px 20px ${accentColor}55`,
              transition: 'all 300ms',
              transform: added ? 'scale(1.02)' : 'scale(1)',
            }}>
            {added ? <Check size={18} /> : <ShoppingCart size={18} />}
            {added ? 'Adicionado!' : `Adicionar ao carrinho${quantidade > 1 ? ` (${quantidade}x)` : ''}`}
          </button>

          {/* WhatsApp direto */}
          {settings?.whatsapp && (
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                [
                  `Olá! Vi na vitrine *${settings?.nome_site ?? 'CriArt Oficina Digital'}* e tenho interesse:`,
                  ``,
                  `🏷️ *${product.nome}*${product.numero ? ` (#${product.numero})` : ''}`,
                  product.categoria?.nome ? `📂 Categoria: ${product.categoria.nome}` : '',
                  `🔢 Quantidade: ${quantidade}`,
                  personalizacao ? `📝 Personalização: ${personalizacao}` : '',
                  ``,
                  `Poderia me passar mais informações? Obrigado! 🙏`,
                ].filter(l => l !== null && l !== undefined && !(l === '' && !personalizacao)).join('\n')
              )}`}
              target="_blank" rel="noopener"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, color: 'white', background: '#25D366', textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Perguntar pelo WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Produtos relacionados */}
      {related.length > 0 && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--lp-ink)', marginBottom: '24px', letterSpacing: '-0.02em' }}>
            Produtos relacionados
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {related.map((p: any) => (
              <ProductCard key={p.id} product={p} tenantSlug={tenantSlug} accentColor={accentColor} mostrarPreco={mostrarPreco} />
            ))}
          </div>
        </div>
      )}

    </>
  )
}

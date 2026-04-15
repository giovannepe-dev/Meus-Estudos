'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'

interface Child {
  id: string
  nome: string
  slug: string
  descricao: string | null
  fotos: string[]
}

interface Props {
  collection: { id: string; nome: string; slug: string; descricao: string | null }
  children: Child[]
  ownImages?: string[]
  parent: { id: string; nome: string; slug: string } | null
  tenantSlug: string
  accentColor: string
}

export default function SubcategoryGrid({ collection, children, ownImages = [], parent, tenantSlug, accentColor }: Props) {
  const parentHref = parent
    ? `/vitrine/${tenantSlug}/papelaria/${parent.slug}`
    : `/vitrine/${tenantSlug}/papelaria`
  const parentNome = parent?.nome ?? 'Papelaria'

  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>

      {/* Botão voltar */}
      <Link
        href={parentHref}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', padding: '8px 16px', borderRadius: '10px', background: 'var(--lp-surface-2)', border: '1.5px solid var(--lp-border)', fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink-2)', textDecoration: 'none' }}
      >
        <ChevronLeft size={16} /> {parentNome}
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          {collection.nome}
        </h1>
        {collection.descricao && (
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>{collection.descricao}</p>
        )}
        <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)', marginTop: '4px' }}>
          {children.length} estilo{children.length !== 1 ? 's' : ''} disponíve{children.length !== 1 ? 'is' : 'l'}
        </p>
      </div>

      {/* Grid de estilos — Opção 1: imagem full + nome overlay */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {children.map(sub => (
          <Link key={sub.id} href={`/vitrine/${tenantSlug}/papelaria/${sub.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              position: 'relative',
              aspectRatio: '3/4',
              borderRadius: '14px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'var(--lp-surface-2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'transform 200ms, box-shadow 200ms',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              {/* Imagem de fundo */}
              {sub.fotos.length > 0 ? (
                <img
                  src={sub.fotos[0]}
                  alt={sub.nome}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '48px',
                }}>
                  🎨
                </div>
              )}

              {/* Gradient overlay + nome */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)',
              }} />

              {/* Nome e número do estilo */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 12px' }}>
                <p style={{
                  fontSize: '13px', fontWeight: 700, color: 'white', margin: 0,
                  lineHeight: 1.35, textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {sub.nome}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out', padding: '24px' }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '12px' }} />
        </div>
      )}
    </div>
  )
}

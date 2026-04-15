'use client'

import Link from 'next/link'
import { ChevronLeft, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

interface Item {
  id: string
  nome: string
  slug: string
  total: number
  fotos: string[]
}

interface Props {
  items: Item[]
  tenantSlug: string
  accentColor: string
}

function normalizeFirstLetter(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .charAt(0)
    .toUpperCase()
}

export default function PapelariaAZClient({ items, tenantSlug, accentColor }: Props) {
  const [letraAtiva, setLetraAtiva] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const buscaLower = busca.trim().toLowerCase()

  const itensFiltrados = useMemo(() =>
    buscaLower
      ? items.filter(i => i.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(
          buscaLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        ))
      : items,
    [items, buscaLower]
  )

  // Agrupa por letra
  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {}
    for (const item of itensFiltrados) {
      const letter = normalizeFirstLetter(item.nome)
      if (!g[letter]) g[letter] = []
      g[letter].push(item)
    }
    return g
  }, [itensFiltrados])

  const lettersComTemas = Object.keys(grouped).sort()

  const letrasExibidas = letraAtiva ? [letraAtiva] : lettersComTemas

  return (
    <div>
      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-ink-4)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar tema..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setLetraAtiva(null) }}
          style={{
            width: '100%', padding: '11px 14px 11px 38px',
            border: `1.5px solid ${busca ? accentColor + '80' : 'var(--lp-border)'}`,
            borderRadius: '12px',
            fontSize: '14px', color: 'var(--lp-ink)', backgroundColor: 'var(--lp-surface)',
            fontFamily: 'var(--font-body)', boxSizing: 'border-box',
            outline: 'none', transition: 'border-color 150ms',
          }}
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--lp-ink-4)', fontSize: '18px', lineHeight: 1, padding: '4px',
            }}
          >×</button>
        )}
      </div>

      {/* Barra de índice A-Z — oculta durante busca */}
      {!buscaLower && <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px',
        marginBottom: '32px',
        padding: '12px 16px',
        background: 'var(--lp-surface-2)',
        border: '1.5px solid var(--lp-border)',
        borderRadius: '12px',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lp-ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', alignSelf: 'center', marginRight: '6px' }}>
          Ir para:
        </span>
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => {
          const active = !!grouped[l]
          const selecionada = letraAtiva === l
          return (
            <button
              key={l}
              onClick={() => {
                if (!active) return
                setLetraAtiva(selecionada ? null : l)
              }}
              disabled={!active}
              style={{
                width: '30px', height: '30px',
                borderRadius: '7px',
                border: selecionada ? `2px solid ${accentColor}` : 'none',
                background: selecionada ? 'white' : active ? accentColor : 'transparent',
                color: selecionada ? accentColor : active ? 'white' : 'var(--lp-ink-4)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: active ? 'pointer' : 'default',
                opacity: active ? 1 : 0.3,
                transition: 'all 150ms',
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, minWidth: '30px', padding: '0 4px',
              }}
            >
              <span style={{ fontSize: '13px' }}>{l}</span>
              {active && <span style={{ fontSize: '9px', opacity: 0.85, marginTop: '1px' }}>{grouped[l].length}</span>}
            </button>
          )
        })}
      </div>}

      {/* Banner da letra selecionada */}
      {letraAtiva && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '24px',
          padding: '12px 16px',
          background: accentColor + '15',
          border: `1.5px solid ${accentColor}40`,
          borderRadius: '12px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 800, color: 'white',
            fontFamily: 'var(--font-display)', flexShrink: 0,
          }}>
            {letraAtiva}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--lp-ink)', margin: 0 }}>
              {grouped[letraAtiva]?.length ?? 0} tema{(grouped[letraAtiva]?.length ?? 0) !== 1 ? 's' : ''} com "{letraAtiva}"
            </p>
          </div>
          <button
            onClick={() => setLetraAtiva(null)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px',
              background: 'var(--lp-surface)', border: '1.5px solid var(--lp-border)',
              fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink-2)',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={14} /> Ver todas
          </button>
        </div>
      )}

      {/* Seções por letra */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {letrasExibidas.map(letter => (
          <div key={letter}>
            {/* Cabeçalho da letra */}
            {!letraAtiva && !buscaLower && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={() => setLetraAtiva(letter)}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '10px',
                    background: accentColor,
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 800, color: 'white',
                    fontFamily: 'var(--font-display)',
                    flexShrink: 0, cursor: 'pointer',
                  }}
                >
                  {letter}
                </button>
                <div style={{ flex: 1, height: '1px', background: 'var(--lp-border)' }} />
                <span style={{ fontSize: '12px', color: 'var(--lp-ink-4)', fontWeight: 600, flexShrink: 0 }}>
                  {grouped[letter].length} tema{grouped[letter].length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Grid de temas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {grouped[letter].map(item => (
                <Link
                  key={item.id}
                  href={`/vitrine/${tenantSlug}/papelaria/${item.slug}`}
                  style={{ textDecoration: 'none' }}
                >
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
                    {item.fotos.length > 0 ? (
                      <img
                        src={item.fotos[0]}
                        alt={item.nome}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '40px',
                      }}>🎨</div>
                    )}

                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)',
                    }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 10px' }}>
                      <p style={{
                        fontSize: '12px', fontWeight: 700, color: 'white', margin: '0 0 3px',
                        lineHeight: 1.3, textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {item.nome}
                      </p>
                      {item.total > 0 && (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                          {item.total} estilo{item.total !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {letrasExibidas.length === 0 && buscaLower && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--lp-ink-4)' }}>
          <p style={{ fontSize: '15px' }}>Nenhum tema encontrado para <strong>"{busca}"</strong></p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Download, ChevronLeft } from 'lucide-react'

interface Item {
  id: string
  nome: string
  slug: string
  ativo: boolean
  drive_folder_id: string | null
  total: number
  capa: string | null
}

interface Props { items: Item[] }

function normalizeFirstLetter(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .charAt(0)
    .toUpperCase()
}

export function PapelariaGlobaisClient({ items }: Props) {
  const [letraAtiva, setLetraAtiva] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const buscaLower = busca.trim().toLowerCase()

  // Filtra por busca
  const itensFiltrados = useMemo(() =>
    buscaLower
      ? items.filter(i => i.nome.toLowerCase().includes(buscaLower))
      : items,
    [items, buscaLower]
  )

  // Agrupa por letra
  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {}
    for (const item of itensFiltrados) {
      const l = normalizeFirstLetter(item.nome)
      if (!g[l]) g[l] = []
      g[l].push(item)
    }
    return g
  }, [itensFiltrados])

  const letrasComTemas = Object.keys(grouped).sort()
  const letrasExibidas = letraAtiva ? [letraAtiva] : letrasComTemas

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
          Papelaria — Temas Globais
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', margin: 0 }}>
          {items.length} temas · A a Z
        </p>
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-ink-4)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar tema..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setLetraAtiva(null) }}
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            border: '1px solid var(--lp-border)', borderRadius: '10px',
            fontSize: '14px', color: 'var(--lp-ink)', backgroundColor: 'var(--lp-surface)',
            fontFamily: 'var(--font-body)', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Barra A-Z */}
      {!buscaLower && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '4px',
          marginBottom: '28px', padding: '10px 14px',
          background: 'var(--lp-surface-2)', border: '1.5px solid var(--lp-border)', borderRadius: '12px',
        }}>
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => {
            const count = grouped[l]?.length ?? 0
            const active = count > 0
            const sel = letraAtiva === l
            return (
              <button
                key={l}
                onClick={() => active && setLetraAtiva(sel ? null : l)}
                disabled={!active}
                style={{
                  minWidth: '34px', height: '34px', padding: '0 6px',
                  borderRadius: '7px',
                  border: sel ? '2px solid #ec4899' : 'none',
                  background: sel ? 'white' : active ? '#ec4899' : 'transparent',
                  color: sel ? '#ec4899' : active ? 'white' : 'var(--lp-ink-4)',
                  fontSize: '12px', fontWeight: 700,
                  cursor: active ? 'pointer' : 'default',
                  opacity: active ? 1 : 0.25,
                  transition: 'all 150ms', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: '13px' }}>{l}</span>
                {active && <span style={{ fontSize: '9px', opacity: 0.85, marginTop: '1px' }}>{count}</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Banner letra selecionada */}
      {letraAtiva && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px',
          padding: '10px 16px', background: '#fdf2f8', border: '1.5px solid #ec489940', borderRadius: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px', background: '#ec4899',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 800, color: 'white', flexShrink: 0,
          }}>{letraAtiva}</div>
          <p style={{ flex: 1, fontWeight: 700, fontSize: '14px', color: 'var(--lp-ink)', margin: 0 }}>
            {grouped[letraAtiva]?.length ?? 0} temas com "{letraAtiva}"
          </p>
          <button
            onClick={() => setLetraAtiva(null)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '8px',
              background: 'white', border: '1.5px solid var(--lp-border)',
              fontSize: '12px', fontWeight: 700, color: 'var(--lp-ink-2)', cursor: 'pointer',
            }}
          >
            <ChevronLeft size={13} /> Ver todas
          </button>
        </div>
      )}

      {/* Seções por letra */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {letrasExibidas.map(letter => (
          <div key={letter}>
            {/* Cabeçalho da letra */}
            {!letraAtiva && !buscaLower && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <button
                  onClick={() => setLetraAtiva(letter)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '9px', background: '#ec4899',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 800, color: 'white', cursor: 'pointer', flexShrink: 0,
                  }}
                >{letter}</button>
                <div style={{ flex: 1, height: '1px', background: 'var(--lp-border)' }} />
                <span style={{ fontSize: '12px', color: 'var(--lp-ink-4)', fontWeight: 600, flexShrink: 0 }}>
                  {grouped[letter].length} tema{grouped[letter].length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Grid de temas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
              {grouped[letter].map(item => (
                <div key={item.id} style={{
                  position: 'relative', borderRadius: '14px', overflow: 'hidden',
                  background: 'var(--lp-surface-2)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  aspectRatio: '3/4', cursor: 'pointer',
                }}>
                  {/* Imagem */}
                  {item.capa ? (
                    <img src={item.capa} alt={item.nome} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🎨</div>
                  )}

                  {/* Gradiente */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)' }} />

                  {/* Badge inativo */}
                  {!item.ativo && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.6)', fontSize: '10px', fontWeight: 700, color: '#fca5a5' }}>
                      Oculto
                    </div>
                  )}

                  {/* Download */}
                  {item.drive_folder_id && (
                    <a
                      href={`https://drive.google.com/drive/folders/${item.drive_folder_id}`}
                      target="_blank" rel="noopener"
                      title="Abrir no Drive"
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: '#ec4899', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textDecoration: 'none', flexShrink: 0,
                      }}
                    >
                      <Download size={13} />
                    </a>
                  )}

                  {/* Nome e contagem — link para detalhe */}
                  <Link href={`/superadmin/papelaria/${item.id}`} style={{ textDecoration: 'none', position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 10px' }}>
                    <p style={{
                      fontSize: '12px', fontWeight: 700, color: 'white', margin: '0 0 3px',
                      lineHeight: 1.3, textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.nome}
                    </p>
                    {item.total > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                        {item.total} estilo{item.total !== 1 ? 's' : ''}
                      </span>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {letrasExibidas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--lp-ink-4)' }}>
          <p>Nenhum tema encontrado para "{busca}"</p>
        </div>
      )}
    </div>
  )
}

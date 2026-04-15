'use client'

import { useState, useMemo } from 'react'
import { Search, Download, Image, FolderOpen, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Kit {
  id: string
  nome: string
  slug: string
  parent_id: string | null
  drive_folder_id: string | null
  ordem: number | null
  num_imagens: number
  oculto: boolean
}

interface Categoria {
  id: string
  nome: string
  slug: string
  drive_folder_id: string | null
  kits: Kit[]
}

interface Props {
  categorias: Categoria[]
  semCategoria: Kit[]
  accentColor: string
  tenantId: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  quadrinhos: '🎨',
  'datas-especiais': '🎉',
  infantil: '🧸',
  religioso: '✝️',
  'copos-bolha': '🥤',
}

function driveUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`
}

export function PapelariaAdminClient({ categorias, semCategoria, accentColor, tenantId }: Props) {
  const supabase = createClient()
  const [busca, setBusca] = useState('')

  // Estado local de coleções ocultas
  const initialHidden = useMemo(() => {
    const s = new Set<string>()
    for (const cat of categorias) for (const kit of cat.kits) if (kit.oculto) s.add(kit.id)
    for (const kit of semCategoria) if (kit.oculto) s.add(kit.id)
    return s
  }, [categorias, semCategoria])
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(initialHidden)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function toggleVisibilidade(kitId: string) {
    if (togglingId) return
    setTogglingId(kitId)
    const estaOculto = hiddenIds.has(kitId)
    if (estaOculto) {
      const { error } = await supabase
        .from('tenant_hidden_collections')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('collection_id', kitId)
      if (error) { toast.error('Erro ao tornar visível'); setTogglingId(null); return }
      setHiddenIds(prev => { const s = new Set(prev); s.delete(kitId); return s })
      toast.success('Visível na vitrine')
    } else {
      const { error } = await supabase
        .from('tenant_hidden_collections')
        .insert({ tenant_id: tenantId, collection_id: kitId })
      if (error) { toast.error('Erro ao ocultar'); setTogglingId(null); return }
      setHiddenIds(prev => new Set([...prev, kitId]))
      toast.success('Oculto da vitrine')
    }
    setTogglingId(null)
  }
  const expandidoInicial = useMemo(() => {
    const r: Record<string, boolean> = {}
    for (const cat of categorias) r[cat.id] = true
    return r
  }, [categorias])
  const [expandido, setExpandido] = useState<Record<string, boolean>>(expandidoInicial)

  // Numera todos os kits globalmente
  const todosKits = useMemo(() => {
    const lista: (Kit & { numero: number; categoriaNome: string })[] = []
    let num = 1
    for (const cat of categorias) {
      for (const kit of cat.kits) {
        lista.push({ ...kit, numero: num++, categoriaNome: cat.nome })
      }
    }
    for (const kit of semCategoria) {
      lista.push({ ...kit, numero: num++, categoriaNome: '—' })
    }
    return lista
  }, [categorias, semCategoria])

  const totalKits = todosKits.length
  const comImagens = todosKits.filter(k => k.num_imagens > 0).length

  // Filtra por busca (nome ou número)
  const buscaLower = busca.trim().toLowerCase()
  const kitsFiltrados = useMemo(() => {
    if (!buscaLower) return null
    return todosKits.filter(k =>
      k.nome.toLowerCase().includes(buscaLower) ||
      String(k.numero).includes(buscaLower) ||
      k.categoriaNome.toLowerCase().includes(buscaLower)
    )
  }, [buscaLower, todosKits])

  function toggleCategoria(id: string) {
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function expandirTodos() {
    const all: Record<string, boolean> = {}
    for (const cat of categorias) all[cat.id] = true
    setExpandido(all)
  }

  function recolherTodos() {
    setExpandido({})
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px 10px 40px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', color: '#0f172a', outline: 'none',
    background: 'white', boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Papelaria Digital
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Catálogo de kits disponíveis para download
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total de kits', value: totalKits },
          { label: 'Com prévia', value: comImagens },
          { label: 'Categorias', value: categorias.length },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: accentColor, lineHeight: 1, marginBottom: '4px' }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Buscar por nome ou número (ex: 12, Bluey, Natal...)"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = accentColor }}
          onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', lineHeight: 1, padding: '2px 4px' }}
          >×</button>
        )}
      </div>

      {/* Resultado de busca */}
      {kitsFiltrados !== null ? (
        <div>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', fontWeight: 600 }}>
            {kitsFiltrados.length} resultado{kitsFiltrados.length !== 1 ? 's' : ''} para "{busca}"
          </p>
          {kitsFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>
              <p>Nenhum kit encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {kitsFiltrados.map(kit => (
                <KitRow key={kit.id} kit={kit} accentColor={accentColor} showCategoria oculto={hiddenIds.has(kit.id)} onToggle={() => toggleVisibilidade(kit.id)} toggling={togglingId === kit.id} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Vista por categorias */
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={expandirTodos} style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Expandir tudo
            </button>
            <span style={{ color: '#e2e8f0' }}>|</span>
            <button onClick={recolherTodos} style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Recolher tudo
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categorias.map(cat => {
              const aberto = expandido[cat.id] ?? false
              const emoji = CATEGORY_EMOJI[cat.slug] ?? '🎨'
              const kitsNumerados = todosKits.filter(k => k.parent_id === cat.id)
              return (
                <div key={cat.id} style={{ border: '1.5px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', background: 'white' }}>
                  {/* Header categoria */}
                  <button
                    onClick={() => toggleCategoria(cat.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '20px' }}>{emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', margin: 0 }}>{cat.nome}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{cat.kits.length} kit{cat.kits.length !== 1 ? 's' : ''}</p>
                    </div>
                    {aberto ? <ChevronDown size={16} color="#94a3b8" /> : <ChevronRight size={16} color="#94a3b8" />}
                  </button>

                  {/* Kits */}
                  {aberto && (
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '8px' }}>
                      {kitsNumerados.length === 0 ? (
                        <p style={{ fontSize: '13px', color: '#94a3b8', padding: '12px 10px' }}>Nenhum kit nesta categoria ainda.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {kitsNumerados.map(kit => (
                            <KitRow key={kit.id} kit={kit} accentColor={accentColor} fallbackFolderId={cat.drive_folder_id} oculto={hiddenIds.has(kit.id)} onToggle={() => toggleVisibilidade(kit.id)} toggling={togglingId === kit.id} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function KitRow({ kit, accentColor, showCategoria, fallbackFolderId, oculto, onToggle, toggling }: {
  kit: { id: string; nome: string; drive_folder_id: string | null; num_imagens: number; numero: number; categoriaNome?: string }
  accentColor: string
  showCategoria?: boolean
  fallbackFolderId?: string | null
  oculto: boolean
  onToggle: () => void
  toggling: boolean
}) {
  const folderId = kit.drive_folder_id ?? fallbackFolderId ?? null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: oculto ? '#fafafa' : '#f8fafc', border: `1px solid ${oculto ? '#fca5a5' : '#f1f5f9'}`, opacity: oculto ? 0.7 : 1 }}>
      {/* Número */}
      <span style={{ minWidth: '28px', height: '28px', borderRadius: '8px', background: `${accentColor}15`, color: accentColor, fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {kit.numero}
      </span>

      {/* Nome e meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {kit.nome}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          {showCategoria && kit.categoriaNome && (
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
              <FolderOpen size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
              {kit.categoriaNome}
            </span>
          )}
          <span style={{ fontSize: '11px', color: kit.num_imagens > 0 ? '#22c55e' : '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Image size={10} />
            {kit.num_imagens > 0 ? `${kit.num_imagens} prévia${kit.num_imagens !== 1 ? 's' : ''}` : 'Sem prévia'}
          </span>
        </div>
      </div>

      {/* Botão visibilidade */}
      <button
        onClick={onToggle}
        disabled={toggling}
        title={oculto ? 'Clique para exibir na vitrine' : 'Clique para ocultar da vitrine'}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: `1.5px solid ${oculto ? '#fca5a5' : '#e2e8f0'}`, background: oculto ? '#fff1f2' : 'white', color: oculto ? '#ef4444' : '#94a3b8', cursor: toggling ? 'wait' : 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
      >
        {oculto ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>

      {/* Botão download */}
      {folderId ? (
        <a
          href={driveUrl(folderId)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: accentColor, color: 'white', fontSize: '12px', fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          <Download size={13} />
          Download
        </a>
      ) : (
        <span style={{ fontSize: '11px', color: '#cbd5e1', padding: '7px 14px', fontWeight: 500, flexShrink: 0 }}>
          Em breve
        </span>
      )}
    </div>
  )
}

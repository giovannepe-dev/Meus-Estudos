'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronLeft, Pencil, Trash2, Check, X, Star, Eye, EyeOff } from 'lucide-react'

interface Props {
  collection: {
    id: string
    nome: string
    slug: string
    descricao: string | null
    ativo: boolean
    destaque: boolean
    parent_id: string | null
  }
  parent: { id: string; nome: string; slug: string } | null
  images: { id: string; imagem_url: string; ordem: number }[]
}

export function CollectionDetailClient({ collection: initialCollection, parent, images }: Props) {
  const supabase = createClient()
  const [col, setCol] = useState(initialCollection)
  const [editNome, setEditNome] = useState(col.nome)
  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const handleSave = async () => {
    if (!editNome.trim()) { toast.error('Nome é obrigatório'); return }
    const { error } = await supabase.from('global_collections').update({ nome: editNome.trim() }).eq('id', col.id)
    if (error) { toast.error('Erro ao salvar'); return }
    setCol(c => ({ ...c, nome: editNome.trim() }))
    setEditing(false)
    toast.success('Nome atualizado')
  }

  const toggleAtivo = async () => {
    const { error } = await supabase.from('global_collections').update({ ativo: !col.ativo }).eq('id', col.id)
    if (error) { toast.error('Erro'); return }
    setCol(c => ({ ...c, ativo: !c.ativo }))
    toast.success(col.ativo ? 'Ocultada' : 'Ativada')
  }

  const toggleDestaque = async () => {
    const { error } = await supabase.from('global_collections').update({ destaque: !col.destaque }).eq('id', col.id)
    if (error) { toast.error('Erro'); return }
    setCol(c => ({ ...c, destaque: !c.destaque }))
  }

  const backHref = parent ? `/superadmin/papelaria/${parent.id}` : '/superadmin/papelaria'
  const backLabel = parent?.nome ?? 'Papelaria'

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link href="/superadmin/papelaria" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)', fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-3)', textDecoration: 'none' }}>
          <ChevronLeft size={14} /> Papelaria
        </Link>
        {parent && (
          <>
            <span style={{ color: 'var(--lp-ink-4)' }}>/</span>
            <Link href={`/superadmin/papelaria/${parent.id}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-3)', textDecoration: 'none' }}>{parent.nome}</Link>
          </>
        )}
        <span style={{ color: 'var(--lp-ink-4)' }}>/</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink)' }}>{col.nome}</span>
      </div>

      {/* Header */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setEditNome(col.nome) } }}
                  autoFocus
                  style={{ padding: '8px 12px', border: '1.5px solid #ec4899', borderRadius: '8px', fontSize: '16px', fontWeight: 700, color: 'var(--lp-ink)', background: 'var(--lp-surface)', outline: 'none', minWidth: '200px' }}
                />
                <button onClick={handleSave} style={{ padding: '8px 14px', background: '#ec4899', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }}><Check size={14} /> Salvar</button>
                <button onClick={() => { setEditing(false); setEditNome(col.nome) }} style={{ padding: '8px 10px', background: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--lp-ink-3)' }}><X size={14} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--lp-ink)', margin: 0 }}>{col.nome}</h1>
                <button onClick={() => setEditing(true)} style={{ padding: '5px 8px', background: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--lp-ink-3)', display: 'flex', alignItems: 'center' }}><Pencil size={12} /></button>
              </div>
            )}
            <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', fontFamily: 'monospace', marginTop: '4px' }}>{col.slug}</p>
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={toggleDestaque}
              title={col.destaque ? 'Remover destaque' : 'Marcar destaque'}
              style={{ padding: '8px 14px', border: '1px solid var(--lp-border)', borderRadius: '8px', background: col.destaque ? '#fef9c3' : 'var(--lp-surface)', cursor: 'pointer', color: col.destaque ? '#ca8a04' : 'var(--lp-ink-4)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}
            >
              <Star size={14} fill={col.destaque ? 'currentColor' : 'none'} /> Destaque
            </button>
            <button
              onClick={toggleAtivo}
              style={{ padding: '8px 14px', border: '1px solid var(--lp-border)', borderRadius: '8px', background: col.ativo ? 'rgba(34,197,94,0.1)' : 'var(--lp-surface-2)', cursor: 'pointer', color: col.ativo ? 'var(--lp-success)' : 'var(--lp-ink-4)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}
            >
              {col.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
              {col.ativo ? 'Ativa' : 'Oculta'}
            </button>
          </div>
        </div>
      </div>

      {/* Imagens */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--lp-ink)', margin: 0 }}>
          Imagens <span style={{ fontWeight: 400, color: 'var(--lp-ink-4)', fontSize: '14px' }}>({images.length})</span>
        </h2>
      </div>

      {images.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-4)' }}>Nenhuma imagem neste tema ainda.</p>
          <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)', marginTop: '8px' }}>
            As imagens são sincronizadas automaticamente via bot do Telegram.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
          {images.map(img => (
            <div
              key={img.id}
              onClick={() => setLightbox(img.imagem_url)}
              style={{ aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', border: '1.5px solid var(--lp-border)', background: 'var(--lp-surface-2)' }}
            >
              <img
                src={img.imagem_url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 250ms' }}
                loading="lazy"
                onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)' }}
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
    </div>
  )
}

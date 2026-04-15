'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, FolderOpen, Loader, Trash2, ChevronRight, Pencil, X, Check } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import { CategoryIcon } from '@/components/storefront/CategoryIcon'
import Link from 'next/link'

const toSlug = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

interface Props {
  initialCategorias: any[]
}

export function CategoriasGlobaisClient({ initialCategorias }: Props) {
  const supabase = createClient()
  const [categorias, setCategorias] = useState<any[]>(initialCategorias)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '' })
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editEmoji, setEditEmoji] = useState('')

  const handleNomeChange = (nome: string) => setForm({ nome })

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const { data, error } = await supabase
      .from('global_categories')
      .insert({ nome: form.nome.trim(), slug: toSlug(form.nome) + '-' + Date.now() })
      .select()
      .single()
    setSaving(false)
    if (error) { toast.error('Erro ao criar: ' + error.message); return }
    setCategorias(prev => [...prev, { ...data, produtos: [{ count: 0 }] }].sort((a, b) => a.nome.localeCompare(b.nome)))
    setForm({ nome: '' })
    setShowForm(false)
    toast.success('Categoria criada!')
  }

  const openEditCat = (cat: any) => {
    setEditingCat(cat.id)
    setEditNome(cat.nome)
    setEditEmoji(cat.emoji ?? '')
  }

  const handleSaveCat = async (catId: string) => {
    if (!editNome.trim()) { toast.error('Nome é obrigatório'); return }
    const { error } = await supabase.from('global_categories')
      .update({ nome: editNome.trim(), emoji: editEmoji.trim() || null })
      .eq('id', catId)
    if (error) { toast.error('Erro ao salvar'); return }
    setCategorias(prev => prev.map(c => c.id === catId ? { ...c, nome: editNome.trim(), emoji: editEmoji.trim() || null } : c))
    setEditingCat(null)
    toast.success('Categoria atualizada')
  }

  const handleToggleAtiva = async (cat: any) => {
    const { error } = await supabase.from('global_categories').update({ ativa: !cat.ativa }).eq('id', cat.id)
    if (error) { toast.error('Erro ao atualizar'); return }
    setCategorias(prev => prev.map(c => c.id === cat.id ? { ...c, ativa: !c.ativa } : c))
  }

  const handleDelete = async (cat: any) => {
    const count = cat.produtos?.[0]?.count ?? 0
    const msg = count > 0
      ? `Excluir "${cat.nome}" e desativar ${count} produto(s) desta categoria da vitrine?`
      : `Excluir categoria "${cat.nome}"?`
    if (!confirm(msg)) return

    // Desativa todos os produtos da categoria antes de excluí-la
    if (count > 0) {
      const { error: prodErr } = await supabase
        .from('global_products')
        .update({ ativo: false })
        .eq('categoria_id', cat.id)
      if (prodErr) { toast.error('Erro ao desativar produtos'); return }
    }

    const { error } = await supabase.from('global_categories').delete().eq('id', cat.id)
    if (error) { toast.error('Erro ao excluir'); return }
    setCategorias(prev => prev.filter(c => c.id !== cat.id))
    toast.success(count > 0 ? `Categoria excluída e ${count} produto(s) desativado(s)` : 'Categoria excluída')
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--lp-border)',
    borderRadius: '8px', fontSize: '14px', color: 'var(--lp-ink)',
    backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' as const,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            Categorias Globais
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
            {categorias.length} categoria{categorias.length !== 1 ? 's' : ''} — catálogo universal
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--lp-violet)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-ink)', marginBottom: '16px' }}>Nova categoria global</h2>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>
              Nome <span style={{ color: 'var(--lp-red)' }}>*</span>
            </label>
            <input type="text" value={form.nome} onChange={e => handleNomeChange(e.target.value)}
              placeholder="Ex: Páscoa" style={inputStyle} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <Loader size={13} className="animate-spin" />}
              {saving ? 'Salvando...' : 'Criar'}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ nome: '' }) }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {categorias.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <FolderOpen size={40} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>
            Nenhuma categoria ainda. Envie uma foto com legenda <code>#categoria</code> pelo bot do Telegram.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categorias.map(cat => {
            const count = cat.produtos?.[0]?.count ?? 0
            return (
              <div key={cat.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CategoryIcon nome={editingCat === cat.id ? editNome : cat.nome} emoji={editingCat === cat.id ? editEmoji : cat.emoji} size={40} />

                {editingCat === cat.id ? (
                  <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)} placeholder="😀"
                      style={{ width: '52px', padding: '7px 8px', border: '1px solid var(--lp-border)', borderRadius: '8px', fontSize: '20px', textAlign: 'center', backgroundColor: 'var(--lp-surface)', boxSizing: 'border-box' as const }} />
                    <input value={editNome} onChange={e => setEditNome(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveCat(cat.id); if (e.key === 'Escape') setEditingCat(null) }}
                      placeholder="Nome da categoria" autoFocus
                      style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--lp-violet)', borderRadius: '8px', fontSize: '14px', color: 'var(--lp-ink)', backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' as const }} />
                    <button onClick={() => handleSaveCat(cat.id)}
                      style={{ padding: '7px 10px', backgroundColor: 'var(--lp-violet)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEditingCat(null)}
                      style={{ padding: '7px 8px', backgroundColor: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--lp-ink-3)' }}>
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <Link href={`/superadmin/produtos?categoria=${cat.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: 'var(--lp-ink)', fontSize: '14px' }}>{cat.nome}</p>
                      <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', fontFamily: 'monospace' }}>{cat.slug}</p>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--lp-ink-4)', flexShrink: 0 }} />
                  </Link>
                )}
                <span style={{
                  padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                  backgroundColor: count > 0 ? 'var(--lp-violet-pale)' : 'var(--lp-surface-2)',
                  color: count > 0 ? 'var(--lp-violet)' : 'var(--lp-ink-4)',
                }}>
                  {count} produto{count !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {editingCat !== cat.id && (
                    <button onClick={() => openEditCat(cat)} title="Editar"
                      style={{ padding: '5px 8px', border: '1px solid var(--lp-border)', borderRadius: '6px', backgroundColor: 'var(--lp-surface)', cursor: 'pointer', color: 'var(--lp-ink-3)', display: 'flex', alignItems: 'center' }}>
                      <Pencil size={13} />
                    </button>
                  )}
                  <span style={{ fontSize: '12px', color: cat.ativa ? 'var(--lp-success)' : 'var(--lp-ink-4)', fontWeight: 500 }}>
                    {cat.ativa ? 'Ativa' : 'Oculta'}
                  </span>
                  <Switch.Root
                    checked={cat.ativa}
                    onCheckedChange={() => handleToggleAtiva(cat)}
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      backgroundColor: cat.ativa ? 'var(--lp-violet)' : 'var(--lp-border)',
                      position: 'relative', transition: 'background-color 0.2s', flexShrink: 0, padding: 0,
                    }}
                  >
                    <Switch.Thumb style={{
                      display: 'block', width: '14px', height: '14px', borderRadius: '50%',
                      backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s',
                      transform: cat.ativa ? 'translateX(19px)' : 'translateX(3px)',
                    }} />
                  </Switch.Root>
                </div>
                <button onClick={() => handleDelete(cat)}
                  style={{ padding: '5px 8px', border: '1px solid var(--lp-border)', borderRadius: '6px', backgroundColor: 'var(--lp-surface)', cursor: 'pointer', color: 'var(--lp-red)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

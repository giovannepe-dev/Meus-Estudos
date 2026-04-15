'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, FolderOpen, Loader, Trash2, ChevronRight } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import { CategoryIcon } from '@/components/storefront/CategoryIcon'
import Link from 'next/link'

interface Props {
  initialCategorias: any[]
  tenantId: string
}

export function CategoriasClient({ initialCategorias, tenantId }: Props) {
  const supabase = createClient()
  const [categorias, setCategorias] = useState(initialCategorias)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', emoji: '', slug: '' })

  const toSlug = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNomeChange = (nome: string) => {
    setForm(prev => ({ ...prev, nome, slug: toSlug(nome) }))
  }

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }

    setSaving(true)
    const { data, error } = await supabase.from('tenant_categories').insert({
      tenant_id: tenantId,
      nome: form.nome.trim(),
      emoji: form.emoji.trim() || null,
      slug: form.slug || toSlug(form.nome),
      ativa: true,
      ordem: categorias.length,
    }).select().single()

    setSaving(false)
    if (error) { toast.error('Erro ao criar categoria'); return }

    setCategorias(prev => [...prev, data])
    setForm({ nome: '', emoji: '', slug: '' })
    setShowForm(false)
    toast.success('Categoria criada!')
  }

  const handleDelete = async (cat: any) => {
    if (!confirm(`Deletar categoria "${cat.nome}"? Os produtos não serão apagados.`)) return

    const { error } = await supabase.from('tenant_categories').delete().eq('id', cat.id)
    if (error) { toast.error('Erro ao deletar'); return }

    setCategorias(prev => prev.filter(c => c.id !== cat.id))
    toast.success('Categoria removida')
  }

  const handleToggleAtiva = async (cat: any) => {
    const { error } = await supabase.from('tenant_categories').update({ ativa: !cat.ativa }).eq('id', cat.id)
    if (error) { toast.error('Erro ao atualizar'); return }
    setCategorias(prev => prev.map(c => c.id === cat.id ? { ...c, ativa: !c.ativa } : c))
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--lp-border)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--lp-ink)',
    backgroundColor: 'var(--lp-surface)',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            Minhas Categorias
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
            Organize seus produtos em categorias personalizadas
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--lp-violet)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-ink)', marginBottom: '16px' }}>Nova categoria</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>
                Nome <span style={{ color: 'var(--lp-red)' }}>*</span>
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={e => handleNomeChange(e.target.value)}
                placeholder="Ex: Caixas MDF"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>
                Emoji
              </label>
              <input
                type="text"
                value={form.emoji}
                onChange={e => setForm(prev => ({ ...prev, emoji: e.target.value }))}
                placeholder="📦"
                style={{ ...inputStyle, textAlign: 'center', fontSize: '20px' }}
                maxLength={2}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>
              Slug (URL)
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="caixas-mdf"
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving && <Loader size={13} className="animate-spin" />}
              {saving ? 'Salvando...' : 'Criar'}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ nome: '', emoji: '', slug: '' }) }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {categorias.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <FolderOpen size={40} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>Nenhuma categoria criada ainda</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categorias.map(cat => (
            <div key={cat.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CategoryIcon nome={cat.nome} emoji={cat.emoji} size={40} />
              <Link href={`/admin/produtos?categoria=${cat.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--lp-ink)', fontSize: '14px' }}>{cat.nome}</p>
                  <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', fontFamily: 'monospace' }}>{cat.slug}</p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--lp-ink-4)', flexShrink: 0 }} />
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: cat.ativa ? 'var(--lp-success)' : 'var(--lp-ink-4)', fontWeight: 500 }}>
                  {cat.ativa ? 'Ativa' : 'Oculta'}
                </span>
                <Switch.Root
                  checked={cat.ativa}
                  onCheckedChange={() => handleToggleAtiva(cat)}
                  style={{
                    width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    backgroundColor: cat.ativa ? 'var(--lp-violet)' : 'var(--lp-border)',
                    position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <Switch.Thumb
                    style={{
                      display: 'block', width: '14px', height: '14px', borderRadius: '50%',
                      backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s',
                      transform: cat.ativa ? 'translateX(19px)' : 'translateX(3px)',
                    }}
                  />
                </Switch.Root>
                <button
                  onClick={() => handleDelete(cat)}
                  style={{
                    padding: '5px 8px', border: '1px solid var(--lp-border)', borderRadius: '6px',
                    backgroundColor: 'var(--lp-surface)', cursor: 'pointer', color: 'var(--lp-red)',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TenantStorefrontSection } from '@/types'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowUp, ArrowDown, Loader } from 'lucide-react'

interface Props {
  tenantId: string
}

export function StorefrontConfig({ tenantId }: Props) {
  const supabase = createClient()
  const [sections, setSections] = useState<TenantStorefrontSection[]>([])
  const [globalCategories, setGlobalCategories] = useState<any[]>([])
  const [tenantCategories, setTenantCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newSection, setNewSection] = useState({
    title: '',
    category_source: 'global' as 'global' | 'tenant',
    category_id: '',
  })

  useEffect(() => {
    async function load() {
      // Fetch sections
      const { data: sectionsData } = await supabase
        .from('tenant_storefront_sections')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ordem')

      setSections(sectionsData || [])

      // Fetch global categories
      const { data: globalCatsData } = await supabase
        .from('global_categories')
        .select('*')
        .eq('ativa', true)
        .order('nome')

      setGlobalCategories(globalCatsData || [])

      // Fetch tenant categories
      const { data: tenantCatsData } = await supabase
        .from('tenant_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('ativa', true)
        .order('nome')

      setTenantCategories(tenantCatsData || [])

      setLoading(false)
    }

    load()
  }, [tenantId])

  const handleAddSection = async () => {
    if (!newSection.title || !newSection.category_id) {
      toast.error('Preencha todos os campos')
      return
    }

    setSaving(true)
    const { data, error } = await supabase
      .from('tenant_storefront_sections')
      .insert({
        tenant_id: tenantId,
        title: newSection.title,
        category_source: newSection.category_source,
        category_id: newSection.category_id,
        ordem: sections.length,
      })
      .select()

    setSaving(false)

    if (error) {
      toast.error('Erro ao adicionar seção')
      return
    }

    if (data) {
      setSections([...sections, data[0]])
      setNewSection({ title: '', category_source: 'global', category_id: '' })
      setShowForm(false)
      toast.success('Seção adicionada!')
    }
  }

  const handleDeleteSection = async (id: string) => {
    const { error } = await supabase
      .from('tenant_storefront_sections')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao remover seção')
      return
    }

    setSections(sections.filter(s => s.id !== id))
    toast.success('Seção removida!')
  }

  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) {
      return
    }

    const newSections = [...sections]
    const otherIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newSections[index]
    newSections[index] = newSections[otherIndex]
    newSections[otherIndex] = temp

    // Atualizar ordens
    setSaving(true)
    const updates = newSections.map((s, i) => ({
      id: s.id,
      ordem: i,
    }))

    for (const update of updates) {
      await supabase
        .from('tenant_storefront_sections')
        .update({ ordem: update.ordem })
        .eq('id', update.id)
    }

    setSections(newSections)
    setSaving(false)
    toast.success('Ordem atualizada!')
  }

  const handleToggleSeção = async (id: string, ativa: boolean) => {
    setSaving(true)
    const { error } = await supabase
      .from('tenant_storefront_sections')
      .update({ ativa: !ativa })
      .eq('id', id)

    setSaving(false)

    if (error) {
      toast.error('Erro ao atualizar')
      return
    }

    setSections(sections.map(s => s.id === id ? { ...s, ativa: !ativa } : s))
  }

  const getCategoryName = (section: TenantStorefrontSection) => {
    if (section.category_source === 'global') {
      return globalCategories.find(c => c.id === section.category_id)?.nome || 'Categoria'
    }
    return tenantCategories.find(c => c.id === section.category_id)?.nome || 'Categoria'
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Carregando...</div>
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)', margin: 0 }}>
          Carrosseis da Vitrine
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--lp-violet)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={{ backgroundColor: 'var(--lp-surface-2)', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Título do carrossel (ex: Destaques)"
            value={newSection.title}
            onChange={e => setNewSection(prev => ({ ...prev, title: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--lp-border)',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
            }}
          />

          <select
            value={newSection.category_source}
            onChange={e => setNewSection(prev => ({ ...prev, category_source: e.target.value as 'global' | 'tenant', category_id: '' }))}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--lp-border)',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
            }}
          >
            <option value="global">Categorias Globais</option>
            <option value="tenant">Minhas Categorias</option>
          </select>

          <select
            value={newSection.category_id}
            onChange={e => setNewSection(prev => ({ ...prev, category_id: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--lp-border)',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
            }}
          >
            <option value="">Selecione uma categoria</option>
            {(newSection.category_source === 'global' ? globalCategories : tenantCategories).map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddSection}
              disabled={saving}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: 'var(--lp-violet)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: 'var(--lp-surface)',
                color: 'var(--lp-ink-2)',
                border: '1px solid var(--lp-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Seções */}
      {sections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--lp-ink-3)' }}>
          <p>Nenhum carrossel configurado</p>
          <p style={{ fontSize: '12px' }}>Adicione carrosseis para organizar sua vitrine</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sections.map((section, idx) => (
            <div
              key={section.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'var(--lp-surface-2)',
                borderRadius: '8px',
                border: `1px solid ${section.ativa ? 'var(--lp-border)' : 'var(--lp-border)'}`,
                opacity: section.ativa ? 1 : 0.6,
              }}
            >
              {/* Ordem */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  onClick={() => handleMoveSection(section.id, 'up')}
                  disabled={idx === 0 || saving}
                  style={{
                    padding: '4px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    opacity: idx === 0 ? 0.3 : 1,
                    fontSize: '12px',
                  }}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  onClick={() => handleMoveSection(section.id, 'down')}
                  disabled={idx === sections.length - 1 || saving}
                  style={{
                    padding: '4px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: idx === sections.length - 1 ? 0.3 : 1,
                    fontSize: '12px',
                  }}
                >
                  <ArrowDown size={12} />
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink)', margin: '0 0 2px 0' }}>
                  {section.title}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--lp-ink-3)', margin: 0 }}>
                  {section.category_source === 'global' ? '📚' : '📁'} {getCategoryName(section)}
                </p>
              </div>

              {/* Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={section.ativa}
                  onChange={() => handleToggleSeção(section.id, section.ativa)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--lp-ink-3)' }}>Ativo</span>
              </label>

              {/* Deletar */}
              <button
                onClick={() => handleDeleteSection(section.id)}
                style={{
                  padding: '6px',
                  border: 'none',
                  backgroundColor: 'var(--lp-red-pale)',
                  color: 'var(--lp-red)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

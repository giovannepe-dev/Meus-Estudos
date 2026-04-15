'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import NextImage from 'next/image'
import { Loader, Upload, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  tenantId: string
  categorias: { id: string; nome: string; emoji: string | null }[]
  initialProduct?: {
    id: string
    nome: string
    descricao: string | null
    preco: number | null
    categoria_id: string | null
    destaque: boolean
    ativo: boolean
    imagem_url: string | null
  }
}

const toSlug = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--lp-border)',
  borderRadius: '8px', fontSize: '14px', color: 'var(--lp-ink)',
  backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' as const,
}
const labelStyle = {
  fontSize: '13px', fontWeight: 600 as const, color: 'var(--lp-ink-2)',
  marginBottom: '8px', display: 'block' as const,
}

export function ProdutoFormClient({ tenantId, categorias, initialProduct }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = !!initialProduct

  const [form, setForm] = useState({
    nome: initialProduct?.nome ?? '',
    descricao: initialProduct?.descricao ?? '',
    preco: initialProduct?.preco != null ? String(initialProduct.preco).replace('.', ',') : '',
    categoria_id: initialProduct?.categoria_id ?? '',
    destaque: initialProduct?.destaque ?? false,
    ativo: initialProduct?.ativo ?? true,
    imagem_url: initialProduct?.imagem_url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Somente imagens são permitidas'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter menos de 5MB'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `${tenantId}/products/${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('tenant-assets')
      .upload(filePath, await file.arrayBuffer(), { contentType: file.type, upsert: true })

    if (error) { toast.error('Erro ao enviar imagem'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('tenant-assets').getPublicUrl(filePath)
    setForm(prev => ({ ...prev, imagem_url: urlData.publicUrl }))
    toast.success('Imagem enviada!')
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      preco: form.preco ? parseFloat(form.preco.replace(',', '.')) : null,
      categoria_id: form.categoria_id || null,
      destaque: form.destaque,
      ativo: form.ativo,
      imagem_url: form.imagem_url || null,
    }

    let error
    if (isEdit) {
      ;({ error } = await supabase.from('tenant_products').update(payload).eq('id', initialProduct!.id))
    } else {
      ;({ error } = await supabase.from('tenant_products').insert({
        ...payload,
        tenant_id: tenantId,
        slug: toSlug(form.nome.trim()) + '-' + Date.now(),
      }))
    }

    setSaving(false)
    if (error) { toast.error(`Erro ao ${isEdit ? 'salvar' : 'criar'} produto`); return }
    toast.success(`Produto ${isEdit ? 'atualizado' : 'criado'}!`)
    router.push('/admin/produtos')
  }

  const handleDelete = async () => {
    if (!confirm('Deletar este produto? Esta ação não pode ser desfeita.')) return
    setDeleting(true)
    const { error } = await supabase.from('tenant_products').delete().eq('id', initialProduct!.id)
    setDeleting(false)
    if (error) { toast.error('Erro ao deletar'); return }
    toast.success('Produto deletado')
    router.push('/admin/produtos')
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/produtos" style={{ display: 'flex', alignItems: 'center', color: 'var(--lp-ink-3)', textDecoration: 'none' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
              {isEdit ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            {!isEdit && <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '2px' }}>Preencha as informações do produto</p>}
          </div>
        </div>
        {isEdit && (
          <button onClick={handleDelete} disabled={deleting} style={{
            padding: '8px 12px', backgroundColor: 'var(--lp-red-pale)', color: 'var(--lp-red)',
            border: '1px solid var(--lp-red)', borderRadius: '8px', cursor: deleting ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Trash2 size={14} /> Deletar
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Nome <span style={{ color: 'var(--lp-red)' }}>*</span></label>
          <input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
            placeholder="Nome do produto" style={inputStyle} autoFocus={!isEdit} />
        </div>

        <div>
          <label style={labelStyle}>Descrição</label>
          <textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
            placeholder="Descrição detalhada do produto"
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Preço (R$)</label>
            <input type="text" value={form.preco} onChange={e => setForm(p => ({ ...p, preco: e.target.value }))}
              placeholder="0,00" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Categoria</label>
            <select value={form.categoria_id} onChange={e => setForm(p => ({ ...p, categoria_id: e.target.value }))} style={inputStyle}>
              <option value="">Sem categoria</option>
              {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.emoji} {cat.nome}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Imagem do produto</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {form.imagem_url ? (
              <NextImage src={form.imagem_url} alt="" width={80} height={80} style={{ objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--lp-border)' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px dashed var(--lp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lp-surface-2)' }}>
                <Upload size={20} style={{ color: 'var(--lp-ink-4)' }} />
              </div>
            )}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={{ padding: '8px 14px', border: '1px solid var(--lp-border)', borderRadius: '8px', backgroundColor: 'var(--lp-surface)', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ink-2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Enviando...' : 'Alterar imagem'}
              </button>
              {form.imagem_url && (
                <button onClick={() => setForm(p => ({ ...p, imagem_url: '' }))}
                  style={{ marginTop: '6px', padding: '4px 10px', border: '1px solid var(--lp-border)', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '12px', color: 'var(--lp-ink-4)' }}>
                  Remover imagem
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--lp-ink-2)' }}>
            <input type="checkbox" checked={form.destaque} onChange={e => setForm(p => ({ ...p, destaque: e.target.checked }))}
              style={{ accentColor: 'var(--lp-violet)', width: '16px', height: '16px' }} />
            Produto em destaque
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--lp-ink-2)' }}>
            <input type="checkbox" checked={form.ativo} onChange={e => setForm(p => ({ ...p, ativo: e.target.checked }))}
              style={{ accentColor: 'var(--lp-violet)', width: '16px', height: '16px' }} />
            Produto ativo (visível na vitrine)
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving && <Loader size={14} className="animate-spin" />}
            {saving ? 'Salvando...' : isEdit ? 'Salvar Produto' : 'Criar Produto'}
          </button>
          <Link href="/admin/produtos" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary">Cancelar</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

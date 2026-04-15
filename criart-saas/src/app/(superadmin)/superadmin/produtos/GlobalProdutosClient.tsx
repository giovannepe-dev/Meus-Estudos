'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Package, Trash2, Star, Sparkles, Eye, EyeOff, Search, Pencil, Plus, X, Loader, Upload, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  initialProdutos: any[]
  initialCategorias: any[]
  initialFiltro?: string
  initialBusca?: string
  totalCount: number
  currentPage: number
  totalPages: number
  perPage: number
}

interface EditForm {
  nome: string
  descricao: string
  preco: string
  categoria_id: string
  imagem_url: string
  destaque: boolean
  novidade: boolean
  ativo: boolean
  personalizavel: boolean
  ordem: string
}

const EMPTY_FORM: EditForm = {
  nome: '', descricao: '', preco: '', categoria_id: '', imagem_url: '',
  destaque: false, novidade: false, ativo: true, personalizavel: false, ordem: '0',
}

const toSlug = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function GlobalProdutosClient({ initialProdutos, initialCategorias, initialFiltro = 'all', initialBusca = '', totalCount, currentPage, totalPages, perPage }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [produtos, setProdutos] = useState<any[]>(initialProdutos)
  const [filtro, setFiltro] = useState<string>(initialFiltro)
  const [busca, setBusca] = useState(initialBusca)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      nome: p.nome ?? '',
      descricao: p.descricao ?? '',
      preco: p.preco != null ? String(p.preco) : '',
      categoria_id: p.categoria_id ?? '',
      imagem_url: p.imagem_url ?? '',
      destaque: p.destaque ?? false,
      novidade: p.novidade ?? false,
      ativo: p.ativo ?? true,
      personalizavel: p.personalizavel ?? false,
      ordem: String(p.ordem ?? 0),
    })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditingId(null) }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `global/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro no upload: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
    setForm(f => ({ ...f, imagem_url: publicUrl }))
    setUploading(false)
    toast.success('Imagem enviada')
  }

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const payload: any = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      preco: form.preco ? parseFloat(form.preco) : null,
      categoria_id: form.categoria_id || null,
      imagem_url: form.imagem_url.trim() || null,
      destaque: form.destaque,
      novidade: form.novidade,
      ativo: form.ativo,
      personalizavel: form.personalizavel,
      ordem: parseInt(form.ordem) || 0,
    }

    if (editingId) {
      const { error } = await supabase.from('global_products').update(payload).eq('id', editingId)
      if (error) { toast.error('Erro ao salvar: ' + error.message); setSaving(false); return }
      setProdutos(prev => prev.map(p => p.id === editingId
        ? { ...p, ...payload, categoria: initialCategorias.find(c => c.id === payload.categoria_id) }
        : p
      ))
      toast.success('Produto atualizado')
    } else {
      const slug = toSlug(form.nome) + '-' + Date.now()
      const { data, error } = await supabase.from('global_products')
        .insert({ ...payload, slug })
        .select('*, categoria:global_categories(id, nome)')
        .single()
      if (error) { toast.error('Erro ao criar: ' + error.message); setSaving(false); return }
      setProdutos(prev => [data, ...prev])
      toast.success('Produto criado!')
    }
    setSaving(false)
    closeModal()
  }

  const toggle = async (id: string, field: 'novidade' | 'destaque' | 'ativo', current: boolean) => {
    const { error } = await supabase.from('global_products').update({ [field]: !current }).eq('id', id)
    if (error) { toast.error('Erro ao atualizar'); return }
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, [field]: !current } : p))
  }

  const handleDelete = async (p: any) => {
    if (!confirm(`Deletar "${p.nome}"? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('global_products').delete().eq('id', p.id)
    if (error) { toast.error('Erro ao deletar'); return }
    setProdutos(prev => prev.filter(x => x.id !== p.id))
    toast.success('Produto removido')
  }

  function navigateTo(params: { categoria?: string; page?: string; busca?: string }) {
    const sp = new URLSearchParams()
    const cat = params.categoria ?? filtro
    const pg = params.page ?? '1'
    const q = params.busca ?? busca
    if (cat && cat !== 'all') sp.set('categoria', cat)
    if (pg !== '1') sp.set('page', pg)
    if (q) sp.set('busca', q)
    router.push(`/superadmin/produtos${sp.toString() ? '?' + sp.toString() : ''}`)
  }

  const handleCategoriaChange = (cat: string) => {
    setFiltro(cat)
    navigateTo({ categoria: cat, page: '1' })
  }

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      navigateTo({ busca, page: '1' })
    }, 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [busca]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBuscaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigateTo({ busca, page: '1' })
  }

  const goToPage = (page: number) => {
    navigateTo({ page: String(page) })
  }

  function paginationRange(): (number | '...')[] {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const filtered = produtos

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--lp-border)',
    borderRadius: '8px', fontSize: '14px', color: 'var(--lp-ink)',
    backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            Produtos Globais
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
            {totalCount.toLocaleString('pt-BR')} produto{totalCount !== 1 ? 's' : ''} no catálogo
            {' — página {0} de {1}'.replace('{0}', String(currentPage)).replace('{1}', String(totalPages))}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Novo produto
        </button>
      </div>

      <form onSubmit={handleBuscaSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-ink-4)' }} />
          <input
            type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto... (Enter para buscar)"
            style={{ ...inputStyle, padding: '9px 12px 9px 32px' }}
          />
        </div>
        <select value={filtro} onChange={e => handleCategoriaChange(e.target.value)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>
          <option value="all">Todas as categorias</option>
          {initialCategorias.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
      </form>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Package size={40} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>
            {produtos.length === 0 ? 'Nenhum produto ainda.' : 'Nenhum produto nesta busca.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--lp-surface-2)', overflow: 'hidden' }}>
                {p.imagem_url ? (
                  <img src={p.imagem_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={32} style={{ color: 'var(--lp-ink-4)' }} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {p.novidade && <span style={{ padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--lp-violet)', color: 'white' }}>NOVO</span>}
                  {p.destaque && <span style={{ padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, backgroundColor: '#F59E0B', color: 'white' }}>★</span>}
                  {!p.ativo && <span style={{ padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>INATIVO</span>}
                </div>
                {/* Edit button overlay */}
                <button onClick={() => openEdit(p)} title="Editar produto"
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={13} />
                </button>
              </div>

              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(p.numero || p.codigo) && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-violet)', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                    #{p.numero || p.codigo}
                  </span>
                )}
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink)', lineHeight: '1.3' }}>{p.nome}</p>
                {p.categoria && <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)' }}>{p.categoria.nome}</p>}
                {p.preco != null && <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--lp-ink-2)' }}>R$ {Number(p.preco).toFixed(2)}</p>}

                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                  <button onClick={() => toggle(p.id, 'novidade', p.novidade)} title="Novidade" style={{
                    flex: 1, padding: '5px 6px', border: '1px solid var(--lp-border)', borderRadius: '6px',
                    backgroundColor: p.novidade ? 'var(--lp-violet-pale)' : 'var(--lp-surface-2)',
                    color: p.novidade ? 'var(--lp-violet)' : 'var(--lp-ink-4)',
                    cursor: 'pointer', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  }}>
                    <Sparkles size={11} /> Novo
                  </button>
                  <button onClick={() => toggle(p.id, 'destaque', p.destaque)} title="Destaque" style={{
                    flex: 1, padding: '5px 6px', border: '1px solid var(--lp-border)', borderRadius: '6px',
                    backgroundColor: p.destaque ? '#FEF3C7' : 'var(--lp-surface-2)',
                    color: p.destaque ? '#D97706' : 'var(--lp-ink-4)',
                    cursor: 'pointer', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  }}>
                    <Star size={11} /> Dest.
                  </button>
                  <button onClick={() => toggle(p.id, 'ativo', p.ativo)} title={p.ativo ? 'Desativar' : 'Ativar'} style={{
                    flex: 1, padding: '5px 6px', border: '1px solid var(--lp-border)', borderRadius: '6px',
                    backgroundColor: p.ativo ? 'var(--lp-success-pale)' : 'var(--lp-surface-2)',
                    color: p.ativo ? 'var(--lp-success)' : 'var(--lp-ink-4)',
                    cursor: 'pointer', fontSize: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  }}>
                    {p.ativo ? <Eye size={11} /> : <EyeOff size={11} />}
                    {p.ativo ? 'Vis.' : 'Ocul.'}
                  </button>
                  <button onClick={() => handleDelete(p)} style={{
                    padding: '5px 7px', border: '1px solid var(--lp-border)', borderRadius: '6px',
                    backgroundColor: 'var(--lp-surface)', cursor: 'pointer', color: 'var(--lp-red)',
                  }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '32px', flexWrap: 'wrap' }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--lp-border)', background: 'var(--lp-surface)', cursor: currentPage <= 1 ? 'default' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--lp-ink-2)' }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          {paginationRange().map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} style={{ padding: '8px 4px', color: 'var(--lp-ink-4)' }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p as number)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  border: p === currentPage ? '1.5px solid var(--lp-violet)' : '1px solid var(--lp-border)',
                  background: p === currentPage ? 'var(--lp-violet-pale)' : 'var(--lp-surface)',
                  color: p === currentPage ? 'var(--lp-violet)' : 'var(--lp-ink-2)',
                }}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--lp-border)', background: 'var(--lp-surface)', cursor: currentPage >= totalPages ? 'default' : 'pointer', opacity: currentPage >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--lp-ink-2)' }}
          >
            Próxima <ChevronRight size={14} />
          </button>
        </nav>
      )}

      {/* Edit / Create Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={closeModal} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', backgroundColor: 'var(--lp-surface)', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', border: '1px solid var(--lp-border)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--lp-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.01em' }}>
                {editingId ? 'Editar produto' : 'Novo produto'}
              </h2>
              <button onClick={closeModal} style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--lp-ink-3)', borderRadius: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Image preview + upload */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '8px', display: 'block' }}>Imagem</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--lp-border)', flexShrink: 0, background: 'var(--lp-surface-2)', position: 'relative' }}>
                    {form.imagem_url ? (
                      <img src={form.imagem_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={24} style={{ color: 'var(--lp-ink-4)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--lp-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--lp-ink-2)', marginBottom: '8px', width: 'fit-content' }}>
                      <Upload size={14} />
                      {uploading ? 'Enviando...' : 'Upload de imagem'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
                    <input
                      type="text" value={form.imagem_url}
                      onChange={e => setForm(f => ({ ...f, imagem_url: e.target.value }))}
                      placeholder="Ou cole uma URL..."
                      style={{ ...inputStyle, fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>
                  Nome <span style={{ color: 'var(--lp-red)' }}>*</span>
                </label>
                <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Caixinha MDF Coração" style={inputStyle} />
              </div>

              {/* Categoria */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>Categoria</label>
                <select value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Sem categoria</option>
                  {initialCategorias.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Descrição do produto..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} />
              </div>

              {/* Preço e Ordem */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>Preço (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.preco}
                    onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                    placeholder="0,00" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' }}>Ordem</label>
                  <input type="number" min="0" value={form.ordem}
                    onChange={e => setForm(f => ({ ...f, ordem: e.target.value }))}
                    style={inputStyle} />
                </div>
              </div>

              {/* Flags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {([
                  ['ativo', 'Ativo (visível)'],
                  ['destaque', 'Destaque ★'],
                  ['novidade', 'Novidade'],
                  ['personalizavel', 'Personalizável'],
                ] as [keyof EditForm, string][]).map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--lp-border)', backgroundColor: form[key] ? 'var(--lp-violet-pale)' : 'var(--lp-surface-2)' }}>
                    <input type="checkbox" checked={form[key] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      style={{ width: '15px', height: '15px', accentColor: 'var(--lp-violet)', cursor: 'pointer' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: form[key] ? 'var(--lp-violet)' : 'var(--lp-ink-2)' }}>{label}</span>
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving && <Loader size={14} className="animate-spin" />}
                  {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar produto'}
                </button>
                <button onClick={closeModal} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import { Eye, EyeOff, Library, ChevronDown, ChevronRight, Package } from 'lucide-react'

interface GlobalCategory {
  id: string
  nome: string
  slug: string
  emoji: string | null
  ativa: boolean
}

interface GlobalProduct {
  id: string
  categoria_id: string
  nome: string
  imagem_url: string | null
  destaque: boolean
  novidade: boolean
}

interface Props {
  tenantId: string
  initialCategories: GlobalCategory[]
  initialHiddenCatIds: string[]
  initialHiddenProdIds: string[]
  totalProducts: number
}

export function BibliotecaClient({
  tenantId,
  initialCategories,
  initialHiddenCatIds,
  initialHiddenProdIds,
  totalProducts,
}: Props) {
  const supabase = createClient()
  const [categories] = useState(initialCategories)
  const [productsByCategory, setProductsByCategory] = useState<Record<string, GlobalProduct[]>>({})
  const [hiddenCatIds, setHiddenCatIds] = useState<Set<string>>(new Set(initialHiddenCatIds))
  const [hiddenProdIds, setHiddenProdIds] = useState<Set<string>>(new Set(initialHiddenProdIds))
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loadingCat, setLoadingCat] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  async function loadCategoryProducts(catId: string) {
    if (productsByCategory[catId]) return
    setLoadingCat(catId)

    let allProducts: GlobalProduct[] = []
    let from = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('global_products')
        .select('id, categoria_id, nome, imagem_url, destaque, novidade')
        .eq('categoria_id', catId)
        .eq('ativo', true)
        .order('nome')
        .range(from, from + pageSize - 1)

      if (error || !data || data.length === 0) break
      allProducts = [...allProducts, ...data]
      if (data.length < pageSize) break
      from += pageSize
    }

    setProductsByCategory(prev => ({ ...prev, [catId]: allProducts }))
    setLoadingCat(null)
  }

  async function toggleExpand(catId: string) {
    const isOpening = !expanded.has(catId)
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(catId) ? s.delete(catId) : s.add(catId)
      return s
    })
    if (isOpening) await loadCategoryProducts(catId)
  }

  async function toggleCategory(catId: string) {
    if (toggling) return
    setToggling(catId)
    if (hiddenCatIds.has(catId)) {
      await supabase.from('tenant_category_visibility').delete()
        .eq('tenant_id', tenantId).eq('category_id', catId)
      setHiddenCatIds(prev => { const s = new Set(prev); s.delete(catId); return s })
    } else {
      await supabase.from('tenant_category_visibility').insert({ tenant_id: tenantId, category_id: catId })
      setHiddenCatIds(prev => new Set([...prev, catId]))
    }
    setToggling(null)
  }

  async function toggleProduct(prodId: string) {
    if (toggling) return
    setToggling(prodId)
    if (hiddenProdIds.has(prodId)) {
      await supabase.from('tenant_product_visibility').delete()
        .eq('tenant_id', tenantId).eq('product_id', prodId)
      setHiddenProdIds(prev => { const s = new Set(prev); s.delete(prodId); return s })
    } else {
      await supabase.from('tenant_product_visibility').insert({ tenant_id: tenantId, product_id: prodId })
      setHiddenProdIds(prev => new Set([...prev, prodId]))
    }
    setToggling(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
          Biblioteca Global
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
          Produtos do catálogo CriArt Oficina Digital. Todos aparecem na sua vitrine por padrão — oculte os que não quer exibir.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total de produtos', value: totalProducts, color: 'var(--lp-ink)' },
          { label: 'Categorias', value: categories.length, color: 'var(--lp-violet)' },
          { label: 'Ocultos por você', value: hiddenProdIds.size, color: 'var(--lp-ink-3)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '24px', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-display)' }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: 'var(--lp-ink-3)', marginTop: '2px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {categories.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Library size={40} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '8px' }}>Biblioteca ainda vazia</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map(cat => {
            const catProds = productsByCategory[cat.id] ?? []
            const isCatHidden = hiddenCatIds.has(cat.id)
            const isOpen = expanded.has(cat.id)
            const isLoadingThis = loadingCat === cat.id
            const hiddenCount = catProds.filter(p => hiddenProdIds.has(p.id)).length

            return (
              <div key={cat.id} className="card" style={{ overflow: 'hidden', opacity: isCatHidden ? .6 : 1, transition: 'opacity 200ms' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', cursor: 'pointer',
                  borderBottom: isOpen ? '1px solid var(--lp-border)' : 'none',
                }} onClick={() => toggleExpand(cat.id)}>
                  <div style={{ fontSize: '20px', width: '32px', textAlign: 'center', flexShrink: 0 }}>
                    {cat.emoji ?? '🎯'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--lp-ink)' }}>{cat.nome}</span>
                    {isOpen && catProds.length > 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginLeft: '10px' }}>
                        {catProds.length - hiddenCount}/{catProds.length} visíveis
                      </span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleCategory(cat.id) }}
                    disabled={toggling === cat.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px', borderRadius: '6px', border: '1.5px solid var(--lp-border)',
                      background: isCatHidden ? 'var(--lp-surface-2)' : 'var(--lp-success-pale)',
                      color: isCatHidden ? 'var(--lp-ink-4)' : 'var(--lp-success)',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                      opacity: toggling === cat.id ? .5 : 1,
                    }}
                  >
                    {isCatHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                    {isCatHidden ? 'Oculta' : 'Visível'}
                  </button>
                  {isOpen ? <ChevronDown size={16} style={{ color: 'var(--lp-ink-4)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--lp-ink-4)', flexShrink: 0 }} />}
                </div>

                {isOpen && (
                  <div style={{ padding: '12px 16px' }}>
                    {isLoadingThis ? (
                      <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)', textAlign: 'center', padding: '20px' }}>
                        Carregando produtos...
                      </p>
                    ) : catProds.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)', textAlign: 'center', padding: '20px' }}>
                        Nenhum produto nesta categoria
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                        {catProds.map(prod => {
                          const isHidden = hiddenProdIds.has(prod.id)
                          return (
                            <div key={prod.id} style={{
                              borderRadius: '10px', border: '1.5px solid var(--lp-border)',
                              overflow: 'hidden', background: 'var(--lp-surface)',
                              opacity: isHidden ? .45 : 1, transition: 'opacity 200ms',
                            }}>
                              <div style={{ height: '110px', background: 'var(--lp-surface-2)', position: 'relative', overflow: 'hidden' }}>
                                {prod.imagem_url ? (
                                  <NextImage src={prod.imagem_url} alt={prod.nome} fill sizes="200px" style={{ objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Package size={24} style={{ color: 'var(--lp-ink-4)' }} />
                                  </div>
                                )}
                                <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', gap: '4px' }}>
                                  {prod.novidade && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: '#ea580c', color: 'white' }}>NOVO</span>}
                                  {prod.destaque && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: '#F59E0B', color: 'white' }}>★</span>}
                                </div>
                              </div>
                              <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <p style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: 'var(--lp-ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {prod.nome}
                                </p>
                                <button
                                  onClick={() => toggleProduct(prod.id)}
                                  disabled={toggling === prod.id || isCatHidden}
                                  style={{
                                    flexShrink: 0, padding: '4px', borderRadius: '5px',
                                    border: '1.5px solid var(--lp-border)',
                                    background: isHidden ? 'var(--lp-surface-2)' : 'var(--lp-success-pale)',
                                    color: isHidden ? 'var(--lp-ink-4)' : 'var(--lp-success)',
                                    cursor: isCatHidden ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center',
                                    opacity: toggling === prod.id ? .5 : 1,
                                  }}
                                >
                                  {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

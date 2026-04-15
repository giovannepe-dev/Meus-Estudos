'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Package, Star, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  initialProducts: any[]
  tenantId: string
  categoriaFiltro: string | null
  categoriaNome: string | null
  totalCount: number
  currentPage: number
  totalPages: number
  perPage: number
}

export function ProdutosClient({ initialProducts, tenantId, categoriaFiltro, categoriaNome, totalCount, currentPage, totalPages }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)

  const handleToggleDestaque = async (product: any) => {
    const { error } = await supabase
      .from('tenant_products')
      .update({ destaque: !product.destaque })
      .eq('id', product.id)
    if (error) { toast.error('Erro ao atualizar'); return }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, destaque: !p.destaque } : p))
  }

  const handleToggleAtivo = async (product: any) => {
    const { error } = await supabase
      .from('tenant_products')
      .update({ ativo: !product.ativo })
      .eq('id', product.id)
    if (error) { toast.error('Erro ao atualizar'); return }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ativo: !p.ativo } : p))
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: categoriaFiltro ? '12px' : '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            Meus Produtos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
            {totalCount} produto{totalCount !== 1 ? 's' : ''} cadastrado{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/produtos/novo" style={{ textDecoration: 'none' }}>
          <button className="btn-primary"><Plus size={16} /> Novo produto</button>
        </Link>
      </div>

      {categoriaFiltro && categoriaNome && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px',
          padding: '8px 12px', backgroundColor: 'var(--lp-violet-pale)', borderRadius: '8px',
          border: '1px solid var(--lp-violet)', width: 'fit-content',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-violet)' }}>
            Categoria: {categoriaNome}
          </span>
          <Link href="/admin/produtos" style={{ display: 'flex', alignItems: 'center', color: 'var(--lp-violet)', textDecoration: 'none' }}>
            <X size={14} />
          </Link>
        </div>
      )}

      {products.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Package size={40} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginBottom: '20px' }}>
            Nenhum produto criado ainda
          </p>
          <Link href="/admin/produtos/novo" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 20px', backgroundColor: 'var(--lp-violet)', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
            }}>
              + Criar produto
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {products.map(product => (
              <div key={product.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                {product.imagem_url ? (
                  <img src={product.imagem_url} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, display: 'block' }} loading="lazy" />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'var(--lp-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} style={{ color: 'var(--lp-ink-4)' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--lp-ink)', fontSize: '14px', marginBottom: '2px' }}>{product.nome}</p>
                  {product.categoria && (
                    <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)' }}>{product.categoria.emoji} {product.categoria.nome}</p>
                  )}
                </div>
                {product.preco && (
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)', whiteSpace: 'nowrap' }}>
                    R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleDestaque(product)}
                    title={product.destaque ? 'Remover destaque' : 'Marcar destaque'}
                    style={{
                      padding: '6px 10px', border: '1px solid var(--lp-border)', borderRadius: '6px',
                      backgroundColor: product.destaque ? 'var(--lp-amber-pale)' : 'var(--lp-surface)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px',
                      color: product.destaque ? 'var(--lp-amber)' : 'var(--lp-ink-3)',
                    }}
                  >
                    <Star size={12} style={{ fill: product.destaque ? 'currentColor' : 'none' }} />
                  </button>
                  <button
                    onClick={() => handleToggleAtivo(product)}
                    style={{
                      padding: '6px 10px', border: '1px solid var(--lp-border)', borderRadius: '6px',
                      backgroundColor: product.ativo ? 'var(--lp-success-pale)' : 'var(--lp-surface-2)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                      color: product.ativo ? 'var(--lp-success)' : 'var(--lp-ink-4)',
                    }}
                  >
                    {product.ativo ? 'Ativo' : 'Oculto'}
                  </button>
                  <Link href={`/admin/produtos/${product.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '6px 10px', border: '1px solid var(--lp-border)', borderRadius: '6px',
                      backgroundColor: 'var(--lp-surface)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: 'var(--lp-ink-2)',
                    }}>
                      Editar
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <Link
                href={`?${new URLSearchParams({ ...(categoriaFiltro ? { categoria: categoriaFiltro } : {}), page: String(currentPage - 1) })}`}
                style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', opacity: currentPage <= 1 ? 0.3 : 1, textDecoration: 'none' }}
              >
                <button style={{ padding: '6px 10px', border: '1px solid var(--lp-border)', borderRadius: '6px', backgroundColor: 'var(--lp-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft size={14} />
                </button>
              </Link>
              <span style={{ fontSize: '13px', color: 'var(--lp-ink-3)' }}>
                Página {currentPage} de {totalPages}
              </span>
              <Link
                href={`?${new URLSearchParams({ ...(categoriaFiltro ? { categoria: categoriaFiltro } : {}), page: String(currentPage + 1) })}`}
                style={{ pointerEvents: currentPage >= totalPages ? 'none' : 'auto', opacity: currentPage >= totalPages ? 0.3 : 1, textDecoration: 'none' }}
              >
                <button style={{ padding: '6px 10px', border: '1px solid var(--lp-border)', borderRadius: '6px', backgroundColor: 'var(--lp-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight size={14} />
                </button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}

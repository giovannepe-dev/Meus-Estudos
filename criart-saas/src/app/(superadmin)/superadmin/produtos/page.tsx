import { createClient } from '@/lib/supabase/server'
import { GlobalProdutosClient } from './GlobalProdutosClient'

const PER_PAGE = 60

interface Props { searchParams: Promise<{ categoria?: string; page?: string; busca?: string }> }

export default async function GlobalProdutosPage({ searchParams }: Props) {
  const { categoria, page: pageStr, busca } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const supabase = await createClient()

  // Categories (small table, no pagination needed)
  const { data: cats } = await supabase
    .from('global_categories')
    .select('id, nome')
    .order('nome')

  // Products with exact count and server-side pagination
  let query = supabase
    .from('global_products')
    .select('*, categoria:global_categories(id, nome)', { count: 'exact' })

  if (categoria && categoria !== 'all') {
    query = query.eq('categoria_id', categoria)
  }
  if (busca) {
    query = query.ilike('nome', `%${busca}%`)
  }

  const from = (currentPage - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const { data: prods, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))

  return (
    <GlobalProdutosClient
      initialProdutos={prods ?? []}
      initialCategorias={cats ?? []}
      initialFiltro={categoria ?? 'all'}
      initialBusca={busca ?? ''}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      perPage={PER_PAGE}
    />
  )
}

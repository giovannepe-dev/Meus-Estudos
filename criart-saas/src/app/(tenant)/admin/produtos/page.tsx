import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProdutosClient } from './ProdutosClient'

const PER_PAGE = 60

interface Props {
  searchParams: Promise<{ categoria?: string; page?: string; busca?: string }>
}

export default async function ProdutosPage({ searchParams }: Props) {
  const { categoria: categoriaFiltro, page: pageStr, busca } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tu } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .single()

  if (!tu) redirect('/login?error=no-tenant')

  let query = supabase
    .from('tenant_products')
    .select('*, categoria:tenant_categories(id, nome, emoji)', { count: 'exact' })
    .eq('tenant_id', tu.tenant_id)
    .order('created_at', { ascending: false })

  if (categoriaFiltro) query = query.eq('categoria_id', categoriaFiltro)
  if (busca) query = query.ilike('nome', `%${busca}%`)

  const from = (currentPage - 1) * PER_PAGE
  const [productsRes, categoriaNomeRes] = await Promise.all([
    query.range(from, from + PER_PAGE - 1),
    categoriaFiltro
      ? supabase.from('tenant_categories').select('nome, emoji').eq('id', categoriaFiltro).single()
      : Promise.resolve({ data: null }),
  ])

  const products = productsRes.data ?? []
  const totalCount = productsRes.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))
  const categoriaNome = categoriaNomeRes.data
    ? `${categoriaNomeRes.data.emoji ? categoriaNomeRes.data.emoji + ' ' : ''}${categoriaNomeRes.data.nome}`
    : null

  return (
    <ProdutosClient
      initialProducts={products}
      tenantId={tu.tenant_id}
      categoriaFiltro={categoriaFiltro ?? null}
      categoriaNome={categoriaNome}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      perPage={PER_PAGE}
    />
  )
}

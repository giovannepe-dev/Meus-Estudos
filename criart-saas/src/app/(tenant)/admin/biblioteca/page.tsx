import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BibliotecaClient } from './BibliotecaClient'

export default async function BibliotecaPage() {
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

  const [catsRes, hiddenCatsRes, hiddenProdsRes, countRes] = await Promise.all([
    supabase.from('global_categories').select('id, nome, slug, emoji, ativa').eq('ativa', true).order('nome'),
    supabase.from('tenant_category_visibility').select('category_id').eq('tenant_id', tu.tenant_id),
    supabase.from('tenant_product_visibility').select('product_id').eq('tenant_id', tu.tenant_id),
    supabase.from('global_products').select('id', { count: 'exact', head: true }).eq('ativo', true),
  ])

  return (
    <BibliotecaClient
      tenantId={tu.tenant_id}
      initialCategories={catsRes.data ?? []}
      initialHiddenCatIds={(hiddenCatsRes.data ?? []).map((r: any) => r.category_id)}
      initialHiddenProdIds={(hiddenProdsRes.data ?? []).map((r: any) => r.product_id)}
      totalProducts={countRes.count ?? 0}
    />
  )
}

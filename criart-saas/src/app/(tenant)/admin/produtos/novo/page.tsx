import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProdutoFormClient } from '../ProdutoFormClient'

export default async function NovoProdutoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tu } = await supabase
    .from('tenant_users').select('tenant_id').eq('user_id', user.id).eq('ativo', true).single()
  if (!tu) redirect('/login')

  const { data: cats } = await supabase
    .from('tenant_categories')
    .select('id, nome, emoji')
    .eq('tenant_id', tu.tenant_id)
    .eq('ativa', true)
    .order('nome')

  return <ProdutoFormClient tenantId={tu.tenant_id} categorias={cats ?? []} />
}

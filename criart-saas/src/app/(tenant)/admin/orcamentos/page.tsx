import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrcamentosClient } from './OrcamentosClient'

export default async function OrcamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tu } = await supabase
    .from('tenant_users').select('tenant_id').eq('user_id', user.id).eq('ativo', true).single()
  if (!tu) redirect('/login')

  const { data: orcamentos } = await supabase
    .from('tenant_orcamentos')
    .select('*')
    .eq('tenant_id', tu.tenant_id)
    .order('created_at', { ascending: false })

  return <OrcamentosClient initialOrcamentos={orcamentos ?? []} />
}

import { createClient } from '@/lib/supabase/server'
import { SolicitacoesClient } from './SolicitacoesClient'

export default async function SolicitacoesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('access_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return <SolicitacoesClient initialRequests={data ?? []} />
}

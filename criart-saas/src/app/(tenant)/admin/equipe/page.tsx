import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EquipeClient } from './EquipeClient'

export default async function EquipePage() {
  const supabase = await createClient()

  // Get current user and tenant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tu } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .single()

  if (!tu) redirect('/login?error=no-tenant')

  // Fetch team members
  const { data: membros } = await supabase
    .from('tenant_users')
    .select('id, role, ativo, user:profiles(id, full_name)')
    .eq('tenant_id', tu.tenant_id)
    .eq('ativo', true)
    .order('created_at')

  return <EquipeClient initialMembros={membros ?? []} tenantId={tu.tenant_id} />
}

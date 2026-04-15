import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConfiguracoesClient } from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tu } = await supabase
    .from('tenant_users')
    .select('tenant:tenants(*), tenant_id')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .single()

  if (!tu) redirect('/login?error=no-tenant')
  const tenant = Array.isArray(tu.tenant) ? tu.tenant[0] : tu.tenant

  const [settingsRes, profileRes] = await Promise.all([
    supabase.from('tenant_settings').select('*').eq('tenant_id', (tenant as any).id).single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  return (
    <ConfiguracoesClient
      initialTenant={tenant ?? {}}
      initialSettings={settingsRes.data ?? {}}
      initialProfile={{ ...profileRes.data, email: user.email }}
    />
  )
}

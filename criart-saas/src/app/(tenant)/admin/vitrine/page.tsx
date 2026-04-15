import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { VitrineClient } from './VitrineClient'

export default async function VitrinePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tu } = await supabase
    .from('tenant_users')
    .select('tenant:tenants(*, settings:tenant_settings(*))')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .single()

  if (!tu?.tenant) redirect('/login?error=no-tenant')

  const tenant = Array.isArray(tu.tenant) ? tu.tenant[0] : tu.tenant as any
  const settings = Array.isArray(tenant.settings) ? tenant.settings[0] : tenant.settings

  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const vitrineUrl = `${protocol}://${host}/vitrine/${tenant.slug}`

  return (
    <VitrineClient
      initialTenant={tenant}
      initialSettings={settings ?? {}}
      vitrineUrl={vitrineUrl}
    />
  )
}

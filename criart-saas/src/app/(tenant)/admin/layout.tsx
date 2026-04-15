import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TenantSidebar } from '@/components/tenant/TenantSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar tenant_users com relações
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('*, tenant:tenants(*, settings:tenant_settings(*))')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .single()

  if (!tenantUser || !tenantUser.tenant) redirect('/login?error=no-tenant')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const tenant = tenantUser.tenant as any
  const expiresAt = tenant.plan_expires_at

  const { count: orcamentosNovos } = await supabase
    .from('tenant_orcamentos')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantUser.tenant_id)
    .eq('status', 'novo')

  // Verificar se plano expirou
  if (expiresAt) {
    const now = new Date()
    const expires = new Date(expiresAt)
    if (now > expires) {
      redirect('/admin/plan-expired')
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--lp-base)' }}>
      <TenantSidebar user={user} profile={profile} tenant={tenant} orcamentosNovos={orcamentosNovos ?? 0} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <AdminTopbar user={user} profile={profile} expiresAt={expiresAt} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="admin-main">
          {children}
        </main>
      </div>
    </div>
  )
}

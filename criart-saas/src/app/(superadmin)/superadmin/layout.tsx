import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuperadminSidebar } from '@/components/superadmin/SuperadminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_superadmin) redirect('/login?error=unauthorized')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--lp-base)' }}>
      <SuperadminSidebar user={user} profile={profile} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <AdminTopbar user={user} profile={profile} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

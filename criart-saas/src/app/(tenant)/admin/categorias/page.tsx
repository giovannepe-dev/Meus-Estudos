import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CategoriasClient } from './CategoriasClient'

export default async function CategoriasPage() {
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

  // Fetch categories
  const { data: categorias } = await supabase
    .from('tenant_categories')
    .select('*')
    .eq('tenant_id', tu.tenant_id)
    .order('ordem')

  return <CategoriasClient initialCategorias={categorias ?? []} tenantId={tu.tenant_id} />
}

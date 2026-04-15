import { createClient } from '@/lib/supabase/server'
import SuperadminDashboard from './superadmin-dashboard'

export default async function SuperadminPage() {
  const supabase = await createClient()

  const [
    { count: totalTenants },
    { count: activeTenants },
    { count: totalProdutos },
    { count: totalCategorias },
    { count: totalColecoes },
    { data: recentTenants },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('global_products').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('global_categories').select('*', { count: 'exact', head: true }).eq('ativa', true),
    supabase.from('global_collections').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('tenants')
      .select('*, settings:tenant_settings(nome_site, logo_url, cor_destaque)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <SuperadminDashboard
      stats={{
        tenants: totalTenants ?? 0,
        active: activeTenants ?? 0,
        products: totalProdutos ?? 0,
        categories: totalCategorias ?? 0,
        colecoes: totalColecoes ?? 0,
      }}
      recentTenants={recentTenants ?? []}
    />
  )
}

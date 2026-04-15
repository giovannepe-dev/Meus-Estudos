import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TenantDetailClient } from './TenantDetailClient'

interface Props { params: Promise<{ id: string }> }

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, settings:tenant_settings(*)')
    .eq('id', id)
    .single()

  if (!tenant) notFound()

  const settings = (tenant as any).settings ?? null

  return (
    <TenantDetailClient
      tenant={tenant}
      settings={settings}
    />
  )
}

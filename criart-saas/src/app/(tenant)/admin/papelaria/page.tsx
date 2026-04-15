export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PapelariaAdminClient } from './PapelariaAdminClient'

export default async function AdminPapelariaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenant:tenants(settings:tenant_settings(*))')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .single()

  if (!tenantUser) redirect('/login')

  const tenantId = tenantUser.tenant_id
  const settings = (tenantUser.tenant as any)?.settings
  const accentColor = settings?.cor_destaque ?? '#ea580c'

  // Busca todas as coleções ativas com contagem de imagens
  const { data: collections } = await supabase
    .from('global_collections')
    .select('id, nome, slug, parent_id, drive_folder_id, ordem')
    .eq('ativo', true)
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('nome')

  // Contagem de imagens por coleção
  const allIds = (collections ?? []).map(c => c.id)
  const { data: imgCounts } = allIds.length > 0
    ? await supabase
        .from('global_collection_images')
        .select('collection_id')
        .in('collection_id', allIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const img of imgCounts ?? []) {
    countMap[img.collection_id] = (countMap[img.collection_id] ?? 0) + 1
  }

  // Coleções ocultas pelo tenant
  const { data: hiddenRows } = await supabase
    .from('tenant_hidden_collections')
    .select('collection_id')
    .eq('tenant_id', tenantId)
  const hiddenIds = new Set((hiddenRows ?? []).map(r => r.collection_id))

  // Monta estrutura: categorias pai + seus kits filhos
  const parents = (collections ?? []).filter(c => !c.parent_id)
  const children = (collections ?? []).filter(c => c.parent_id)

  const categorias = parents.map(p => ({
    ...p,
    kits: children.filter(c => c.parent_id === p.id).map(c => ({
      ...c,
      num_imagens: countMap[c.id] ?? 0,
      oculto: hiddenIds.has(c.id),
    })),
  }))

  // Kits sem categoria pai (importados direto como raiz com drive_folder_id)
  const semCategoria = children
    .filter(c => !parents.find(p => p.id === c.parent_id))
    .map(c => ({ ...c, num_imagens: countMap[c.id] ?? 0, oculto: hiddenIds.has(c.id) }))

  return (
    <PapelariaAdminClient
      categorias={categorias}
      semCategoria={semCategoria}
      accentColor={accentColor}
      tenantId={tenantId}
    />
  )
}

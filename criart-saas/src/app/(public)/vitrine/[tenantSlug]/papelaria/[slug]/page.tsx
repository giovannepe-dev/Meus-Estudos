export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/supabase/queries'
import { CollectionDetailClient } from './CollectionDetailClient'
import SubcategoryGrid from './SubcategoryGrid'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ tenantSlug: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('global_collections').select('nome, descricao').eq('slug', slug).single()
  if (!data) return {}
  return { title: data.nome, description: data.descricao ?? undefined }
}

export default async function CollectionPage({ params }: Props) {
  const { tenantSlug, slug } = await params
  const supabase = await createClient()
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) notFound()

  const settings = (tenant as any).settings
  const accentColor = settings?.cor_destaque ?? '#ea580c'

  // Busca a coleção pelo slug
  const { data: collection } = await supabase
    .from('global_collections')
    .select('id, nome, slug, descricao, parent_id')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!collection) notFound()

  // Verifica se tem subcategorias (é uma categoria pai)
  const { data: children } = await supabase
    .from('global_collections')
    .select('id, nome, slug, descricao')
    .eq('parent_id', collection.id)
    .eq('ativo', true)
    .order('ordem')
    .order('nome')

  const hasChildren = (children ?? []).length > 0

  // Wrapper do Drive: tem timestamp no nome — deve ser ignorado no breadcrumb
  const isWrapper = (nome: string) => /\d{8}T\d{6}Z/.test(nome) || /^[A-Z]$/.test(nome.trim())

  // Busca pai para breadcrumb, pulando wrappers drive-download e containers de letra
  let parentCollection = null
  let parentId = collection.parent_id
  while (parentId) {
    const { data: parent } = await supabase
      .from('global_collections')
      .select('id, nome, slug, parent_id')
      .eq('id', parentId)
      .single()
    if (!parent) break
    if (!isWrapper(parent.nome)) {
      parentCollection = { id: parent.id, nome: parent.nome, slug: parent.slug }
      break
    }
    parentId = parent.parent_id
  }

  if (hasChildren) {
    const childIds = (children ?? []).map(c => c.id)

    // Imagens próprias desta coleção (aparecem como preview no topo)
    const { data: ownImagesData } = await supabase
      .from('global_collection_images')
      .select('imagem_url')
      .eq('collection_id', collection.id)
      .order('ordem')

    // Imagens dos filhos para mosaico nos cards
    const fotosMap: Record<string, string[]> = {}
    if (childIds.length > 0) {
      const { data: coverImages } = await supabase
        .from('global_collection_images')
        .select('collection_id, imagem_url')
        .in('collection_id', childIds)
        .order('ordem')
      for (const img of coverImages ?? []) {
        if (!fotosMap[img.collection_id]) fotosMap[img.collection_id] = []
        if (fotosMap[img.collection_id].length < 4) fotosMap[img.collection_id].push(img.imagem_url)
      }
    }

    return (
      <SubcategoryGrid
        collection={collection}
        children={(children ?? []).map(c => ({ ...c, fotos: fotosMap[c.id] ?? [] }))}
        ownImages={(ownImagesData ?? []).map(i => i.imagem_url)}
        parent={parentCollection}
        tenantSlug={tenantSlug}
        accentColor={accentColor}
      />
    )
  }

  // É um tema (folha) — busca imagens e mostra detalhes
  const { data: images } = await supabase
    .from('global_collection_images')
    .select('id, imagem_url, ordem')
    .eq('collection_id', collection.id)
    .order('ordem')

  return (
    <CollectionDetailClient
      collection={collection}
      parent={parentCollection}
      images={images ?? []}
      settings={settings}
      accentColor={accentColor}
      tenantSlug={tenantSlug}
    />
  )
}

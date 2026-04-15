import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { CollectionDetailClient } from './CollectionDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

const CATEGORY_EMOJI: Record<string, string> = {
  quadrinhos: '🎨', 'datas-especiais': '🎉', infantil: '🧸', religioso: '✝️', 'copos-bolha': '🥤',
}

export default async function PapelariaCollectionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: collection } = await supabase
    .from('global_collections')
    .select('id, nome, slug, descricao, ativo, destaque, ordem, tg_topic_id, parent_id')
    .eq('id', id)
    .single()

  if (!collection) notFound()

  // Busca categoria pai
  let parent = null
  if (collection.parent_id) {
    const { data } = await supabase
      .from('global_collections')
      .select('id, nome, slug')
      .eq('id', collection.parent_id)
      .single()
    parent = data
  }

  // Verifica se tem filhos (subcategorias/kits)
  const { data: children } = await supabase
    .from('global_collections')
    .select('id, nome, slug, descricao, ativo, destaque, ordem, tg_topic_id, parent_id, drive_folder_id')
    .eq('parent_id', id)
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('nome')

  const hasChildren = (children ?? []).length > 0

  if (hasChildren) {
    const childIds = (children ?? []).map(c => c.id)

    // Imagens próprias + imagens dos filhos (para mosaico) em paralelo
    const [{ data: ownImages }, { data: childImages }] = await Promise.all([
      supabase
        .from('global_collection_images')
        .select('id, imagem_url, ordem')
        .eq('collection_id', id)
        .order('ordem'),
      childIds.length > 0
        ? supabase
            .from('global_collection_images')
            .select('collection_id, imagem_url')
            .in('collection_id', childIds)
            .order('ordem')
        : Promise.resolve({ data: [] }),
    ])

    // Agrupa imagens por filho (até 4 para mosaico)
    const fotosMap: Record<string, string[]> = {}
    for (const img of childImages ?? []) {
      if (!fotosMap[img.collection_id]) fotosMap[img.collection_id] = []
      if (fotosMap[img.collection_id].length < 4) fotosMap[img.collection_id].push(img.imagem_url)
    }

    const childrenWithCount = (children ?? []).map(c => ({
      ...c,
      imagem_count: fotosMap[c.id]?.length ?? 0,
      fotos: fotosMap[c.id] ?? [],
    }))
    const emoji = CATEGORY_EMOJI[collection.slug] ?? '🎨'

    return (
      <div>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Link href="/superadmin/papelaria" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)', fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-3)', textDecoration: 'none' }}>
            <ChevronLeft size={14} /> Papelaria
          </Link>
          {parent && (
            <>
              <span style={{ color: 'var(--lp-ink-4)' }}>/</span>
              <Link href={`/superadmin/papelaria/${parent.id}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-3)', textDecoration: 'none' }}>{parent.nome}</Link>
            </>
          )}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{emoji}</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em', margin: 0 }}>{collection.nome}</h1>
            <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)', margin: '3px 0 0', fontFamily: 'monospace' }}>{collection.slug}</p>
          </div>
        </div>

        {/* Imagens próprias desta coleção (preview / capas) */}
        {(ownImages ?? []).length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lp-ink-4)', marginBottom: '10px' }}>
              Prévia — {ownImages!.length} imagem{ownImages!.length !== 1 ? 'ns' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              {ownImages!.map(img => (
                <a key={img.id} href={img.imagem_url} target="_blank" rel="noopener">
                  <div style={{ aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--lp-border)', background: 'var(--lp-surface-2)' }}>
                    <img src={img.imagem_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: '13px', color: 'var(--lp-ink-3)', marginBottom: '16px', fontWeight: 600 }}>
          {childrenWithCount.length} tema{childrenWithCount.length !== 1 ? 's' : ''}
        </p>

        {/* Grid de filhos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {childrenWithCount.map(child => (
            <div key={child.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Mosaico 2x2 */}
              <Link href={`/superadmin/papelaria/${child.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ aspectRatio: '1', background: 'var(--lp-surface-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', cursor: 'pointer' }}>
                  {child.fotos.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', gridRow: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🎨</div>
                  ) : child.fotos.length === 1 ? (
                    <img src={child.fotos[0]} alt="" style={{ gridColumn: '1/-1', gridRow: '1/-1', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                  ) : (
                    [0, 1, 2, 3].map(i => (
                      child.fotos[i]
                        ? <img key={i} src={child.fotos[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                        : <div key={i} style={{ background: 'var(--lp-surface-3)' }} />
                    ))
                  )}
                </div>
              </Link>

              {/* Info + ações */}
              <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/superadmin/papelaria/${child.id}`} style={{ textDecoration: 'none' }}>
                    <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--lp-ink)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.nome}</p>
                  </Link>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: child.imagem_count > 0 ? '#ec4899' : 'var(--lp-ink-4)', fontWeight: 600 }}>
                      {child.imagem_count} img
                    </span>
                    <span style={{ fontSize: '11px', color: child.ativo ? 'var(--lp-success)' : 'var(--lp-ink-4)' }}>
                      {child.ativo ? '● Ativa' : '○ Oculta'}
                    </span>
                  </div>
                </div>
                {child.drive_folder_id && (
                  <a
                    href={`https://drive.google.com/drive/folders/${child.drive_folder_id}`}
                    target="_blank"
                    rel="noopener"
                    title="Abrir pasta no Drive"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: '#ec4899', color: 'white', flexShrink: 0, textDecoration: 'none' }}
                  >
                    <Download size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // É um tema folha — busca imagens
  const { data: images } = await supabase
    .from('global_collection_images')
    .select('id, imagem_url, ordem')
    .eq('collection_id', id)
    .order('ordem')

  return (
    <CollectionDetailClient
      collection={collection}
      parent={parent}
      images={images ?? []}
    />
  )
}

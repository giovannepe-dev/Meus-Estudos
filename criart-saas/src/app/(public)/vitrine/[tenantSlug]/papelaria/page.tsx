export const revalidate = 300

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTenantBySlug } from '@/lib/supabase/queries'
import Link from 'next/link'
import { ChevronLeft, Package } from 'lucide-react'
import PapelariaAZClient from './PapelariaAZClient'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default async function PapelariaPage({ params }: Props) {
  const { tenantSlug } = await params
  const supabase = await createClient()
  const tenant = await getTenantBySlug(tenantSlug)
  if (!tenant) notFound()

  const settings = (tenant as any).settings
  const accentColor = settings?.cor_destaque ?? '#ea580c'
  const tenantId = tenant.id

  // Coleções ocultas por este tenant
  const { data: hiddenRows } = await supabase
    .from('tenant_hidden_collections')
    .select('collection_id')
    .eq('tenant_id', tenantId)
  const hiddenColIds = new Set((hiddenRows ?? []).map((r: any) => r.collection_id))

  // Container passthrough — não vira card, apenas navega para dentro
  // Letra: nome é 1 única letra maiúscula (ex: "B")
  // Wrapper: nome contém timestamp do Drive (ex: "drive-download-20230514T182419Z-001")
  const isPassthrough = (nome: string) =>
    /^[A-Z]$/.test(nome.trim()) || /\d{8}T\d{6}Z/.test(nome)

  // Raiz
  const { data: raiz } = await supabase
    .from('global_collections')
    .select('id, nome, slug, descricao')
    .is('parent_id', null)
    .eq('ativo', true)
    .order('nome')

  // BFS: percorre todos os níveis até esgotar passthroughs
  const todosOsTemas: typeof raiz = []
  let fila = (raiz ?? []) // começa com todos os itens raiz

  while (fila.length > 0) {
    const temas = fila.filter(c => !isPassthrough(c.nome))
    const passthroughs = fila.filter(c => isPassthrough(c.nome))

    todosOsTemas.push(...temas)

    if (passthroughs.length === 0) break

    const ids = passthroughs.map(p => p.id)
    const { data: filhos } = await supabase
      .from('global_collections')
      .select('id, nome, slug, descricao')
      .in('parent_id', ids)
      .eq('ativo', true)
      .order('nome')

    fila = filhos ?? []
  }
  const temaIds = todosOsTemas.map(t => t.id)

  // Contagem de estilos (filhos dos temas)
  const { data: estilos } = temaIds.length > 0
    ? await supabase
        .from('global_collections')
        .select('id, parent_id')
        .in('parent_id', temaIds)
        .eq('ativo', true)
    : { data: [] }

  const estiloCountMap: Record<string, number> = {}
  for (const e of estilos ?? []) {
    if (e.parent_id) estiloCountMap[e.parent_id] = (estiloCountMap[e.parent_id] ?? 0) + 1
  }

  // Capa: primeira imagem de cada tema
  const { data: coverImgs } = temaIds.length > 0
    ? await supabase
        .from('global_collection_images')
        .select('collection_id, imagem_url')
        .in('collection_id', temaIds)
        .order('ordem')
    : { data: [] }

  const coverMap: Record<string, string> = {}
  for (const img of coverImgs ?? []) {
    if (!coverMap[img.collection_id]) coverMap[img.collection_id] = img.imagem_url
  }

  const items = todosOsTemas
    .filter(t => !hiddenColIds.has(t.id))
    .map(t => ({
      id: t.id,
      nome: t.nome,
      slug: t.slug,
      total: estiloCountMap[t.id] ?? 0,
      fotos: coverMap[t.id] ? [coverMap[t.id]] : [],
    }))

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>

      {/* Botão voltar */}
      <Link
        href={`/vitrine/${tenantSlug}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', padding: '8px 16px', borderRadius: '10px', background: 'var(--lp-surface-2)', border: '1.5px solid var(--lp-border)', fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink-2)', textDecoration: 'none' }}
      >
        <ChevronLeft size={16} /> Voltar à vitrine
      </Link>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          Papelaria
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>
          {items.length} tema{items.length !== 1 ? 's' : ''} disponíve{items.length !== 1 ? 'is' : 'l'} · A a Z
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--lp-ink-4)' }}>
          <Package size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <p>Nenhum tema disponível no momento.</p>
        </div>
      ) : (
        <PapelariaAZClient items={items} tenantSlug={tenantSlug} accentColor={accentColor} />
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { PapelariaGlobaisClient } from './PapelariaGlobaisClient'

// Container passthrough — mesma lógica da vitrine
const isPassthrough = (nome: string) =>
  /^[A-Z]$/.test(nome.trim()) || /\d{8}T\d{6}Z/.test(nome)

export default async function PapelariaGlobaisPage() {
  const supabase = await createClient()

  // BFS: percorre toda a hierarquia e coleta os temas reais
  const { data: raiz } = await supabase
    .from('global_collections')
    .select('id, nome, slug, descricao, ativo, drive_folder_id')
    .is('parent_id', null)
    .order('nome')

  type Col = { id: string; nome: string; slug: string; descricao: string | null; ativo: boolean; drive_folder_id: string | null }
  const todosOsTemas: Col[] = []
  let fila: Col[] = raiz ?? []

  while (fila.length > 0) {
    const temas = fila.filter(c => !isPassthrough(c.nome))
    const passthroughs = fila.filter(c => isPassthrough(c.nome))
    todosOsTemas.push(...temas)
    if (passthroughs.length === 0) break
    const ids = passthroughs.map(p => p.id)
    const { data: filhos } = await supabase
      .from('global_collections')
      .select('id, nome, slug, descricao, ativo, drive_folder_id')
      .in('parent_id', ids)
      .order('nome')
    fila = filhos ?? []
  }

  const temaIds = todosOsTemas.map(t => t.id)

  // Contagem de estilos por tema
  const { data: estilos } = temaIds.length > 0
    ? await supabase
        .from('global_collections')
        .select('id, parent_id')
        .in('parent_id', temaIds)
    : { data: [] }

  const estiloCountMap: Record<string, number> = {}
  for (const e of estilos ?? []) {
    if (e.parent_id) estiloCountMap[e.parent_id] = (estiloCountMap[e.parent_id] ?? 0) + 1
  }

  // Primeira imagem de cada tema
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

  const items = todosOsTemas.map(t => ({
    id: t.id,
    nome: t.nome,
    slug: t.slug,
    ativo: t.ativo,
    drive_folder_id: t.drive_folder_id,
    total: estiloCountMap[t.id] ?? 0,
    capa: coverMap[t.id] ?? null,
  }))

  return <PapelariaGlobaisClient items={items} />
}

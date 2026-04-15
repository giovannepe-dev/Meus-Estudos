import { createClient } from '@/lib/supabase/server'
import { CategoriasGlobaisClient } from './CategoriasGlobaisClient'

export default async function GlobalCategoriasPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('global_categories')
    .select('*, produtos:global_products(count)')
    .order('nome')

  return <CategoriasGlobaisClient initialCategorias={data ?? []} />
}

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProdutoFormClient } from '../ProdutoFormClient'

interface Props { params: Promise<{ id: string }> }

export default async function EditarProdutoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tu } = await supabase
    .from('tenant_users').select('tenant_id').eq('user_id', user.id).eq('ativo', true).single()
  if (!tu) redirect('/login')

  const [{ data: product }, { data: cats }] = await Promise.all([
    supabase.from('tenant_products').select('*').eq('id', id).eq('tenant_id', tu.tenant_id).single(),
    supabase.from('tenant_categories').select('id, nome, emoji').eq('tenant_id', tu.tenant_id).eq('ativa', true).order('nome'),
  ])

  if (!product) notFound()

  return (
    <ProdutoFormClient
      tenantId={tu.tenant_id}
      categorias={cats ?? []}
      initialProduct={{
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        preco: product.preco,
        categoria_id: product.categoria_id,
        destaque: product.destaque,
        ativo: product.ativo,
        imagem_url: product.imagem_url,
      }}
    />
  )
}

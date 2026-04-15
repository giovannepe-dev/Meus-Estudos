import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenant_id, itens, total_estimado, nome_cliente, whatsapp_cliente, observacao_geral } = body

    if (!tenant_id || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const numero = `ORC-${Date.now().toString().slice(-6)}`
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('tenant_orcamentos')
      .insert({
        tenant_id,
        numero,
        itens,
        total_estimado: total_estimado ?? null,
        nome_cliente: nome_cliente?.trim() || null,
        whatsapp_cliente: whatsapp_cliente?.trim() || null,
        observacao_geral: observacao_geral?.trim() || null,
      })
      .select('id, numero')
      .single()

    if (error) {
      console.error('Error saving orcamento:', error)
      return NextResponse.json({ error: 'Erro ao salvar orçamento' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, numero: data.numero })
  } catch (err) {
    console.error('Error in orcamentos route:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

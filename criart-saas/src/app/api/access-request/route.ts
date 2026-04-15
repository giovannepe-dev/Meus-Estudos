import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendAccessRequestNotification, sendAccessRequestConfirmation } from '@/lib/email/send-access-request'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, empresa, email, whatsapp } = body

    if (!nome?.trim() || !empresa?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const data = {
      nome: nome.trim(),
      empresa: empresa.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp?.trim() || null,
    }

    const supabase = await createClient()
    const { error } = await supabase.from('access_requests').insert(data)

    if (error) {
      console.error('Error saving access request:', error)
      return NextResponse.json({ error: 'Erro ao salvar solicitação' }, { status: 500 })
    }

    // Dispara os dois emails em paralelo, sem bloquear a resposta em caso de falha
    await Promise.allSettled([
      sendAccessRequestNotification(data),
      sendAccessRequestConfirmation(data),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in access-request route:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

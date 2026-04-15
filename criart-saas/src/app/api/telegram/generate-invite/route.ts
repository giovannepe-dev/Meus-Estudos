import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Só superadmin pode chamar
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()
  if (!profile?.is_superadmin) return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })

  const { tenant_slug, tenant_id } = await req.json()

  const botUrl = process.env.BOT_API_URL
  const botSecret = process.env.BOT_API_SECRET

  if (!botUrl || !botSecret) {
    return NextResponse.json({ error: 'BOT_API_URL ou BOT_API_SECRET não configurados' }, { status: 500 })
  }

  try {
    const res = await fetch(`${botUrl}/generate-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Secret': botSecret,
      },
      body: JSON.stringify({ tenant_slug }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.error ?? 'Erro no bot' }, { status: 502 })
    }

    const { invite_link } = await res.json()

    // Salva o link no tenant
    if (tenant_id && invite_link) {
      await supabase
        .from('tenants')
        .update({ tg_invite_link: invite_link })
        .eq('id', tenant_id)
    }

    return NextResponse.json({ invite_link })
  } catch (e) {
    console.error('[generate-invite]', e)
    return NextResponse.json({ error: 'Falha ao conectar com o bot' }, { status: 502 })
  }
}

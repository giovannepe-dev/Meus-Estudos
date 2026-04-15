import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendReactivationEmail } from '@/lib/email/send-reactivation'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenant_id, tenant_slug, owner_email, tenant_name, plan_days, plan_expires_at } = body

    if (!tenant_id || !tenant_slug || !owner_email || !tenant_name) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Verificar superadmin
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_superadmin')
      .eq('id', currentUser.id)
      .single()
    if (!profile?.is_superadmin) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // 1. Gerar novo invite link do Telegram
    let tgInviteLink: string | null = null
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN
      const oficinaChatId = process.env.TG_OFICINA_CHAT_ID || '-1003640284997'
      if (botToken) {
        const expireDate = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 60 // 60 dias
        const inviteRes = await fetch(
          `https://api.telegram.org/bot${botToken}/createChatInviteLink`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: oficinaChatId,
              name: `Reativacao ${tenant_slug}`,
              member_limit: 1,
              expire_date: expireDate,
            }),
            signal: AbortSignal.timeout(10000),
          }
        )
        if (inviteRes.ok) {
          const data = await inviteRes.json()
          tgInviteLink = data.result?.invite_link ?? null
        }
      }
    } catch (e) {
      console.error('[reactivate-tenant] erro ao gerar invite Telegram:', e)
    }

    // 2. Atualizar tg_invite_link no banco (limpar tg_user_id pois vai entrar de novo)
    if (tgInviteLink) {
      await adminSupabase
        .from('tenants')
        .update({ tg_invite_link: tgInviteLink, tg_user_id: null })
        .eq('id', tenant_id)
    }

    // 3. Enviar email de reativação
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://laserpro.vercel.app'}/login`
    const vitrineUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://laserpro.vercel.app'}/vitrine/${tenant_slug}`

    const emailResult = await sendReactivationEmail({
      email: owner_email,
      tenantName: tenant_name,
      adminUrl,
      vitrineUrl,
      planDays: plan_days,
      planExpiresAt: plan_expires_at ? new Date(plan_expires_at) : undefined,
      tgInviteLink,
    })

    return NextResponse.json({
      success: true,
      tgInviteLink,
      emailSent: emailResult.success,
    })
  } catch (error) {
    console.error('[reactivate-tenant] erro:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

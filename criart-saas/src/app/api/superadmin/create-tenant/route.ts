import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/slug'
import { sendWelcomeEmail } from '@/lib/email/send-welcome'
import { NextRequest, NextResponse } from 'next/server'

interface CreateTenantRequest {
  tenantName: string
  ownerEmail: string
  ownerPassword: string
  planDays: number
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateTenantRequest = await req.json()
    const { tenantName, ownerEmail, ownerPassword, planDays } = body

    if (!tenantName || !ownerEmail || !ownerPassword || !planDays) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    // Verificar se usuário atual é superadmin
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

    // 1. Verificar se email já existe via SQL (confiável, sem paginação)
    let newUserId: string
    const { data: existingAuthUser } = await adminSupabase
      .rpc('get_user_id_by_email', { email_input: ownerEmail })
      .maybeSingle()

    if (existingAuthUser) {
      const userId = existingAuthUser as string
      // Usuário já existe — verificar se já tem tenant
      const { data: existingLink } = await adminSupabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', userId)
        .single()

      if (existingLink) {
        return NextResponse.json(
          { error: `Usuário ${ownerEmail} já tem uma empresa cadastrada` },
          { status: 400 }
        )
      }
      newUserId = userId
      // Atualizar senha
      await adminSupabase.auth.admin.updateUserById(newUserId, { password: ownerPassword })
    } else {
      // Criar novo usuário
      const { data: newUser, error: userError } = await adminSupabase.auth.admin.createUser({
        email: ownerEmail,
        password: ownerPassword,
        email_confirm: true,
      })

      if (userError || !newUser.user) {
        // Fallback: se "already registered", buscar via SQL direto
        if (userError?.message?.includes('already')) {
          const { data: foundId } = await adminSupabase
            .rpc('get_user_id_by_email', { email_input: ownerEmail })
            .maybeSingle()
          if (foundId) {
            newUserId = foundId as string
          } else {
            return NextResponse.json(
              { error: `Erro ao criar usuário: ${userError.message}` },
              { status: 400 }
            )
          }
        } else {
          return NextResponse.json(
            { error: `Erro ao criar usuário: ${userError?.message || 'Desconhecido'}` },
            { status: 400 }
          )
        }
      } else {
        newUserId = newUser.user.id
      }
    }

    // 2. Gerar slug única
    let slug = generateSlug(tenantName)
    let uniqueSlug = slug
    let counter = 1
    while (true) {
      const { data: existing } = await adminSupabase
        .from('tenants')
        .select('id')
        .eq('slug', uniqueSlug)
        .single()
      if (!existing) break
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    // 3. Calcular expiração e criar tenant
    const planExpiresAt = new Date()
    planExpiresAt.setDate(planExpiresAt.getDate() + planDays)

    const isTrial = planDays === 1
    const { data: tenant, error: tenantError } = await adminSupabase
      .from('tenants')
      .insert({
        slug: uniqueSlug,
        name: tenantName,
        status: isTrial ? 'trial' : 'active',
        is_trial: isTrial,
        plan: 'free',
        plan_days: planDays,
        plan_expires_at: planExpiresAt.toISOString(),
        owner_email: ownerEmail,
        created_by: currentUser.id,
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      console.error('Tenant insert error:', tenantError)
      return NextResponse.json(
        { error: `Erro ao criar empresa: ${tenantError?.message || 'Desconhecido'}` },
        { status: 400 }
      )
    }

    // 4. Vincular user ao tenant
    const { error: linkError } = await adminSupabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: newUserId,
        role: 'tenant_admin',
        ativo: true,
      })

    if (linkError) {
      console.error('Tenant link error:', linkError)
      await adminSupabase.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { error: `Erro ao vincular usuário: ${linkError.message}` },
        { status: 400 }
      )
    }

    // 5. Gerar invite link do Telegram via Bot API (não bloqueia em caso de falha)
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
              name: `Acesso ${uniqueSlug}`,
              member_limit: 1,
              expire_date: expireDate,
            }),
            signal: AbortSignal.timeout(10000),
          }
        )
        if (inviteRes.ok) {
          const data = await inviteRes.json()
          tgInviteLink = data.result?.invite_link ?? null
          if (tgInviteLink) {
            await adminSupabase.from('tenants').update({ tg_invite_link: tgInviteLink }).eq('id', tenant.id)
          }
        }
      }
    } catch (e) {
      console.error('[create-tenant] erro ao gerar invite Telegram:', e)
    }

    // 6. Enviar email de boas-vindas
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://laserpro.vercel.app'}/login`
    const vitrineUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://laserpro.vercel.app'}/vitrine/${uniqueSlug}`

    const emailResult = await sendWelcomeEmail({
      email: ownerEmail,
      tenantName: tenantName,
      password: ownerPassword,
      vitrineUrl,
      adminUrl,
      planDays,
      planExpiresAt,
      tgInviteLink,
    })

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      userId: newUserId,
      slug: uniqueSlug,
      expiresAt: planExpiresAt.toISOString(),
      tgInviteLink,
      emailSent: emailResult.success,
      emailMessage: emailResult.success
        ? '✅ Email de boas-vindas enviado com sucesso'
        : `⚠️ Tenant criado, mas erro ao enviar email: ${emailResult.error}`,
    })
  } catch (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPlanExpiringAlert } from '@/lib/email/send-plan-alert'

const ALERT_DAYS = [7, 3, 1]
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://laserpro.vercel.app'

async function kickFromTelegram(tgUserId: number, tenantName: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TG_OFICINA_CHAT_ID || '-1003640284997'
  if (!botToken || !tgUserId) return false
  try {
    // Bane e depois desbane — efeito de "kick" sem banimento permanente
    await fetch(`https://api.telegram.org/bot${botToken}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: tgUserId }),
      signal: AbortSignal.timeout(10000),
    })
    await fetch(`https://api.telegram.org/bot${botToken}/unbanChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: tgUserId, only_if_banned: true }),
      signal: AbortSignal.timeout(10000),
    })
    console.log(`[cron] ${tenantName}: expulso do Telegram (${tgUserId})`)
    return true
  } catch (e) {
    console.error(`[cron] erro ao expulsar ${tenantName} do Telegram:`, e)
    return false
  }
}

// Rota chamada pelo Vercel Cron diariamente às 06h UTC
// Vercel Cron envia header Authorization com CRON_SECRET
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()
  const now = new Date()
  const results = {
    active_to_grace: 0,
    grace_to_suspended: 0,
    trial_expired: 0,
    alerts_sent: 0,
    errors: [] as string[],
  }

  // ── 1. Alertas de vencimento (7, 3 e 1 dia antes) ───────────────────────────
  for (const daysLeft of ALERT_DAYS) {
    // Janela: plan_expires_at cai entre (agora + daysLeft dias) e (agora + daysLeft dias + 1 dia)
    const windowStart = new Date(now)
    windowStart.setDate(windowStart.getDate() + daysLeft)
    windowStart.setHours(0, 0, 0, 0)

    const windowEnd = new Date(windowStart)
    windowEnd.setDate(windowEnd.getDate() + 1)

    const { data: expiring, error: eAlert } = await db
      .from('tenants')
      .select('id, name, owner_email, plan_expires_at')
      .eq('status', 'active')
      .gte('plan_expires_at', windowStart.toISOString())
      .lt('plan_expires_at', windowEnd.toISOString())

    if (eAlert) {
      results.errors.push(`alert-${daysLeft}d: ${eAlert.message}`)
      continue
    }

    for (const t of expiring ?? []) {
      if (!t.owner_email) continue
      const sent = await sendPlanExpiringAlert({
        email: t.owner_email,
        tenantName: t.name,
        daysLeft,
        expiresAt: new Date(t.plan_expires_at),
        adminUrl: `${APP_URL}/login`,
      })
      if (sent) results.alerts_sent++
      else results.errors.push(`alert email falhou: ${t.name}`)
    }
  }

  // ── 2. active → grace: plano venceu mas ainda no prazo de carência ──────────
  const { data: expired, error: e1 } = await db
    .from('tenants')
    .select('id, name, plan_expires_at, grace_days')
    .eq('status', 'active')
    .lt('plan_expires_at', now.toISOString())

  if (e1) results.errors.push('active→grace: ' + e1.message)

  for (const t of expired ?? []) {
    const { error } = await db.from('tenants').update({ status: 'grace' }).eq('id', t.id)
    if (error) results.errors.push(`${t.name}: ${error.message}`)
    else results.active_to_grace++
  }

  // ── 3. grace → suspended: carência esgotada + expulsa do Telegram ───────────
  const { data: inGrace, error: e2 } = await db
    .from('tenants')
    .select('id, name, plan_expires_at, grace_days, tg_user_id')
    .eq('status', 'grace')

  if (e2) results.errors.push('grace→suspended: ' + e2.message)

  for (const t of inGrace ?? []) {
    const graceDays = t.grace_days ?? 5
    const deadline = new Date(t.plan_expires_at)
    deadline.setDate(deadline.getDate() + graceDays)
    if (now > deadline) {
      const { error } = await db.from('tenants').update({ status: 'suspended' }).eq('id', t.id)
      if (error) {
        results.errors.push(`${t.name}: ${error.message}`)
      } else {
        results.grace_to_suspended++
        // Expulsa do grupo Telegram se tiver tg_user_id registrado
        if (t.tg_user_id) {
          await kickFromTelegram(t.tg_user_id, t.name)
        }
      }
    }
  }

  // ── 4. trial → suspended: sem carência, expulsa imediato do Telegram ─────────
  const { data: expiredTrials, error: e3 } = await db
    .from('tenants')
    .select('id, name, tg_user_id')
    .eq('status', 'trial')
    .lt('plan_expires_at', now.toISOString())

  if (e3) results.errors.push('trial→suspended: ' + e3.message)

  for (const t of expiredTrials ?? []) {
    const { error } = await db.from('tenants').update({ status: 'suspended' }).eq('id', t.id)
    if (error) {
      results.errors.push(`trial ${t.name}: ${error.message}`)
    } else {
      results.trial_expired++
      if (t.tg_user_id) await kickFromTelegram(t.tg_user_id, t.name)
    }
  }

  console.log('[cron/plan-check]', results)
  return NextResponse.json({ ok: true, ...results, at: now.toISOString() })
}

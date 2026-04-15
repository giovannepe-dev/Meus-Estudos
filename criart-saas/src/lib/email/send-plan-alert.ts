import { Resend } from 'resend'

const FROM = 'CriArt Oficina Digital <noreply@criart.smlife.tech>'
const SUPPORT_WA = '(62) 99881-6808'

interface PlanAlertProps {
  email: string
  tenantName: string
  daysLeft: number
  expiresAt: Date
  adminUrl: string
}

export async function sendPlanExpiringAlert({
  email,
  tenantName,
  daysLeft,
  expiresAt,
  adminUrl,
}: PlanAlertProps) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const expiresFormatted = expiresAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const urgency = daysLeft === 1 ? 'alto' : daysLeft <= 3 ? 'medio' : 'baixo'
  const borderColor = urgency === 'alto' ? '#ef4444' : urgency === 'medio' ? '#f97316' : '#eab308'
  const bgColor = urgency === 'alto' ? '#fef2f2' : urgency === 'medio' ? '#fff7ed' : '#fefce8'

  const subject =
    daysLeft === 1
      ? `Ultimo dia de acesso — renove hoje (${tenantName})`
      : `Seu plano vence em ${daysLeft} dias — ${tenantName}`

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; }
  .container { max-width: 560px; margin: 0 auto; padding: 20px; background: #f9fafb; }
  .header { background: linear-gradient(135deg, #ea580c 0%, #d63e08 100%); color: white; padding: 28px 30px; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 22px; }
  .content { background: white; padding: 28px 30px; border-radius: 0 0 8px 8px; }
  .alert-box { background: ${bgColor}; border: 1.5px solid ${borderColor}; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
  .alert-title { font-weight: 700; color: ${borderColor}; font-size: 15px; margin-bottom: 8px; }
  .btn { display: inline-block; padding: 13px 28px; background: #ea580c; color: white !important; text-decoration: none; border-radius: 7px; font-weight: 700; font-size: 14px; margin-top: 20px; }
  .footer { color: #9ca3af; font-size: 11px; margin-top: 28px; padding-top: 18px; border-top: 1px solid #e5e7eb; text-align: center; }
  p { margin: 10px 0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Aviso de vencimento do plano</h1>
    <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">${esc(tenantName)}</p>
  </div>
  <div class="content">
    <p>Ola!</p>
    <p>Este é um aviso importante sobre o plano da sua empresa no CriArt Oficina Digital.</p>

    <div class="alert-box">
      <div class="alert-title">
        ${daysLeft === 1 ? 'Ultimo dia!' : `Faltam ${daysLeft} dias`}
      </div>
      <p style="margin:0;font-size:14px;color:#374151;">
        Seu plano vence em <strong>${expiresFormatted}</strong>.
        ${daysLeft === 1
          ? 'Apos hoje, o acesso ao painel e a vitrine serao suspensos automaticamente.'
          : `Renove antes dessa data para nao perder o acesso ao painel e a vitrine.`}
      </p>
    </div>

    <p>Para renovar, entre em contato pelo WhatsApp:</p>
    <p style="font-size:18px;font-weight:700;color:#111827;">${SUPPORT_WA}</p>

    <a href="${adminUrl}" class="btn">Acessar Painel Admin</a>

    <p style="margin-top:24px;font-size:13px;color:#6b7280;">
      Apos o vencimento, o sistema entra em periodo de carencia de 5 dias antes de suspender o acesso definitivamente.
    </p>

    <div class="footer">
      <p>Email automatico — nao responda.</p>
      <p>&copy; 2026 CriArt Oficina Digital. Todos os direitos reservados.</p>
    </div>
  </div>
</div>
</body>
</html>`,
    })

    if (result.error) {
      console.error(`[plan-alert] erro ao enviar para ${email}:`, result.error)
      return false
    }
    return true
  } catch (e) {
    console.error(`[plan-alert] exception para ${email}:`, e)
    return false
  }
}

function esc(text: string): string {
  return text.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] ?? c)
  )
}

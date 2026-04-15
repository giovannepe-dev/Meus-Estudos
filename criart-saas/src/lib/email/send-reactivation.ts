import { Resend } from 'resend'

interface ReactivationEmailProps {
  email: string
  tenantName: string
  adminUrl: string
  vitrineUrl: string
  planDays?: number
  planExpiresAt?: Date
  tgInviteLink?: string | null
}

export async function sendReactivationEmail(props: ReactivationEmailProps) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const result = await resend.emails.send({
      from: 'CriArt Oficina Digital <noreply@criart.smlife.tech>',
      to: props.email,
      subject: `Acesso reativado — ${props.tenantName}`,
      html: generateReactivationHTML(props),
    })

    if (result.error) {
      console.error('[reactivation-email] erro:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('[reactivation-email] erro:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

function generateReactivationHTML({
  tenantName,
  email,
  adminUrl,
  vitrineUrl,
  planDays,
  planExpiresAt,
  tgInviteLink,
}: ReactivationEmailProps): string {
  const expiresFormatted = planExpiresAt
    ? planExpiresAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const planBlock = planDays && expiresFormatted ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:18px;margin:24px 0;">
        <div style="font-weight:700;color:#15803d;font-size:15px;margin-bottom:12px;">Plano Renovado</div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:4px 0;width:130px;">Duração</td>
            <td style="font-size:14px;color:#111827;font-weight:600;">${planDays} dias</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:4px 0;">Válido até</td>
            <td style="font-size:14px;color:#111827;font-weight:600;">${expiresFormatted}</td>
          </tr>
        </table>
      </div>` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 6px 4px 6px 0; }
    .footer { color: #9ca3af; font-size: 11px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
    h2 { color: #1f2937; font-size: 17px; margin: 24px 0 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Acesso Reativado!</h1>
      <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9;">A empresa <strong>${escapeHtml(tenantName)}</strong> está ativa novamente</p>
    </div>

    <div class="content">
      <p>Olá!</p>
      <p>Seu acesso ao CriArt Oficina Digital foi reativado. Sua vitrine e painel admin estão disponíveis novamente.</p>

      ${planBlock}

      <h2>Acesse agora</h2>
      <div style="margin:16px 0;">
        <a href="${adminUrl}" class="button">Acessar Painel Admin</a>
        <a href="${vitrineUrl}" class="button" style="background:#6366f1;">Ver Vitrine</a>
      </div>

      ${tgInviteLink ? `
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:18px 20px;margin:24px 0;">
        <div style="font-weight:700;color:#0369a1;font-size:15px;margin-bottom:10px;">Grupo Oficina Digital no Telegram</div>
        <p style="margin:0 0 12px;font-size:14px;color:#374151;">
          Um novo link de acesso ao grupo foi gerado para você. Este link é único e só pode ser usado uma vez.
        </p>
        <a href="${tgInviteLink}" style="display:inline-block;padding:11px 24px;background:#229ed9;color:white;text-decoration:none;border-radius:7px;font-weight:700;font-size:14px;">
          Entrar no grupo do Telegram
        </a>
      </div>` : ''}

      <h2>Suporte</h2>
      <p>Dúvidas? Fale pelo WhatsApp: <strong>(62) 99881-6808</strong></p>

      <div class="footer">
        <p>Email automático — não responda.</p>
        <p>&copy; 2026 CriArt Oficina Digital. Todos os direitos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

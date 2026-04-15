import { Resend } from 'resend'

interface WelcomeEmailProps {
  email: string
  tenantName: string
  password: string
  vitrineUrl: string
  adminUrl: string
  planDays?: number
  planExpiresAt?: Date
  tgInviteLink?: string | null
}

export async function sendWelcomeEmail({
  email,
  tenantName,
  password,
  vitrineUrl,
  adminUrl,
  planDays,
  planExpiresAt,
  tgInviteLink,
}: WelcomeEmailProps) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const result = await resend.emails.send({
      from: 'CriArt Oficina Digital <noreply@criart.smlife.tech>',
      to: email,
      subject: `Bem-vindo ao CriArt Oficina Digital - ${tenantName}`,
      html: generateWelcomeHTML({
        tenantName,
        email,
        password,
        vitrineUrl,
        adminUrl,
        planDays,
        planExpiresAt,
        tgInviteLink,
      }),
    })

    if (result.error) {
      console.error('Erro ao enviar email:', result.error)
      return { success: false, error: result.error.message }
    }

    console.log('Email de boas-vindas enviado para:', email)
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

function generateWelcomeHTML({
  tenantName,
  email,
  password,
  vitrineUrl,
  adminUrl,
  planDays,
  planExpiresAt,
  tgInviteLink,
}: WelcomeEmailProps): string {
  const expiresFormatted = planExpiresAt
    ? planExpiresAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const isTrial = planDays === 1
  const expiresTime = planExpiresAt
    ? planExpiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  const planBlock = planDays && expiresFormatted ? `
      <div style="background:${isTrial ? '#fffbeb' : '#f0fdf4'};border:1px solid ${isTrial ? '#fde68a' : '#bbf7d0'};border-radius:8px;padding:18px;margin:24px 0;">
        <div style="font-weight:700;color:${isTrial ? '#92400e' : '#15803d'};font-size:15px;margin-bottom:12px;">
          ${isTrial ? '⏱️ Período de Teste' : 'Plano Contratado'}
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:4px 0;width:130px;">Duração</td>
            <td style="font-size:14px;color:#111827;font-weight:600;">${isTrial ? '24 horas de teste' : `${planDays} dias`}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#6b7280;padding:4px 0;">Válido até</td>
            <td style="font-size:14px;color:#111827;font-weight:600;">${expiresFormatted}${isTrial && expiresTime ? ` às ${expiresTime}` : ''}</td>
          </tr>
        </table>
        <p style="font-size:12px;color:#6b7280;margin:12px 0 0;">
          ${isTrial
            ? 'Aproveite as 24 horas para explorar tudo! Ao final do teste, o acesso é suspenso automaticamente. Para assinar, entre em contato pelo WhatsApp: (62) 99881-6808.'
            : 'Você receberá um aviso por email antes do vencimento. Após o prazo, o acesso é suspenso automaticamente. Para renovar, entre em contato pelo WhatsApp: (62) 99881-6808.'
          }
        </p>
      </div>` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: linear-gradient(135deg, #ea580c 0%, #d63e08 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
    .creds { background: #f3f4f6; border-left: 4px solid #ea580c; padding: 15px; margin: 12px 0; border-radius: 4px; }
    .creds-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: 600; }
    .creds-value { font-size: 15px; color: #1f2937; margin-top: 4px; word-break: break-all; font-family: monospace; }
    .button { display: inline-block; padding: 12px 24px; background: #ea580c; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 6px 4px 6px 0; }
    .info-box { background: #fef3c7; border: 1px solid #fde68a; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { color: #9ca3af; font-size: 11px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; }
    h2 { color: #1f2937; font-size: 17px; margin: 24px 0 8px; }
    ul, ol { padding-left: 20px; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bem-vindo ao CriArt Oficina Digital!</h1>
      <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9;">Sua empresa <strong>${escapeHtml(tenantName)}</strong> esta pronta</p>
    </div>

    <div class="content">
      <p>Ola!</p>
      <p>Sua empresa foi criada com sucesso. Aqui estao seus dados de acesso e informacoes do plano:</p>

      <h2>Credenciais de Acesso</h2>
      <div class="creds">
        <div class="creds-label">Email</div>
        <div class="creds-value">${escapeHtml(email)}</div>
      </div>
      <div class="creds">
        <div class="creds-label">Senha Temporaria</div>
        <div class="creds-value">${escapeHtml(password)}</div>
      </div>

      <div class="info-box">
        <strong>Importante:</strong> Altere sua senha no primeiro acesso em <strong>Configuracoes &rarr; Seguranca</strong>.
      </div>

      ${planBlock}

      <h2>Acesse agora</h2>
      <div style="margin:16px 0;">
        <a href="${adminUrl}" class="button">Acessar Painel Admin</a>
        <a href="${vitrineUrl}" class="button" style="background:#6366f1;">Ver Vitrine</a>
      </div>

      <h2>Proximos Passos</h2>
      <ol>
        <li>Faca login e configure o logo e cores da sua vitrine</li>
        <li>Adicione seus produtos e categorias</li>
        <li>Compartilhe o link da vitrine com seus clientes</li>
      </ol>

      ${tgInviteLink ? `
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:18px 20px;margin:24px 0;">
        <div style="font-weight:700;color:#0369a1;font-size:15px;margin-bottom:10px;">Grupo Oficina Digital no Telegram</div>
        <p style="margin:0 0 12px;font-size:14px;color:#374151;">
          Voce tem acesso ao grupo exclusivo de clientes no Telegram com dicas, novidades e suporte.
          Este link e unico e so pode ser usado uma vez.
        </p>
        <a href="${tgInviteLink}" style="display:inline-block;padding:11px 24px;background:#229ed9;color:white;text-decoration:none;border-radius:7px;font-weight:700;font-size:14px;">
          Entrar no grupo do Telegram
        </a>
      </div>` : ''}

      <h2>Suporte</h2>
      <p>Duvidas ou problemas? Fale pelo WhatsApp: <strong>(62) 99881-6808</strong></p>

      <div class="footer">
        <p>Email automatico — nao responda.</p>
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

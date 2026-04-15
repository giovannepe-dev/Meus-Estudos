import { Resend } from 'resend'

const FROM = 'CriArt Oficina Digital <noreply@criart.smlife.tech>'

interface AccessRequestData {
  nome: string
  empresa: string
  email: string
  whatsapp?: string | null
}

// Email para o admin master — avisa que chegou uma nova solicitação
export async function sendAccessRequestNotification(data: AccessRequestData) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const adminEmail = process.env.SUPERADMIN_EMAIL!

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: adminEmail,
      subject: `📩 Nova solicitação de acesso — ${data.empresa}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6; }
  .container { max-width: 580px; margin: 0 auto; padding: 20px; background: #f9fafb; }
  .card { background: white; border-radius: 10px; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #ea580c, #c2410c); color: white; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; }
  .header h1 { margin: 0; font-size: 20px; }
  .row { display: flex; gap: 8px; margin: 10px 0; }
  .label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; width: 90px; flex-shrink: 0; padding-top: 2px; }
  .value { font-size: 15px; color: #111827; font-weight: 500; }
  .btn { display: inline-block; padding: 12px 24px; background: #ea580c; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 20px; }
  .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 20px; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <h1>📩 Nova solicitação de acesso</h1>
      <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">Uma nova empresa quer entrar na plataforma</p>
    </div>
    <div class="row"><span class="label">Empresa</span><span class="value">${esc(data.empresa)}</span></div>
    <div class="row"><span class="label">Nome</span><span class="value">${esc(data.nome)}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">${esc(data.email)}</span></div>
    <div class="row"><span class="label">WhatsApp</span><span class="value">${data.whatsapp ? esc(data.whatsapp) : '—'}</span></div>
    <a href="https://laserpro.vercel.app/superadmin/solicitacoes" class="btn">Ver solicitações no painel →</a>
  </div>
  <div class="footer">CriArt Oficina Digital · email automático</div>
</div>
</body>
</html>`,
    })
    if (result.error) console.error('[access-request] notif error:', result.error)
    return !result.error
  } catch (e) {
    console.error('[access-request] notif exception:', e)
    return false
  }
}

// Email para quem solicitou — confirma que recebemos
export async function sendAccessRequestConfirmation(data: AccessRequestData) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: `✅ Solicitação recebida — CriArt Oficina Digital`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6; }
  .container { max-width: 580px; margin: 0 auto; padding: 20px; background: #f9fafb; }
  .card { background: white; border-radius: 10px; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #ea580c, #c2410c); color: white; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; }
  .header h1 { margin: 0; font-size: 20px; }
  .info-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0; }
  .footer { text-align: center; font-size: 11px; color: #9ca3af; margin-top: 20px; }
  p { margin: 10px 0; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <h1>✅ Solicitação recebida!</h1>
      <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">CriArt Oficina Digital</p>
    </div>
    <p>Olá, <strong>${esc(data.nome)}</strong>! 👋</p>
    <p>Recebemos a solicitação de acesso para a empresa <strong>${esc(data.empresa)}</strong> e já está em análise pela nossa equipe.</p>
    <div class="info-box">
      <strong>O que acontece agora?</strong><br>
      Nossa equipe vai analisar sua solicitação e em breve você receberá um email com suas credenciais de acesso à plataforma.
    </div>
    <p>Se tiver dúvidas, entre em contato pelo WhatsApp ou responda este email.</p>
    <p style="margin-top:24px;">Até logo! 🚀<br><strong>Equipe CriArt Oficina Digital</strong></p>
  </div>
  <div class="footer">CriArt Oficina Digital · email automático</div>
</div>
</body>
</html>`,
    })
    if (result.error) console.error('[access-request] confirm error:', result.error)
    return !result.error
  } catch (e) {
    console.error('[access-request] confirm exception:', e)
    return false
  }
}

function esc(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] ?? c))
}

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Acesso Suspenso — CriArt' }

interface Props {
  searchParams: Promise<{ trial?: string }>
}

export default async function AcessoSuspensoPge({ searchParams }: Props) {
  const { trial } = await searchParams
  const isTrial = trial === '1'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0b0f1c',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* Ícone */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: isTrial ? 'rgba(99,130,255,0.12)' : 'rgba(239,68,68,0.12)',
          border: `2px solid ${isTrial ? 'rgba(99,130,255,0.35)' : 'rgba(239,68,68,0.35)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px', fontSize: '36px',
        }}>
          {isTrial ? '⏱️' : '🔒'}
        </div>

        {isTrial ? (
          <>
            <p style={{ color: '#6382ff', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Período de teste encerrado
            </p>
            <h1 style={{ color: '#ffffff', fontSize: '26px', fontWeight: 700, marginBottom: '14px', lineHeight: 1.3 }}>
              Seu teste grátis acabou 🎉<br />Gostou do que viu?
            </h1>
            <p style={{ color: '#8898bb', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
              Sua vitrine, o catálogo e o acesso ao Telegram foram pausados.
              Para continuar usando, é só assinar o plano — <strong style={{ color: '#c8d4f0' }}>R$67/mês</strong> ou <strong style={{ color: '#c8d4f0' }}>R$500/ano</strong>.
            </p>

            <div style={{
              padding: '20px 24px', borderRadius: '16px',
              background: 'rgba(99,130,255,0.08)', border: '1px solid rgba(99,130,255,0.2)',
              marginBottom: '16px',
            }}>
              <p style={{ color: '#a0b4ff', fontSize: '13px', marginBottom: '14px', fontWeight: 600 }}>
                O que você continua tendo ao assinar:
              </p>
              {[
                '✅  Vitrine com sua marca no ar',
                '✅  +24.000 produtos no catálogo',
                '✅  Papelaria digital (429 temas)',
                '✅  Calculadora de orçamentos',
                '✅  Pedidos direto no WhatsApp',
                '✅  Acesso ao grupo Telegram',
              ].map(item => (
                <p key={item} style={{ color: '#c8d4f0', fontSize: '13px', textAlign: 'left', marginBottom: '6px' }}>{item}</p>
              ))}
            </div>

            <a
              href="https://wa.me/5562998816808?text=Ol%C3%A1%2C%20terminei%20o%20teste%20e%20quero%20assinar!"
              style={{
                display: 'block', padding: '14px 24px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6382ff, #7c4dff)',
                color: '#fff', fontWeight: 700, fontSize: '15px',
                textDecoration: 'none', marginBottom: '12px',
                boxShadow: '0 8px 24px rgba(99,130,255,0.35)',
              }}
            >
              Quero assinar agora →
            </a>

            <p style={{ color: '#3a4460', fontSize: '12px' }}>
              Fale pelo WhatsApp e ative em menos de 24h
            </p>
          </>
        ) : (
          <>
            <h1 style={{ color: '#ffffff', fontSize: '26px', fontWeight: 700, marginBottom: '14px', lineHeight: 1.3 }}>
              Sua conta está suspensa
            </h1>
            <p style={{ color: '#8898bb', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px' }}>
              O plano da sua loja expirou e o acesso ao painel foi suspenso.
              Entre em contato para reativar.
            </p>
            <div style={{
              padding: '20px 24px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '24px',
            }}>
              <p style={{ color: '#6b7fa3', fontSize: '13px', marginBottom: '12px' }}>
                Fale com o suporte via WhatsApp:
              </p>
              <a
                href="https://wa.me/5562998816808"
                style={{
                  display: 'inline-block', padding: '10px 24px', borderRadius: '8px',
                  background: '#25d366', color: '#fff', fontWeight: 600,
                  fontSize: '14px', textDecoration: 'none',
                }}
              >
                Falar no WhatsApp
              </a>
            </div>
            <a href="/login" style={{ color: '#3a4460', fontSize: '13px', textDecoration: 'none' }}>
              Voltar ao login
            </a>
          </>
        )}
      </div>
    </div>
  )
}

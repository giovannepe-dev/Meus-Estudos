'use client'

import { AlertCircle } from 'lucide-react'

export default function PlanExpiredPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--lp-base)',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--lp-red-pale)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <AlertCircle size={32} style={{ color: 'var(--lp-red)' }} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--lp-ink)',
          letterSpacing: '-0.02em',
          marginBottom: '12px',
        }}>
          Plano Expirado
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--lp-ink-3)', lineHeight: 1.7, marginBottom: '32px' }}>
          Seu período de acesso chegou ao fim. Entre em contato com o administrador da plataforma para renovar seu plano e voltar a usar o sistema.
        </p>

        <div style={{
          padding: '16px',
          background: 'var(--lp-surface)',
          border: '1px solid var(--lp-border)',
          borderRadius: '12px',
          fontSize: '14px',
          color: 'var(--lp-ink-3)',
        }}>
          Precisa de ajuda? Contate o suporte da CriArt Oficina Digital.
        </div>
      </div>
    </div>
  )
}

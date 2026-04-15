'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LaserIcon } from '@/components/shared/LaserIcon'
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ResetSenhaPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Informe seu e-mail'); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    setLoading(false)
    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço.')
      return
    }
    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lp-base)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #ea580c, #c2410c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(234,88,12,.35)',
          }}>
            <LaserIcon style={{ width: '18px', height: '18px', color: 'white' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em' }}>
            CriArt Oficina Digital
          </span>
        </div>

        {sent ? (
          /* Estado: e-mail enviado */
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--lp-success-pale)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle size={28} style={{ color: 'var(--lp-success)' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em', marginBottom: '10px' }}>
              E-mail enviado!
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', lineHeight: 1.6, marginBottom: '28px' }}>
              Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para redefinir sua senha.
            </p>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '14px', color: 'var(--lp-violet)', fontWeight: 600, textDecoration: 'none',
            }}>
              <ArrowLeft size={14} /> Voltar ao login
            </Link>
          </div>
        ) : (
          /* Formulário */
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                Esqueceu a senha?
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', lineHeight: 1.6 }}>
                Informe seu e-mail e enviaremos um link para você criar uma nova senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--lp-ink-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  E-mail
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-ink-4)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoFocus
                    style={{
                      width: '100%', padding: '11px 14px 11px 36px',
                      border: `1.5px solid ${error ? 'var(--lp-danger)' : 'var(--lp-border)'}`,
                      borderRadius: '10px', fontSize: '14px', color: 'var(--lp-ink)',
                      background: 'var(--lp-surface)', outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 150ms ease',
                    }}
                    onFocus={e => { if (!error) e.target.style.borderColor = 'var(--lp-violet)' }}
                    onBlur={e => { if (!error) e.target.style.borderColor = 'var(--lp-border)' }}
                  />
                </div>
                {error && <p style={{ fontSize: '12px', color: 'var(--lp-danger)', marginTop: '6px' }}>{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: 'var(--lp-ink-3)', textDecoration: 'none',
                transition: 'color 150ms',
              }}>
                <ArrowLeft size={13} /> Voltar ao login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

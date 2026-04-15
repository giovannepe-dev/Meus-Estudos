'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LaserIcon } from '@/components/shared/LaserIcon'
import { Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NovaSenhaPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.')
      return
    }

    setDone(true)
    setTimeout(() => router.push('/admin'), 2500)
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

        {done ? (
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
              Senha atualizada!
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', lineHeight: 1.6 }}>
              Redirecionando para o painel...
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                Criar nova senha
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', lineHeight: 1.6 }}>
                Escolha uma nova senha para sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Nova senha */}
              <div>
                <label style={labelStyle}>Nova senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-ink-4)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoFocus
                    required
                    style={{ ...inputStyle, paddingRight: '42px', borderColor: error ? 'var(--lp-danger)' : 'var(--lp-border)' }}
                    onFocus={e => { if (!error) e.target.style.borderColor = 'var(--lp-violet)' }}
                    onBlur={e => { if (!error) e.target.style.borderColor = 'var(--lp-border)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lp-ink-4)', display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirmar senha */}
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-ink-4)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repita a nova senha"
                    required
                    style={{ ...inputStyle, borderColor: error ? 'var(--lp-danger)' : 'var(--lp-border)' }}
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
                style={{ justifyContent: 'center', padding: '12px', marginTop: '4px' }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: 'var(--lp-ink-3)', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px 11px 36px',
  border: '1.5px solid var(--lp-border)',
  borderRadius: '10px', fontSize: '14px', color: 'var(--lp-ink)',
  background: 'var(--lp-surface)', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-body)', transition: 'border-color 150ms ease',
}

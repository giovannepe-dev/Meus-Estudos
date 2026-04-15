'use client'

import { useState } from 'react'
import { LaserIcon } from '@/components/shared/LaserIcon'
import { ArrowLeft, User, Mail, Building2, Phone, CheckCircle, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CadastroPage() {
  const [form, setForm] = useState({ nome: '', empresa: '', email: '', whatsapp: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/access-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)

    if (!res.ok) {
      setError('Não foi possível enviar a solicitação. Tente novamente.')
      return
    }

    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--lp-base)' }}>

      {/* Branding panel */}
      <div style={{
        display: 'none',
        width: '50%',
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        background: 'var(--lp-ink)',
      }}
        className="lg-flex"
      >
        <div style={{ position: 'absolute', inset: 0, opacity: .06,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.8) 1px, transparent 0)',
          backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', top: '33%', left: '25%', width: '384px', height: '384px',
          borderRadius: '50%', opacity: .2, filter: 'blur(64px)', background: 'var(--lp-violet)' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--lp-violet)', boxShadow: 'var(--shadow-violet)' }}>
            <LaserIcon style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
            CriArt Oficina Digital
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 800, color: 'white', lineHeight: 1.05, marginBottom: '16px' }}>
            Leve seu<br />
            negócio<br />
            <span style={{ color: 'var(--lp-violet-light)' }}>para o digital.</span>
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, maxWidth: '320px' }}>
            Catálogo online, vitrine profissional e gestão de produtos — tudo em um só lugar para quem trabalha com corte a laser.
          </p>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Catálogo de produtos com fotos de alta qualidade', 'Vitrine online pronta para compartilhar', 'Painel de gestão simples e rápido'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(234,88,12,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={11} color="#f97316" />
              </div>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

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
                Solicitação enviada!
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', lineHeight: 1.6, marginBottom: '28px' }}>
                Recebemos seu pedido de acesso. Nossa equipe entrará em contato em breve no e-mail <strong>{form.email}</strong>.
              </p>
              <Link href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '14px', color: 'var(--lp-violet)', fontWeight: 600, textDecoration: 'none',
              }}>
                <ArrowLeft size={14} /> Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: 'var(--lp-ink)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                  Solicitar acesso
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', lineHeight: 1.6 }}>
                  Preencha os dados abaixo e nossa equipe ativará sua conta.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Nome completo</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={iconStyle} />
                    <input name="nome" type="text" required value={form.nome} onChange={handleChange}
                      placeholder="Seu nome" autoFocus style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--lp-violet)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--lp-border)' }} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Nome da empresa</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={15} style={iconStyle} />
                    <input name="empresa" type="text" required value={form.empresa} onChange={handleChange}
                      placeholder="Nome do seu negócio" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--lp-violet)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--lp-border)' }} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>E-mail</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={iconStyle} />
                    <input name="email" type="email" required value={form.email} onChange={handleChange}
                      placeholder="seu@email.com" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--lp-violet)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--lp-border)' }} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>
                    WhatsApp <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={iconStyle} />
                    <input name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange}
                      placeholder="(11) 99999-9999" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--lp-violet)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--lp-border)' }} />
                  </div>
                </div>

                {error && (
                  <p style={{ fontSize: '13px', color: 'var(--lp-danger)', background: 'var(--lp-danger-pale, #FEF2F2)', padding: '10px 12px', borderRadius: '8px' }}>
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary"
                  style={{ justifyContent: 'center', padding: '12px', gap: '8px', marginTop: '4px' }}>
                  {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                  {loading ? 'Enviando...' : 'Enviar solicitação'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', color: 'var(--lp-ink-3)', textDecoration: 'none',
                }}>
                  <ArrowLeft size={13} /> Já tenho conta
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: 'var(--lp-ink-3)', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const iconStyle: React.CSSProperties = {
  position: 'absolute', left: '12px', top: '50%',
  transform: 'translateY(-50%)', color: 'var(--lp-ink-4)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px 11px 36px',
  border: '1.5px solid var(--lp-border)',
  borderRadius: '10px', fontSize: '14px', color: 'var(--lp-ink)',
  background: 'var(--lp-surface)', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-body)', transition: 'border-color 150ms ease',
}

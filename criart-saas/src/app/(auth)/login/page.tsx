import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { LaserIcon } from '@/components/shared/LaserIcon'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Entrar — CriArt Oficina Digital' }

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--lp-base)' }}>

      {/* Lado esquerdo — branding */}
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
            Sua vitrine<br />
            <span style={{ color: 'var(--lp-violet-light)' }}>premium</span><br />
            começa aqui.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, maxWidth: '320px' }}>
            Gerencie catálogos, produtos e orçamentos com uma plataforma feita para quem trabalha com precisão.
          </p>
        </div>

        <div style={{ position: 'relative', padding: '20px', borderRadius: '16px',
          border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)' }}>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', lineHeight: 1.6, marginBottom: '12px' }}>
            "Triplicamos os pedidos de orçamento depois de colocar o catálogo online."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(234,88,12,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: 'white' }}>
              AM
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>Ana Machado</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>Atelier Laser Criações</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--lp-violet)', boxShadow: 'var(--shadow-violet)' }}>
              <LaserIcon style={{ width: '16px', height: '16px', color: 'white' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
              CriArt Oficina Digital
            </span>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700,
              color: 'var(--lp-ink)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Bem-vindo de volta
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>
              Entre com sua conta para acessar o painel.
            </p>
          </div>

          <LoginForm />

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '24px' }}>
            Não tem conta?{' '}
            <Link href="/cadastro" style={{ color: 'var(--lp-violet)', fontWeight: 500, textDecoration: 'none' }}>
              Solicitar acesso
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

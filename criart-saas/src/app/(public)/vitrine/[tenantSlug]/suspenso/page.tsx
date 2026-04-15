import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface Props { params: Promise<{ tenantSlug: string }> }

export default async function VitrineSuspensaPage({ params }: Props) {
  const { tenantSlug } = await params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, settings')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) notFound()

  const settings = (tenant as any).settings
  const accentColor = settings?.cor_destaque ?? '#ea580c'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f0f',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
      }}>
        {/* Icone */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)',
          border: '2px solid rgba(239,68,68,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          fontSize: '36px',
        }}>
          🔒
        </div>

        {/* Nome da loja */}
        <p style={{
          color: accentColor,
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          {tenant.name}
        </p>

        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '16px',
          lineHeight: 1.3,
        }}>
          Loja temporariamente indisponível
        </h1>

        <p style={{
          color: '#9ca3af',
          fontSize: '15px',
          lineHeight: 1.7,
          marginBottom: '32px',
        }}>
          Esta loja está com o acesso suspenso no momento.
          Entre em contato com o proprietário para mais informações.
        </p>

        <div style={{
          padding: '16px 24px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#6b7280',
          fontSize: '13px',
        }}>
          Se você é o proprietário desta loja, acesse o painel administrativo para verificar o status do seu plano.
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, RefreshCw, Loader } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--lp-border)',
  borderRadius: '8px', fontSize: '14px', color: 'var(--lp-ink)',
  backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' as const,
}
const labelStyle = { fontSize: '13px', fontWeight: 600 as const, color: 'var(--lp-ink-2)', marginBottom: '8px', display: 'block' as const }

interface Props {
  initialNome?: string
  initialEmail?: string
}

export function CriarEmpresaClient({ initialNome = '', initialEmail = '' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    tenantName: initialNome,
    ownerEmail: initialEmail,
    ownerPassword: generatePassword(),
    planDays: 30,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao criar empresa'); setLoading(false); return }
      toast.success(`Empresa criada! Slug: ${data.slug}`)
      router.push('/superadmin/tenants')
    } catch {
      toast.error('Erro ao criar empresa')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
          Nova Empresa
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
          Cadastre uma nova empresa na plataforma
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Nome da Empresa <span style={{ color: 'var(--lp-red)' }}>*</span></label>
          <input type="text" required value={form.tenantName}
            onChange={e => setForm(p => ({ ...p, tenantName: e.target.value }))}
            placeholder="Ex: CriArt Oficina Digital Ltda" style={inputStyle} autoFocus />
        </div>

        <div>
          <label style={labelStyle}>E-mail do Responsável <span style={{ color: 'var(--lp-red)' }}>*</span></label>
          <input type="email" required value={form.ownerEmail}
            onChange={e => setForm(p => ({ ...p, ownerEmail: e.target.value }))}
            placeholder="contato@empresa.com" style={inputStyle} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Senha de acesso</label>
            <button type="button" onClick={() => setForm(p => ({ ...p, ownerPassword: generatePassword() }))}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--lp-violet)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              <RefreshCw size={13} /> Gerar nova
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type={showPassword ? 'text' : 'password'} readOnly value={form.ownerPassword}
              style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              style={{ padding: '10px', border: '1px solid var(--lp-border)', borderRadius: '8px', backgroundColor: 'var(--lp-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button type="button" onClick={() => { navigator.clipboard.writeText(form.ownerPassword); toast.success('Senha copiada!') }}
              style={{ padding: '10px 14px', border: '1px solid var(--lp-border)', borderRadius: '8px', backgroundColor: 'var(--lp-violet-pale)', color: 'var(--lp-violet)', cursor: 'pointer', fontWeight: 500, fontSize: '12px' }}>
              Copiar
            </button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Plano</label>
          <select value={form.planDays} onChange={e => setForm(p => ({ ...p, planDays: parseInt(e.target.value) }))} style={inputStyle}>
            <option value="1">⏱️ Trial — 1 dia de teste</option>
            <option value="30">30 dias</option>
            <option value="60">60 dias</option>
            <option value="90">90 dias</option>
            <option value="180">180 dias</option>
            <option value="365">365 dias (1 ano)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Link href="/superadmin/tenants" style={{ textDecoration: 'none', flex: 1 }}>
            <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Cancelar</button>
          </Link>
          <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            {loading && <Loader size={14} className="animate-spin" />}
            {loading ? 'Criando...' : 'Criar Empresa'}
          </button>
        </div>
      </form>
    </div>
  )
}

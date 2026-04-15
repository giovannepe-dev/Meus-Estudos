'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Users, Loader, X } from 'lucide-react'

interface Props {
  initialMembros: any[]
  tenantId: string
}

export function EquipeClient({ initialMembros, tenantId }: Props) {
  const [membros, setMembros] = useState(initialMembros)
  const [showModal, setShowModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nome: '', role: 'tenant_staff' })

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleOpenModal = () => {
    setForm({ email: '', password: generatePassword(), nome: '', role: 'tenant_staff' })
    setShowModal(true)
  }

  const handleInvite = async () => {
    if (!form.email.trim()) { toast.error('E-mail é obrigatório'); return }
    if (!form.password.trim() || form.password.length < 8) { toast.error('Senha deve ter pelo menos 8 caracteres'); return }

    setSending(true)
    const res = await fetch('/api/tenant/invite-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.trim(),
        password: form.password,
        nome: form.nome.trim() || null,
        role: form.role,
        tenantId,
      }),
    })
    const data = await res.json()
    setSending(false)

    if (!res.ok) { toast.error(data.error || 'Erro ao convidar membro'); return }

    toast.success('Membro convidado com sucesso!')
    setShowModal(false)
    // Reload membros
    const { data: { user } } = await (await import('@/lib/supabase/client')).createClient().auth.getUser()
    if (user) {
      const { data: updated } = await (await import('@/lib/supabase/client')).createClient()
        .from('tenant_users')
        .select('id, role, ativo, user:profiles(id, full_name, email)')
        .eq('tenant_id', tenantId)
        .eq('ativo', true)
        .order('created_at')
      setMembros(updated ?? [])
    }
  }

  const roleLabel = (role: string) => {
    if (role === 'tenant_admin') return 'Admin'
    if (role === 'tenant_staff') return 'Colaborador'
    return role
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--lp-border)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--lp-ink)',
    backgroundColor: 'var(--lp-surface)',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box' as const,
  }
  const labelStyle = { fontSize: '13px', fontWeight: 600 as const, color: 'var(--lp-ink-2)', marginBottom: '6px', display: 'block' as const }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            Equipe
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
            Gerencie os usuários da sua empresa
          </p>
        </div>
        <button onClick={handleOpenModal} className="btn-primary">
          <Plus size={16} /> Convidar membro
        </button>
      </div>

      {membros.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Users size={40} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>Nenhum membro na equipe</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {membros.map((m: any) => (
            <div key={m.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--lp-violet-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--lp-violet)' }}>
                  {(m.user?.full_name || '?')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: 'var(--lp-ink)', fontSize: '14px' }}>{m.user?.full_name || '(sem nome)'}</p>
                <p style={{ fontSize: '12px', color: 'var(--lp-ink-3)', fontStyle: m.user?.full_name ? 'normal' : 'italic' }}>{m.role === 'tenant_admin' ? 'Administrador' : 'Colaborador'}</p>
              </div>
              <span style={{
                padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                backgroundColor: m.role === 'tenant_admin' ? 'var(--lp-violet-pale)' : 'var(--lp-surface-2)',
                color: m.role === 'tenant_admin' ? 'var(--lp-violet)' : 'var(--lp-ink-3)',
              }}>
                {roleLabel(m.role)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal de convite */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px',
        }}>
          <div style={{ backgroundColor: 'var(--lp-base)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)' }}>Convidar membro</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lp-ink-3)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input type="text" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-mail <span style={{ color: 'var(--lp-red)' }}>*</span></label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="membro@empresa.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Senha de acesso <span style={{ color: 'var(--lp-red)' }}>*</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px' }} />
                  <button onClick={() => setForm(p => ({ ...p, password: generatePassword() }))} style={{ padding: '10px 12px', border: '1px solid var(--lp-border)', borderRadius: '8px', backgroundColor: 'var(--lp-surface)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: 'var(--lp-ink-2)', whiteSpace: 'nowrap' }}>
                    Gerar
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)', marginTop: '4px' }}>O membro poderá alterar a senha após o primeiro acesso.</p>
              </div>
              <div>
                <label style={labelStyle}>Cargo</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={inputStyle}>
                  <option value="tenant_staff">Colaborador</option>
                  <option value="tenant_admin">Administrador</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleInvite} disabled={sending} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {sending && <Loader size={14} className="animate-spin" />}
                {sending ? 'Convidando...' : 'Convidar'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

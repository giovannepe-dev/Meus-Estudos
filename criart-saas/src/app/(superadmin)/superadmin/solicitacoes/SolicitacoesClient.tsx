'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Mail, Phone, User, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AccessRequest {
  id: string
  nome: string
  empresa: string
  email: string
  whatsapp: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  notes: string | null
}

interface Props { initialRequests: AccessRequest[] }

export function SolicitacoesClient({ initialRequests }: Props) {
  const supabase = createClient()
  const [requests, setRequests] = useState<AccessRequest[]>(initialRequests)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [acting, setActing] = useState<string | null>(null)

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setActing(id)
    await supabase
      .from('access_requests')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setActing(null)
  }

  const statusBadge = (status: string) => {
    if (status === 'pending') return { label: 'Pendente', bg: 'var(--lp-amber-pale)', color: 'var(--lp-amber)' }
    if (status === 'approved') return { label: 'Aprovado', bg: 'var(--lp-success-pale)', color: 'var(--lp-success)' }
    return { label: 'Rejeitado', bg: 'var(--lp-red-pale, #FEF2F2)', color: 'var(--lp-danger)' }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            Solicitações de acesso
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
            {requests.length} solicitaç{requests.length !== 1 ? 'ões' : 'ão'} no total
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', background: 'var(--lp-surface)', border: '1.5px solid var(--lp-border)', borderRadius: '10px', padding: '4px' }}>
          {(['pending', 'all', 'approved', 'rejected'] as const).map(f => {
            const labels = { pending: 'Pendentes', all: 'Todas', approved: 'Aprovadas', rejected: 'Rejeitadas' }
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                background: filter === f ? 'var(--lp-violet)' : 'transparent',
                color: filter === f ? 'white' : 'var(--lp-ink-3)',
                transition: 'all 150ms',
              }}>
                {labels[f]}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
              </button>
            )
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <Clock size={32} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '8px' }}>
            Nenhuma solicitação {filter !== 'all' ? `"${filter === 'pending' ? 'pendente' : filter === 'approved' ? 'aprovada' : 'rejeitada'}"` : ''}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>
            As solicitações da página <strong>/cadastro</strong> aparecerão aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map(req => {
            const badge = statusBadge(req.status)
            const date = new Date(req.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
            return (
              <div key={req.id} className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #ea580c22, #c2410c22)',
                    border: '1.5px solid var(--lp-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 700, color: 'var(--lp-violet)',
                  }}>
                    {req.empresa.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--lp-ink)' }}>{req.empresa}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginLeft: 'auto' }}>{date}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--lp-ink-3)' }}>
                        <User size={12} /> {req.nome}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--lp-ink-3)' }}>
                        <Mail size={12} /> {req.email}
                      </span>
                      {req.whatsapp && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--lp-ink-3)' }}>
                          <Phone size={12} /> {req.whatsapp}
                        </span>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <Link
                        href={`/superadmin/tenants/novo?nome=${encodeURIComponent(req.empresa)}&email=${encodeURIComponent(req.email)}&requestId=${req.id}`}
                        onClick={() => updateStatus(req.id, 'approved')}
                        style={{ textDecoration: 'none' }}
                      >
                        <button style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: 'var(--lp-success-pale)', color: 'var(--lp-success)',
                          fontSize: '13px', fontWeight: 600,
                        }}>
                          <CheckCircle size={14} /> Aprovar
                          <ExternalLink size={12} style={{ opacity: .6 }} />
                        </button>
                      </Link>
                      <button
                        disabled={acting === req.id}
                        onClick={() => updateStatus(req.id, 'rejected')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 14px', borderRadius: '8px', border: '1.5px solid var(--lp-border)', cursor: 'pointer',
                          background: 'transparent', color: 'var(--lp-ink-3)',
                          fontSize: '13px', fontWeight: 600,
                          opacity: acting === req.id ? .5 : 1,
                        }}
                      >
                        <XCircle size={14} /> Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

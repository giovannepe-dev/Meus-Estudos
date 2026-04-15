'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { MessageSquare, ChevronDown, ChevronUp, Clock, Phone, User, Package } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { novo: 'Novo', lido: 'Lido', respondido: 'Respondido' }
const STATUS_COLOR: Record<string, string> = {
  novo: '#ea580c',
  lido: 'var(--lp-ink-3)',
  respondido: 'var(--lp-success)',
}
const STATUS_BG: Record<string, string> = {
  novo: 'rgba(234,88,12,.15)',
  lido: 'var(--lp-surface-2)',
  respondido: 'rgba(34,197,94,.12)',
}

interface Orcamento {
  id: string
  numero: string
  status: string
  itens: any[]
  total_estimado: number | null
  nome_cliente: string | null
  whatsapp_cliente: string | null
  observacao_geral: string | null
  created_at: string
}

interface Props {
  initialOrcamentos: Orcamento[]
}

const TABS = ['todos', 'novo', 'lido', 'respondido'] as const

export function OrcamentosClient({ initialOrcamentos }: Props) {
  const supabase = createClient()
  const [orcamentos, setOrcamentos] = useState(initialOrcamentos)

  useEffect(() => {
    const channel = supabase
      .channel('orcamentos-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tenant_orcamentos' }, payload => {
        const novo = payload.new as Orcamento
        setOrcamentos(prev => [novo, ...prev])
        toast('📋 Novo orçamento recebido!', {
          description: `${novo.numero} — ${novo.nome_cliente ?? 'Cliente anônimo'}`,
          duration: 8000,
          action: { label: 'Ver', onClick: () => setExpanded(prev => { const s = new Set(prev); s.add(novo.id); return s }) },
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])
  const [tab, setTab] = useState<typeof TABS[number]>('todos')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = tab === 'todos' ? orcamentos : orcamentos.filter(o => o.status === tab)
  const novos = orcamentos.filter(o => o.status === 'novo').length

  const toggleExpand = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('tenant_orcamentos').update({ status }).eq('id', id)
    if (error) { toast.error('Erro ao atualizar status'); return }
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const fmtDate = (s: string) =>
    new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            Orçamentos recebidos
          </h1>
          {novos > 0 && (
            <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: '#ea580c', color: 'white' }}>
              {novos} novo{novos > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>
          Solicitações enviadas pelos clientes na sua vitrine
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--lp-surface-2)', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 150ms',
              background: tab === t ? 'var(--lp-surface)' : 'transparent',
              color: tab === t ? 'var(--lp-ink)' : 'var(--lp-ink-3)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {t === 'todos' ? `Todos (${orcamentos.length})` : `${STATUS_LABEL[t]} ${orcamentos.filter(o => o.status === t).length > 0 ? `(${orcamentos.filter(o => o.status === t).length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <MessageSquare size={40} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600, color: 'var(--lp-ink)', marginBottom: '6px' }}>Nenhum orçamento aqui</p>
          <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)' }}>
            Os orçamentos enviados pelos clientes na vitrine aparecerão aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(orc => {
            const isOpen = expanded.has(orc.id)
            return (
              <div key={orc.id} className="card" style={{ overflow: 'hidden', borderLeft: `3px solid ${STATUS_COLOR[orc.status]}` }}>
                {/* Header do card */}
                <div
                  onClick={() => { toggleExpand(orc.id); if (orc.status === 'novo') updateStatus(orc.id, 'lido') }}
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--lp-ink)' }}>
                        {orc.numero}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                        background: STATUS_BG[orc.status], color: STATUS_COLOR[orc.status],
                      }}>
                        {STATUS_LABEL[orc.status]}
                      </span>
                      {orc.nome_cliente && (
                        <span style={{ fontSize: '13px', color: 'var(--lp-ink-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> {orc.nome_cliente}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--lp-ink-4)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Package size={11} /> {orc.itens.length} item{orc.itens.length !== 1 ? 's' : ''}
                      </span>
                      {orc.total_estimado != null && (
                        <span style={{ fontWeight: 600, color: '#ea580c' }}>{fmt(orc.total_estimado)}</span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {fmtDate(orc.created_at)}
                      </span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} style={{ color: 'var(--lp-ink-4)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--lp-ink-4)', flexShrink: 0 }} />}
                </div>

                {/* Detalhes expandidos */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--lp-border)', padding: '20px' }}>
                    {/* Itens */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lp-ink-4)', marginBottom: '10px' }}>
                        Itens do pedido
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {orc.itens.map((item: any, idx: number) => (
                          <div key={idx} style={{ padding: '12px', borderRadius: '8px', background: 'var(--lp-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)' }}>{item.product?.nome ?? 'Produto'}</p>
                              {item.observacao && (
                                <p style={{ fontSize: '12px', color: 'var(--lp-ink-3)', marginTop: '3px', fontStyle: 'italic' }}>
                                  "{item.observacao}"
                                </p>
                              )}
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink-2)', flexShrink: 0 }}>
                              × {item.quantidade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dados do cliente */}
                    {(orc.whatsapp_cliente || orc.observacao_geral) && (
                      <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'var(--lp-surface-2)' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--lp-ink-4)', marginBottom: '8px' }}>
                          Dados do cliente
                        </p>
                        {orc.whatsapp_cliente && (
                          <a
                            href={`https://wa.me/${orc.whatsapp_cliente.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#25D366', textDecoration: 'none', marginBottom: '6px' }}
                          >
                            <Phone size={13} /> {orc.whatsapp_cliente}
                          </a>
                        )}
                        {orc.observacao_geral && (
                          <p style={{ fontSize: '13px', color: 'var(--lp-ink-2)', fontStyle: 'italic' }}>"{orc.observacao_geral}"</p>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(['novo', 'lido', 'respondido'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(orc.id, s)}
                          disabled={orc.status === s}
                          style={{
                            padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                            border: `1px solid ${orc.status === s ? STATUS_COLOR[s] : 'var(--lp-border)'}`,
                            background: orc.status === s ? STATUS_BG[s] : 'transparent',
                            color: orc.status === s ? STATUS_COLOR[s] : 'var(--lp-ink-3)',
                            cursor: orc.status === s ? 'default' : 'pointer',
                          }}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                      {orc.whatsapp_cliente && (
                        <a
                          href={`https://wa.me/${orc.whatsapp_cliente.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Recebi seu orçamento ${orc.numero} e em breve retorno com mais informações.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: '#25D366', color: 'white', textDecoration: 'none' }}
                        >
                          Responder no WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

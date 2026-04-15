'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader, ExternalLink, Trash2, Lock, Unlock, X, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--lp-border)',
  borderRadius: '8px', fontSize: '14px', color: 'var(--lp-ink)',
  backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' as const,
}
const labelStyle = {
  fontSize: '13px', fontWeight: 600 as const, color: 'var(--lp-ink-2)',
  marginBottom: '6px', display: 'block' as const,
}
const sectionTitleStyle = {
  fontSize: '13px', fontWeight: 700 as const, color: 'var(--lp-ink-3)',
  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '16px',
}

interface TenantSettings {
  tenant_id: string
  nome_site?: string | null
  slogan?: string | null
  descricao?: string | null
  whatsapp?: string | null
  instagram?: string | null
  cor_destaque?: string | null
  vitrine_papelaria?: boolean | null
  vitrine_laser?: boolean | null
  [key: string]: unknown
}

interface Tenant {
  id: string
  name: string
  slug: string
  owner_email?: string | null
  status: string
  plan_days?: number | null
  plan_expires_at?: string | null
  [key: string]: unknown
}

interface Props {
  tenant: Tenant
  settings: TenantSettings | null
}

export function TenantDetailClient({ tenant: initialTenant, settings: initialSettings }: Props) {
  const supabase = createClient()
  const router = useRouter()

  // --- Informações Básicas ---
  const [basicForm, setBasicForm] = useState({
    name: initialTenant.name ?? '',
    slug: initialTenant.slug ?? '',
    owner_email: initialTenant.owner_email ?? '',
    status: initialTenant.status ?? 'active',
  })
  const [savingBasic, setSavingBasic] = useState(false)

  // --- Ações Perigosas ---
  const [blockConfirmModal, setBlockConfirmModal] = useState(false)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isBlocking, setIsBlocking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(initialTenant.status)

  // --- Plano ---
  const [planExpires, setPlanExpires] = useState(initialTenant.plan_expires_at ?? null)
  const [planDays, setPlanDays] = useState(initialTenant.plan_days ?? 0)
  const [extendDays, setExtendDays] = useState('')
  const [setDateValue, setSetDateValue] = useState(
    initialTenant.plan_expires_at ? initialTenant.plan_expires_at.split('T')[0] : ''
  )
  const [savingPlan, setSavingPlan] = useState(false)
  const [activatingTrial, setActivatingTrial] = useState(false)


  // --- Configurações ---
  const [settingsForm, setSettingsForm] = useState({
    nome_site: initialSettings?.nome_site ?? '',
    slogan: initialSettings?.slogan ?? '',
    descricao: initialSettings?.descricao ?? '',
    whatsapp: initialSettings?.whatsapp ?? '',
    instagram: initialSettings?.instagram ?? '',
    cor_destaque: initialSettings?.cor_destaque ?? '#ea580c',
    vitrine_papelaria: initialSettings?.vitrine_papelaria ?? true,
    vitrine_laser: initialSettings?.vitrine_laser ?? true,
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // ---- Handlers ----

  async function saveBasic() {
    setSavingBasic(true)
    const { error } = await supabase
      .from('tenants')
      .update({
        name: basicForm.name,
        slug: basicForm.slug,
        owner_email: basicForm.owner_email,
        status: basicForm.status,
      })
      .eq('id', initialTenant.id)
    setSavingBasic(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success('Informações básicas salvas!')
  }

  async function savePlanExtend() {
    const days = parseInt(extendDays)
    if (!days || days <= 0) { toast.error('Informe um número de dias válido'); return }
    setSavingPlan(true)
    const base = planExpires ? new Date(planExpires) : new Date()
    base.setDate(base.getDate() + days)
    const newDate = base.toISOString()
    const { error } = await supabase
      .from('tenants')
      .update({ plan_expires_at: newDate })
      .eq('id', initialTenant.id)
    setSavingPlan(false)
    if (error) { toast.error('Erro ao estender plano: ' + error.message); return }
    setPlanExpires(newDate)
    setSetDateValue(newDate.split('T')[0])
    setExtendDays('')
    toast.success(`Plano estendido por ${days} dias!`)
  }

  async function savePlanDate() {
    if (!setDateValue) { toast.error('Informe uma data válida'); return }
    setSavingPlan(true)
    const newDate = new Date(setDateValue + 'T12:00:00').toISOString()
    const { error } = await supabase
      .from('tenants')
      .update({ plan_expires_at: newDate })
      .eq('id', initialTenant.id)
    setSavingPlan(false)
    if (error) { toast.error('Erro ao salvar data: ' + error.message); return }
    setPlanExpires(newDate)
    toast.success('Data de expiração atualizada!')
  }

  async function renewPlan(days: number) {
    setSavingPlan(true)
    const now = new Date()
    const expires = new Date()
    expires.setDate(expires.getDate() + days)

    // 1. Atualiza status e datas no banco
    const { error } = await supabase
      .from('tenants')
      .update({
        plan_expires_at: expires.toISOString(),
        plan_days: days,
        plan_activated_at: now.toISOString(),
        status: 'active',
      })
      .eq('id', initialTenant.id)

    if (error) {
      setSavingPlan(false)
      toast.error('Erro ao renovar plano: ' + error.message)
      return
    }

    // 2. Gera novo invite Telegram + envia email de reativação
    try {
      await fetch('/api/superadmin/reactivate-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: initialTenant.id,
          tenant_slug: initialTenant.slug,
          owner_email: initialTenant.owner_email,
          tenant_name: initialTenant.name,
          plan_days: days,
          plan_expires_at: expires.toISOString(),
        }),
      })
    } catch (e) {
      console.error('Erro ao gerar invite/email de reativação:', e)
    }

    setSavingPlan(false)
    setPlanExpires(expires.toISOString())
    setPlanDays(days)
    setSetDateValue(expires.toISOString().split('T')[0])
    setCurrentStatus('active')
    toast.success(`Plano renovado por ${days} dias! Email enviado ao cliente.`)
  }

  async function saveSettings() {
    setSavingSettings(true)
    const { error } = await supabase
      .from('tenant_settings')
      .update({
        nome_site: settingsForm.nome_site || null,
        slogan: settingsForm.slogan || null,
        descricao: settingsForm.descricao || null,
        whatsapp: settingsForm.whatsapp || null,
        instagram: settingsForm.instagram || null,
        cor_destaque: settingsForm.cor_destaque || null,
        vitrine_papelaria: settingsForm.vitrine_papelaria,
        vitrine_laser: settingsForm.vitrine_laser,
      })
      .eq('tenant_id', initialTenant.id)
    setSavingSettings(false)
    if (error) { toast.error('Erro ao salvar configurações: ' + error.message); return }
    toast.success('Configurações salvas!')
  }

  async function blockTenant() {
    setIsBlocking(true)
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const { error } = await supabase
      .from('tenants')
      .update({ status: newStatus })
      .eq('id', initialTenant.id)
    setIsBlocking(false)
    if (error) { toast.error('Erro ao atualizar status: ' + error.message); return }
    setCurrentStatus(newStatus)
    setBlockConfirmModal(false)
    toast.success(newStatus === 'suspended' ? 'Empresa bloqueada! Dados mantidos.' : 'Empresa desbloqueada!')
  }

  async function activateTrial() {
    setActivatingTrial(true)
    const expires = new Date()
    expires.setDate(expires.getDate() + 1) // 1 dia
    const now = new Date()

    const { error } = await supabase
      .from('tenants')
      .update({
        status: 'trial',
        is_trial: true,
        plan_days: 1,
        plan_expires_at: expires.toISOString(),
        plan_activated_at: now.toISOString(),
      })
      .eq('id', initialTenant.id)

    if (error) {
      setActivatingTrial(false)
      toast.error('Erro ao ativar trial: ' + error.message)
      return
    }

    // Gera invite Telegram + envia email de boas-vindas
    try {
      await fetch('/api/superadmin/reactivate-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: initialTenant.id,
          tenant_slug: initialTenant.slug,
          owner_email: initialTenant.owner_email,
          tenant_name: initialTenant.name,
          plan_days: 1,
          plan_expires_at: expires.toISOString(),
        }),
      })
    } catch (e) {
      console.error('Erro ao gerar invite/email trial:', e)
    }

    setActivatingTrial(false)
    setPlanExpires(expires.toISOString())
    setPlanDays(1)
    setSetDateValue(expires.toISOString().split('T')[0])
    setCurrentStatus('trial')
    toast.success('Trial de 1 dia ativado! Invite Telegram gerado e email enviado.')
  }

  async function deleteTenant() {
    if (deleteConfirmText !== basicForm.name) {
      toast.error('Nome da empresa não corresponde')
      return
    }
    setIsDeleting(true)
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', initialTenant.id)
    setIsDeleting(false)
    if (error) { toast.error('Erro ao deletar: ' + error.message); return }
    toast.success('Empresa deletada permanentemente!')
    setTimeout(() => router.push('/superadmin/tenants'), 1000)
  }

  const formattedExpires = planExpires
    ? new Date(planExpires).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Sem expiração definida'

  return (
    <div style={{ maxWidth: '700px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Link
          href="/superadmin/tenants"
          style={{ display: 'flex', alignItems: 'center', color: 'var(--lp-ink-3)', textDecoration: 'none' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
            {settingsForm.nome_site || basicForm.name}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)', marginTop: '2px' }}>/{basicForm.slug}</p>
        </div>
        <a
          href={`/vitrine/${initialTenant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
        >
          <ExternalLink size={14} /> Abrir Vitrine
        </a>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>

        {/* Informações Básicas */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={sectionTitleStyle}>Informações Básicas</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input
                type="text"
                value={basicForm.name}
                onChange={e => setBasicForm(p => ({ ...p, name: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Slug
                <span style={{ fontWeight: 400, color: 'var(--lp-amber)', marginLeft: '8px', fontSize: '11px' }}>
                  ⚠ Mudar o slug quebra a URL da vitrine
                </span>
              </label>
              <input
                type="text"
                value={basicForm.slug}
                onChange={e => setBasicForm(p => ({ ...p, slug: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>E-mail do Responsável</label>
              <input
                type="text"
                value={basicForm.owner_email}
                onChange={e => setBasicForm(p => ({ ...p, owner_email: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={basicForm.status}
                onChange={e => setBasicForm(p => ({ ...p, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="active">Ativa</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspensa</option>
                <option value="inactive">Inativa</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={saveBasic}
              disabled={savingBasic}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {savingBasic && <Loader size={13} className="animate-spin" />}
              {savingBasic ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Plano */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={sectionTitleStyle}>Plano</h2>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', padding: '12px 14px', backgroundColor: 'var(--lp-surface-2)', borderRadius: '8px' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--lp-ink-3)', margin: '0 0 2px 0' }}>Dias do plano</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-ink)', margin: 0 }}>{planDays ?? '—'}</p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--lp-ink-3)', margin: '0 0 2px 0' }}>Expira em</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--lp-ink)', margin: 0 }}>{formattedExpires}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {/* Adicionar dias */}
            <div>
              <label style={labelStyle}>Adicionar dias ao plano atual</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  value={extendDays}
                  onChange={e => setExtendDays(e.target.value)}
                  placeholder="Ex: 30"
                  style={{ ...inputStyle, width: 'auto', flex: 1 }}
                />
                <button
                  onClick={savePlanExtend}
                  disabled={savingPlan}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  {savingPlan && <Loader size={13} className="animate-spin" />}
                  Estender
                </button>
              </div>
            </div>

            {/* Definir data exata */}
            <div>
              <label style={labelStyle}>Definir data de expiração</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="date"
                  value={setDateValue}
                  onChange={e => setSetDateValue(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', flex: 1 }}
                />
                <button
                  onClick={savePlanDate}
                  disabled={savingPlan}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  {savingPlan && <Loader size={13} className="animate-spin" />}
                  Salvar data
                </button>
              </div>
            </div>

            {/* Atalhos rápidos */}
            <div>
              <label style={labelStyle}>Renovação rápida (a partir de hoje)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => renewPlan(30)}
                  disabled={savingPlan}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {savingPlan && <Loader size={13} className="animate-spin" />}
                  Renovar 30 dias
                </button>
                <button
                  onClick={() => renewPlan(365)}
                  disabled={savingPlan}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {savingPlan && <Loader size={13} className="animate-spin" />}
                  Renovar 365 dias
                </button>
              </div>
            </div>

            {/* Trial */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--lp-border)' }}>
              <label style={labelStyle}>Período de teste</label>
              <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginBottom: '10px' }}>
                Ativa acesso completo por 1 dia — ao expirar, expulsa do Telegram automaticamente e exibe tela de upgrade.
              </p>
              <button
                onClick={activateTrial}
                disabled={activatingTrial}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--lp-amber)',
                  backgroundColor: 'rgba(251,191,36,0.08)', color: 'var(--lp-amber)',
                  fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                }}
              >
                {activatingTrial ? <Loader size={13} className="animate-spin" /> : <FlaskConical size={13} />}
                {activatingTrial ? 'Ativando...' : 'Ativar Trial 1 dia'}
              </button>
            </div>
          </div>
        </div>

        {/* Configurações */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={sectionTitleStyle}>Configurações</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Nome do Site</label>
              <input
                type="text"
                value={settingsForm.nome_site}
                onChange={e => setSettingsForm(p => ({ ...p, nome_site: e.target.value }))}
                placeholder="Nome exibido na vitrine"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Slogan</label>
              <input
                type="text"
                value={settingsForm.slogan}
                onChange={e => setSettingsForm(p => ({ ...p, slogan: e.target.value }))}
                placeholder="Frase de destaque"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Descrição</label>
              <textarea
                value={settingsForm.descricao}
                onChange={e => setSettingsForm(p => ({ ...p, descricao: e.target.value }))}
                placeholder="Descrição da empresa"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input
                type="text"
                value={settingsForm.whatsapp}
                onChange={e => setSettingsForm(p => ({ ...p, whatsapp: e.target.value }))}
                placeholder="5511999999999"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Instagram</label>
              <input
                type="text"
                value={settingsForm.instagram}
                onChange={e => setSettingsForm(p => ({ ...p, instagram: e.target.value }))}
                placeholder="sem o @"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Cor de Destaque</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={settingsForm.cor_destaque}
                  onChange={e => setSettingsForm(p => ({ ...p, cor_destaque: e.target.value }))}
                  style={{ width: '40px', height: '40px', padding: '2px', border: '1px solid var(--lp-border)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--lp-surface)' }}
                />
                <input
                  type="text"
                  value={settingsForm.cor_destaque}
                  onChange={e => setSettingsForm(p => ({ ...p, cor_destaque: e.target.value }))}
                  placeholder="#ea580c"
                  style={{ ...inputStyle, width: '130px', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            {/* Vitrines */}
            <div>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Vitrines Ativas</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {([
                  { key: 'vitrine_laser', label: 'Vitrine Laser', desc: 'Catálogo de produtos a laser' },
                  { key: 'vitrine_papelaria', label: 'Vitrine Papelaria', desc: 'Catálogo de papelaria e kits' },
                ] as const).map(({ key, label, desc }) => {
                  const on = settingsForm[key]
                  return (
                    <div
                      key={key}
                      onClick={() => setSettingsForm(p => ({ ...p, [key]: !p[key] }))}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                        background: on ? 'rgba(34,197,94,0.07)' : 'var(--lp-surface-2)',
                        border: `1.5px solid ${on ? 'rgba(34,197,94,0.3)' : 'var(--lp-border)'}`,
                        transition: 'all 150ms',
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--lp-ink)' }}>{label}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--lp-ink-4)' }}>{desc}</p>
                      </div>
                      {/* Switch */}
                      <div style={{
                        width: '40px', height: '22px', borderRadius: '11px',
                        backgroundColor: on ? '#22c55e' : 'var(--lp-ink-4)',
                        position: 'relative', transition: 'background 200ms', flexShrink: 0,
                      }}>
                        <div style={{
                          position: 'absolute', top: '3px', width: '16px', height: '16px',
                          borderRadius: '50%', backgroundColor: 'white',
                          left: on ? '21px' : '3px', transition: 'left 200ms',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {savingSettings && <Loader size={13} className="animate-spin" />}
              {savingSettings ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>


        {/* Ações Perigosas */}
        <div className="card" style={{ padding: '20px', borderColor: 'var(--lp-red-pale)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
          <h2 style={{ ...sectionTitleStyle, color: 'var(--lp-red)' }}>⚠️ Ações Perigosas</h2>
          <p style={{ fontSize: '13px', color: 'var(--lp-ink-3)', marginBottom: '16px' }}>
            {currentStatus === 'suspended' ? 'Esta empresa está bloqueada. Todos os dados foram mantidos.' : 'Use essas opções com cuidado. Os dados não podem ser recuperados.'}
          </p>
          <div style={{ display: 'grid', gap: '10px' }}>
            <button
              onClick={() => setBlockConfirmModal(true)}
              disabled={isBlocking}
              style={{
                padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                border: '1.5px solid var(--lp-red)', background: currentStatus === 'suspended' ? 'var(--lp-success-pale)' : 'var(--lp-red-pale)',
                color: currentStatus === 'suspended' ? 'var(--lp-success)' : 'var(--lp-red)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
              }}
            >
              {currentStatus === 'suspended' ? <Unlock size={16} /> : <Lock size={16} />}
              {isBlocking && <Loader size={14} className="animate-spin" />}
              {currentStatus === 'suspended' ? 'Desbloquear Empresa' : 'Bloquear Empresa'}
            </button>
            <button
              onClick={() => setDeleteConfirmModal(true)}
              style={{
                padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                border: '1.5px solid var(--lp-red)', background: 'var(--lp-red-pale)',
                color: 'var(--lp-red)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
              }}
            >
              <Trash2 size={16} />
              Deletar Empresa Permanentemente
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Confirmar Bloqueio */}
      {blockConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={() => setBlockConfirmModal(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', backgroundColor: 'var(--lp-surface)', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', border: '1px solid var(--lp-border)', padding: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)', marginBottom: '8px' }}>
              {currentStatus === 'suspended' ? 'Desbloquear Empresa' : 'Bloquear Empresa'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginBottom: '20px', lineHeight: 1.5 }}>
              {currentStatus === 'suspended'
                ? 'Tem certeza que quer desbloquear esta empresa? Ela voltará a ter acesso à plataforma.'
                : 'Tem certeza que quer bloquear esta empresa? Todos os seus dados serão mantidos, mas ela não terá mais acesso.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setBlockConfirmModal(false)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--lp-border)', background: 'var(--lp-surface)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink-2)' }}
              >
                Cancelar
              </button>
              <button
                onClick={blockTenant}
                disabled={isBlocking}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: 'none',
                  background: currentStatus === 'suspended' ? 'var(--lp-success)' : 'var(--lp-red)',
                  color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {isBlocking && <Loader size={13} className="animate-spin" />}
                {currentStatus === 'suspended' ? 'Desbloquear' : 'Bloquear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Deleção */}
      {deleteConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={() => setDeleteConfirmModal(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', backgroundColor: 'var(--lp-surface)', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', border: '1px solid var(--lp-border)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-red)', margin: 0 }}>
                ⚠️ Deletar Permanentemente
              </h2>
              <button
                onClick={() => setDeleteConfirmModal(false)}
                style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--lp-ink-3)' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginBottom: '16px', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--lp-red)' }}>Esta ação não pode ser desfeita.</strong> Toda a empresa e seus dados serão deletados permanentemente. Confirme digitando o nome da empresa:
            </p>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginBottom: '6px' }}>Nome da empresa (exato):</p>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--lp-ink)', padding: '10px 12px', background: 'var(--lp-surface-2)', borderRadius: '8px', margin: '6px 0 12px 0' }}>
                {basicForm.name}
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Digite exatamente..."
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setDeleteConfirmModal(false); setDeleteConfirmText('') }}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--lp-border)', background: 'var(--lp-surface)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink-2)' }}
              >
                Cancelar
              </button>
              <button
                onClick={deleteTenant}
                disabled={isDeleting || deleteConfirmText !== basicForm.name}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: 'none',
                  background: deleteConfirmText !== basicForm.name ? 'var(--lp-ink-4)' : 'var(--lp-red)',
                  color: 'white', cursor: deleteConfirmText !== basicForm.name ? 'default' : 'pointer',
                  fontSize: '14px', fontWeight: 600, opacity: deleteConfirmText !== basicForm.name ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {isDeleting && <Loader size={13} className="animate-spin" />}
                Deletar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

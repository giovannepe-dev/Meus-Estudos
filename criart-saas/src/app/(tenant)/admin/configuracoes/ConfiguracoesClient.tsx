'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import NextImage from 'next/image'
import { Loader, Upload, Eye, EyeOff, Lock } from 'lucide-react'

interface Props {
  initialTenant: Record<string, any>
  initialSettings: Record<string, any>
  initialProfile: Record<string, any>
}

export function ConfiguracoesClient({ initialTenant, initialSettings, initialProfile }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState(initialSettings)
  const [profile, setProfile] = useState(initialProfile)
  const [activeTab, setActiveTab] = useState<'perfil' | 'empresa' | 'redes' | 'seguranca'>('perfil')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password change state
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleSaveProfile = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name })
      .eq('id', profile.id)
    setLoading(false)
    if (error) toast.error('Erro ao salvar perfil')
    else toast.success('Perfil atualizado!')
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/tenant/upload-logo', { method: 'POST', body: formData })
    const data = await res.json()
    setUploadingLogo(false)
    if (!res.ok) { toast.error(data.error || 'Erro ao enviar logo'); return }
    setSettings((prev: any) => ({ ...prev, logo_url: data.url }))
    toast.success('Logo atualizada!')
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('tenant_settings')
      .update({
        nome_site: settings.nome_site,
        slogan: settings.slogan,
        whatsapp: settings.whatsapp,
        instagram: settings.instagram,
        cnpj: settings.cnpj,
      })
      .eq('id', settings.id)
    setLoading(false)
    if (error) toast.error('Erro ao salvar configurações')
    else toast.success('Configurações atualizadas!')
  }

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.current) {
      toast.error('Digite sua senha atual')
      return
    }
    if (!passwordForm.new) {
      toast.error('Digite uma nova senha')
      return
    }
    if (passwordForm.new.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('As senhas não conferem')
      return
    }
    if (passwordForm.current === passwordForm.new) {
      toast.error('A nova senha deve ser diferente da atual')
      return
    }

    setPasswordLoading(true)

    // First verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      toast.error('Erro ao obter dados do usuário')
      setPasswordLoading(false)
      return
    }

    // Try to sign in with current credentials to verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.current,
    })

    if (signInError) {
      toast.error('Senha atual incorreta')
      setPasswordLoading(false)
      return
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordForm.new,
    })

    setPasswordLoading(false)

    if (updateError) {
      toast.error(updateError.message || 'Erro ao alterar senha')
      return
    }

    toast.success('Senha alterada com sucesso!')
    setPasswordForm({ current: '', new: '', confirm: '' })
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--lp-border)',
    borderRadius: '8px', fontSize: '14px', color: 'var(--lp-ink)',
    backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)',
  }

  const labelStyle = { fontSize: '13px', fontWeight: 600 as const, color: 'var(--lp-ink-2)', marginBottom: '8px', display: 'block' as const }

  const saveBtn = (label: string) => (
    <button
      onClick={handleSaveSettings}
      disabled={loading}
      style={{
        padding: '10px 16px', backgroundColor: 'var(--lp-violet)', color: 'white',
        border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', alignSelf: 'flex-start',
      }}
    >
      {loading && <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {loading ? 'Salvando...' : label}
    </button>
  )

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
          Configurações
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
          Gerencie seu perfil, empresa e redes sociais
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--lp-border)', marginBottom: '24px' }}>
        {(['perfil', 'empresa', 'redes', 'seguranca'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '12px 16px', border: 'none', backgroundColor: 'transparent',
            color: activeTab === tab ? 'var(--lp-violet)' : 'var(--lp-ink-3)',
            fontWeight: activeTab === tab ? 600 : 500, fontSize: '14px', cursor: 'pointer',
            borderBottom: activeTab === tab ? '2px solid var(--lp-violet)' : 'none', marginBottom: '-1px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {tab === 'seguranca' && <Lock size={14} />}
            {tab === 'perfil' ? 'Perfil' : tab === 'empresa' ? 'Empresa' : tab === 'redes' ? 'Redes Sociais' : 'Segurança'}
          </button>
        ))}
      </div>

      {/* Aba Perfil */}
      {activeTab === 'perfil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Nome Completo</label>
            <input type="text" value={profile.full_name || ''} onChange={e => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" value={profile.email || ''} disabled style={{ ...inputStyle, color: 'var(--lp-ink-4)', backgroundColor: 'var(--lp-surface-2)' }} />
            <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginTop: '4px' }}>E-mail não pode ser alterado</p>
          </div>
          <button onClick={handleSaveProfile} disabled={loading} style={{
            padding: '10px 16px', backgroundColor: 'var(--lp-violet)', color: 'white',
            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', alignSelf: 'flex-start',
          }}>
            {loading && <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </div>
      )}

      {/* Aba Empresa */}
      {activeTab === 'empresa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Nome da Empresa</label>
            <input type="text" value={settings.nome_site || ''} onChange={e => setSettings((p: any) => ({ ...p, nome_site: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>CNPJ (opcional)</label>
            <input type="text" value={settings.cnpj || ''} onChange={e => setSettings((p: any) => ({ ...p, cnpj: e.target.value }))} style={inputStyle} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label style={labelStyle}>Slogan</label>
            <textarea value={settings.slogan || ''} onChange={e => setSettings((p: any) => ({ ...p, slogan: e.target.value }))} style={{ ...inputStyle, minHeight: '80px', resize: 'none' } as any} placeholder="Descrição curta da sua empresa" />
          </div>
          <div>
            <label style={labelStyle}>Logo da Empresa</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {settings.logo_url ? (
                <NextImage src={settings.logo_url} alt="Logo" width={64} height={64} style={{ objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--lp-border)', background: 'white', padding: '4px' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', border: '1px dashed var(--lp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lp-surface-2)' }}>
                  <Upload size={20} style={{ color: 'var(--lp-ink-4)' }} />
                </div>
              )}
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo} style={{
                  padding: '8px 14px', border: '1px solid var(--lp-border)', borderRadius: '8px',
                  backgroundColor: 'var(--lp-surface)', cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 500, color: 'var(--lp-ink-2)', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {uploadingLogo ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                  {uploadingLogo ? 'Enviando...' : 'Escolher imagem'}
                </button>
                <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)', marginTop: '4px' }}>PNG, JPG ou SVG. Máx 2MB.</p>
              </div>
            </div>
          </div>
          {saveBtn('Salvar Empresa')}
        </div>
      )}

      {/* Aba Redes Sociais */}
      {activeTab === 'redes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>WhatsApp</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ padding: '10px 12px', backgroundColor: 'var(--lp-surface-2)', borderRadius: '8px 0 0 8px', fontSize: '14px', color: 'var(--lp-ink-3)' }}>+55</span>
              <input type="text" value={settings.whatsapp?.replace(/^\+55/, '') || ''} onChange={e => setSettings((p: any) => ({ ...p, whatsapp: `+55${e.target.value}` }))} style={{ ...inputStyle, borderRadius: '0 8px 8px 0' }} placeholder="85999999999" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Instagram</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ padding: '10px 12px', backgroundColor: 'var(--lp-surface-2)', borderRadius: '8px 0 0 8px', fontSize: '14px', color: 'var(--lp-ink-3)' }}>@</span>
              <input type="text" value={settings.instagram || ''} onChange={e => setSettings((p: any) => ({ ...p, instagram: e.target.value }))} style={{ ...inputStyle, borderRadius: '0 8px 8px 0' }} placeholder="seu_usuario" />
            </div>
          </div>
          {saveBtn('Salvar Redes Sociais')}
        </div>
      )}

      {/* Aba Segurança */}
      {activeTab === 'seguranca' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', color: 'var(--lp-ink)', margin: '0' }}>
              🔒 Altere sua senha de acesso regularmente para manter sua conta segura.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Senha Atual</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.current}
                onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                style={inputStyle}
                placeholder="Digite sua senha atual"
              />
              <button
                onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: 'var(--lp-ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nova Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.new}
                onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                style={inputStyle}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: 'var(--lp-ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', marginTop: '4px' }}>
              Use uma combinação de letras, números e caracteres especiais para melhor segurança
            </p>
          </div>

          <div>
            <label style={labelStyle}>Confirmar Nova Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirm}
                onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                style={inputStyle}
                placeholder="Confirme a nova senha"
              />
              <button
                onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: 'var(--lp-ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={passwordLoading}
            style={{
              padding: '10px 16px', backgroundColor: 'var(--lp-violet)', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
              cursor: passwordLoading ? 'not-allowed' : 'pointer', opacity: passwordLoading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', alignSelf: 'flex-start',
            }}
          >
            {passwordLoading && <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      )}
    </div>
  )
}

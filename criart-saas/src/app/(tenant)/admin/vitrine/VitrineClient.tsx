'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'
import { Copy, ExternalLink, Upload, Loader, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { StorefrontConfig } from './storefront-config'

interface Props {
  initialTenant: Record<string, any>
  initialSettings: Record<string, any>
  vitrineUrl: string
}

export function VitrineClient({ initialTenant, initialSettings, vitrineUrl }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const tenantId: string = initialTenant.id

  const [settings, setSettings] = useState(initialSettings)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(vitrineUrl)
    toast.success('URL copiada!')
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

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !settings?.id) return
    if (!file.type.startsWith('image/')) { toast.error('Somente imagens são permitidas'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter menos de 5MB'); return }

    setUploadingBanner(true)
    const ext = file.name.split('.').pop()
    const filePath = `${initialTenant.id}/banner.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(filePath, buffer, { contentType: file.type, upsert: true })

    if (uploadError) { toast.error('Erro ao enviar banner'); setUploadingBanner(false); return }

    const { data: urlData } = supabase.storage.from('tenant-assets').getPublicUrl(filePath)
    const bannerUrl = urlData.publicUrl

    const { error } = await supabase.from('tenant_settings').update({ banner_url: bannerUrl }).eq('id', settings.id)
    setUploadingBanner(false)
    if (error) { toast.error('Erro ao salvar banner'); return }

    setSettings((prev: any) => ({ ...prev, banner_url: bannerUrl }))
    toast.success('Banner atualizado!')
  }

  const handleSaveSettings = async () => {
    if (!settings?.id) { toast.error('Configurações não encontradas'); return }
    setSavingSettings(true)
    const { error } = await supabase
      .from('tenant_settings')
      .update({
        instagram: settings.instagram,
        whatsapp: settings.whatsapp,
        banner_opacity: settings.banner_opacity ?? 0.6,
        banner_zoom: settings.banner_zoom ?? 100,
      })
      .eq('id', settings.id)
    setSavingSettings(false)
    if (error) toast.error('Erro ao salvar')
    else toast.success('Configurações salvas!')
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--lp-ink)', letterSpacing: '-0.02em' }}>
          Vitrine
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', marginTop: '4px' }}>
          Gerencie o link, aparência e carrosseis da sua vitrine
        </p>
      </div>

      {/* Link da Vitrine */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)', marginBottom: '12px' }}>
          Link da Vitrine
        </h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={vitrineUrl}
            style={{
              flex: 1, padding: '10px 12px', border: '1px solid var(--lp-border)',
              borderRadius: '8px', fontSize: '14px', color: 'var(--lp-ink-2)',
              backgroundColor: 'var(--lp-surface-2)', fontFamily: 'monospace',
            }}
          />
          <button
            onClick={handleCopyUrl}
            style={{
              padding: '10px 12px', backgroundColor: 'var(--lp-violet)', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
              fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Copy size={14} /> Copiar
          </button>
          <a
            href={vitrineUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 12px', backgroundColor: 'var(--lp-surface-2)', color: 'var(--lp-violet)',
              border: '1px solid var(--lp-border)', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} /> Abrir
          </a>
        </div>
      </div>

      {/* Aparência */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)', marginBottom: '16px' }}>
          Aparência da Vitrine
        </h2>

        {/* Logo */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '8px', display: 'block' }}>
            Logo da Empresa
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {settings?.logo_url ? (
              <NextImage
                src={settings.logo_url}
                alt="Logo"
                width={64} height={64}
                style={{ objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--lp-border)', background: 'white', padding: '4px' }}
              />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', border: '1px dashed var(--lp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--lp-surface-2)' }}>
                <Upload size={20} style={{ color: 'var(--lp-ink-4)' }} />
              </div>
            )}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                style={{
                  padding: '8px 14px', border: '1px solid var(--lp-border)', borderRadius: '8px',
                  backgroundColor: 'var(--lp-surface)', cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 500, color: 'var(--lp-ink-2)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {uploadingLogo ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                {uploadingLogo ? 'Enviando...' : 'Escolher imagem'}
              </button>
              <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)', marginTop: '4px' }}>PNG, JPG ou SVG. Máx 2MB.</p>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '8px', display: 'block' }}>
            Banner do Hero (fundo da página inicial)
          </label>
          <div style={{ marginBottom: '12px' }}>
            {settings?.banner_url ? (
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--lp-border)' }}>
                <NextImage src={settings.banner_url} alt="Banner" fill sizes="100vw" style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,.5), transparent)', display: 'flex', alignItems: 'center', padding: '12px' }}>
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }}>Banner configurado</span>
                </div>
              </div>
            ) : (
              <div style={{ height: '80px', borderRadius: '8px', border: '1px dashed var(--lp-border)', background: 'var(--lp-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ImageIcon size={18} style={{ color: 'var(--lp-ink-4)' }} />
                <span style={{ fontSize: '13px', color: 'var(--lp-ink-4)' }}>Sem banner (usa cor de destaque)</span>
              </div>
            )}
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            style={{
              padding: '8px 14px', border: '1px solid var(--lp-border)', borderRadius: '8px',
              backgroundColor: 'var(--lp-surface)', cursor: uploadingBanner ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 500, color: 'var(--lp-ink-2)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {uploadingBanner ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
            {uploadingBanner ? 'Enviando...' : 'Escolher banner'}
          </button>
          <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)', marginTop: '4px' }}>PNG ou JPG. Recomendado: 1440×600px. Máx 5MB.</p>

          {settings?.banner_url && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--lp-surface-2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)' }}>Opacidade do banner</label>
                  <span style={{ fontSize: '13px', color: 'var(--lp-ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round((settings?.banner_opacity ?? 0.6) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={Math.round((settings?.banner_opacity ?? 0.6) * 100)}
                  onChange={e => setSettings((prev: any) => ({ ...prev, banner_opacity: Number(e.target.value) / 100 }))}
                  style={{ width: '100%', accentColor: 'var(--lp-violet)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--lp-ink-4)' }}>
                  <span>Transparente</span><span>Escuro</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)' }}>Zoom do banner</label>
                  <span style={{ fontSize: '13px', color: 'var(--lp-ink-3)', fontVariantNumeric: 'tabular-nums' }}>
                    {settings?.banner_zoom ?? 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min={100} max={200} step={5}
                  value={settings?.banner_zoom ?? 100}
                  onChange={e => setSettings((prev: any) => ({ ...prev, banner_zoom: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--lp-violet)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--lp-ink-4)' }}>
                  <span>Normal (100%)</span><span>Bem próximo (200%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instagram */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '8px', display: 'block' }}>
            Instagram
          </label>
          <div style={{ display: 'flex', gap: '0' }}>
            <span style={{ padding: '10px 12px', backgroundColor: 'var(--lp-surface-2)', borderRadius: '8px 0 0 8px', fontSize: '14px', color: 'var(--lp-ink-3)', border: '1px solid var(--lp-border)', borderRight: 'none' }}>
              @
            </span>
            <input
              type="text"
              value={settings?.instagram || ''}
              onChange={e => setSettings((prev: any) => ({ ...prev, instagram: e.target.value }))}
              placeholder="seu_usuario"
              style={{
                flex: 1, padding: '10px 12px', border: '1px solid var(--lp-border)',
                borderRadius: '0 8px 8px 0', fontSize: '14px', color: 'var(--lp-ink)',
                backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)',
              }}
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lp-ink-2)', marginBottom: '8px', display: 'block' }}>
            WhatsApp
          </label>
          <div style={{ display: 'flex', gap: '0' }}>
            <span style={{ padding: '10px 12px', backgroundColor: 'var(--lp-surface-2)', borderRadius: '8px 0 0 8px', fontSize: '14px', color: 'var(--lp-ink-3)', border: '1px solid var(--lp-border)', borderRight: 'none' }}>
              +55
            </span>
            <input
              type="text"
              value={settings?.whatsapp?.replace(/^\+55/, '') || ''}
              onChange={e => setSettings((prev: any) => ({ ...prev, whatsapp: `+55${e.target.value}` }))}
              placeholder="85999999999"
              style={{
                flex: 1, padding: '10px 12px', border: '1px solid var(--lp-border)',
                borderRadius: '0 8px 8px 0', fontSize: '14px', color: 'var(--lp-ink)',
                backgroundColor: 'var(--lp-surface)', fontFamily: 'var(--font-body)',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          style={{
            padding: '10px 16px', backgroundColor: 'var(--lp-violet)', color: 'white',
            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
            cursor: savingSettings ? 'not-allowed' : 'pointer', opacity: savingSettings ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          {savingSettings && <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          {savingSettings ? 'Salvando...' : 'Salvar Aparência'}
        </button>
      </div>

      {/* Preview */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)' }}>Preview</h2>
          {!showPreview && (
            <button
              onClick={() => setShowPreview(true)}
              style={{
                padding: '7px 14px', border: '1px solid var(--lp-border)', borderRadius: '8px',
                backgroundColor: 'var(--lp-surface)', cursor: 'pointer', fontSize: '13px',
                fontWeight: 500, color: 'var(--lp-ink-2)',
              }}
            >
              Carregar preview
            </button>
          )}
        </div>
        {showPreview ? (
          <div style={{ border: '1px solid var(--lp-border)', borderRadius: '8px', overflow: 'hidden' }}>
            <iframe
              src={vitrineUrl}
              style={{ width: '100%', height: '600px', border: 'none', backgroundColor: 'white' }}
            />
          </div>
        ) : (
          <div style={{ height: '120px', border: '1px dashed var(--lp-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--lp-ink-4)' }}>Clique em "Carregar preview" para visualizar a vitrine</p>
          </div>
        )}
      </div>

      {/* Tema da Vitrine */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)', marginBottom: '4px' }}>
          Tema da Vitrine
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--lp-ink-3)', marginBottom: '20px' }}>
          Escolha o estilo visual da página inicial da sua vitrine.
        </p>

        {/* ── Temas de Página ── */}
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lp-ink-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Temas de Página
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {([
            {
              id: 'elegante',
              label: 'Elegante',
              desc: 'Grade sutil, glow de cor',
              preview: 'linear-gradient(135deg, #1a1a24 0%, #070709 100%)',
              dot: 'rgba(255,255,255,0.18)',
            },
            {
              id: 'luxury',
              label: 'Luxury',
              desc: 'Navy profundo, linhas douradas',
              preview: 'linear-gradient(135deg, #1a1530 0%, #060410 100%)',
              dot: 'rgba(212,175,55,0.7)',
            },
            {
              id: 'terracota',
              label: 'Terracota',
              desc: 'Tons quentes, pontos âmbar',
              preview: 'linear-gradient(135deg, #2a1005 0%, #0d0602 100%)',
              dot: 'rgba(255,160,60,0.7)',
            },
            {
              id: 'grafite',
              label: 'Grafite',
              desc: 'Ardósia escura, matriz de pontos',
              preview: 'linear-gradient(135deg, #1a2232 0%, #0d1018 100%)',
              dot: 'rgba(148,163,184,0.5)',
            },
          ] as const).map(theme => {
            const isActive = settings?.banner_style === theme.id
            return (
              <button
                key={theme.id}
                onClick={async () => {
                  setSavingSettings(true)
                  const { data: saved, error } = await supabase
                    .from('tenant_settings')
                    .upsert({ tenant_id: tenantId, banner_style: theme.id }, { onConflict: 'tenant_id' })
                    .select('id')
                    .single()
                  setSavingSettings(false)
                  if (error) { toast.error('Erro ao salvar'); return }
                  setSettings((prev: any) => ({ ...prev, banner_style: theme.id, id: saved?.id ?? prev?.id }))
                  toast.success(`Tema "${theme.label}" aplicado!`)
                }}
                style={{
                  padding: '0',
                  border: isActive ? '2px solid var(--lp-violet)' : '1px solid var(--lp-border)',
                  borderRadius: '10px',
                  background: 'none',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
              >
                {/* Preview color strip */}
                <div style={{
                  height: '52px',
                  background: theme.preview,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                }}>
                  {[0,1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      width: '4px', height: '4px', borderRadius: '50%',
                      background: theme.dot,
                      opacity: 0.6 + i * 0.07,
                    }} />
                  ))}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: '6px', right: '6px',
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: 'var(--lp-violet)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', color: 'white', fontWeight: 800,
                    }}>✓</div>
                  )}
                </div>
                {/* Label */}
                <div style={{ padding: '8px 10px', background: isActive ? 'rgba(139,92,246,0.06)' : 'var(--lp-surface)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? 'var(--lp-violet)' : 'var(--lp-ink)' }}>
                    {theme.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--lp-ink-4)', marginTop: '1px' }}>{theme.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Efeitos Animados ── */}
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lp-ink-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Efeitos Animados
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
          {([
            { id: 'laser',       label: 'Laser',       emoji: '🔫', desc: 'Varredura laser' },
            { id: 'pixel',       label: 'Pixel',       emoji: '✨', desc: 'Ondas de pixel' },
            { id: 'aurora',      label: 'Aurora',      emoji: '🌊', desc: 'Ondas fluidas' },
            { id: 'orbs',        label: 'Orbs',        emoji: '⭕', desc: 'Esferas flutuantes' },
            { id: 'antigravity', label: 'Antigravity', emoji: '🛸', desc: 'Partículas' },
            { id: 'magnetic',    label: 'Magnético',   emoji: '🧲', desc: 'Cursor magnético' },
            { id: 'static',      label: 'Estático',    emoji: '⬛', desc: 'Sem efeito' },
          ] as const).map(style => {
            const isActive = settings?.banner_style === style.id
            return (
              <button
                key={style.id}
                onClick={async () => {
                  setSavingSettings(true)
                  const { data: saved, error } = await supabase
                    .from('tenant_settings')
                    .upsert({ tenant_id: tenantId, banner_style: style.id }, { onConflict: 'tenant_id' })
                    .select('id')
                    .single()
                  setSavingSettings(false)
                  if (error) { toast.error('Erro ao salvar'); return }
                  setSettings((prev: any) => ({ ...prev, banner_style: style.id, id: saved?.id ?? prev?.id }))
                  toast.success(`"${style.label}" selecionado!`)
                }}
                style={{
                  padding: '10px 8px',
                  border: isActive ? '2px solid var(--lp-violet)' : '1px solid var(--lp-border)',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(139,92,246,0.08)' : 'var(--lp-surface)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  transition: 'all 0.18s ease',
                }}
              >
                <span style={{ fontSize: '20px' }}>{style.emoji}</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: isActive ? 'var(--lp-violet)' : 'var(--lp-ink)' }}>{style.label}</div>
                <div style={{ fontSize: '9px', color: 'var(--lp-ink-4)' }}>{style.desc}</div>
              </button>
            )
          })}
        </div>
      </div>


      {/* Configurador de Carrosseis */}
      <StorefrontConfig tenantId={initialTenant.id} />
    </div>
  )
}

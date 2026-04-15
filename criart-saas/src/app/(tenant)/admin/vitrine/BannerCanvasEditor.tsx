'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuid } from 'uuid'
import {
  Save, Loader, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Trash2, Copy, ChevronUp, ChevronDown, ImageIcon, Layers,
  ArrowUpToLine, ArrowDownToLine,
} from 'lucide-react'
import { toast } from 'sonner'

export const CW = 1600
export const CH = 500

// ── Tipos ──────────────────────────────────────────────────────────────
export type ElType = 'text' | 'image' | 'button'

export interface CanvasElement {
  id: string; type: ElType
  x: number; y: number; w: number; h: number
  // text
  text?: string; fontSize?: number; color?: string
  bold?: boolean; italic?: boolean; align?: 'left' | 'center' | 'right'
  // image
  src?: string
  // button
  label?: string; bgColor?: string; textColor?: string
  borderRadius?: number; action?: 'catalog' | 'whatsapp' | 'instagram' | 'custom'
  href?: string
}

export interface CanvasData {
  bgColor: string; bgImage?: string
  elements: CanvasElement[]
}

// ── Widgets pré-definidos ───────────────────────────────────────────────
const WIDGETS: { id: string; label: string; category: string; defaults: Partial<CanvasElement> }[] = [
  { id: 'w-title',    label: 'Título',       category: 'texto',  defaults: { type: 'text',   w: 900,  h: 110, text: 'Seu Título Aqui',     fontSize: 90, bold: true,  color: '#ffffff', align: 'left' } },
  { id: 'w-subtitle', label: 'Subtítulo',    category: 'texto',  defaults: { type: 'text',   w: 700,  h: 70,  text: 'Subtítulo ou slogan', fontSize: 42, bold: false, color: 'rgba(255,255,255,0.85)', align: 'left' } },
  { id: 'w-para',     label: 'Parágrafo',    category: 'texto',  defaults: { type: 'text',   w: 600,  h: 56,  text: 'Texto descritivo aqui', fontSize: 28, bold: false, color: 'rgba(255,255,255,0.7)', align: 'left' } },
  { id: 'w-catalog',  label: 'Ver Catálogo', category: 'botao',  defaults: { type: 'button', w: 220,  h: 60,  label: 'Ver Catálogo', bgColor: 'rgba(255,255,255,0.2)', textColor: '#ffffff', borderRadius: 12, action: 'catalog' } },
  { id: 'w-whatsapp', label: 'WhatsApp',     category: 'botao',  defaults: { type: 'button', w: 220,  h: 60,  label: 'WhatsApp',    bgColor: '#25D366', textColor: '#ffffff', borderRadius: 12, action: 'whatsapp' } },
  { id: 'w-insta',    label: 'Instagram',    category: 'botao',  defaults: { type: 'button', w: 220,  h: 60,  label: 'Instagram',   bgColor: '#E1306C', textColor: '#ffffff', borderRadius: 12, action: 'instagram' } },
  { id: 'w-btn',      label: 'Botão livre',  category: 'botao',  defaults: { type: 'button', w: 220,  h: 60,  label: 'Clique aqui', bgColor: '#ea580c', textColor: '#ffffff', borderRadius: 12, action: 'custom', href: '#' } },
  { id: 'w-image',    label: 'Imagem',       category: 'midia',  defaults: { type: 'image',  w: CW,   h: CH,  x: 0, y: 0, src: '' } },
]

// ── Helpers ─────────────────────────────────────────────────────────────
const pill = (active?: boolean, danger?: boolean): React.CSSProperties => ({
  padding: '5px 10px', border: `1px solid ${danger ? 'var(--lp-red)' : 'var(--lp-border)'}`,
  borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  backgroundColor: danger ? 'var(--lp-danger-pale)' : active ? 'var(--lp-violet)' : 'var(--lp-surface)',
  color: danger ? 'var(--lp-red)' : active ? 'white' : 'var(--lp-ink-2)',
  userSelect: 'none' as const,
})

const inp = (w?: number): React.CSSProperties => ({
  width: w ?? '100%', padding: '5px 8px',
  border: '1px solid var(--lp-border)', borderRadius: '6px',
  fontSize: '12px', color: 'var(--lp-ink)', backgroundColor: 'var(--lp-surface)',
  fontFamily: 'var(--font-body)',
})

const elLabel = (el: CanvasElement) => {
  if (el.type === 'text') return `✏️ ${(el.text ?? '').slice(0, 18) || 'Texto'}`
  if (el.type === 'image') return `🖼️ Imagem`
  if (el.type === 'button') return `🔘 ${el.label ?? 'Botão'}`
  return 'Elemento'
}

interface Props { tenantId: string; settingsId: string; initial?: CanvasData | null; onSave?: (canvas: CanvasData) => void; onChange?: (canvas: CanvasData) => void }

export function BannerCanvasEditor({ tenantId, settingsId, initial, onSave, onChange }: Props) {
  const supabase = createClient()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [canvas, setCanvas] = useState<CanvasData>(initial ?? { bgColor: '#1a1744', elements: [] })
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const elImgRef = useRef<HTMLInputElement>(null)

  const drag = useRef<{ id: string; mode: 'move' | 'resize'; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number } | null>(null)
  const dropWidget = useRef<string | null>(null)

  useEffect(() => {
    const obs = new ResizeObserver(([e]) => { if (e) setScale(e.contentRect.width / CW) })
    if (wrapRef.current) obs.observe(wrapRef.current)
    return () => obs.disconnect()
  }, [])

  // Sync local changes to parent preview in real-time
  useEffect(() => {
    onChange?.(canvas)
  }, [canvas, onChange])

  const sel = canvas.elements.find(e => e.id === selected)

  const upd = (id: string, p: Partial<CanvasElement>) =>
    setCanvas(prev => ({ ...prev, elements: prev.elements.map(e => e.id === id ? { ...e, ...p } : e) }))

  const del = (id: string) => { setCanvas(prev => ({ ...prev, elements: prev.elements.filter(e => e.id !== id) })); setSelected(null) }

  const dup = (id: string) => {
    const el = canvas.elements.find(e => e.id === id); if (!el) return
    const clone = { ...el, id: uuid(), x: el.x + 30, y: el.y + 30 }
    setCanvas(prev => ({ ...prev, elements: [...prev.elements, clone] })); setSelected(clone.id)
  }

  // camadas: índice maior = mais à frente
  const layer = (id: string, dir: 'up' | 'down' | 'front' | 'back') => {
    setCanvas(prev => {
      const els = [...prev.elements]; const i = els.findIndex(e => e.id === id)
      if (dir === 'up' && i < els.length - 1) [els[i], els[i+1]] = [els[i+1], els[i]]
      else if (dir === 'down' && i > 0) [els[i], els[i-1]] = [els[i-1], els[i]]
      else if (dir === 'front') { const [el] = els.splice(i, 1); els.push(el) }
      else if (dir === 'back') { const [el] = els.splice(i, 1); els.unshift(el) }
      return { ...prev, elements: els }
    })
  }

  // ── Drop de widget ──────────────────────────────────────────────────
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!dropWidget.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.round((e.clientX - rect.left) / scale)
    const y = Math.round((e.clientY - rect.top) / scale)
    const w = WIDGETS.find(w => w.id === dropWidget.current)!
    const el: CanvasElement = { id: uuid(), x: Math.max(0, x - 100), y: Math.max(0, y - 30), ...w.defaults } as CanvasElement
    setCanvas(prev => ({ ...prev, elements: [...prev.elements, el] }))
    setSelected(el.id)
    if (el.type === 'image') setTimeout(() => elImgRef.current?.click(), 100)
    dropWidget.current = null
  }

  // ── Upload ──────────────────────────────────────────────────────────
  const uploadBg = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadingBg(true)
    const path = `${tenantId}/canvas-bg-${uuid()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('tenant-assets').upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true })
    if (error) { toast.error('Erro ao enviar'); setUploadingBg(false); return }
    setCanvas(prev => ({ ...prev, bgImage: supabase.storage.from('tenant-assets').getPublicUrl(path).data.publicUrl }))
    setUploadingBg(false)
  }

  const uploadElImg = async (file: File, targetId: string) => {
    if (!file.type.startsWith('image/')) return
    setUploadingImg(true)
    const path = `${tenantId}/canvas-el-${uuid()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('tenant-assets').upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true })
    if (error) { toast.error('Erro ao enviar'); setUploadingImg(false); return }
    upd(targetId, { src: supabase.storage.from('tenant-assets').getPublicUrl(path).data.publicUrl })
    setUploadingImg(false)
  }

  // ── Pointer drag/resize ─────────────────────────────────────────────
  const onPtrDown = (e: React.PointerEvent, id: string, mode: 'move' | 'resize') => {
    e.stopPropagation()
    setSelected(id)
    const el = canvas.elements.find(e => e.id === id)!
    drag.current = { id, mode, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.w, oh: el.h }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPtrMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return
    const dx = (e.clientX - d.sx) / scale; const dy = (e.clientY - d.sy) / scale
    if (d.mode === 'move') upd(d.id, { x: Math.round(Math.max(0, Math.min(CW - 20, d.ox + dx))), y: Math.round(Math.max(0, Math.min(CH - 10, d.oy + dy))) })
    else upd(d.id, { w: Math.round(Math.max(40, d.ow + dx)), h: Math.round(Math.max(20, d.oh + dy)) })
  }
  const onPtrUp = () => { drag.current = null }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('tenant_settings').update({ banner_canvas: canvas }).eq('id', settingsId)
    setSaving(false)
    if (error) toast.error('Erro ao salvar')
    else {
      toast.success('Canvas salvo!')
      onSave?.(canvas)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', border: '1px solid var(--lp-border)', borderRadius: '6px', background: 'var(--lp-surface)' }}>
          <span style={{ fontSize: '12px', color: 'var(--lp-ink-3)', fontWeight: 600 }}>Fundo</span>
          <input type="color" value={canvas.bgColor} onChange={e => setCanvas(p => ({ ...p, bgColor: e.target.value }))}
            style={{ width: 28, height: 26, border: 'none', cursor: 'pointer', borderRadius: 4, padding: 0 }} title="Cor do fundo" />
          <label style={{ fontSize: '12px', color: 'var(--lp-violet)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Imagem de fundo">
            {uploadingBg ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={12} />}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadBg(e.target.files[0])} />
          </label>
          {canvas.bgImage && <button onClick={() => setCanvas(p => ({ ...p, bgImage: undefined }))} style={{ fontSize: '11px', color: 'var(--lp-red)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ img</button>}
        </div>
        <div style={{ flex: 1 }} />
        <button style={pill()} onClick={() => { if (confirm('Limpar o canvas?')) { setCanvas({ bgColor: '#1a1744', elements: [] }); setSelected(null) } }}>Limpar</button>
        <button style={pill(true)} onClick={handleSave} disabled={saving}>
          {saving ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* ── Layout: widgets | canvas | camadas ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>

        {/* ── Painel de widgets ── */}
        <div style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lp-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>Widgets</p>
          <p style={{ fontSize: '10px', color: 'var(--lp-ink-4)', margin: '0 0 6px' }}>Arraste para o canvas</p>
          {['texto', 'botao', 'midia'].map(cat => (
            <div key={cat}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--lp-ink-4)', textTransform: 'uppercase', margin: '6px 0 3px' }}>
                {cat === 'texto' ? 'Texto' : cat === 'botao' ? 'Botões' : 'Mídia'}
              </p>
              {WIDGETS.filter(w => w.category === cat).map(w => (
                <div
                  key={w.id}
                  draggable
                  onDragStart={() => { dropWidget.current = w.id }}
                  style={{
                    padding: '6px 8px', marginBottom: '3px',
                    border: '1px solid var(--lp-border)', borderRadius: '6px',
                    background: 'var(--lp-surface)', cursor: 'grab',
                    fontSize: '11px', fontWeight: 500, color: 'var(--lp-ink-2)',
                    userSelect: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '12px' }}>
                    {cat === 'texto' ? '✏️' : cat === 'botao' ? '🔘' : '🖼️'}
                  </span>
                  {w.label}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Canvas ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            ref={wrapRef}
            style={{ width: '100%', position: 'relative', paddingTop: `${(CH / CW) * 100}%`, border: '2px solid var(--lp-border)', borderRadius: '8px', overflow: 'hidden' }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleCanvasDrop}
          >
            <div style={{ position: 'absolute', inset: 0 }}>
              <div
                ref={canvasRef}
                style={{ width: CW, height: CH, transformOrigin: 'top left', transform: `scale(${scale})`, position: 'relative', overflow: 'hidden', backgroundColor: canvas.bgColor, cursor: 'default' }}
                onPointerMove={onPtrMove}
                onPointerUp={onPtrUp}
                onClick={() => setSelected(null)}
              >
                {/* fundo */}
                {canvas.bgImage && <img src={canvas.bgImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />}

                {/* grade guia */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)', backgroundSize: '100px 100px', pointerEvents: 'none', zIndex: 0 }} />

                {/* elementos — índice maior = frente */}
                {canvas.elements.map((el, idx) => {
                  const isSel = el.id === selected
                  return (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
                        zIndex: idx + 1,
                        outline: isSel ? '2px solid #ea580c' : '1px dashed rgba(255,255,255,.2)',
                        outlineOffset: isSel ? 2 : 0,
                        cursor: 'move', overflow: 'visible',
                        boxSizing: 'border-box',
                      }}
                      onPointerDown={e => onPtrDown(e, el.id, 'move')}
                      onClick={e => { e.stopPropagation(); setSelected(el.id) }}
                    >
                      {el.type === 'text' && (
                        <div
                          contentEditable suppressContentEditableWarning
                          onBlur={e => upd(el.id, { text: e.currentTarget.innerText })}
                          onPointerDown={e => { e.stopPropagation(); setSelected(el.id) }}
                          onClick={e => e.stopPropagation()}
                          style={{
                            width: '100%', height: '100%', outline: 'none', cursor: 'text',
                            fontSize: el.fontSize, color: el.color,
                            fontWeight: el.bold ? 'bold' : 'normal',
                            fontStyle: el.italic ? 'italic' : 'normal',
                            textAlign: el.align ?? 'left',
                            fontFamily: 'var(--font-display, system-ui)',
                            lineHeight: 1.2, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          }}
                        >{el.text}</div>
                      )}

                      {el.type === 'image' && (
                        el.src
                          ? <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
                          : (
                            <div
                              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: 8, cursor: 'pointer' }}
                              onClick={e => { e.stopPropagation(); setSelected(el.id); elImgRef.current?.click() }}
                            >
                              <ImageIcon size={32} style={{ color: 'rgba(255,255,255,.5)' }} />
                              <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, marginTop: 8 }}>Clique para enviar</span>
                            </div>
                          )
                      )}

                      {el.type === 'button' && (
                        <div style={{
                          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: el.bgColor, borderRadius: el.borderRadius ?? 12,
                          color: el.textColor ?? '#fff', fontSize: 22, fontWeight: 700,
                          fontFamily: 'var(--font-display, system-ui)', pointerEvents: 'none',
                        }}>{el.label}</div>
                      )}

                      {/* alças de resize quando selecionado */}
                      {isSel && (
                        <div
                          style={{ position: 'absolute', bottom: -6, right: -6, width: 14, height: 14, background: '#ea580c', borderRadius: 3, cursor: 'se-resize', zIndex: 9999, border: '2px solid white' }}
                          onPointerDown={e => onPtrDown(e, el.id, 'resize')}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--lp-ink-4)', marginTop: '5px' }}>
            Arraste widgets • Mova elementos • Quadrado azul = redimensionar • Clique no texto para editar
          </p>
        </div>

        {/* ── Painel de Camadas ── */}
        <div style={{ width: '150px', flexShrink: 0 }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--lp-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={11} /> Camadas
          </p>
          <p style={{ fontSize: '10px', color: 'var(--lp-ink-4)', margin: '0 0 6px' }}>Topo = frente</p>

          {canvas.elements.length === 0 && (
            <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)', fontStyle: 'italic' }}>Nenhum elemento</p>
          )}

          {/* Exibe em ordem inversa: último array = topo da lista */}
          {[...canvas.elements].reverse().map((el) => {
            const isSel = el.id === selected
            const idx = canvas.elements.findIndex(e => e.id === el.id)
            const isTop = idx === canvas.elements.length - 1
            const isBottom = idx === 0
            return (
              <div
                key={el.id}
                onClick={() => setSelected(el.id)}
                style={{
                  padding: '5px 7px', marginBottom: '3px',
                  border: `1px solid ${isSel ? '#ea580c' : 'var(--lp-border)'}`,
                  borderRadius: '6px',
                  background: isSel ? 'rgba(234,88,12,0.1)' : 'var(--lp-surface)',
                  cursor: 'pointer', fontSize: '11px',
                  color: isSel ? '#ea580c' : 'var(--lp-ink-2)',
                  fontWeight: isSel ? 600 : 400,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px',
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {elLabel(el)}
                </span>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <button
                    style={{ background: 'none', border: 'none', cursor: isTop ? 'default' : 'pointer', padding: '1px', opacity: isTop ? 0.3 : 1 }}
                    onClick={e => { e.stopPropagation(); layer(el.id, 'up') }}
                    title="Subir camada"
                  >
                    <ChevronUp size={11} />
                  </button>
                  <button
                    style={{ background: 'none', border: 'none', cursor: isBottom ? 'default' : 'pointer', padding: '1px', opacity: isBottom ? 0.3 : 1 }}
                    onClick={e => { e.stopPropagation(); layer(el.id, 'down') }}
                    title="Descer camada"
                  >
                    <ChevronDown size={11} />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Botões frente/trás para o selecionado */}
          {sel && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
              <button
                style={{ ...pill(), fontSize: '10px', padding: '4px 8px', width: '100%', justifyContent: 'center' }}
                onClick={() => layer(sel.id, 'front')}
                title="Trazer para frente"
              >
                <ArrowUpToLine size={10} /> Frente total
              </button>
              <button
                style={{ ...pill(), fontSize: '10px', padding: '4px 8px', width: '100%', justifyContent: 'center' }}
                onClick={() => layer(sel.id, 'back')}
                title="Enviar para trás"
              >
                <ArrowDownToLine size={10} /> Atrás total
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Painel de Propriedades ── */}
      {sel && (
        <div style={{ marginTop: '12px', padding: '14px', background: 'var(--lp-surface-2)', borderRadius: '8px', border: '1px solid var(--lp-border)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>

            {/* ── texto ── */}
            {sel.type === 'text' && (<>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>Tamanho</label>
                <input type="number" min={8} max={400} value={sel.fontSize ?? 32} onChange={e => upd(sel.id, { fontSize: Number(e.target.value) })} style={{ ...inp(60) }} />
              </div>
              <input type="color" value={sel.color ?? '#ffffff'} onChange={e => upd(sel.id, { color: e.target.value })} style={{ width: 32, height: 30, border: 'none', cursor: 'pointer', borderRadius: 4, padding: 0 }} title="Cor" />
              <button style={pill(sel.bold)} onClick={() => upd(sel.id, { bold: !sel.bold })}><Bold size={12} /></button>
              <button style={pill(sel.italic)} onClick={() => upd(sel.id, { italic: !sel.italic })}><Italic size={12} /></button>
              <button style={pill(sel.align === 'left')} onClick={() => upd(sel.id, { align: 'left' })}><AlignLeft size={12} /></button>
              <button style={pill(sel.align === 'center')} onClick={() => upd(sel.id, { align: 'center' })}><AlignCenter size={12} /></button>
              <button style={pill(sel.align === 'right')} onClick={() => upd(sel.id, { align: 'right' })}><AlignRight size={12} /></button>
            </>)}

            {/* ── imagem ── */}
            {sel.type === 'image' && (<>
              <label style={{ ...pill(), cursor: 'pointer' }}>
                {uploadingImg ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={12} />}
                {sel.src ? 'Trocar imagem' : 'Enviar imagem'}
                <input ref={elImgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadElImg(e.target.files[0], sel.id) }} />
              </label>
              <button style={pill()} onClick={() => upd(sel.id, { w: CW, h: CH, x: 0, y: 0 })}>Preencher tela</button>
            </>)}

            {/* ── botão ── */}
            {sel.type === 'button' && (<>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>Label</label>
                <input value={sel.label ?? ''} onChange={e => upd(sel.id, { label: e.target.value })} style={{ ...inp(140) }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>Fundo</label>
                <input type="color" value={sel.bgColor ?? '#ea580c'} onChange={e => upd(sel.id, { bgColor: e.target.value })} style={{ width: 32, height: 30, border: 'none', cursor: 'pointer', borderRadius: 4, padding: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>Texto</label>
                <input type="color" value={sel.textColor ?? '#ffffff'} onChange={e => upd(sel.id, { textColor: e.target.value })} style={{ width: 32, height: 30, border: 'none', cursor: 'pointer', borderRadius: 4, padding: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>Arred.</label>
                <input type="number" min={0} max={100} value={sel.borderRadius ?? 12} onChange={e => upd(sel.id, { borderRadius: Number(e.target.value) })} style={{ ...inp(50) }} />
              </div>
              {sel.action === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>Link</label>
                  <input value={sel.href ?? ''} onChange={e => upd(sel.id, { href: e.target.value })} placeholder="https://..." style={{ ...inp(160) }} />
                </div>
              )}
            </>)}

            {/* posição / tamanho */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--lp-border)', paddingLeft: '8px' }}>
              <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>X</label>
              <input type="number" value={Math.round(sel.x)} onChange={e => upd(sel.id, { x: Number(e.target.value) })} style={{ ...inp(56) }} />
              <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>Y</label>
              <input type="number" value={Math.round(sel.y)} onChange={e => upd(sel.id, { y: Number(e.target.value) })} style={{ ...inp(56) }} />
              <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>W</label>
              <input type="number" value={Math.round(sel.w)} onChange={e => upd(sel.id, { w: Number(e.target.value) })} style={{ ...inp(60) }} />
              <label style={{ fontSize: '11px', color: 'var(--lp-ink-3)' }}>H</label>
              <input type="number" value={Math.round(sel.h)} onChange={e => upd(sel.id, { h: Number(e.target.value) })} style={{ ...inp(60) }} />
            </div>

            {/* ações */}
            <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid var(--lp-border)', paddingLeft: '8px' }}>
              <button style={pill()} onClick={() => dup(sel.id)} title="Duplicar"><Copy size={12} /> Duplicar</button>
              <button style={pill(false, true)} onClick={() => del(sel.id)}><Trash2 size={12} /> Deletar</button>
            </div>
          </div>
        </div>
      )}

      {/* input oculto para upload de imagem do elemento */}
      <input ref={elImgRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0] && selected) uploadElImg(e.target.files[0], selected) }} />
    </div>
  )
}

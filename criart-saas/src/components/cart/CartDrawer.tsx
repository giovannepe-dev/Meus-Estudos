'use client'
import Image from 'next/image'
import { useCartStore } from '@/lib/store/cartStore'
import { X, ShoppingCart, Plus, Minus, Trash2, Pencil, FileDown, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props { open: boolean; onClose: () => void; settings: any; tenantSlug: string; tenantId: string }

async function fetchBase64(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    // Normaliza para URL absoluta usando a origin atual
    const u = url.startsWith('http') ? url : `${window.location.origin}${url}`
    const res = await fetch(u)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise(resolve => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = () => resolve(null)
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

async function imprimirOrcamento(items: any[], settings: any, mostrarPreco: boolean, total: number | null): Promise<string> {
  const numero = `ORC-${Date.now().toString().slice(-6)}`
  const nomeSite = settings?.nome_site ?? 'CriArt Oficina Digital'
  const accent = settings?.cor_destaque ?? '#ea580c'
  const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const contatos = [
    settings?.whatsapp ? `WhatsApp: ${settings.whatsapp}` : '',
    settings?.instagram ? `Instagram: @${settings.instagram.replace('@', '')}` : '',
  ].filter(Boolean).join('   |   ')

  const imgs = await Promise.all(items.map(i => fetchBase64(i.product.imagem_url)))

  const linhas = items.map((item, idx) => {
    const codigoNum = item.product.numero || item.product.codigo
    const codigo = codigoNum ? `#${codigoNum}` : ''
    const cat = item.product.categoria?.nome ?? ''
    const b64 = imgs[idx]
    const imgHtml = b64
      ? `<img src="${b64}" width="60" height="60" style="border-radius:8px;object-fit:cover;display:block;border:1px solid #eee"/>`
      : `<div style="width:60px;height:60px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:11px;text-align:center">sem foto</div>`
    const preco = mostrarPreco && item.product.preco != null
      ? `<div style="color:${accent};font-weight:700;font-size:12px;margin-top:4px">${fmt(item.product.preco)} x ${item.quantidade} = ${fmt(item.product.preco * item.quantidade)}</div>`
      : ''
    return `<tr style="border-bottom:1px solid #eee">
      <td style="padding:10px 6px;text-align:center;color:#bbb;font-weight:700;font-size:12px;width:28px;vertical-align:middle">${idx + 1}</td>
      <td style="padding:10px 8px;width:76px;vertical-align:middle">${imgHtml}</td>
      <td style="padding:10px 8px;vertical-align:middle">
        ${codigo ? `<div style="color:${accent};font-size:11px;font-weight:700;margin-bottom:2px">${codigo}</div>` : ''}
        <div style="font-weight:700;font-size:13px;color:#111">${item.product.nome}</div>
        ${cat ? `<div style="color:#999;font-size:11px;margin-top:2px">Categoria: ${cat}</div>` : ''}
        ${item.observacao ? `<div style="font-size:11px;color:#555;font-style:italic;margin-top:4px;border-left:3px solid ${accent};padding-left:6px">${item.observacao}</div>` : ''}
        ${preco}
      </td>
      <td style="padding:10px 8px;text-align:center;font-size:20px;font-weight:800;width:40px;vertical-align:middle;color:#111">${item.quantidade}</td>
    </tr>`
  }).join('')

  const totalHtml = mostrarPreco && total !== null
    ? `<div style="text-align:right;margin-top:16px"><span style="background:${accent};color:white;padding:8px 18px;border-radius:6px;font-weight:700;font-size:14px">Total estimado: ${fmt(total)}</span></div>`
    : ''

  const html = `
    <div style="background:${accent};color:white;padding:22px 28px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:19px;font-weight:800">${nomeSite}</div>
        ${contatos ? `<div style="font-size:11px;opacity:0.85;margin-top:5px">${contatos}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;opacity:0.7;letter-spacing:1px">ORCAMENTO</div>
        <div style="font-size:22px;font-weight:800">${numero}</div>
        <div style="font-size:11px;opacity:0.8;margin-top:2px">${data}</div>
      </div>
    </div>
    <div style="background:#fffbf0;border-left:4px solid ${accent};padding:9px 28px;font-size:12px;color:#888">Valido por 7 dias</div>
    <div style="padding:16px 28px">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:${accent}15">
          <th style="padding:8px 6px;width:28px"></th>
          <th style="padding:8px;width:76px"></th>
          <th style="padding:8px;text-align:left;font-size:10px;color:${accent};text-transform:uppercase">Produto</th>
          <th style="padding:8px;text-align:center;font-size:10px;color:${accent};text-transform:uppercase;width:40px">Qtd</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
      </table>
      ${totalHtml}
    </div>
    <div style="margin-top:24px;padding:14px 28px;border-top:1px solid #eee;text-align:center;color:#ccc;font-size:10px">
      Gerado por <strong>${nomeSite}</strong> - Powered by CriArt Oficina Digital
    </div>`

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      body { margin:0; font-family:Arial,Helvetica,sans-serif; color:#111; background:white }
      @media print { @page { margin: 10mm } }
    </style>
  </head><body>${html}</body></html>`

  const printWin = window.open('', '_blank', 'width=800,height=900')
  if (printWin) {
    printWin.document.write(fullHtml)
    printWin.document.close()
    // Aguarda imagens carregarem antes de imprimir
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus()
        printWin.print()
        printWin.close()
      }, 300)
    }
    // Fallback se onload não disparar (base64 carrega sem eventos)
    setTimeout(() => {
      if (!printWin.closed) {
        printWin.focus()
        printWin.print()
        printWin.close()
      }
    }, 1200)
  }

  return numero
}

export function CartDrawer({ open, onClose, settings, tenantId }: Props) {
  const { items, removeItem, updateQuantidade, updateObservacao, clearCart, totalEstimado } = useCartStore()
  const accentColor = settings?.cor_destaque ?? '#ea580c'
  const mostrarPreco = settings?.mostrar_preco ?? false
  const total = totalEstimado()
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const [loading, setLoading] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [clienteNome, setClienteNome] = useState('')
  const [clienteWhatsapp, setClienteWhatsapp] = useState('')

  async function handleAbrirOrcamento() {
    if (!items.length) return
    setLoading(true)
    try { await imprimirOrcamento(items, settings, mostrarPreco, total) }
    finally { setLoading(false) }
  }

  async function handleWhatsAppOrcamento() {
    if (!items.length || !settings?.whatsapp) return
    setLoading(true)
    try {
      const numero = await imprimirOrcamento(items, settings, mostrarPreco, total)
      setTimeout(() => {
        const msg = encodeURIComponent(`Ola! Segue o orcamento ${numero}.`)
        window.open(`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
      }, 600)
    } finally { setLoading(false) }
  }

  async function handleSolicitarOrcamento() {
    if (!items.length) return
    setEnviando(true)
    try {
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          itens: items.map(i => ({
            product: { nome: i.product.nome, imagem_url: i.product.imagem_url ?? null, preco: i.product.preco ?? null, categoria: i.product.categoria ?? null },
            quantidade: i.quantidade,
            observacao: i.observacao,
          })),
          total_estimado: mostrarPreco && total !== null ? total : null,
          nome_cliente: clienteNome.trim() || null,
          whatsapp_cliente: clienteWhatsapp.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error('Erro ao enviar orcamento'); return }
      toast.success(`Orcamento ${data.numero} enviado! Em breve entraremos em contato.`, { duration: 6000 })
      clearCart(); setShowModal(false); setClienteNome(''); setClienteWhatsapp(''); onClose()
    } catch {
      toast.error('Erro ao enviar orcamento')
    } finally { setEnviando(false) }
  }

  if (!open) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 51, width: '100%', maxWidth: '440px', background: 'var(--lp-surface)', borderLeft: '1px solid var(--lp-border)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,.15)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--lp-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} style={{ color: 'var(--lp-ink-2)' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)' }}>Carrinho de orcamento</h2>
            {items.length > 0 && (
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: accentColor, color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{items.length}</span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: 'var(--lp-ink-2)' }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <ShoppingCart size={48} style={{ color: 'var(--lp-ink-4)', margin: '0 auto 16px' }} />
              <p style={{ fontWeight: 600, color: 'var(--lp-ink)', marginBottom: '6px' }}>Carrinho vazio</p>
              <p style={{ fontSize: '14px', color: 'var(--lp-ink-3)', lineHeight: 1.6 }}>Adicione produtos para montar seu orcamento.</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'var(--lp-surface-2)', border: '1px solid var(--lp-border)', overflow: 'hidden', flexShrink: 0 }}>
                  {item.product.imagem_url
                    ? <Image src={item.product.imagem_url} alt="" width={52} height={52} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📦</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {(item.product.numero || item.product.codigo) && (
                    <p style={{ fontSize: '11px', fontWeight: 700, color: accentColor, marginBottom: '2px' }}>#{item.product.numero || item.product.codigo}</p>
                  )}
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-ink)', lineHeight: 1.3 }}>{item.product.nome}</p>
                  {item.product.categoria?.nome && <p style={{ fontSize: '11px', color: 'var(--lp-ink-4)', marginTop: '2px' }}>{item.product.categoria.emoji} {item.product.categoria.nome}</p>}
                  {mostrarPreco && item.product.preco != null && <p style={{ fontSize: '13px', fontWeight: 700, color: accentColor, marginTop: '3px' }}>{fmt(item.product.preco)}</p>}
                </div>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--lp-ink-4)', alignSelf: 'flex-start', borderRadius: '6px' }}><Trash2 size={14} /></button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--lp-ink-3)', marginRight: 'auto' }}>Quantidade:</span>
                <button onClick={() => updateQuantidade(item.id, item.quantidade - 1)} style={{ width: '26px', height: '26px', borderRadius: '7px', border: '1px solid var(--lp-border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11} /></button>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--lp-ink)', minWidth: '26px', textAlign: 'center' }}>{item.quantidade}</span>
                <button onClick={() => updateQuantidade(item.id, item.quantidade + 1)} style={{ width: '26px', height: '26px', borderRadius: '7px', border: `1.5px solid ${accentColor}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}><Plus size={11} /></button>
              </div>

              <div style={{ position: 'relative' }}>
                <Pencil size={12} style={{ position: 'absolute', left: '10px', top: '11px', color: item.observacao ? accentColor : 'var(--lp-ink-4)', pointerEvents: 'none' }} />
                <textarea value={item.observacao} onChange={e => updateObservacao(item.id, e.target.value)}
                  placeholder="Personalizacao: nome, cor, fonte, tamanho..." rows={item.observacao ? 3 : 1}
                  style={{ width: '100%', padding: '8px 10px 8px 28px', border: `1.5px solid ${item.observacao ? accentColor + '80' : 'var(--lp-border)'}`, borderRadius: '9px', fontSize: '13px', color: 'var(--lp-ink)', fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', background: item.observacao ? `${accentColor}08` : 'var(--lp-base)', lineHeight: 1.5, boxSizing: 'border-box', overflow: 'hidden' }}
                  onFocus={e => { e.target.rows = 3; e.target.style.borderColor = accentColor }}
                  onBlur={e => { if (!item.observacao) e.target.rows = 1; e.target.style.borderColor = item.observacao ? `${accentColor}80` : 'var(--lp-border)' }}
                />
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--lp-border)', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--lp-base)' }}>
            {mostrarPreco && total !== null && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--lp-ink-2)' }}>Total estimado:</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: accentColor }}>{fmt(total)}</span>
              </div>
            )}

            <button onClick={handleAbrirOrcamento} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '13px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, color: accentColor, background: 'white', border: `2px solid ${accentColor}`, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              <FileDown size={17} />{loading ? 'Carregando...' : 'Gerar orcamento (PDF)'}
            </button>

            <button onClick={handleWhatsAppOrcamento} disabled={loading || !settings?.whatsapp} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', borderRadius: '14px', fontSize: '15px', fontWeight: 700, color: 'white', background: settings?.whatsapp ? '#25D366' : 'var(--lp-ink-4)', border: 'none', cursor: (loading || !settings?.whatsapp) ? 'not-allowed' : 'pointer', boxShadow: settings?.whatsapp ? '0 6px 20px rgba(37,211,102,.35)' : 'none', opacity: loading ? 0.7 : 1 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar pelo WhatsApp
            </button>

            {!settings?.whatsapp && <p style={{ fontSize: '12px', color: 'var(--lp-ink-4)', textAlign: 'center' }}>WhatsApp nao configurado.</p>}

            <button onClick={() => setShowModal(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '13px', borderRadius: '14px', fontSize: '14px', fontWeight: 600, color: accentColor, background: 'transparent', border: `2px solid ${accentColor}44`, cursor: 'pointer' }}>
              <CheckCircle size={17} />Solicitar orcamento
            </button>

            <button onClick={clearCart} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--lp-ink-3)', padding: '4px', textAlign: 'center' }}>Limpar carrinho</button>
          </div>
        )}
      </div>

      {showModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 60, backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 61, width: '90%', maxWidth: '380px', background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', borderRadius: '20px', padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,.4)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--lp-ink)', marginBottom: '6px' }}>Identificacao</h3>
            <p style={{ fontSize: '13px', color: 'var(--lp-ink-3)', marginBottom: '20px', lineHeight: 1.5 }}>Para facilitar o contato, informe seus dados. Ambos opcionais.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <input type="text" placeholder="Seu nome (opcional)" value={clienteNome} onChange={e => setClienteNome(e.target.value)} style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--lp-border)', background: 'var(--lp-base)', color: 'var(--lp-ink)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none' }} />
              <input type="tel" placeholder="WhatsApp (opcional)" value={clienteWhatsapp} onChange={e => setClienteWhatsapp(e.target.value)} style={{ padding: '11px 14px', borderRadius: '10px', border: '1px solid var(--lp-border)', background: 'var(--lp-base)', color: 'var(--lp-ink)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--lp-border)', background: 'transparent', color: 'var(--lp-ink-2)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSolicitarOrcamento} disabled={enviando} style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: accentColor, color: 'white', fontSize: '14px', fontWeight: 700, cursor: enviando ? 'wait' : 'pointer', opacity: enviando ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={15} />{enviando ? 'Enviando...' : 'Enviar orcamento'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

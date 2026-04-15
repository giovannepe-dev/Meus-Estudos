import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!

const toSlug = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Legenda ativa por chat (enviada pelo bot VPS antes das fotos)
// chatId → { caption, expiresAt }
const activeCaption = new Map<number, { caption: string; expiresAt: number }>()

// Fila de fotos sem legenda (enviadas antes da legenda, uso manual)
// chatId → fileId[]
const pendingPhotos = new Map<number, string[]>()

const CAPTION_TTL_MS = 10 * 60 * 1000 // 10 minutos

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

function parseCaption(caption: string): { categoria: string; produto: string } | null {
  const text = caption.trim()
  if (!text) return null

  const hashMatch = text.match(/^#([\w-]+)(?:\s+(.+))?$/si)
  if (hashMatch) {
    const catRaw = hashMatch[1].replace(/-/g, ' ')
    const categoria = catRaw.charAt(0).toUpperCase() + catRaw.slice(1)
    const produto = hashMatch[2]?.trim() ?? categoria
    return { categoria, produto }
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length >= 2) return { categoria: lines[0], produto: lines.slice(1).join(' ') }
  return { categoria: lines[0], produto: lines[0] }
}

async function ensureCategory(nome: string): Promise<string> {
  const db = createAdminClient()
  const { data: existing } = await db.from('global_categories').select('id').ilike('nome', nome).maybeSingle()
  if (existing) return existing.id

  const { data: nova, error } = await db
    .from('global_categories')
    .insert({ nome, slug: toSlug(nome) + '-' + Date.now() })
    .select('id').single()

  if (error || !nova) throw new Error('Erro ao criar categoria: ' + error?.message)
  return nova.id
}

async function uploadTelegramPhoto(fileId: string): Promise<string | null> {
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`)
    const fileData = await fileRes.json()
    if (!fileData.ok) return null

    const filePath: string = fileData.result.file_path
    const imgRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`)
    if (!imgRes.ok) return null

    const buffer = await imgRes.arrayBuffer()
    const ext = filePath.split('.').pop() ?? 'jpg'
    const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
    const storagePath = `global/${Date.now()}_${fileId.slice(-8)}.${ext}`

    const db = createAdminClient()
    const { error } = await db.storage
      .from('product-images')
      .upload(storagePath, buffer, { contentType, upsert: false })

    if (error) return null

    const { data: { publicUrl } } = db.storage
      .from('product-images')
      .getPublicUrl(storagePath)

    return publicUrl
  } catch {
    return null
  }
}

async function saveProduct(fileId: string, caption: string): Promise<{ success: boolean; codigo?: number }> {
  const parsed = parseCaption(caption)
  if (!parsed) return { success: false }

  const db = createAdminClient()
  const categoriaId = await ensureCategory(parsed.categoria)

  const imagemUrl = await uploadTelegramPhoto(fileId) ?? `/api/tg-img/${fileId}`

  const { data, error } = await db.from('global_products').insert({
    nome: parsed.produto,
    slug: toSlug(parsed.produto) + '-' + Date.now(),
    categoria_id: categoriaId,
    imagem_url: imagemUrl,
    novidade: true,
    ativo: true,
    destaque: false,
  }).select('codigo').single()

  return { success: !error, codigo: data?.codigo ?? undefined }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let update: any
  try { update = await req.json() } catch { return NextResponse.json({ ok: true }) }

  const message = update?.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId: number = message.chat.id
  const caption: string = message.caption?.trim() ?? ''
  const photos: any[] = message.photo

  // ── Comandos ──
  if (message.text) {
    const text: string = message.text.trim()

    if (text === '/start' || text === '/help') {
      await sendMessage(chatId, [
        '🤖 <b>CriArt Oficina Digital Bot</b>',
        '',
        '<b>Fluxo automático (bot VPS):</b>',
        '  1. Bot envia <code>#categoria</code>',
        '  2. Bot envia foto(s) → salvas automaticamente',
        '',
        '<b>Fluxo manual:</b>',
        '  • Foto com legenda <code>#categoria nome</code>',
        '  • Ou: encaminhe fotos → depois digite <code>#categoria</code>',
        '',
        '/fila — fotos aguardando legenda',
        '/limpar — descartar fila',
      ].join('\n'))
      return NextResponse.json({ ok: true })
    }

    if (text.startsWith('/buscar')) {
      const codigoStr = text.replace('/buscar', '').trim().replace(/^#/, '')
      const codigoNum = parseInt(codigoStr, 10)
      if (!codigoNum) {
        await sendMessage(chatId, 'Use: <code>/buscar 6037</code> ou <code>/buscar #6037</code>')
        return NextResponse.json({ ok: true })
      }
      const db = createAdminClient()
      const [gRes, tRes] = await Promise.all([
        db.from('global_products').select('codigo, nome, slug, categoria:global_categories(nome)').eq('codigo', codigoNum).maybeSingle(),
        db.from('tenant_products').select('codigo, nome, slug, categoria:tenant_categories(nome)').eq('codigo', codigoNum).maybeSingle(),
      ])
      const found = gRes.data ?? tRes.data
      if (!found) {
        await sendMessage(chatId, `❌ Produto <b>#${codigoNum}</b> não encontrado no banco de dados.\n\nEsse código pode ser de um produto que foi deletado.`)
      } else {
        const cat = (found.categoria as any)?.nome ?? '—'
        await sendMessage(chatId, `✅ <b>#${found.codigo}</b> — ${found.nome}\n📁 Categoria: ${cat}`)
      }
      return NextResponse.json({ ok: true })
    }

    if (text === '/fila') {
      const qtd = pendingPhotos.get(chatId)?.length ?? 0
      const cap = activeCaption.get(chatId)
      const capText = cap && cap.expiresAt > Date.now() ? `\nLegenda ativa: <code>${cap.caption}</code>` : ''
      await sendMessage(chatId, qtd === 0
        ? `📭 Fila vazia.${capText}`
        : `📬 <b>${qtd} foto${qtd !== 1 ? 's' : ''}</b> aguardando legenda.${capText}`
      )
      return NextResponse.json({ ok: true })
    }

    if (text === '/limpar') {
      const qtd = pendingPhotos.get(chatId)?.length ?? 0
      pendingPhotos.delete(chatId)
      activeCaption.delete(chatId)
      await sendMessage(chatId, `🗑 Fila limpa. ${qtd} foto${qtd !== 1 ? 's' : ''} descartada${qtd !== 1 ? 's' : ''}.`)
      return NextResponse.json({ ok: true })
    }

    // Texto com legenda (#categoria ou nome)
    const parsed = parseCaption(text)
    if (!parsed) {
      await sendMessage(chatId, '⚠️ Formato não reconhecido.\n\nUse: <code>#categoria nome</code>')
      return NextResponse.json({ ok: true })
    }

    // 1) Se há fotos na fila → processa todas agora
    const queue = pendingPhotos.get(chatId)
    if (queue && queue.length > 0) {
      await sendMessage(chatId, `⏳ Salvando <b>${queue.length} foto${queue.length !== 1 ? 's' : ''}</b> em <b>${parsed.categoria}</b>...`)

      let ok = 0
      const codigos: number[] = []
      for (const fileId of queue) {
        const result = await saveProduct(fileId, text)
        if (result.success) { ok++; if (result.codigo) codigos.push(result.codigo) }
      }
      pendingPhotos.delete(chatId)

      // Mantém legenda ativa para fotos que ainda vêm a seguir
      activeCaption.set(chatId, { caption: text, expiresAt: Date.now() + CAPTION_TTL_MS })

      const codigoText = codigos.length > 0 ? `\n🔢 Códigos: ${codigos.join(', ')}` : ''
      await sendMessage(chatId, `✅ <b>${ok}/${queue.length}</b> produto${ok !== 1 ? 's' : ''} salvo${ok !== 1 ? 's' : ''} em <b>${parsed.categoria}</b>! 🆕${codigoText}`)
      return NextResponse.json({ ok: true })
    }

    // 2) Sem fila → ativa legenda para próximas fotos (fluxo VPS: texto vem antes da foto)
    activeCaption.set(chatId, { caption: text, expiresAt: Date.now() + CAPTION_TTL_MS })
    // Sem reply — bot VPS não espera confirmação
    return NextResponse.json({ ok: true })
  }

  // ── Foto com legenda — processa direto ──
  if (photos && photos.length > 0 && caption) {
    const fileId = photos[photos.length - 1].file_id
    const result = await saveProduct(fileId, caption)

    if (result.success) {
      const parsed = parseCaption(caption)!
      const codigoText = result.codigo ? ` | #${result.codigo}` : ''
      await sendMessage(chatId, `✅ <b>${parsed.produto}</b> → <b>${parsed.categoria}</b>${codigoText} 🆕`)
    } else {
      await sendMessage(chatId, '❌ Erro ao salvar produto.')
    }
    return NextResponse.json({ ok: true })
  }

  // ── Foto SEM legenda ──
  if (photos && photos.length > 0) {
    const fileId = photos[photos.length - 1].file_id
    const active = activeCaption.get(chatId)

    // Tem legenda ativa (enviada pelo VPS antes desta foto)
    if (active && active.expiresAt > Date.now()) {
      const result = await saveProduct(fileId, active.caption)
      if (result.success) {
        const parsed = parseCaption(active.caption)!
        const codigoText = result.codigo ? ` | #${result.codigo}` : ''
        await sendMessage(chatId, `✅ <b>${parsed.produto}</b> → <b>${parsed.categoria}</b>${codigoText} 🆕`)
      } else {
        await sendMessage(chatId, '❌ Erro ao salvar produto.')
      }
      return NextResponse.json({ ok: true })
    }

    // Sem legenda ativa → fila manual
    const queue = pendingPhotos.get(chatId) ?? []
    queue.push(fileId)
    pendingPhotos.set(chatId, queue)

    await sendMessage(chatId, [
      `📸 Foto ${queue.length} na fila.`,
      `Digite <code>#categoria nome</code> para salvar.`,
    ].join('\n'))
  }

  return NextResponse.json({ ok: true })
}

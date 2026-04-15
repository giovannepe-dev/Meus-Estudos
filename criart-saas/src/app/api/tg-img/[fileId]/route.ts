import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

export async function GET(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params

  if (!fileId) return new NextResponse('Not found', { status: 404 })

  try {
    // Tenta buscar o file_path do Telegram (cacheado por 30 dias para evitar rate limit)
    async function getFilePath(bustCache = false): Promise<string | null> {
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
        bustCache ? { cache: 'no-store' } : { next: { revalidate: 2592000 } }
      )
      const data = await res.json()
      if (!data.ok) return null
      return data.result.file_path as string
    }

    let filePath = await getFilePath()
    if (!filePath) return new NextResponse('Not found', { status: 404 })

    let imgRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`)

    // Se o download falhou, o file_path cacheado pode estar expirado — re-tenta sem cache
    if (!imgRes.ok) {
      filePath = await getFilePath(true)
      if (!filePath) return new NextResponse('Image not found', { status: 404 })
      imgRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`)
    }

    if (!imgRes.ok) return new NextResponse('Image not found', { status: 404 })

    const rawType = imgRes.headers.get('content-type') ?? ''
    const contentType = rawType.startsWith('image/') ? rawType : 'image/jpeg'
    const buffer = await imgRes.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        // CDN da Vercel cacheia por 1 ano; browser por 7 dias (evita cache poisoning por fileId reciclado)
        'Cache-Control': 'public, s-maxage=31536000, max-age=604800, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('tg-img proxy error:', err)
    return new NextResponse('Error', { status: 500 })
  }
}

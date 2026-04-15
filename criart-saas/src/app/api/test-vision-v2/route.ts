import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import {
  calculateConfidence,
  generateTags,
  generateProductName,
  PRODUCT_DICT,
} from '@/lib/product-naming-dict'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface AnalysisResult {
  tipo: string
  tema: string
  cor: string
  acabamento: string
}

async function analyzeProductImage(imageUrl: string): Promise<AnalysisResult & { rawResponse?: string }> {
  try {
    // Baixa a imagem e converte para base64
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Erro ao baixar imagem')

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mediaType = imageUrl.includes('.webp') ? 'image/webp' : 'image/jpeg'

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analise esta imagem de produto e classifique em categorias. Retorne APENAS um JSON válido sem markdown, sem explicação.

{
  "tipo": "um dos: Chaveiro, Copo, Caneca, Camiseta, Pulseira, Colar, Adesivo, Brinco, Pelúcia, Lembrancinha, Bolsa, Chinelo, Mug, Garrafa, Moletom, Boné, Almofada, Luminária, Quadro, Pôster, Acessório",
  "tema": "um dos: Urso, Ursinho, Coração, Flor, Infantil, Religioso, Geométrico, Abstrato, Fofo, Minimalista, Vintage, Moderno, Artesanal, Personalizado, Presente, Criança, Bebê, Adulto, Unissex, Feminino, Masculino, Casal (deixe vazio se não souber)",
  "cor": "um dos: Preto, Branco, Rosa, Azul, Vermelho, Verde, Amarelo, Laranja, Roxo, Cinza, Bege, Marrom, Ouro, Prata, Transparente, Colorido, Degradê (deixe vazio se não souber)",
  "acabamento": "um dos: Personalizado, Gravado, Cromado, Bordado, Estampado, Pintado, Brilhante, Fosco, Metalizado, Holográfico, Neon, Fluorescente, Resistente, Impermeável, Ecológico (deixe vazio se não souber)"
}`,
            },
          ],
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Resposta não é texto')

    const parsed = JSON.parse(content.text)
    return {
      tipo: parsed.tipo || 'Acessório',
      tema: parsed.tema || '',
      cor: parsed.cor || '',
      acabamento: parsed.acabamento || '',
      rawResponse: content.text,
    }
  } catch (err) {
    console.error('Erro ao analisar:', err)
    return {
      tipo: 'Acessório',
      tema: '',
      cor: '',
      acabamento: '',
      rawResponse: err instanceof Error ? err.message : 'Desconhecido',
    }
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()

  // 5 produtos aleatórios com imagem
  const { data: products, error } = await db
    .from('global_products')
    .select('id, nome, imagem_url, codigo')
    .not('imagem_url', 'is', null)
    .limit(5)

  if (error || !products) {
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
  }

  const results = []

  for (const product of products) {
    try {
      let fullUrl = product.imagem_url
      if (fullUrl.startsWith('/api/tg-img/')) {
        fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://laserpro.vercel.app'}${fullUrl}`
      }

      const analysis = await analyzeProductImage(fullUrl)
      const confidence = calculateConfidence(
        analysis.tipo,
        analysis.tema,
        analysis.cor,
        analysis.acabamento
      )
      const tags = generateTags(analysis.tipo, analysis.tema, analysis.cor, analysis.acabamento)
      const nomeSugerido = generateProductName(
        analysis.tipo,
        analysis.tema,
        analysis.cor,
        analysis.acabamento
      )

      results.push({
        codigo: product.codigo,
        nomeAtual: product.nome,
        analise: analysis,
        nomeSugerido,
        tags,
        confianca: confidence,
        imagem: product.imagem_url,
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      results.push({
        codigo: product.codigo,
        nomeAtual: product.nome,
        erro: err instanceof Error ? err.message : 'Desconhecido',
      })
    }
  }

  return NextResponse.json({
    message: 'Análise concluída',
    totalTestados: products.length,
    resultados: results,
  })
}

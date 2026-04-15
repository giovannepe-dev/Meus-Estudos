/**
 * Dicionário estruturado para nomeação de produtos
 * Garante consistência e evita termos estranhos
 */

export const PRODUCT_DICT = {
  // Tipos principais de produtos
  tipos: [
    'Chaveiro',
    'Copo',
    'Caneca',
    'Camiseta',
    'Pulseira',
    'Colar',
    'Adesivo',
    'Brinco',
    'Pelúcia',
    'Lembrancinha',
    'Bolsa',
    'Chinelo',
    'Mug',
    'Garrafa',
    'Moletom',
    'Boné',
    'Almofada',
    'Luminária',
    'Quadro',
    'Pôster',
    'Toca',
    'Luva',
    'Meia',
    'Carteira',
    'Placa',
    'Imã',
    'Diffusor',
    'Vela',
    'Jogo de Mesa',
    'Marcador de Livro',
  ],

  // Temas e formatos
  temas: [
    'Urso',
    'Ursinho',
    'Coração',
    'Flor',
    'Infantil',
    'Religioso',
    'Geométrico',
    'Abstrato',
    'Fofo',
    'Minimalista',
    'Vintage',
    'Moderno',
    'Artesanal',
    'Personalizado',
    'Presente',
    'Criança',
    'Bebê',
    'Adulto',
    'Unissex',
    'Feminino',
    'Masculino',
    'Casal',
  ],

  // Cores permitidas
  cores: [
    'Preto',
    'Branco',
    'Rosa',
    'Azul',
    'Vermelho',
    'Verde',
    'Amarelo',
    'Laranja',
    'Roxo',
    'Cinza',
    'Bege',
    'Marrom',
    'Ouro',
    'Prata',
    'Transparente',
    'Colorido',
    'Degradê',
  ],

  // Acabamentos e características
  acabamentos: [
    'Personalizado',
    'Gravado',
    'Cromado',
    'Bordado',
    'Estampado',
    'Pintado',
    'Brilhante',
    'Fosco',
    'Metalizado',
    'Holográfico',
    'Neon',
    'Fluorescente',
    'Resistente',
    'Impermeável',
    'Ecológico',
  ],

  // Sinônimos para busca
  sinonimos: {
    'Chaveiro': ['chaveiro', 'pendente', 'acessório de chave', 'porta-chave'],
    'Caneca': ['caneca', 'xícara', 'mug', 'taza'],
    'Copo': ['copo', 'copo de vidro', 'taça', 'recipiente'],
    'Camiseta': ['camiseta', 'tshirt', 'camisa', 'blusa'],
    'Pulseira': ['pulseira', 'bracelete', 'brazalete'],
    'Colar': ['colar', 'colinho', 'cordão', 'corrente'],
    'Pelúcia': ['pelúcia', 'bichinho de pelúcia', 'bicho de pelúcia', 'toy'],
    'Urso': ['urso', 'ursinho', 'ursão', 'bear', 'teddy'],
    'Coração': ['coração', 'love', 'amor', 'coraçãozinho'],
    'Infantil': ['infantil', 'criança', 'bebê', 'kids', 'baby'],
    'Personalizado': ['personalizado', 'customizado', 'gravado', 'com nome'],
    'Presente': ['presente', 'brinde', 'lembrancinha', 'gift'],
  },
}

/**
 * Calcula confiança da análise (0-100)
 * Com base em quantas palavras foram encontradas no dicionário
 */
export function calculateConfidence(
  tipo: string,
  tema: string,
  cor: string,
  acabamento: string
): number {
  let score = 0
  let total = 4

  if (PRODUCT_DICT.tipos.some(t => t.toLowerCase() === tipo.toLowerCase())) score += 1
  if (PRODUCT_DICT.temas.some(t => t.toLowerCase() === tema.toLowerCase())) score += 1
  if (PRODUCT_DICT.cores.some(c => c.toLowerCase() === cor.toLowerCase())) score += 1
  if (PRODUCT_DICT.acabamentos.some(a => a.toLowerCase() === acabamento.toLowerCase()))
    score += 1

  return Math.round((score / total) * 100)
}

/**
 * Gera tags baseado em tipo, tema, cor, acabamento
 */
export function generateTags(
  tipo: string,
  tema: string,
  cor: string,
  acabamento: string
): string[] {
  const tags = new Set<string>()

  // Adiciona o tipo
  if (tipo) tags.add(tipo.toLowerCase())

  // Adiciona sinônimos do tipo
  const tipoSinonimos = PRODUCT_DICT.sinonimos[tipo as keyof typeof PRODUCT_DICT.sinonimos]
  if (tipoSinonimos) tipoSinonimos.forEach(s => tags.add(s.toLowerCase()))

  // Adiciona tema e sinônimos
  if (tema) {
    tags.add(tema.toLowerCase())
    const temaSinonimos = PRODUCT_DICT.sinonimos[tema as keyof typeof PRODUCT_DICT.sinonimos]
    if (temaSinonimos) temaSinonimos.forEach(s => tags.add(s.toLowerCase()))
  }

  // Adiciona cor
  if (cor) tags.add(cor.toLowerCase())

  // Adiciona acabamento
  if (acabamento) tags.add(acabamento.toLowerCase())

  // Tags gerais
  tags.add('presente')
  tags.add('loja')

  return Array.from(tags).filter(t => t.length > 2)
}

/**
 * Gera nome estruturado
 */
export function generateProductName(
  tipo: string,
  tema: string,
  cor: string,
  acabamento: string
): string {
  const parts: string[] = [tipo]

  if (tema) parts.push(`de ${tema}`)
  if (cor) parts.push(cor)
  if (acabamento) parts.push(acabamento)

  return parts.filter(p => p && p.length > 0).join(' ')
}

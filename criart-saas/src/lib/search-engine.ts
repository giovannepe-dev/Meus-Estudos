import { PRODUCT_DICT } from './product-naming-dict'

/**
 * Expande termo de busca com sinônimos e variações
 * Exemplo: "urso" → ["urso", "ursinho", "ursão", "bear", "teddy"]
 */
export function expandSearchTerm(term: string): string[] {
  const normalized = term.toLowerCase().trim()
  const expanded = new Set<string>()

  // Adiciona o termo original
  expanded.add(normalized)

  // Adiciona plural/singular
  if (normalized.endsWith('s')) {
    expanded.add(normalized.slice(0, -1)) // Remove 's'
  } else {
    expanded.add(normalized + 's') // Adiciona 's'
  }

  // Busca sinônimos no dicionário
  const sinonimos = PRODUCT_DICT.sinonimos[term as keyof typeof PRODUCT_DICT.sinonimos]
  if (sinonimos) {
    sinonimos.forEach(s => expanded.add(s.toLowerCase()))
  }

  // Se não encontrou sinônimo direto, procura em cada categoria
  for (const categoria of Object.keys(PRODUCT_DICT)) {
    if (categoria === 'sinonimos') continue

    const items = PRODUCT_DICT[categoria as keyof typeof PRODUCT_DICT] as string[]
    for (const item of items) {
      const itemLower = item.toLowerCase()

      // Se o termo está em um item, adiciona sinônimos desse item
      if (itemLower.includes(normalized) || normalized.includes(itemLower)) {
        const itemSinonimos = PRODUCT_DICT.sinonimos[item as keyof typeof PRODUCT_DICT.sinonimos]
        if (itemSinonimos) {
          itemSinonimos.forEach(s => expanded.add(s.toLowerCase()))
        }
        expanded.add(itemLower)
      }
    }
  }

  return Array.from(expanded)
}

/**
 * Calcula score de relevância para ordenar resultados
 * - Correspondência exata = 100
 * - Começa com termo = 90
 * - Contém termo = 80
 * - Contém sinônimo = 70
 */
export function calculateRelevanceScore(
  productName: string,
  productTags: string[],
  searchTerms: string[]
): number {
  const name = productName.toLowerCase()
  const tags = productTags.map(t => t.toLowerCase())
  let maxScore = 0

  for (const term of searchTerms) {
    // Correspondência exata no nome
    if (name === term) {
      maxScore = Math.max(maxScore, 100)
    }
    // Nome começa com termo
    else if (name.startsWith(term)) {
      maxScore = Math.max(maxScore, 90)
    }
    // Nome contém termo
    else if (name.includes(term)) {
      maxScore = Math.max(maxScore, 85)
    }
    // Tag contém termo
    else if (tags.some(tag => tag.includes(term))) {
      maxScore = Math.max(maxScore, 75)
    }
    // Tag exato
    else if (tags.includes(term)) {
      maxScore = Math.max(maxScore, 80)
    }
  }

  return maxScore
}

/**
 * Filtra produtos por busca inteligente
 * Busca em nome + tags + sinônimos
 */
export function filterProductsBySearch(
  products: Array<{ nome: string; tags?: string[] }>,
  searchQuery: string
): Array<{ product: typeof products[0]; score: number }> {
  if (!searchQuery || !searchQuery.trim()) {
    return products.map(p => ({ product: p, score: 0 }))
  }

  const searchTerms = expandSearchTerm(searchQuery)

  return products
    .map(product => ({
      product,
      score: calculateRelevanceScore(product.nome, product.tags || [], searchTerms),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
}

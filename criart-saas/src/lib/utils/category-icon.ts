interface CategoryIcon {
  emoji: string
  animClass: string
}

const ICON_MAP: { keywords: string[]; emoji: string; animClass: string }[] = [
  // Caixas / embalagens
  { keywords: ['caixa', 'caixas', 'box', 'embalagem', 'embalagens'], emoji: '📦', animClass: 'cat-anim-bounce' },
  // Porta-retratos / quadros / fotos
  { keywords: ['porta-retrato', 'porta retrato', 'retrato', 'foto', 'fotos', 'quadro', 'quadros', 'painel', 'paineis'], emoji: '🖼️', animClass: 'cat-anim-float' },
  // Letras / nomes / palavras
  { keywords: ['letra', 'letras', 'nome', 'nomes', 'palavra', 'palavras', 'frase', 'frases', 'escrita'], emoji: '✍️', animClass: 'cat-anim-wiggle' },
  // Decoração
  { keywords: ['decor', 'decoração', 'decoracao', 'enfeite', 'enfeites', 'adorno'], emoji: '🎨', animClass: 'cat-anim-float' },
  // Natal
  { keywords: ['natal', 'natalino', 'natalina', 'natalinos', 'christmas', 'arvore'], emoji: '🎄', animClass: 'cat-anim-bounce' },
  // Páscoa
  { keywords: ['pascoa', 'páscoa', 'easter', 'coelho', 'ovo', 'ovos'], emoji: '🐰', animClass: 'cat-anim-bounce' },
  // Mãe / Dia das Mães
  { keywords: ['mae', 'mãe', 'maes', 'mães', 'mother', 'mamãe', 'mamae'], emoji: '🌸', animClass: 'cat-anim-pulse' },
  // Casamento
  { keywords: ['casamento', 'wedding', 'noiva', 'noivo', 'bodas', 'noivado'], emoji: '💍', animClass: 'cat-anim-float' },
  // Formatura
  { keywords: ['formatura', 'formando', 'diploma', 'graduação', 'graduacao'], emoji: '🎓', animClass: 'cat-anim-bounce' },
  // Brindes / presentes
  { keywords: ['brinde', 'brindes', 'presente', 'presentes', 'gift', 'lembrança', 'lembrancas'], emoji: '🎁', animClass: 'cat-anim-bounce' },
  // Nécessaire / estojo / joias
  { keywords: ['necessaire', 'estojo', 'estojinho', 'porta-joias', 'joias', 'joia', 'bijou'], emoji: '💄', animClass: 'cat-anim-wiggle' },
  // Chaveiro / chaves
  { keywords: ['chave', 'chaves', 'porta-chave', 'chaveiro', 'chaveiros'], emoji: '🔑', animClass: 'cat-anim-wiggle' },
  // Infantil / bebê
  { keywords: ['infantil', 'infantis', 'criança', 'crianças', 'criança', 'bebe', 'bebê', 'kids', 'kid', 'toy', 'brinquedo'], emoji: '🧸', animClass: 'cat-anim-bounce' },
  // MDF / madeira
  { keywords: ['mdf', 'madeira', 'pinus', 'compensado', 'wood'], emoji: '🪵', animClass: 'cat-anim-float' },
  // Acrílico
  { keywords: ['acrilico', 'acrílico', 'acrylic', 'espelhado'], emoji: '✨', animClass: 'cat-anim-pulse' },
  // Placa / letreiro
  { keywords: ['placa', 'placas', 'letreiro', 'letreiros', 'aviso'], emoji: '🏷️', animClass: 'cat-anim-float' },
  // Bandeja
  { keywords: ['bandeja', 'bandejas', 'prato', 'travessa'], emoji: '🍽️', animClass: 'cat-anim-float' },
  // Velas
  { keywords: ['vela', 'velas', 'porta-vela', 'castical', 'castiçal', 'velinha'], emoji: '🕯️', animClass: 'cat-anim-pulse' },
  // Animais / pets
  { keywords: ['animal', 'animais', 'pet', 'cachorro', 'gato', 'bicho'], emoji: '🐾', animClass: 'cat-anim-bounce' },
  // Flores
  { keywords: ['flor', 'flores', 'flower', 'floreira', 'flora'], emoji: '🌺', animClass: 'cat-anim-float' },
  // Festa / aniversário
  { keywords: ['festa', 'festas', 'party', 'aniversário', 'aniversario', 'comemoracao', 'comemoração'], emoji: '🎉', animClass: 'cat-anim-bounce' },
  // Religioso
  { keywords: ['religios', 'santo', 'santa', 'deus', 'cruz', 'oracao', 'oração', 'terço', 'terco', 'sagrado'], emoji: '🕊️', animClass: 'cat-anim-pulse' },
  // Amor / coração / namorados
  { keywords: ['amor', 'coração', 'coracao', 'love', 'heart', 'namorado', 'namorada', 'apaixon', 'romance'], emoji: '❤️', animClass: 'cat-anim-pulse' },
  // Casa / lar
  { keywords: ['casa', 'lar', 'home', 'residencia', 'residência', 'moradia'], emoji: '🏡', animClass: 'cat-anim-float' },
  // Porta-caneta / escritório
  { keywords: ['escritório', 'escritorio', 'caneta', 'lapís', 'lapis', 'porta-lapis', 'porta-caneta'], emoji: '✏️', animClass: 'cat-anim-wiggle' },
  // Utensílios / cozinha
  { keywords: ['cozinha', 'utensilio', 'utensílio', 'colher', 'garfo', 'faca'], emoji: '🍳', animClass: 'cat-anim-float' },
  // Cerveja / happy hour / bar
  { keywords: ['cerveja', 'bar', 'churrasco', 'happy', 'boteco', 'bebida'], emoji: '🍺', animClass: 'cat-anim-bounce' },
  // Porta-guardanapo
  { keywords: ['guardanapo', 'porta-guardanapo', 'mesa posta', 'jantar'], emoji: '🍽️', animClass: 'cat-anim-float' },
  // Espelho
  { keywords: ['espelho', 'espelhos', 'mirror'], emoji: '🪞', animClass: 'cat-anim-float' },
  // Porta-retrato magnético / ímã / geladeira
  { keywords: ['imã', 'ima', 'magnético', 'magnetico', 'geladeira'], emoji: '🧲', animClass: 'cat-anim-wiggle' },
  // Agenda / caderno
  { keywords: ['agenda', 'caderno', 'organizador', 'notebook'], emoji: '📓', animClass: 'cat-anim-float' },
  // Kit / conjunto
  { keywords: ['kit', 'conjunto', 'set', 'combo'], emoji: '🗂️', animClass: 'cat-anim-float' },
]

export function getCategoryIcon(nome: string): CategoryIcon {
  const lower = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  for (const entry of ICON_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return { emoji: entry.emoji, animClass: entry.animClass }
    }
  }

  // Fallback inteligente baseado na primeira letra
  const fallbacks = ['🎯', '🌟', '💫', '🔮', '🎀', '🏅', '🎪', '🌈']
  const idx = nome.charCodeAt(0) % fallbacks.length
  return { emoji: fallbacks[idx], animClass: 'cat-anim-float' }
}

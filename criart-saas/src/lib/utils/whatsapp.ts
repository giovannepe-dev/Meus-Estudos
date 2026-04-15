export function formatWhatsAppMessage(payload: any): string {
  const { settings, items, totalEstimado, mostrarPreco } = payload
  const linhas: string[] = []
  linhas.push(settings?.mensagem_padrao || 'Olá! Gostaria de fazer um orçamento:')
  linhas.push('', '📋 *Itens do pedido:*', '')
  items.forEach((item: any, idx: number) => {
    linhas.push(`*${idx + 1}. ${item.nome}*`)
    if (item.categoria) linhas.push(`   📂 ${item.categoria}`)
    if (item.arquivo) linhas.push(`   📄 Arquivo: ${item.arquivo}`)
    if (item.tags?.length) linhas.push(`   🏷️ ${item.tags.join(', ')}`)
    if (item.imagem_url) linhas.push(`   🖼️ ${item.imagem_url}`)
    linhas.push(`   🔢 Quantidade: ${item.quantidade}`)
    if (mostrarPreco && item.preco) linhas.push(`   💰 Unit.: ${fmt(item.preco)} | Total: ${fmt(item.preco * item.quantidade)}`)
    if (item.observacao) linhas.push(`   📝 Obs.: ${item.observacao}`)
    linhas.push('')
  })
  if (mostrarPreco && totalEstimado !== null) linhas.push(`💵 *Total estimado: ${fmt(totalEstimado)}*`, '')
  linhas.push('Aguardo retorno. Obrigado! 🙏')
  return linhas.join('\n')
}
export function buildWhatsAppURL(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`
}
function fmt(v: number) { return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v) }

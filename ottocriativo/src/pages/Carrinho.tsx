import { useCart } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2, MessageCircle, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Carrinho = () => {
  const { items, updateQuantity, removeItem, updateObservacao, clearCart } = useCart();
  const { data: settings } = useSiteSettings();
  const [observacaoGeral, setObservacaoGeral] = useState("");

  const total = items.reduce((sum, item) => sum + (item.preco ?? 0) * item.quantidade, 0);

  const finalizarWhatsApp = () => {
    const whatsapp = settings?.whatsapp ?? "";
    const saudacao = settings?.mensagem_padrao ?? "Olá! Gostaria de fazer um orçamento:";

    let msg = `${saudacao}\n\n`;
    msg += `📋 *Pedido de Orçamento*\n\n`;

    items.forEach((item, i) => {
      msg += `${i + 1}. *${item.nome}*\n`;
      msg += `   📁 Arquivo: ${item.arquivo || "N/A"}\n`;
      msg += `   📂 Categoria: ${item.categoria || "N/A"}\n`;
      msg += `   📦 Quantidade: ${item.quantidade}\n`;
      if (settings?.mostrar_preco && item.preco != null) {
        msg += `   💰 Preço unit.: R$ ${item.preco.toFixed(2).replace(".", ",")}\n`;
      }
      if (item.observacao) {
        msg += `   📝 Obs: ${item.observacao}\n`;
      }
      msg += `\n`;
    });

    if (settings?.mostrar_preco && total > 0) {
      msg += `💰 *Total estimado: R$ ${total.toFixed(2).replace(".", ",")}*\n\n`;
    }

    if (observacaoGeral) {
      msg += `📝 *Observações gerais:*\n${observacaoGeral}\n`;
    }

    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-6">Adicione produtos do catálogo para solicitar um orçamento</p>
        <Button asChild className="rounded-full">
          <Link to="/catalogo">Ver Catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="font-display text-3xl font-bold mb-6">Carrinho</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.id} className="bg-card rounded-2xl border p-4 flex gap-4">
            <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
              {item.imagem_url ? (
                <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-display text-lg">
                  {item.nome[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-semibold text-sm">{item.nome}</h3>
                  <p className="text-xs text-muted-foreground">{item.categoria} • {item.arquivo}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => updateQuantity(item.id, item.quantidade - 1)} className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-medium w-8 text-center">{item.quantidade}</span>
                <button onClick={() => updateQuantity(item.id, item.quantidade + 1)} className="h-7 w-7 rounded-full border flex items-center justify-center hover:bg-muted transition-colors">
                  <Plus className="h-3 w-3" />
                </button>
                {settings?.mostrar_preco && item.preco != null && (
                  <span className="ml-auto text-sm font-semibold text-primary">
                    R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
                  </span>
                )}
              </div>
              <Input
                placeholder="Observação sobre este item..."
                value={item.observacao}
                onChange={(e) => updateObservacao(item.id, e.target.value)}
                className="mt-2 text-xs h-8 rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg">Resumo do Orçamento</h2>
        <p className="text-sm text-muted-foreground">{items.length} item(ns) • {items.reduce((s, i) => s + i.quantidade, 0)} unidade(s)</p>
        
        {settings?.mostrar_preco && total > 0 && (
          <div className="flex justify-between items-center border-t pt-4">
            <span className="font-medium">Total estimado</span>
            <span className="font-display text-xl font-bold text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
        )}

        <Textarea
          placeholder="Observações gerais do pedido..."
          value={observacaoGeral}
          onChange={(e) => setObservacaoGeral(e.target.value)}
          className="rounded-xl"
        />

        <Button onClick={finalizarWhatsApp} size="lg" className="w-full rounded-full font-display font-semibold">
          <MessageCircle className="mr-2 h-5 w-5" /> Finalizar pelo WhatsApp
        </Button>

        <button onClick={clearCart} className="w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors">
          Limpar carrinho
        </button>
      </div>
    </div>
  );
};

export default Carrinho;

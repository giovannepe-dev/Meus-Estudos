import { useParams } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Share2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Produto = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug ?? "");
  const { data: settings } = useSiteSettings();
  const { addItem } = useCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="aspect-square bg-muted rounded-2xl max-w-lg" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg text-muted-foreground">Produto não encontrado</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/catalogo">Voltar ao catálogo</Link>
        </Button>
      </div>
    );
  }

  const handleAdd = () => {
    addItem({
      id: product.id,
      nome: product.nome,
      arquivo: product.arquivo ?? "",
      categoria: product.categories?.nome ?? "",
      preco: product.preco,
      imagem_url: product.imagem_url,
    });
    toast.success(`${product.nome} adicionado ao carrinho`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden bg-muted aspect-square">
          {product.imagem_url ? (
            <img src={product.imagem_url} alt={product.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-display text-muted-foreground/20">
              {product.nome[0]}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          {product.categories && (
            <Link to={`/categoria/${product.categories.slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {product.categories.emoji} {product.categories.nome}
            </Link>
          )}
          <h1 className="font-display text-3xl font-bold mt-1 mb-3">{product.nome}</h1>
          
          {product.descricao && <p className="text-muted-foreground mb-4">{product.descricao}</p>}
          
          {product.arquivo && (
            <p className="text-sm text-muted-foreground/70 mb-2">📁 Arquivo: {product.arquivo}</p>
          )}

          {settings?.mostrar_preco && product.preco != null && (
            <p className="font-display text-2xl font-bold text-primary mb-4">
              R$ {product.preco.toFixed(2).replace(".", ",")}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {product.destaque && <span className="bg-secondary/20 text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full">⭐ Destaque</span>}
            {product.novidade && <span className="bg-accent/20 text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">🆕 Novidade</span>}
            {product.personalizavel && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">✨ Personalizável</span>}
          </div>

          {product.product_tags && product.product_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-6">
              {product.product_tags.map((t) => (
                <span key={t.tag} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{t.tag}</span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleAdd} size="lg" className="rounded-full flex-1 font-display">
              <ShoppingCart className="mr-2 h-4 w-4" /> Adicionar ao Carrinho
            </Button>
            <Button onClick={handleShare} variant="outline" size="lg" className="rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Produto;

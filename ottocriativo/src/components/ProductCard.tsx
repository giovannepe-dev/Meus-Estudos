import { motion } from "framer-motion";
import { Plus, Star, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  nome: string;
  descricao: string | null;
  arquivo: string | null;
  imagem_url: string | null;
  preco: number | null;
  destaque: boolean;
  novidade: boolean;
  personalizavel: boolean;
  slug: string;
  categoria?: { nome: string; slug: string; emoji: string | null } | null;
  tags?: { tag: string }[];
}

export function ProductCard({ id, nome, descricao, arquivo, imagem_url, preco, destaque, novidade, personalizavel, slug, categoria, tags }: ProductCardProps) {
  const { addItem } = useCart();
  const { data: settings } = useSiteSettings();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Excluir "${nome}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Produto excluído");
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      nome,
      arquivo: arquivo ?? "",
      categoria: categoria?.nome ?? "",
      preco,
      imagem_url,
    });
    toast.success(`${nome} adicionado ao carrinho`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/produto/${slug}`} className="block group">
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          {/* Image */}
          <div className="relative aspect-square bg-muted overflow-hidden">
            {imagem_url ? (
              <img src={imagem_url} alt={nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <span className="text-4xl font-display">{nome[0]}</span>
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {destaque && (
                <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" /> Destaque
                </span>
              )}
              {novidade && (
                <span className="bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                  Novo
                </span>
              )}
              {personalizavel && (
                <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                  Personalizável
                </span>
              )}
            </div>
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg hover:bg-destructive/90 z-10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
          </div>

          {/* Info */}
          <div className="p-4">
            {categoria && (
              <p className="text-xs text-muted-foreground mb-1">
                {categoria.emoji} {categoria.nome}
              </p>
            )}
            <h3 className="font-display font-semibold text-sm line-clamp-1">{nome}</h3>
            {descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{descricao}</p>}
            {arquivo && <p className="text-xs text-muted-foreground/60 mt-1">📁 {arquivo}</p>}
            
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                {settings?.mostrar_preco && preco != null ? (
                  <span className="font-display font-bold text-primary truncate">
                    R$ {preco.toFixed(2).replace(".", ",")}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground truncate">Sob consulta</span>
                )}
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center shrink-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-transform hover:scale-110"
                  aria-label={`Adicionar ${nome} ao carrinho`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.slice(0, 3).map((t) => (
                  <span key={t.tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                    {t.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

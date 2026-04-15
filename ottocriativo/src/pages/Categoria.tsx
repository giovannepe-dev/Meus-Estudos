import { useParams } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Categoria = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories } = useCategories();
  const category = categories?.find((c) => c.slug === slug);

  const { data: products, isLoading } = useProducts({
    categoriaId: category?.id,
    enabled: !!category,
  });

  if (!category && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-lg text-muted-foreground">Categoria não encontrada</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          {category?.emoji} {category?.nome}
        </h1>
        {category?.descricao && <p className="text-muted-foreground mt-2">{category.descricao}</p>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} {...p} categoria={p.categories} tags={p.product_tags} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-20">Nenhum produto nesta categoria</p>
      )}
    </div>
  );
};

export default Categoria;

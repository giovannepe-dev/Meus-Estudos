import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, Sparkles, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductCard } from "@/components/ProductCard";
import { motion } from "framer-motion";

const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [filterDestaque, setFilterDestaque] = useState(false);
  const [filterNovidade, setFilterNovidade] = useState(false);

  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({
    search: search || undefined,
    categoriaId: selectedCategory,
    destaque: filterDestaque || undefined,
    novidade: filterNovidade || undefined,
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Catálogo</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, descrição, arquivo ou tags..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 rounded-full bg-card"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={!selectedCategory && !filterDestaque && !filterNovidade ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => { setSelectedCategory(undefined); setFilterDestaque(false); setFilterNovidade(false); }}
        >
          Todos
        </Button>
        <Button
          variant={filterDestaque ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => { setFilterDestaque(!filterDestaque); setFilterNovidade(false); }}
        >
          <Sparkles className="h-3 w-3 mr-1" /> Destaques
        </Button>
        <Button
          variant={filterNovidade ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => { setFilterNovidade(!filterNovidade); setFilterDestaque(false); }}
        >
          <Clock className="h-3 w-3 mr-1" /> Novidades
        </Button>
        <div className="w-px bg-border mx-1" />
        {categories
          ?.filter((cat) =>
            !search || cat.nome.toLowerCase().includes(search.toLowerCase())
          )
          .map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? undefined : cat.id)}
            >
              {cat.emoji} {cat.nome}
            </Button>
          ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              {...p}
              categoria={p.categories}
              tags={p.product_tags}
            />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">Nenhum produto encontrado</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Tente outra busca ou filtro</p>
        </div>
      )}
    </div>
  );
};

export default Catalogo;

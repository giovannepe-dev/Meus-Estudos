import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Package, Star, CheckCircle, Sparkles } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { VitrineCard } from "@/components/VitrineCard";
import { useTenantFilter } from "@/hooks/useTenantFilter";

const AdminDashboard = () => {
  const { tenantId, applyPublicFilter } = useTenantFilter();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats", tenantId],
    queryFn: async () => {
      let catsQuery = supabase.from("categories").select("id", { count: "exact", head: true });
      let prodsQuery = supabase.from("products").select("id, destaque, ativo", { count: "exact" });
      catsQuery = applyPublicFilter(catsQuery);
      prodsQuery = applyPublicFilter(prodsQuery);

      const [cats, prods] = await Promise.all([catsQuery, prodsQuery]);
      const products = prods.data ?? [];
      return {
        totalCategorias: cats.count ?? 0,
        totalProdutos: prods.count ?? 0,
        totalDestaques: products.filter((p) => p.destaque).length,
        totalAtivos: products.filter((p) => p.ativo).length,
      };
    },
  });

  const { data: destaques } = useQuery({
    queryKey: ["admin-destaques", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, nome, imagem_url, slug")
        .eq("destaque", true)
        .eq("ativo", true)
        .order("ordem")
        .limit(12);
      query = applyPublicFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: novidades } = useQuery({
    queryKey: ["admin-novidades", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, nome, imagem_url, slug")
        .eq("novidade", true)
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(12);
      query = applyPublicFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const cards = [
    { label: "Categorias", value: stats?.totalCategorias ?? 0, icon: FolderOpen, color: "text-accent" },
    { label: "Produtos", value: stats?.totalProdutos ?? 0, icon: Package, color: "text-primary" },
    { label: "Destaques", value: stats?.totalDestaques ?? 0, icon: Star, color: "text-secondary" },
    { label: "Ativos", value: stats?.totalAtivos ?? 0, icon: CheckCircle, color: "text-accent" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>

      {/* Vitrine Link */}
      <VitrineCard />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Destaques Carousel */}
      {destaques && destaques.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-secondary" />
            <h2 className="font-display text-xl font-bold">Destaques</h2>
          </div>
          <div className="px-10">
            <Carousel opts={{ align: "start", loop: true }}>
              <CarouselContent>
                {destaques.map((p) => (
                  <CarouselItem key={p.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <Card className="overflow-hidden">
                      <div className="aspect-square bg-muted">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Sem imagem
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium line-clamp-2">{p.nome}</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      )}

      {/* Novidades Carousel */}
      {novidades && novidades.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Novidades</h2>
          </div>
          <div className="px-10">
            <Carousel opts={{ align: "start", loop: true }}>
              <CarouselContent>
                {novidades.map((p) => (
                  <CarouselItem key={p.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <Card className="overflow-hidden">
                      <div className="aspect-square bg-muted">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Sem imagem
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium line-clamp-2">{p.nome}</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

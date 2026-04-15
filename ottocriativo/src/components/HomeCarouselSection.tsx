import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import type { HomeCarousel } from "@/hooks/useHomeCarousels";

interface Props {
  carousel: HomeCarousel;
}

export function HomeCarouselSection({ carousel }: Props) {
  const { data: products } = useQuery({
    queryKey: ["home-carousel-products", carousel.id, carousel.tipo, carousel.categoria_id],
    queryFn: async () => {
      if (carousel.tipo === "destaques") {
        // Fetch featured category IDs first
        const { data: featCats } = await supabase
          .from("categories")
          .select("id")
          .eq("destaque", true)
          .eq("ativa", true);
        const featCatIds = (featCats ?? []).map((c: any) => c.id);

        let query = supabase
          .from("products")
          .select("*, categories(nome, slug, emoji), product_tags(tag)")
          .eq("ativo", true);

        if (featCatIds.length > 0) {
          // Products flagged as destaque OR belonging to a featured category
          query = query.or(`destaque.eq.true,categoria_id.in.(${featCatIds.join(",")})`);
        } else {
          query = query.eq("destaque", true);
        }

        const { data, error } = await query.order("ordem").limit(12);
        if (error) throw error;
        return data ?? [];
      }

      let query = supabase
        .from("products")
        .select("*, categories(nome, slug, emoji), product_tags(tag)")
        .eq("ativo", true);

      if (carousel.tipo === "novidades") {
        query = query.eq("novidade", true).order("created_at", { ascending: false });
      } else if (carousel.tipo === "categoria" && carousel.categoria_id) {
        query = query.eq("categoria_id", carousel.categoria_id).order("ordem");
      }

      const { data, error } = await query.limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!products || products.length === 0) return null;

  return (
    <section className="mx-auto px-1 md:px-4 py-8">
      <h2 className="font-display text-xl md:text-2xl font-bold mb-5 px-1">
        {carousel.titulo}
      </h2>
      <div className="md:px-10 [&_.embla]:overflow-visible">
        <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}>
          <CarouselContent className="-ml-1.5 sm:-ml-2 md:-ml-4">
            {products.map((p) => (
              <CarouselItem key={p.id} className="pl-1.5 sm:pl-2 md:pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <ProductCard {...p} categoria={p.categories} tags={p.product_tags} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
}

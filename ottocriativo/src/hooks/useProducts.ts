import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantFilter } from "./useTenantFilter";

interface UseProductsOptions {
  categoriaId?: string;
  destaque?: boolean;
  novidade?: boolean;
  search?: string;
  onlyActive?: boolean;
  enabled?: boolean;
}

export function useProducts(opts: UseProductsOptions = {}) {
  const { categoriaId, destaque, novidade, search, onlyActive = true, enabled = true } = opts;
  const { tenantId, applyPublicFilter } = useTenantFilter();

  return useQuery({
    queryKey: ["products", opts, tenantId],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(nome, slug, emoji), product_tags(tag)")
        .order("ordem");

      if (onlyActive) query = query.eq("ativo", true);
      if (categoriaId) query = query.eq("categoria_id", categoriaId);
      if (destaque) query = query.eq("destaque", true);
      if (novidade) query = query.eq("novidade", true);
      if (search) {
        query = query.or(
          `nome.ilike.%${search}%,descricao.ilike.%${search}%,arquivo.ilike.%${search}%`
        );
      }
      query = applyPublicFilter(query);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProduct(slug: string) {
  const { tenantId, applyPublicFilter } = useTenantFilter();

  return useQuery({
    queryKey: ["product", slug, tenantId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(nome, slug, emoji), product_tags(tag)")
        .eq("slug", slug);
      query = applyPublicFilter(query);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

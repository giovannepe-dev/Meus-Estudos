import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantFilter } from "./useTenantFilter";

export interface HomeCarousel {
  id: string;
  titulo: string;
  emoji: string | null;
  tipo: string;
  categoria_id: string | null;
  ativo: boolean;
  ordem: number;
}

export function useHomeCarousels() {
  const { tenantId, applyPublicFilter } = useTenantFilter();

  return useQuery({
    queryKey: ["home-carousels", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("home_carousels")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      query = applyPublicFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as HomeCarousel[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllHomeCarousels() {
  const { tenantId, applyPublicFilter } = useTenantFilter();

  return useQuery({
    queryKey: ["home-carousels-all", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("home_carousels")
        .select("*, categories(nome, emoji)")
        .order("ordem");
      query = applyPublicFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantFilter } from "./useTenantFilter";

export function useCategories(onlyActive = true) {
  const { tenantId, applyPublicFilter } = useTenantFilter();

  return useQuery({
    queryKey: ["categories", onlyActive, tenantId],
    queryFn: async () => {
      let query = supabase.from("categories").select("*").order("nome");
      if (onlyActive) query = query.eq("ativa", true);
      query = applyPublicFilter(query);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

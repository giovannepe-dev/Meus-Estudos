import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantFilter } from "./useTenantFilter";

export function useSiteSettings() {
  const { tenantId, applyTenantFilter } = useTenantFilter();

  return useQuery({
    queryKey: ["site-settings", tenantId],
    queryFn: async () => {
      let query = supabase.from("site_settings").select("*").limit(1);
      // Site settings are tenant-specific, not shared with master
      query = applyTenantFilter(query);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

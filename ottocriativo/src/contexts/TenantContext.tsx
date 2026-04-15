import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Tenant {
  id: string;
  nome: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  owner_id: string | null;
  telegram_chat_id: number | null;
  ativo: boolean;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  tenantId: null,
  loading: true,
  error: null,
});

export function useTenant() {
  return useContext(TenantContext);
}

/**
 * Resolves the current tenant by:
 * 1. Checking URL path for /loja/:slug pattern
 * 2. Checking hostname against custom_domain (only storefront routes)
 * 3. Resolving admin tenant by logged user ownership
 * 4. Falling back to null for global/public routes
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  const resolveTenant = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hostname = window.location.hostname;
      const pathname = location.pathname;
      const isCreateStoreRoute = pathname === "/criar-loja";
      const isAdminRoute = pathname.startsWith("/admin");
      const isSuperAdminRoute = pathname.startsWith("/super-admin");
      const isBackofficeRoute = isAdminRoute || isSuperAdminRoute;

      // 1. /criar-loja must always be a global standalone page
      if (isCreateStoreRoute) {
        setTenant(null);
        setLoading(false);
        return;
      }

      // 2. Check /loja/:slug pattern
      const slugMatch = pathname.match(/^\/loja\/([^/]+)/);
      if (slugMatch) {
        const slug = slugMatch[1];
        const { data, error: err } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", slug)
          .eq("ativo", true)
          .maybeSingle();

        if (err) throw err;
        if (!data) {
          setError("Loja não encontrada");
          setLoading(false);
          return;
        }
        setTenant(data as Tenant);
        setLoading(false);
        return;
      }

      // 3. Check custom domain only for storefront pages
      const isLocalOrLovable =
        hostname === "localhost" ||
        hostname.endsWith(".lovable.app") ||
        hostname.endsWith(".lovable.dev");

      if (!isBackofficeRoute && !isLocalOrLovable) {
        const { data, error: err } = await supabase
          .from("tenants")
          .select("*")
          .eq("custom_domain", hostname)
          .eq("ativo", true)
          .maybeSingle();

        if (err) throw err;
        if (data) {
          setTenant(data as Tenant);
          setLoading(false);
          return;
        }
      }

      // 4. For admin routes, resolve tenant by logged-in owner's user id
      if (isAdminRoute) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;

        if (userId) {
          const { data: ownedTenant, error: err } = await supabase
            .from("tenants")
            .select("*")
            .eq("owner_id", userId)
            .maybeSingle();

          if (err) throw err;
          if (ownedTenant) {
            setTenant(ownedTenant as Tenant);
            setLoading(false);
            return;
          }
        }
      }

      // 5. Global mode (no tenant)
      setTenant(null);
      setLoading(false);
    } catch (err: any) {
      console.error("Tenant resolution error:", err);
      setError(err.message || "Erro ao resolver tenant");
      setTenant(null);
      setLoading(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    void resolveTenant();
  }, [resolveTenant]);

  return (
    <TenantContext.Provider value={{ tenant, tenantId: tenant?.id ?? null, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

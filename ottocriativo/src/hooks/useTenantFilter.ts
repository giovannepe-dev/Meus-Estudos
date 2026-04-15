import { useTenant } from "@/contexts/TenantContext";

/**
 * Returns tenant context and a helper to apply tenant_id filter.
 * For public-facing queries: shows master catalog (tenant_id IS NULL) + tenant's own data.
 * For admin queries: shows only the tenant's own data.
 */
export function useTenantFilter() {
  const { tenantId } = useTenant();

  /**
   * Filters for master + tenant data (public catalog view).
   * Uses .or() to show items where tenant_id is null OR matches the current tenant.
   */
  function applyPublicFilter(query: any): any {
    if (tenantId) {
      return query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    }
    return query;
  }

  /**
   * Filters for tenant-only data (admin management).
   */
  function applyTenantFilter(query: any): any {
    if (tenantId) {
      return query.eq("tenant_id", tenantId);
    }
    return query;
  }

  return { tenantId, applyPublicFilter, applyTenantFilter };
}

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Cached tenant query for storefront pages
 * React.cache deduplicates calls within a single render tree
 * - First call: fetches from Supabase
 * - Subsequent calls: returns cached result instantly
 */
export const getTenantBySlug = cache(async (tenantSlug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('*, settings:tenant_settings(*)')
    .eq('slug', tenantSlug)
    .in('status', ['active', 'trial'])
    .single()
  return data
})

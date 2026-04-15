import { createClient as c } from '@supabase/supabase-js'
export function createAdminClient() {
  return c(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
}

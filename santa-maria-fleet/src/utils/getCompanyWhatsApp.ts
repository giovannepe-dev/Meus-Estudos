import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the company WhatsApp number for the current user.
 * First checks companies.telefone (new), falls back to settings.whatsapp_admin (legacy).
 */
export async function getCompanyWhatsApp(): Promise<string | null> {
  // Try company phone first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (profile?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("telefone")
      .eq("id", profile.company_id)
      .single();

    if (company?.telefone) return company.telefone;
  }

  // Fallback to legacy settings
  const { data: settings } = await supabase
    .from("settings")
    .select("whatsapp_admin")
    .limit(1)
    .single();

  return settings?.whatsapp_admin || null;
}

import { supabase } from "@/integrations/supabase/client";
import { loadLogoCompressed } from "@/utils/pdfImageUtils";

/**
 * Fetches the company logo for the current user.
 * Returns base64 of company logo_url if set, otherwise empty string (no logo).
 * Never falls back to the master app logo.
 */
export const loadCompanyLogoBase64 = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.company_id) return "";

  const { data: company } = await supabase
    .from("companies")
    .select("logo_url")
    .eq("id", profile.company_id)
    .single();

  if (!company?.logo_url) return "";

  return loadLogoCompressed(company.logo_url);
};

/**
 * Fetches company name for PDF headers.
 */
export const getCompanyName = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "SmartFrota";

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.company_id) return "SmartFrota";

  const { data: company } = await supabase
    .from("companies")
    .select("nome")
    .eq("id", profile.company_id)
    .single();

  return company?.nome || "SmartFrota";
};

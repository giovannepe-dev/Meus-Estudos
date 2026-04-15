import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDriverTracking } from "./useDriverTracking";

/**
 * Hook that automatically tracks the driver's location
 * when they have an active (open) checkout and tracking is enabled.
 */
export function useAutoTracking(userId: string | undefined, companyId: string | undefined) {
  const [activeCheckoutId, setActiveCheckoutId] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const checkActiveCheckout = useCallback(async () => {
    if (!userId || !companyId) return;

    // Check if tracking is enabled for company
    const { data: settings } = await supabase
      .from("settings")
      .select("rastreamento_ativo")
      .eq("company_id", companyId)
      .limit(1)
      .single();

    const enabled = !!(settings as any)?.rastreamento_ativo;
    setTrackingEnabled(enabled);

    if (!enabled) {
      setActiveCheckoutId(null);
      return;
    }

    // Check if driver has an open checkout
    const { data: checkout } = await supabase
      .from("checkouts")
      .select("id")
      .eq("motorista_id", userId)
      .eq("status", "aberto")
      .limit(1)
      .single();

    setActiveCheckoutId(checkout?.id || null);
  }, [userId, companyId]);

  useEffect(() => {
    checkActiveCheckout();
    // Re-check periodically (e.g. when coming back to checkout page)
    const interval = setInterval(checkActiveCheckout, 60_000);
    return () => clearInterval(interval);
  }, [checkActiveCheckout]);

  // Start tracking if there's an active checkout
  useDriverTracking(
    activeCheckoutId,
    companyId || null,
    userId || null,
    trackingEnabled && !!activeCheckoutId
  );

  return { activeCheckoutId, trackingEnabled, refresh: checkActiveCheckout };
}

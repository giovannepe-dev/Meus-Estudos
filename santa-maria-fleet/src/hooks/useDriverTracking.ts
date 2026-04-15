import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const INTERVAL_MS = 30_000; // send location every 30s

export function useDriverTracking(
  checkoutId: string | null,
  companyId: string | null,
  motoristaId: string | null,
  enabled: boolean
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendLocation = useCallback(async () => {
    if (!checkoutId || !companyId || !motoristaId) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await supabase.from("driver_locations" as any).insert({
          checkout_id: checkoutId,
          company_id: companyId,
          motorista_id: motoristaId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        } as any);
      },
      (err) => console.warn("Geolocation error:", err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [checkoutId, companyId, motoristaId]);

  useEffect(() => {
    if (!enabled || !checkoutId) return;

    // Send immediately
    sendLocation();

    // Then every 30s
    intervalRef.current = setInterval(sendLocation, INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, checkoutId, sendLocation]);
}

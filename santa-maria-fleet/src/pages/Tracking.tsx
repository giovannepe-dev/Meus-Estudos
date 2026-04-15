import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, RefreshCw, Navigation, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "leaflet/dist/leaflet.css";

interface DriverMarker {
  checkout_id: string;
  motorista_id: string;
  motorista_nome: string;
  veiculo_placa: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
}

const Tracking: React.FC = () => {
  const { profile } = useAuth();
  const [markers, setMarkers] = useState<DriverMarker[]>([]);
  const [trails, setTrails] = useState<Record<string, [number, number][]>>({});
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);
  const leafletPolylinesRef = useRef<any[]>([]);

  const fetchSettings = useCallback(async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("settings")
      .select("rastreamento_ativo")
      .eq("company_id", profile.company_id)
      .limit(1)
      .single();
    setTrackingEnabled(!!(data as any)?.rastreamento_ativo);
  }, [profile?.company_id]);

  const fetchLocations = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);

    const { data: checkouts } = await supabase
      .from("checkouts")
      .select("id, motorista_id, veiculo_id")
      .eq("company_id", profile.company_id)
      .eq("status", "aberto");

    if (!checkouts || checkouts.length === 0) {
      setMarkers([]);
      setLoading(false);
      return;
    }

    const results: DriverMarker[] = [];
    const trailData: Record<string, [number, number][]> = {};

    for (const co of checkouts) {
      // Fetch ALL locations for trail
      const { data: allLocs } = await supabase
        .from("driver_locations")
        .select("latitude, longitude, recorded_at")
        .eq("checkout_id", co.id)
        .order("recorded_at", { ascending: true });

      if (allLocs && allLocs.length > 0) {
        trailData[co.id] = allLocs.map((l) => [l.latitude, l.longitude] as [number, number]);

        const lastLoc = allLocs[allLocs.length - 1];

        const { data: prof } = await supabase
          .from("profiles")
          .select("nome")
          .eq("user_id", co.motorista_id)
          .single();

        const { data: veh } = await supabase
          .from("vehicles")
          .select("placa")
          .eq("id", co.veiculo_id)
          .single();

        results.push({
          checkout_id: co.id,
          motorista_id: co.motorista_id,
          motorista_nome: prof?.nome || "Motorista",
          veiculo_placa: veh?.placa || "---",
          latitude: lastLoc.latitude,
          longitude: lastLoc.longitude,
          recorded_at: lastLoc.recorded_at,
        });
      }
    }

    setMarkers(results);
    setTrails(trailData);
    setLoading(false);
  }, [profile?.company_id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (trackingEnabled) fetchLocations();
  }, [trackingEnabled, fetchLocations]);

  // Initialize map with vanilla Leaflet
  useEffect(() => {
    if (!trackingEnabled || !mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current).setView([-14.235, -51.925], 4);

      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri", maxZoom: 19 }
      );
      const labels = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      );
      satellite.addTo(map);
      labels.addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [trackingEnabled]);

  // Filtered data based on selected driver
  const filteredMarkers = useMemo(() => {
    if (selectedDriver === "all") return markers;
    return markers.filter((m) => m.motorista_id === selectedDriver);
  }, [markers, selectedDriver]);

  const filteredTrails = useMemo(() => {
    if (selectedDriver === "all") return trails;
    const filtered: Record<string, [number, number][]> = {};
    const selectedCheckouts = markers
      .filter((m) => m.motorista_id === selectedDriver)
      .map((m) => m.checkout_id);
    selectedCheckouts.forEach((id) => {
      if (trails[id]) filtered[id] = trails[id];
    });
    return filtered;
  }, [trails, markers, selectedDriver]);

  // Update markers on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      leafletMarkersRef.current.forEach((m) => m.remove());
      leafletMarkersRef.current = [];
      leafletPolylinesRef.current.forEach((p) => p.remove());
      leafletPolylinesRef.current = [];

      Object.values(filteredTrails).forEach((coords) => {
        if (coords.length >= 2) {
          const polyline = L.polyline(coords, {
            color: "#3b82f6",
            weight: 3,
            opacity: 0.7,
            dashArray: "8, 6",
          }).addTo(map);
          leafletPolylinesRef.current.push(polyline);
        }
      });

      filteredMarkers.forEach((m) => {
        const marker = L.marker([m.latitude, m.longitude]).addTo(map);
        marker.bindPopup(
          `<div style="font-size:13px"><strong>${m.motorista_nome}</strong><br/>🚗 ${m.veiculo_placa}<br/><span style="color:#888">Última: ${new Date(m.recorded_at).toLocaleTimeString("pt-BR")}</span></div>`
        );
        leafletMarkersRef.current.push(marker);
      });

      if (filteredMarkers.length > 0) {
        const bounds = L.latLngBounds(filteredMarkers.map((m) => [m.latitude, m.longitude] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    });
  }, [filteredMarkers, filteredTrails]);

  // Realtime subscription
  useEffect(() => {
    if (!trackingEnabled || !profile?.company_id) return;
    const channel = supabase
      .channel("driver-locations-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "driver_locations" }, () => {
        fetchLocations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [trackingEnabled, profile?.company_id, fetchLocations]);

  if (!trackingEnabled) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Rastreamento</h1>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Navigation className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">O rastreamento está desativado. Ative em <strong>Configurações → Empresa</strong>.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Rastreamento</h1>
        <div className="flex items-center gap-2 ml-auto">
          {markers.length > 0 && (
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <Users className="w-4 h-4 mr-1 shrink-0" />
                <SelectValue placeholder="Todos os motoristas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os motoristas</SelectItem>
                {markers.map((m) => (
                  <SelectItem key={m.motorista_id} value={m.motorista_id}>
                    {m.motorista_nome} — {m.veiculo_placa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={fetchLocations} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Badge variant="secondary" className="text-xs">
        <MapPin className="w-3 h-3 mr-1" />
        {filteredMarkers.length} motorista{filteredMarkers.length !== 1 ? "s" : ""} em rota
      </Badge>

      <Card className="overflow-hidden relative" style={{ zIndex: 0 }}>
        <div ref={mapRef} style={{ height: "500px", width: "100%" }} />
      </Card>

      {filteredMarkers.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center">Nenhum motorista em rota no momento.</p>
      )}
    </div>
  );
};

export default Tracking;

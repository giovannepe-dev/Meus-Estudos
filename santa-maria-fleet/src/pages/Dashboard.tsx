import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Fuel, AlertTriangle, Route, ArrowRight, ArrowRightLeft, Wrench, FileText, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useOfflineSnapshot } from "@/hooks/useOfflineSnapshot";
import { usePWA } from "@/hooks/usePWA";
import { generateMonthlyReportPdf } from "@/utils/monthlyReportPdf";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from "@/components/ui/alert-dialog";

const Dashboard: React.FC = () => {
  const { role, user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    disponiveis: 0,
    emUso: 0,
    manutencao: 0,
    gastosMes: 0,
    kmMes: 0,
    kmMesMotorista: 0,
    avariasAbertas: 0,
    avariasAbertasMotorista: 0,
    gastosManutencaoMes: 0,
    multasPendentes: 0,
    multasValorPendente: 0,
    multasPendentesMotorista: 0,
    multasValorPendenteMotorista: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const { save: saveSnapshot, load: loadSnapshot } = useOfflineSnapshot();
  const { isOnline } = usePWA();
  const [kmDivergences, setKmDivergences] = useState<any[]>([]);
  const [showMaintenancePopup, setShowMaintenancePopup] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [lastClosing, setLastClosing] = useState<string | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);

  useEffect(() => {
    if (isOnline) {
      fetchStats();
      fetchAlerts();
      fetchRecentIncidents();
      fetchKmDivergences();
      fetchLastClosing();
      fetchUpcomingBookings();
    } else {
      const snapshot = loadSnapshot();
      if (snapshot) {
        setStats({ ...stats, ...snapshot.stats });
      }
    }
  }, [role, isOnline]);

  // Realtime: refresh dashboard when vehicles or checkouts change
  useEffect(() => {
    if (!isOnline) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        fetchStats();
        fetchAlerts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "checkouts" }, () => {
        fetchStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "fuel_records" }, () => {
        fetchStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
        fetchStats();
        fetchRecentIncidents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline]);

  const fetchStats = async () => {
    if (!profile?.company_id) return;
    const cid = profile.company_id;
    const { data: vehicles } = await supabase.from("vehicles").select("status").eq("company_id", cid);
    const disponiveis = vehicles?.filter((v) => v.status === "disponivel").length || 0;
    const emUso = vehicles?.filter((v) => v.status === "em_uso").length || 0;
    const manutencao = vehicles?.filter((v) => v.status === "manutencao").length || 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: fuelData } = await supabase
      .from("fuel_records")
      .select("valor_total")
      .eq("company_id", cid)
      .gte("data_hora", startOfMonth.toISOString());
    const gastosMes = fuelData?.reduce((sum, f) => sum + Number(f.valor_total), 0) || 0;

    const { data: checkoutsData } = await supabase
      .from("checkouts")
      .select("km_rodado, motorista_id")
      .eq("company_id", cid)
      .gte("created_at", startOfMonth.toISOString())
      .eq("status", "fechado");
    const kmMes = checkoutsData?.reduce((sum, c) => sum + (Number(c.km_rodado) || 0), 0) || 0;
    const kmMesMotorista = user ? checkoutsData?.filter((c) => c.motorista_id === user.id).reduce((sum, c) => sum + (Number(c.km_rodado) || 0), 0) || 0 : 0;

    const { data: incidentsData } = await supabase
      .from("incidents")
      .select("id, motorista_id")
      .eq("company_id", cid)
      .eq("status", "aberta");
    const avariasAbertas = incidentsData?.length || 0;
    const avariasAbertasMotorista = user ? incidentsData?.filter((i) => i.motorista_id === user.id).length || 0 : 0;

    const { data: maintenanceData } = await supabase
      .from("maintenance")
      .select("custo")
      .eq("company_id", cid)
      .gte("created_at", startOfMonth.toISOString());
    const gastosManutencaoMes = maintenanceData?.reduce((sum, m) => sum + (Number(m.custo) || 0), 0) || 0;

    // Traffic tickets
    const { data: ticketsData } = await supabase
      .from("traffic_tickets")
      .select("valor, status, motorista_id")
      .eq("company_id", cid)
      .eq("status", "pendente");
    const multasPendentes = ticketsData?.length || 0;
    const multasValorPendente = ticketsData?.reduce((sum, t) => sum + Number(t.valor), 0) || 0;
    const motoristTickets = user ? ticketsData?.filter((t) => t.motorista_id === user.id) || [] : [];
    const multasPendentesMotorista = motoristTickets.length;
    const multasValorPendenteMotorista = motoristTickets.reduce((sum, t) => sum + Number(t.valor), 0);

    const newStats = { disponiveis, emUso, manutencao, gastosMes, kmMes, kmMesMotorista, avariasAbertas, avariasAbertasMotorista, gastosManutencaoMes, multasPendentes, multasValorPendente, multasPendentesMotorista, multasValorPendenteMotorista };
    setStats(newStats);
    saveSnapshot({ stats: newStats });
  };

  const fetchAlerts = async () => {
    if (!profile?.company_id) return;
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, placa, prefixo, km_atual, km_ultima_revisao, alerta_revisao_km_intervalo, status")
      .eq("company_id", profile.company_id);

    const alertList: any[] = [];
    const vehiclesToBlock: string[] = [];

    vehicles?.forEach((v) => {
      // Skip vehicles already in maintenance — they've been handled
      if (v.status === "manutencao") return;

      if (v.alerta_revisao_km_intervalo) {
        const baseKm = Number(v.km_ultima_revisao ?? 0);
        const nextRevision = baseKm + Number(v.alerta_revisao_km_intervalo);
        const diff = nextRevision - Number(v.km_atual);
        if (diff <= 0) {
          alertList.push({ ...v, type: "vencida", diff });
          if (v.status !== "indisponivel") {
            vehiclesToBlock.push(v.id);
          }
        } else if (diff <= 500) {
          alertList.push({ ...v, type: "proxima", diff });
          if (v.status !== "indisponivel") {
            vehiclesToBlock.push(v.id);
          }
        }
      }
    });

    // Auto-block overdue vehicles
    for (const id of vehiclesToBlock) {
      await supabase.from("vehicles").update({ status: "indisponivel" }).eq("id", id);
    }

    setAlerts(alertList);
    if (alertList.length > 0 && role === "admin") {
      // Criar uma chave única baseada nos IDs dos veículos com alerta
      const alertKey = alertList.map((a) => a.id).sort().join(",");
      const dismissedKey = localStorage.getItem("dismissed_maintenance_popup");
      if (dismissedKey !== alertKey) {
        setShowMaintenancePopup(true);
      }
    }
  };

  const handleScheduleMaintenance = async (vehicleId: string, placa: string) => {
    // Verificar se já existe manutenção agendada para este veículo
    const { data: existing } = await supabase
      .from("maintenance")
      .select("id")
      .eq("veiculo_id", vehicleId)
      .eq("status", "agendada")
      .limit(1);

    if (existing && existing.length > 0) {
      toast.info("Já existe uma manutenção agendada para este veículo.");
      return;
    }

    const { error } = await supabase.from("maintenance").insert({
      veiculo_id: vehicleId,
      tipo_servico: "Revisão programada",
      descricao: `Revisão por atingir intervalo de km - ${placa}`,
      status: "agendada",
      data_agendada: new Date().toISOString().split("T")[0],
    } as any);
    if (error) {
      toast.error("Erro ao agendar manutenção.");
    } else {
      await supabase.from("vehicles").update({ status: "manutencao" as any }).eq("id", vehicleId);
      toast.success("Manutenção agendada e veículo bloqueado!");
      await fetchStats();
      await fetchAlerts();
    }
  };

  const fetchKmDivergences = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("km_divergences")
      .select("*, vehicles(placa, prefixo)")
      .eq("company_id", profile.company_id)
      .eq("status", "pendente")
      .order("data_hora", { ascending: false })
      .limit(10);
    
    if (data && data.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, nome");
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.nome]));
      setKmDivergences(data.map((d) => ({
        ...d,
        veiculo_nome: d.vehicles?.prefixo || d.vehicles?.placa || "?",
        motorista_nome: profileMap[d.motorista_id] || "?",
      })));
    } else {
      setKmDivergences([]);
    }
  };

  const fetchRecentIncidents = async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("incidents")
      .select("*, vehicles(placa, prefixo)")
      .eq("company_id", profile.company_id)
      .gte("created_at", threeDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);
    const dismissed: string[] = JSON.parse(localStorage.getItem("dismissed_incidents") || "[]");
    const filtered = (data || []).filter((d: any) => !dismissed.includes(d.id));
    if (filtered.length > 0) {
      const motoristIds = [...new Set(filtered.map((d: any) => d.motorista_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, nome").in("user_id", motoristIds);
      const profMap = Object.fromEntries((profs || []).map((p: any) => [p.user_id, p.nome]));
      setRecentIncidents(filtered.map((d: any) => ({
        ...d,
        veiculo_nome: d.vehicles?.prefixo || d.vehicles?.placa || "?",
        motorista_nome: profMap[d.motorista_id] || "?",
      })));
    } else {
      setRecentIncidents([]);
    }
  };

  const fetchLastClosing = async () => {
    const now = new Date();
    const mesRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const { data } = await supabase
      .from("monthly_closings")
      .select("mes_referencia")
      .eq("mes_referencia", mesRef)
      .limit(1);
    setLastClosing(data && data.length > 0 ? mesRef : null);
  };

  const fetchUpcomingBookings = async () => {
    const now = new Date();
    const in7days = new Date();
    in7days.setDate(in7days.getDate() + 7);
    const { data } = await supabase
      .from("vehicle_bookings")
      .select("*, vehicles(placa, prefixo)")
      .gte("data_inicio", now.toISOString())
      .lte("data_inicio", in7days.toISOString())
      .eq("status", "agendado")
      .order("data_inicio", { ascending: true })
      .limit(10);
    if (data && data.length > 0) {
      const motoristIds = [...new Set(data.map((d: any) => d.motorista_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, nome").in("user_id", motoristIds);
      const profMap = Object.fromEntries((profs || []).map((p: any) => [p.user_id, p.nome]));
      setUpcomingBookings(data.map((d: any) => ({
        ...d,
        veiculo_nome: d.vehicles?.prefixo || d.vehicles?.placa || "?",
        motorista_nome: profMap[d.motorista_id] || "?",
      })));
    } else {
      setUpcomingBookings([]);
    }
  };

  const handleEmitMonthlyReport = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const mesRef = `${year}-${String(month + 1).padStart(2, "0")}`;

    setGeneratingReport(true);
    try {
      await generateMonthlyReportPdf(year, month);
      await supabase.from("monthly_closings").insert({
        mes_referencia: mesRef,
        gerado_por_user_id: user!.id,
      } as any);
      setLastClosing(mesRef);
      toast.success("Relatório mensal gerado e mês fechado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar relatório mensal.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const isMotorista = role === "motorista";

  const allStatCards = [
    { label: "Disponíveis", value: stats.disponiveis, icon: Car, color: "text-success", link: "/painel/veiculos", roles: ["admin", "frota", "motorista"] },
    { label: "Em Uso", value: stats.emUso, icon: Route, color: "text-primary", link: "/painel/checkout", roles: ["admin", "frota", "motorista"] },
    { label: "Manutenção", value: stats.manutencao, icon: Wrench, color: "text-warning", link: "/painel/manutencoes", roles: ["admin", "frota", "motorista"] },
    { label: "Gastos Combust. (mês)", value: `R$ ${stats.gastosMes.toFixed(2)}`, icon: Fuel, color: "text-destructive", link: "/painel/abastecimentos", roles: ["admin", "frota"] },
    { label: "Gastos Manut. (mês)", value: `R$ ${stats.gastosManutencaoMes.toFixed(2)}`, icon: Wrench, color: "text-destructive", link: "/painel/manutencoes", roles: ["admin", "frota"] },
    { label: "Km Rodados (mês)", value: stats.kmMes.toLocaleString("pt-BR"), icon: Route, color: "text-primary", link: "/painel/relatorios", roles: ["admin", "frota"] },
    { label: "Meus Km (mês)", value: stats.kmMesMotorista.toLocaleString("pt-BR"), icon: Route, color: "text-primary", link: "/painel/checkout", roles: ["motorista"] },
    { label: "Avarias Abertas", value: stats.avariasAbertas, icon: AlertTriangle, color: "text-warning", link: "/painel/avarias", roles: ["admin", "frota"] },
    { label: "Minhas Avarias", value: stats.avariasAbertasMotorista, icon: AlertTriangle, color: "text-warning", link: "/painel/avarias", roles: ["motorista"] },
    { label: "Multas Pendentes", value: stats.multasPendentes, icon: AlertTriangle, color: "text-destructive", link: "/painel/multas", roles: ["admin", "frota"] },
    { label: "Valor em Multas", value: `R$ ${stats.multasValorPendente.toFixed(2)}`, icon: AlertTriangle, color: "text-destructive", link: "/painel/multas", roles: ["admin", "frota"] },
    { label: "Minhas Multas", value: stats.multasPendentesMotorista, icon: AlertTriangle, color: "text-destructive", link: "/painel/multas", roles: ["motorista"] },
    { label: "Valor Multas", value: `R$ ${stats.multasValorPendenteMotorista.toFixed(2)}`, icon: AlertTriangle, color: "text-destructive", link: "/painel/multas", roles: ["motorista"] },
  ];

  const statCards = allStatCards.filter((card) => card.roles.includes(role || "motorista"));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Popup de Manutenção para Admin/Frota */}
      <AlertDialog open={showMaintenancePopup} onOpenChange={setShowMaintenancePopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-warning" />
              Veículos precisam de manutenção!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Os seguintes veículos estão próximos ou já ultrapassaram o limite de km para revisão. Providencie a manutenção o mais rápido possível.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg ${alert.type === "vencida" ? "bg-destructive/10" : "bg-warning/10"}`}>
                      <div>
                        <p className="text-sm font-medium">{alert.prefixo || alert.placa}</p>
                        <p className="text-xs text-muted-foreground">
                          {alert.type === "vencida"
                            ? "⛔ Revisão vencida — veículo bloqueado"
                            : `⚠️ Faltam apenas ${alert.diff} km para a revisão`}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${alert.type === "vencida" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground"}`}>
                        {alert.type === "vencida" ? "Urgente" : "Atenção"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogAction onClick={() => { setShowMaintenancePopup(false); navigate("/painel/manutencoes"); }}>
              Ir para Manutenções
            </AlertDialogAction>
            <Button variant="outline" onClick={() => {
              const alertKey = alerts.map((a) => a.id).sort().join(",");
              localStorage.setItem("dismissed_maintenance_popup", alertKey);
              setShowMaintenancePopup(false);
            }}>
              Entendi
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Visão geral da frota</p>
      </div>

      {/* Stat Cards */}
      <div data-tour="stat-cards" className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(card.link)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div data-tour="quick-actions" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          size="lg"
          className="h-14 text-base font-semibold"
          onClick={() => navigate("/painel/checkout?action=retirar")}
        >
          <Car className="w-5 h-5 mr-2" />
          Retirar Veículo
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 text-base font-semibold"
          onClick={() => navigate("/painel/checkout?action=devolver")}
        >
          <ArrowRightLeft className="w-5 h-5 mr-2" />
          Devolver Veículo
          <ArrowRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>

      {/* Upcoming Bookings - visible to all */}
      {upcomingBookings.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                <div className="flex-1">
                  <p className="text-sm font-medium">{b.veiculo_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.motorista_nome} • {b.motivo}
                    {b.destino ? ` → ${b.destino}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(b.data_inicio).toLocaleDateString("pt-BR")} {new Date(b.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {" — "}
                    {new Date(b.data_fim).toLocaleDateString("pt-BR")} {new Date(b.data_fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/painel/agendamentos")}>
              Ver todos os agendamentos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Monthly Report - Admin Only */}
      {role === "admin" && (
        <Card className="border-primary/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Fechamento Mensal</p>
              <p className="text-xs text-muted-foreground">
                {lastClosing
                  ? `Mês atual já fechado (${lastClosing})`
                  : "Emita o relatório para fechar o mês corrente"}
              </p>
            </div>
            <Button
              onClick={handleEmitMonthlyReport}
              disabled={generatingReport || !!lastClosing}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              {generatingReport ? "Gerando..." : lastClosing ? "Já emitido" : "Emitir Relatório"}
            </Button>
          </CardContent>
        </Card>
      )}


      {/* Maintenance Alerts */}
      {!isMotorista && alerts.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Alertas de Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  alert.type === "vencida" ? "bg-destructive/10" : "bg-warning/10"
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {alert.prefixo || alert.placa}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.type === "vencida"
                      ? "Revisão vencida! Veículo bloqueado."
                      : `Faltam ${alert.diff} km para revisão`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      alert.type === "vencida"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-warning text-warning-foreground"
                    }`}
                  >
                    {alert.type === "vencida" ? "Vencida" : "Próxima"}
                  </span>
                  {(role === "admin" || role === "frota") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleScheduleMaintenance(alert.id, alert.prefixo || alert.placa)}
                    >
                      <Wrench className="w-3 h-3 mr-1" />
                      Agendar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Km Divergence Alerts - only for admin/frota */}
      {(role === "admin" || role === "frota") && kmDivergences.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Divergências de Km Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {kmDivergences.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.veiculo_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.motorista_nome} • Diferença de {Number(d.km_divergente).toLocaleString("pt-BR")} km não registrados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 border-destructive/50 hover:bg-destructive/10"
                    onClick={async () => {
                      setKmDivergences((prev) => prev.filter((item) => item.id !== d.id));
                      await supabase.from("km_divergences").update({ status: "ciente" }).eq("id", d.id);
                      toast.success("Divergência marcada como ciente.");
                    }}
                  >
                    Ciente
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/painel/relatorios")}>
              Ver relatório completo <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Incidents Alert - admin/frota */}
      {(role === "admin" || role === "frota") && recentIncidents.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Avarias Recentes (últimos 3 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentIncidents.map((inc: any) => (
              <div key={inc.id} className={`flex items-center justify-between p-3 rounded-lg ${inc.gravidade === "grave" ? "bg-destructive/10" : "bg-warning/10"}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium">{inc.veiculo_nome} — {inc.tipo}</p>
                  <p className="text-xs text-muted-foreground">
                    {inc.motorista_nome} • {inc.gravidade.toUpperCase()} • {inc.descricao?.slice(0, 60)}{inc.descricao?.length > 60 ? "..." : ""}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{new Date(inc.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${inc.gravidade === "grave" ? "bg-destructive text-destructive-foreground" : inc.gravidade === "media" ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"}`}>
                    {inc.gravidade}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setRecentIncidents((prev) => prev.filter((item) => item.id !== inc.id));
                      const dismissed = JSON.parse(localStorage.getItem("dismissed_incidents") || "[]");
                      dismissed.push(inc.id);
                      localStorage.setItem("dismissed_incidents", JSON.stringify(dismissed));
                    }}
                  >
                    Ciente
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/painel/avarias")}>
              Ver todas as avarias <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

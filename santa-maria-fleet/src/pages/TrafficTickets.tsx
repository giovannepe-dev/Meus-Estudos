import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyWhatsApp } from "@/utils/getCompanyWhatsApp";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, AlertTriangle, User, RefreshCw, Filter, X } from "lucide-react";

interface TrafficTicket {
  id: string;
  veiculo_id: string;
  motorista_id: string | null;
  data_infracao: string;
  valor: number;
  numero_auto: string | null;
  descricao: string;
  pontos: number;
  local_infracao: string | null;
  status: string;
  comprovante_foto: string | null;
  observacoes: string | null;
  created_at: string;
}

const TrafficTickets: React.FC = () => {
  const { user, role, profile } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TrafficTicket[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detectedDriver, setDetectedDriver] = useState<{ id: string; nome: string } | null>(null);
  const [detectingDriver, setDetectingDriver] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterVehicle, setFilterVehicle] = useState("todos");
  const [filterDriver, setFilterDriver] = useState("todos");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    veiculo_id: "",
    data_infracao: "",
    valor: "",
    numero_auto: "",
    descricao: "",
    pontos: "0",
    local_infracao: "",
    observacoes: "",
  });

  const fetchData = async () => {
    if (!profile?.company_id) return;
    const cid = profile.company_id;
    setLoading(true);
    const [{ data: t }, { data: v }, { data: p }] = await Promise.all([
      supabase.from("traffic_tickets").select("*").eq("company_id", cid).order("data_infracao", { ascending: false }),
      supabase.from("vehicles").select("id, placa, prefixo, modelo").eq("company_id", cid),
      supabase.from("profiles").select("user_id, nome").eq("company_id", cid),
    ]);
    setTickets((t as TrafficTicket[]) || []);
    setVehicles(v || []);
    setProfiles(p || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const vehicleLabel = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.prefixo || v.placa} - ${v.modelo || ""}` : id;
  };

  const driverName = (id: string | null) => {
    if (!id) return "Não identificado";
    const p = profiles.find((x) => x.user_id === id);
    return p?.nome || "Desconhecido";
  };

  // Auto-detect driver based on vehicle + infraction date
  const detectDriver = async (vehicleId: string, dateStr: string) => {
    if (!vehicleId || !dateStr) {
      setDetectedDriver(null);
      return;
    }
    setDetectingDriver(true);
    try {
      const infraDate = new Date(dateStr).toISOString();
      // Find checkout where this vehicle was checked out at infraction time
      const { data: checkouts } = await supabase
        .from("checkouts")
        .select("motorista_id, data_hora_retirada, data_hora_devolucao")
        .eq("veiculo_id", vehicleId)
        .lte("data_hora_retirada", infraDate)
        .order("data_hora_retirada", { ascending: false })
        .limit(10);

      if (checkouts && checkouts.length > 0) {
        // Find checkout that covers the infraction date
        const match = checkouts.find((c) => {
          const ret = new Date(c.data_hora_retirada).getTime();
          const dev = c.data_hora_devolucao ? new Date(c.data_hora_devolucao).getTime() : Date.now();
          const infra = new Date(infraDate).getTime();
          return infra >= ret && infra <= dev;
        });

        if (match) {
          const driver = profiles.find((p) => p.user_id === match.motorista_id);
          setDetectedDriver(driver ? { id: match.motorista_id, nome: driver.nome } : { id: match.motorista_id, nome: "Motorista encontrado" });
        } else {
          setDetectedDriver(null);
        }
      } else {
        setDetectedDriver(null);
      }
    } catch {
      setDetectedDriver(null);
    }
    setDetectingDriver(false);
  };

  useEffect(() => {
    detectDriver(form.veiculo_id, form.data_infracao);
  }, [form.veiculo_id, form.data_infracao]);

  // Send WhatsApp notification
  const sendWhatsAppNotification = async (ticketData: { descricao: string; veiculo: string; valor: string; motorista: string }) => {
    try {
      const waPhone = await getCompanyWhatsApp();
      if (waPhone) {
        const msg = `🚫 *Nova Multa Registrada*\n\n🚘 *Veículo:* ${ticketData.veiculo}\n🧑‍💼 *Motorista:* ${ticketData.motorista}\n📝 *Infração:* ${ticketData.descricao}\n💸 *Valor:* R$ ${ticketData.valor}\n\n_SmartFrota_`;
        const url = `https://wa.me/${waPhone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
      }
    } catch {}
  };

  const handleSubmit = async () => {
    if (!form.veiculo_id || !form.data_infracao || !form.descricao) {
      toast({ title: "Preencha veículo, data e descrição", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("traffic_tickets").insert({
      veiculo_id: form.veiculo_id,
      motorista_id: detectedDriver?.id || null,
      data_infracao: new Date(form.data_infracao).toISOString(),
      valor: Number(form.valor) || 0,
      numero_auto: form.numero_auto || null,
      descricao: form.descricao,
      pontos: Number(form.pontos) || 0,
      local_infracao: form.local_infracao || null,
      observacoes: form.observacoes || null,
      registrado_por_user_id: user!.id,
    } as any);

    if (error) {
      toast({ title: "Erro ao registrar multa", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Multa registrada com sucesso!" });
      sendWhatsAppNotification({
        descricao: form.descricao,
        veiculo: vehicleLabel(form.veiculo_id),
        valor: (Number(form.valor) || 0).toFixed(2),
        motorista: detectedDriver?.nome || "Não identificado",
      });
      setForm({ veiculo_id: "", data_infracao: "", valor: "", numero_auto: "", descricao: "", pontos: "0", local_infracao: "", observacoes: "" });
      setDetectedDriver(null);
      setDialogOpen(false);
      fetchData();
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from("traffic_tickets").update({ status: newStatus } as any).eq("id", id);
    fetchData();
  };

  // Sync: auto-detect drivers for all tickets missing motorista_id
  const syncDrivers = async () => {
    setSyncing(true);
    try {
      const pending = tickets.filter((t) => !t.motorista_id);
      if (pending.length === 0) {
        toast({ title: "Todas as multas já têm motorista identificado!" });
        setSyncing(false);
        return;
      }

      // Fetch all checkouts for matching
      const { data: allCheckouts } = await supabase
        .from("checkouts")
        .select("motorista_id, veiculo_id, data_hora_retirada, data_hora_devolucao")
        .order("data_hora_retirada", { ascending: false });

      let updated = 0;
      for (const ticket of pending) {
        const infraTime = new Date(ticket.data_infracao).getTime();
        const match = (allCheckouts || []).find((c) => {
          if (c.veiculo_id !== ticket.veiculo_id) return false;
          const ret = new Date(c.data_hora_retirada).getTime();
          const dev = c.data_hora_devolucao ? new Date(c.data_hora_devolucao).getTime() : Date.now();
          return infraTime >= ret && infraTime <= dev;
        });

        if (match) {
          await supabase
            .from("traffic_tickets")
            .update({ motorista_id: match.motorista_id } as any)
            .eq("id", ticket.id);
          updated++;
        }
      }

      toast({
        title: `Sincronização concluída`,
        description: `${updated} multa(s) atualizada(s) de ${pending.length} pendente(s).`,
      });
      fetchData();
    } catch {
      toast({ title: "Erro na sincronização", variant: "destructive" });
    }
    setSyncing(false);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { pendente: "bg-warning/20 text-warning-foreground", paga: "bg-success/20 text-success", recurso: "bg-primary/20 text-primary", cancelada: "bg-muted text-muted-foreground" };
    return <Badge className={map[s] || ""}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
  };

  // Apply filters
  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== "todos" && t.status !== filterStatus) return false;
    if (filterVehicle !== "todos" && t.veiculo_id !== filterVehicle) return false;
    if (filterDriver !== "todos" && (t.motorista_id || "") !== filterDriver) return false;
    if (filterDateStart) {
      const start = new Date(filterDateStart).getTime();
      if (new Date(t.data_infracao).getTime() < start) return false;
    }
    if (filterDateEnd) {
      const end = new Date(filterDateEnd + "T23:59:59").getTime();
      if (new Date(t.data_infracao).getTime() > end) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilterStatus("todos");
    setFilterVehicle("todos");
    setFilterDriver("todos");
    setFilterDateStart("");
    setFilterDateEnd("");
  };

  const hasActiveFilters = filterStatus !== "todos" || filterVehicle !== "todos" || filterDriver !== "todos" || filterDateStart || filterDateEnd;

  if (role === "motorista") {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <h1 className="text-xl font-bold">Minhas Multas</h1>
        {tickets.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma multa registrada.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{t.descricao}</p>
                      <p className="text-sm text-muted-foreground">{vehicleLabel(t.veiculo_id)}</p>
                    </div>
                    {statusBadge(t.status)}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{new Date(t.data_infracao).toLocaleDateString("pt-BR")}</span>
                    <span>R$ {Number(t.valor).toFixed(2)}</span>
                    {t.pontos > 0 && <span>{t.pontos} pts</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">Multas de Trânsito</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={syncDrivers} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Motoristas"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Multa</Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Multa</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Veículo *</Label>
                <Select value={form.veiculo_id} onValueChange={(v) => setForm({ ...form, veiculo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.prefixo || v.placa} - {v.modelo || ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data/Hora da Infração *</Label>
                <Input type="datetime-local" value={form.data_infracao} onChange={(e) => setForm({ ...form, data_infracao: e.target.value })} />
              </div>

              {/* Auto-detected driver */}
              <Card className={detectedDriver ? "border-green-300 bg-green-50" : "border-yellow-300 bg-yellow-50"}>
                <CardContent className="p-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {detectingDriver ? (
                    <span className="text-sm text-muted-foreground">Buscando motorista...</span>
                  ) : detectedDriver ? (
                    <span className="text-sm font-medium text-green-800">
                      Motorista detectado: <strong>{detectedDriver.nome}</strong>
                    </span>
                  ) : (
                    <span className="text-sm text-yellow-800">
                      {form.veiculo_id && form.data_infracao
                        ? "Nenhum checkout encontrado nessa data/hora"
                        : "Informe veículo e data para detectar o motorista"}
                    </span>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                </div>
                <div>
                  <Label>Pontos</Label>
                  <Input type="number" value={form.pontos} onChange={(e) => setForm({ ...form, pontos: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Nº Auto de Infração</Label>
                <Input value={form.numero_auto} onChange={(e) => setForm({ ...form, numero_auto: e.target.value })} />
              </div>

              <div>
                <Label>Descrição da Infração *</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Excesso de velocidade" />
              </div>

              <div>
                <Label>Local da Infração</Label>
                <Input value={form.local_infracao} onChange={(e) => setForm({ ...form, local_infracao: e.target.value })} />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>

              <Button onClick={handleSubmit} className="w-full">Registrar Multa</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant={showFilters ? "secondary" : "outline"} onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-1" /> Filtros
          {hasActiveFilters && <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">!</Badge>}
        </Button>
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" /> Limpar filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="recurso">Recurso</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Veículo</Label>
              <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.prefixo || v.placa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Motorista</Label>
              <Select value={filterDriver} onValueChange={setFilterDriver}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Data Início</Label>
              <Input type="date" className="h-8 text-xs" value={filterDateStart} onChange={(e) => setFilterDateStart(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Input type="date" className="h-8 text-xs" value={filterDateEnd} onChange={(e) => setFilterDateEnd(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{hasActiveFilters ? "Nenhuma multa encontrada com os filtros aplicados." : "Nenhuma multa registrada."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-sm">{new Date(t.data_infracao).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-sm">{vehicleLabel(t.veiculo_id)}</TableCell>
                  <TableCell className="text-sm">{driverName(t.motorista_id)}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{t.descricao}</TableCell>
                  <TableCell className="text-sm">R$ {Number(t.valor).toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{t.pontos}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell>
                    <Select value={t.status} onValueChange={(v) => updateStatus(t.id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="recurso">Recurso</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TrafficTickets;

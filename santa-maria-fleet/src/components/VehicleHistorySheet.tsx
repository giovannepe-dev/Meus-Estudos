import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Fuel, Wrench, AlertTriangle, Route, ArrowRightLeft, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VehicleHistorySheetProps {
  vehicle: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VehicleHistorySheet: React.FC<VehicleHistorySheetProps> = ({ vehicle, open, onOpenChange }) => {
  const { role } = useAuth();
  const canManage = role === "admin" || role === "frota";
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [fuelRecords, setFuelRecords] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editCheckout, setEditCheckout] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ motivo_uso: "", destino_rota: "", observacoes_retirada: "", observacoes_devolucao: "", km_retirada: "", km_devolucao: "", veiculo_id: "" });
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);

  useEffect(() => {
    if (open && vehicle) fetchHistory();
  }, [open, vehicle, month]);

  const fetchHistory = async () => {
    if (!vehicle) return;
    setLoading(true);
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1).toISOString();
    const end = new Date(year, mon, 0, 23, 59, 59).toISOString();

    const [ckRes, fuelRes, maintRes, incRes, profsRes] = await Promise.all([
      supabase
        .from("checkouts")
        .select("id, motorista_id, veiculo_id, km_retirada, km_devolucao, km_rodado, data_hora_retirada, data_hora_devolucao, status, motivo_uso, destino_rota, observacoes_retirada, observacoes_devolucao")
        .eq("veiculo_id", vehicle.id)
        .gte("data_hora_retirada", start)
        .lte("data_hora_retirada", end)
        .order("data_hora_retirada", { ascending: false }),
      supabase
        .from("fuel_records")
        .select("id, motorista_id, litros, valor_total, tipo_combustivel, data_hora, km_no_abastecimento")
        .eq("veiculo_id", vehicle.id)
        .gte("data_hora", start)
        .lte("data_hora", end)
        .order("data_hora", { ascending: false }),
      supabase
        .from("maintenance")
        .select("id, tipo_servico, descricao, custo, status, data_agendada, data_realizada")
        .eq("veiculo_id", vehicle.id)
        .or(`data_agendada.gte.${month}-01,data_realizada.gte.${month}-01`)
        .order("created_at", { ascending: false }),
      supabase
        .from("incidents")
        .select("id, motorista_id, tipo, gravidade, descricao, status, created_at")
        .eq("veiculo_id", vehicle.id)
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, nome"),
    ]);

    const profMap = Object.fromEntries((profsRes.data || []).map((p) => [p.user_id, p.nome]));

    setCheckouts((ckRes.data || []).map((c) => ({ ...c, motorista_nome: profMap[c.motorista_id] || "?" })));
    setFuelRecords((fuelRes.data || []).map((f) => ({ ...f, motorista_nome: profMap[f.motorista_id] || "?" })));
    setMaintenances(maintRes.data || []);
    setIncidents((incRes.data || []).map((i) => ({ ...i, motorista_nome: profMap[i.motorista_id] || "?" })));
    setLoading(false);
  };

  const changeMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthLabel = (() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  })();

  const totalKm = checkouts.reduce((s, c) => s + (Number(c.km_rodado) || 0), 0);
  const totalLitros = fuelRecords.reduce((s, f) => s + (Number(f.litros) || 0), 0);
  const totalGasto = fuelRecords.reduce((s, f) => s + (Number(f.valor_total) || 0), 0);
  const totalManut = maintenances.reduce((s, m) => s + (Number(m.custo) || 0), 0);
  const kmPorLitro = totalLitros > 0 ? totalKm / totalLitros : 0;

  const gravColors: Record<string, string> = {
    leve: "bg-muted text-muted-foreground",
    media: "bg-warning text-warning-foreground",
    grave: "bg-destructive text-destructive-foreground",
  };

  const handleOpenEdit = async (c: any) => {
    setEditCheckout(c);
    setEditForm({
      motivo_uso: c.motivo_uso || "",
      destino_rota: c.destino_rota || "",
      observacoes_retirada: c.observacoes_retirada || "",
      observacoes_devolucao: c.observacoes_devolucao || "",
      km_retirada: String(c.km_retirada || ""),
      km_devolucao: String(c.km_devolucao || ""),
      veiculo_id: c.veiculo_id || vehicle?.id || "",
    });
    // Load vehicles list for the select
    if (vehiclesList.length === 0) {
      const { data } = await supabase
        .from("vehicles")
        .select("id, placa, prefixo, marca, modelo")
        .order("prefixo");
      setVehiclesList(data || []);
    }
  };

  const recalcVehicleKm = async (vehicleId: string) => {
    const { data } = await supabase
      .from("checkouts")
      .select("km_retirada, km_devolucao")
      .eq("veiculo_id", vehicleId)
      .order("data_hora_retirada", { ascending: false })
      .limit(1);
    const lastKm = data && data.length > 0
      ? Math.max(Number(data[0].km_retirada) || 0, Number(data[0].km_devolucao) || 0)
      : 0;
    if (lastKm > 0) {
      await supabase.from("vehicles").update({ km_atual: lastKm }).eq("id", vehicleId);
    }
  };

  const handleSaveEdit = async () => {
    if (!editCheckout) return;
    setSaving(true);
    const oldVehicleId = editCheckout.veiculo_id || vehicle?.id;
    const newVehicleId = editForm.veiculo_id;
    const changedVehicle = oldVehicleId !== newVehicleId;
    const kmRetirada = editForm.km_retirada ? Number(editForm.km_retirada) : null;
    const kmDevolucao = editForm.km_devolucao ? Number(editForm.km_devolucao) : null;
    const kmRodado = kmRetirada != null && kmDevolucao != null ? kmDevolucao - kmRetirada : null;

    const { error } = await supabase
      .from("checkouts")
      .update({
        motivo_uso: editForm.motivo_uso,
        destino_rota: editForm.destino_rota || null,
        observacoes_retirada: editForm.observacoes_retirada || null,
        observacoes_devolucao: editForm.observacoes_devolucao || null,
        km_retirada: kmRetirada ?? editCheckout.km_retirada,
        km_devolucao: kmDevolucao,
        km_rodado: kmRodado,
        veiculo_id: newVehicleId,
      })
      .eq("id", editCheckout.id);
    if (error) {
      setSaving(false);
      toast.error("Erro ao salvar alterações");
      return;
    }

    // Recalc km for affected vehicles
    await recalcVehicleKm(newVehicleId);
    if (changedVehicle) {
      await recalcVehicleKm(oldVehicleId);
    }

    setSaving(false);
    toast.success("Utilização atualizada e km recalculado");
    setEditCheckout(null);
    fetchHistory();
  };

  const handleDeleteCheckout = async (id: string) => {
    setSaving(true);
    await Promise.all([
      supabase.from("driver_locations").delete().eq("checkout_id", id),
      supabase.from("km_divergences").delete().eq("checkout_id", id),
      supabase.from("incidents").delete().eq("checkout_id", id),
    ]);
    const { error } = await supabase.from("checkouts").delete().eq("id", id);
    if (error) {
      setSaving(false);
      toast.error("Erro ao excluir utilização");
      return;
    }
    await recalcVehicleKm(vehicle!.id);
    setSaving(false);
    toast.success("Utilização excluída e km recalculado");
    fetchHistory();
  };

  if (!vehicle) return null;

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {vehicle.prefixo || vehicle.placa}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{vehicle.marca} {vehicle.modelo} • {vehicle.placa} • {Number(vehicle.km_atual).toLocaleString("pt-BR")} km</p>
        </SheetHeader>

        {/* Month Navigation */}
        <div className="flex items-center justify-between py-3">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold capitalize">{monthLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
        ) : (
          <div className="space-y-4 pb-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <Card><CardContent className="p-3 text-center">
                <Route className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{totalKm.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">Km Rodados</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <Fuel className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{kmPorLitro.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Km/L</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <Fuel className="w-4 h-4 mx-auto mb-1 text-destructive" />
                <p className="text-lg font-bold">R$ {totalGasto.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Combustível</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <Wrench className="w-4 h-4 mx-auto mb-1 text-warning" />
                <p className="text-lg font-bold">R$ {totalManut.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Manutenção</p>
              </CardContent></Card>
            </div>

            {/* Checkouts */}
            {checkouts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1 mb-2">
                  <ArrowRightLeft className="w-4 h-4" /> Utilizações ({checkouts.length})
                </h3>
                <div className="space-y-1.5">
                  {checkouts.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-muted/50 text-xs space-y-0.5">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{c.motorista_nome}</span>
                        <div className="flex items-center gap-1">
                          {canManage && (
                            <>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleOpenEdit(c)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir utilização?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. A utilização de {c.motorista_nome} em {new Date(c.data_hora_retirada).toLocaleDateString("pt-BR")} será excluída permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCheckout(c.id)} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      {saving ? "Excluindo..." : "Excluir"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          <Badge variant={c.status === "fechado" ? "default" : "secondary"} className="text-[10px] h-4">
                            {c.status === "fechado" ? "Fechado" : "Aberto"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        {new Date(c.data_hora_retirada).toLocaleDateString("pt-BR")} • {c.motivo_uso}
                        {c.destino_rota ? ` → ${c.destino_rota}` : ""}
                      </p>
                      {c.km_rodado && <p className="text-muted-foreground">{Number(c.km_rodado).toLocaleString("pt-BR")} km rodados</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fuel */}
            {fuelRecords.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1 mb-2">
                  <Fuel className="w-4 h-4" /> Abastecimentos ({fuelRecords.length})
                </h3>
                <div className="space-y-1.5">
                  {fuelRecords.map((f) => (
                    <div key={f.id} className="p-2.5 rounded-lg bg-muted/50 text-xs space-y-0.5">
                      <div className="flex justify-between">
                        <span className="font-medium">{f.motorista_nome}</span>
                        <span className="font-semibold">R$ {Number(f.valor_total).toFixed(2)}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {new Date(f.data_hora).toLocaleDateString("pt-BR")} • {Number(f.litros).toFixed(1)}L {f.tipo_combustivel}
                        {f.km_no_abastecimento ? ` • ${Number(f.km_no_abastecimento).toLocaleString("pt-BR")} km` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance */}
            {maintenances.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1 mb-2">
                  <Wrench className="w-4 h-4" /> Manutenções ({maintenances.length})
                </h3>
                <div className="space-y-1.5">
                  {maintenances.map((m) => (
                    <div key={m.id} className="p-2.5 rounded-lg bg-muted/50 text-xs space-y-0.5">
                      <div className="flex justify-between">
                        <span className="font-medium">{m.tipo_servico}</span>
                        <Badge variant={m.status === "realizada" ? "default" : "secondary"} className="text-[10px] h-4">
                          {m.status === "realizada" ? "Realizada" : "Agendada"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {m.data_realizada || m.data_agendada ? new Date(m.data_realizada || m.data_agendada).toLocaleDateString("pt-BR") : "—"}
                        {m.custo ? ` • R$ ${Number(m.custo).toFixed(2)}` : ""}
                      </p>
                      {m.descricao && <p className="text-muted-foreground">{m.descricao}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents */}
            {incidents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Avarias ({incidents.length})
                </h3>
                <div className="space-y-1.5">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-2.5 rounded-lg bg-muted/50 text-xs space-y-0.5">
                      <div className="flex justify-between">
                        <span className="font-medium">{inc.motorista_nome} — {inc.tipo}</span>
                        <Badge className={`${gravColors[inc.gravidade] || ""} text-[10px] h-4`}>
                          {inc.gravidade}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {new Date(inc.created_at).toLocaleDateString("pt-BR")} • {inc.descricao?.slice(0, 80)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {checkouts.length === 0 && fuelRecords.length === 0 && maintenances.length === 0 && incidents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Sem registros neste mês</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>

    {/* Edit Checkout Dialog */}
    <Dialog open={!!editCheckout} onOpenChange={(o) => !o && setEditCheckout(null)}>
      <DialogContent className="max-w-md z-[200]">
        <DialogHeader>
          <DialogTitle>Editar Utilização</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label>Veículo</Label>
            <Select value={editForm.veiculo_id} onValueChange={(v) => setEditForm({ ...editForm, veiculo_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent className="z-[300]">
                {vehiclesList.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.prefixo || v.placa} — {v.marca} {v.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Km Retirada</Label>
              <Input type="number" value={editForm.km_retirada} onChange={(e) => setEditForm({ ...editForm, km_retirada: e.target.value })} />
            </div>
            <div>
              <Label>Km Devolução</Label>
              <Input type="number" value={editForm.km_devolucao} onChange={(e) => setEditForm({ ...editForm, km_devolucao: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Motivo de uso</Label>
            <Input value={editForm.motivo_uso} onChange={(e) => setEditForm({ ...editForm, motivo_uso: e.target.value })} />
          </div>
          <div>
            <Label>Destino / Rota</Label>
            <Input value={editForm.destino_rota} onChange={(e) => setEditForm({ ...editForm, destino_rota: e.target.value })} />
          </div>
          <div>
            <Label>Observações (retirada)</Label>
            <Textarea value={editForm.observacoes_retirada} onChange={(e) => setEditForm({ ...editForm, observacoes_retirada: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Observações (devolução)</Label>
            <Textarea value={editForm.observacoes_devolucao} onChange={(e) => setEditForm({ ...editForm, observacoes_devolucao: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditCheckout(null)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} disabled={saving || !editForm.motivo_uso.trim()}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default VehicleHistorySheet;

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Car, Pencil, QrCode } from "lucide-react";
import { toast } from "sonner";
import VehicleHistorySheet from "@/components/VehicleHistorySheet";
import VehicleQrCode from "@/components/VehicleQrCode";

const statusColors: Record<string, string> = {
  disponivel: "bg-success text-success-foreground",
  em_uso: "bg-primary text-primary-foreground",
  manutencao: "bg-warning text-warning-foreground",
  indisponivel: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  disponivel: "Disponível",
  em_uso: "Em Uso",
  manutencao: "Manutenção",
  indisponivel: "Indisponível",
};

const Vehicles: React.FC = () => {
  const { role, profile } = useAuth();
  const canManage = role === "admin" || role === "frota";
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    placa: "", prefixo: "", marca: "", modelo: "", ano: "",
    tipo: "carro" as string, km_atual: "", observacoes: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<any | null>(null);
  const [qrVehicle, setQrVehicle] = useState<any | null>(null);
  const [kmEditEnabled, setKmEditEnabled] = useState(false);
  const [kmEditVehicle, setKmEditVehicle] = useState<any | null>(null);
  const [kmEditValue, setKmEditValue] = useState("");
  const [kmEditSaving, setKmEditSaving] = useState(false);

  useEffect(() => { fetchVehicles(); fetchKmEditSetting(); }, []);

  const fetchVehicles = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase.from("vehicles").select("*").eq("company_id", profile.company_id).order("prefixo");
    setVehicles(data || []);
  };

  const fetchKmEditSetting = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("settings")
      .select("permitir_edicao_km")
      .eq("company_id", profile.company_id)
      .limit(1)
      .single();
    setKmEditEnabled(!!(data as any)?.permitir_edicao_km);
  };

  const handleKmEdit = async () => {
    if (!kmEditVehicle || !kmEditValue) return;
    setKmEditSaving(true);
    const { error } = await supabase.rpc("update_vehicle_status_on_checkout", {
      _vehicle_id: kmEditVehicle.id,
      _new_status: kmEditVehicle.status,
      _km: Number(kmEditValue),
    });
    setKmEditSaving(false);
    if (error) {
      toast.error("Erro ao atualizar km: " + error.message);
    } else {
      toast.success("Km atualizado com sucesso!");
      setKmEditVehicle(null);
      setKmEditValue("");
      fetchVehicles();
    }
  };

  const filtered = vehicles.filter(
    (v) =>
      v.placa?.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
      v.prefixo?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.placa.trim()) {
      toast.error("Placa é obrigatória");
      return;
    }
    const payload = {
      placa: form.placa.toUpperCase().trim(),
      prefixo: form.prefixo.trim() || null,
      marca: form.marca.trim() || null,
      modelo: form.modelo.trim() || null,
      ano: form.ano ? Number(form.ano) : null,
      tipo: form.tipo as any,
      km_atual: Number(form.km_atual) || 0,
      observacoes: form.observacoes.trim() || null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("vehicles").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("vehicles").insert(payload as any));
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editId ? "Veículo atualizado!" : "Veículo cadastrado!");
      setDialogOpen(false);
      resetForm();
      fetchVehicles();
    }
  };

  const resetForm = () => {
    setForm({ placa: "", prefixo: "", marca: "", modelo: "", ano: "", tipo: "carro", km_atual: "", observacoes: "" });
    setEditId(null);
  };

  const openEdit = (v: any) => {
    setForm({
      placa: v.placa, prefixo: v.prefixo || "", marca: v.marca || "", modelo: v.modelo || "",
      ano: v.ano?.toString() || "", tipo: v.tipo, km_atual: v.km_atual?.toString() || "", observacoes: v.observacoes || "",
    });
    setEditId(v.id);
    setDialogOpen(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Veículos</h1>
          <p className="text-sm text-muted-foreground">{vehicles.length} veículos cadastrados</p>
        </div>
        {canManage && (
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Placa *</Label><Input value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} placeholder="ABC1D23" /></div>
                <div><Label>Prefixo</Label><Input value={form.prefixo} onChange={(e) => setForm({ ...form, prefixo: e.target.value })} placeholder="Carro 01" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
                <div><Label>Modelo</Label><Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ano</Label><Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} /></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carro">Carro</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="ambulancia">Ambulância</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Km Atual</Label><Input type="number" value={form.km_atual} onChange={(e) => setForm({ ...form, km_atual: e.target.value })} /></div>
              <div><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
              <Button className="w-full" onClick={handleSave}>{editId ? "Salvar Alterações" : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por placa, modelo ou prefixo..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map((v) => (
          <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setHistoryVehicle(v)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Car className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{v.prefixo || v.placa}</p>
                <p className="text-xs text-muted-foreground">{v.marca} {v.modelo} • {v.placa}</p>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={(e) => { e.stopPropagation(); openEdit(v); }}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-auto p-0 px-1" onClick={(e) => { e.stopPropagation(); setQrVehicle(v); }} title="QR Code">
                      <QrCode className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-right">
                {v.status === "indisponivel" ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="focus:outline-none">
                          <Badge className={`${statusColors[v.status]} cursor-pointer`}>{statusLabels[v.status]}</Badge>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" className="max-w-[240px] text-xs p-3">
                        {(() => {
                          const baseKm = Number(v.km_ultima_revisao ?? 0);
                          const intervalo = Number(v.alerta_revisao_km_intervalo ?? 0);
                          if (intervalo > 0) {
                            const nextRev = baseKm + intervalo;
                            const diff = nextRev - Number(v.km_atual);
                            if (diff <= 0) return "⛔ Revisão vencida. Km atual ultrapassou o limite de revisão.";
                            if (diff <= 500) return `⚠️ Faltam apenas ${diff} km para a revisão programada.`;
                          }
                          return "Veículo marcado como indisponível pelo gestor.";
                        })()}
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <Badge className={statusColors[v.status]}>{statusLabels[v.status]}</Badge>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-xs text-muted-foreground">{Number(v.km_atual).toLocaleString("pt-BR")} km</p>
                  {role === "admin" && kmEditEnabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setKmEditVehicle(v);
                        setKmEditValue(String(v.km_atual || 0));
                      }}
                      className="text-muted-foreground hover:text-primary"
                      title="Editar KM"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Car className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum veículo encontrado</p>
          </div>
        )}
      </div>

      <VehicleHistorySheet
        vehicle={historyVehicle}
        open={!!historyVehicle}
        onOpenChange={(open) => { if (!open) setHistoryVehicle(null); }}
      />

      {/* Dialog de Edição de KM */}
      <Dialog open={!!kmEditVehicle} onOpenChange={(open) => { if (!open) { setKmEditVehicle(null); setKmEditValue(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar KM — {kmEditVehicle?.prefixo || kmEditVehicle?.placa}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Km Atual</Label>
              <Input
                type="number"
                value={kmEditValue}
                onChange={(e) => setKmEditValue(e.target.value)}
                placeholder="Digite o novo km"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Km registrado: {Number(kmEditVehicle?.km_atual || 0).toLocaleString("pt-BR")} km
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setKmEditVehicle(null); setKmEditValue(""); }}>Cancelar</Button>
              <Button onClick={handleKmEdit} disabled={kmEditSaving || !kmEditValue}>
                {kmEditSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <VehicleQrCode
        vehicle={qrVehicle}
        open={!!qrVehicle}
        onOpenChange={(open) => { if (!open) setQrVehicle(null); }}
      />
    </div>
  );
};

export default Vehicles;

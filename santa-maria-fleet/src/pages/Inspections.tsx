import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyWhatsApp } from "@/utils/getCompanyWhatsApp";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardCheck, Car, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const Inspections: React.FC = () => {
  const { user, role, profile } = useAuth();
  const canManage = role === "admin" || role === "frota";
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openIncidents, setOpenIncidents] = useState<any[]>([]);
  const [form, setForm] = useState({
    veiculo_id: "",
    calibracao_pneus: "ok",
    nivel_agua: "ok",
    nivel_oleo: "ok",
    abastecido: false,
    km_inspecao: "",
    avarias_encontradas: "",
    observacoes: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    if (!profile?.company_id) return;
    const cid = profile.company_id;
    const [{ data: vehs }, { data: insps }, { data: incs }] = await Promise.all([
      supabase.from("vehicles").select("id, placa, prefixo, km_atual").eq("company_id", cid).order("prefixo"),
      supabase.from("inspections").select("*").eq("company_id", cid).order("data_inspecao", { ascending: false }).limit(50),
      supabase.from("incidents").select("*, vehicles(placa, prefixo)").eq("company_id", cid).eq("status", "aberta").order("created_at", { ascending: false }),
    ]);
    setVehicles(vehs || []);
    setOpenIncidents(incs || []);

    // Enrich inspections with vehicle info
    const vehMap = Object.fromEntries((vehs || []).map((v: any) => [v.id, v]));
    setInspections(
      (insps || []).map((i: any) => ({
        ...i,
        veiculo_nome: vehMap[i.veiculo_id]?.prefixo || vehMap[i.veiculo_id]?.placa || "?",
      }))
    );
  };

  const handleSave = async () => {
    if (!form.veiculo_id) {
      toast.error("Selecione um veículo");
      return;
    }
    const { error } = await supabase.from("inspections").insert({
      veiculo_id: form.veiculo_id,
      inspecionado_por_user_id: user!.id,
      calibracao_pneus: form.calibracao_pneus,
      nivel_agua: form.nivel_agua,
      nivel_oleo: form.nivel_oleo,
      abastecido: form.abastecido,
      km_inspecao: Number(form.km_inspecao) || 0,
      avarias_encontradas: form.avarias_encontradas.trim() || null,
      observacoes: form.observacoes.trim() || null,
    } as any);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Inspeção registrada!");

    // Get vehicle info for WhatsApp
    const veh = vehicles.find((v: any) => v.id === form.veiculo_id);
    const avariasAbertas = openForVehicle(form.veiculo_id);

    // Mandatory WhatsApp notification
    const waPhone = await getCompanyWhatsApp();
    if (waPhone) {
      const statusEmoji = (v: string) => v === "ok" ? "✅" : v === "baixo" ? "⚠️" : "🔴";
      let msgText = `🔍 *Inspeção Veicular*\n\n🚘 *Veículo:* ${veh?.prefixo || veh?.placa}\n🪪 *Placa:* ${veh?.placa}\n🛣️ *Km:* ${Number(form.km_inspecao).toLocaleString("pt-BR")}\n🗓️ *Data:* ${new Date().toLocaleString("pt-BR")}\n\n🛞 *Pneus:* ${statusEmoji(form.calibracao_pneus)} ${form.calibracao_pneus}\n💧 *Água:* ${statusEmoji(form.nivel_agua)} ${form.nivel_agua}\n🛢️ *Óleo:* ${statusEmoji(form.nivel_oleo)} ${form.nivel_oleo}\n⛽ *Abastecido:* ${form.abastecido ? "Sim ✅" : "Não ❌"}`;
      if (form.avarias_encontradas.trim()) {
        msgText += `\n\n🚨 Avarias encontradas: ${form.avarias_encontradas.trim()}`;
      }
      if (avariasAbertas.length > 0) {
        msgText += `\n\n⚠️ ${avariasAbertas.length} avaria(s) aberta(s) no veículo`;
      }
      const msg = encodeURIComponent(msgText);
      const waLink = `https://wa.me/${waPhone.replace(/\D/g, "")}?text=${msg}`;
      window.location.href = waLink;
    } else {
      toast.error("WhatsApp da empresa não configurado! Vá em Configurações > Empresa.");
    }

    setDialogOpen(false);
    setForm({ veiculo_id: "", calibracao_pneus: "ok", nivel_agua: "ok", nivel_oleo: "ok", abastecido: false, km_inspecao: "", avarias_encontradas: "", observacoes: "" });
    fetchAll();
  };

  const statusIcon = (val: string) =>
    val === "ok" ? <CheckCircle2 className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-warning" />;

  const openForVehicle = (vehId: string) => openIncidents.filter((i) => i.veiculo_id === vehId);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Inspeções</h1>
          <p className="text-sm text-muted-foreground">Checklist semanal dos veículos</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><ClipboardCheck className="w-4 h-4 mr-1" />Nova Inspeção</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nova Inspeção</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Veículo *</Label>
                  <Select value={form.veiculo_id} onValueChange={(v) => setForm({ ...form, veiculo_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.prefixo || v.placa}
                          {openForVehicle(v.id).length > 0 && ` ⚠️ ${openForVehicle(v.id).length} avaria(s)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.veiculo_id && openForVehicle(form.veiculo_id).length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Avarias abertas neste veículo:
                    </p>
                    {openForVehicle(form.veiculo_id).map((inc: any) => (
                      <p key={inc.id} className="text-xs text-muted-foreground">
                        • {inc.tipo} — {inc.descricao?.slice(0, 50)}{inc.descricao?.length > 50 ? "..." : ""} ({inc.gravidade})
                      </p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Calibração Pneus</Label>
                    <Select value={form.calibracao_pneus} onValueChange={(v) => setForm({ ...form, calibracao_pneus: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ok">✅ OK</SelectItem>
                        <SelectItem value="baixo">⚠️ Baixo</SelectItem>
                        <SelectItem value="critico">🔴 Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Nível de Água</Label>
                    <Select value={form.nivel_agua} onValueChange={(v) => setForm({ ...form, nivel_agua: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ok">✅ OK</SelectItem>
                        <SelectItem value="baixo">⚠️ Baixo</SelectItem>
                        <SelectItem value="critico">🔴 Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nível de Óleo</Label>
                    <Select value={form.nivel_oleo} onValueChange={(v) => setForm({ ...form, nivel_oleo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ok">✅ OK</SelectItem>
                        <SelectItem value="baixo">⚠️ Baixo</SelectItem>
                        <SelectItem value="critico">🔴 Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Km Atual</Label>
                    <Input type="number" value={form.km_inspecao} onChange={(e) => setForm({ ...form, km_inspecao: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="abastecido" checked={form.abastecido} onChange={(e) => setForm({ ...form, abastecido: e.target.checked })} />
                  <Label htmlFor="abastecido">Veículo abastecido?</Label>
                </div>
                <div>
                  <Label>Avarias encontradas (não cadastradas)</Label>
                  <Textarea value={form.avarias_encontradas} onChange={(e) => setForm({ ...form, avarias_encontradas: e.target.value })} placeholder="Descreva avarias novas encontradas..." />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={handleSave}>Registrar Inspeção</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Open incidents summary */}
      {canManage && openIncidents.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              {openIncidents.length} avaria(s) aberta(s) na frota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {openIncidents.slice(0, 5).map((inc: any) => (
              <p key={inc.id} className="text-xs text-muted-foreground">
                <span className="font-medium">{inc.vehicles?.prefixo || inc.vehicles?.placa}</span> — {inc.tipo} • {inc.gravidade}
              </p>
            ))}
            {openIncidents.length > 5 && <p className="text-xs text-muted-foreground">... e mais {openIncidents.length - 5}</p>}
          </CardContent>
        </Card>
      )}

      {/* Inspection history */}
      <div className="space-y-2">
        {inspections.map((insp: any) => (
          <Card key={insp.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Car className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{insp.veiculo_nome}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs flex items-center gap-0.5">🛞 {statusIcon(insp.calibracao_pneus)}</span>
                  <span className="text-xs flex items-center gap-0.5">💧 {statusIcon(insp.nivel_agua)}</span>
                  <span className="text-xs flex items-center gap-0.5">🛢️ {statusIcon(insp.nivel_oleo)}</span>
                  {insp.abastecido && <Badge variant="outline" className="text-[10px] h-5">⛽ Abastecido</Badge>}
                </div>
                {insp.avarias_encontradas && (
                  <p className="text-xs text-destructive mt-1">⚠️ {insp.avarias_encontradas.slice(0, 60)}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{new Date(insp.data_inspecao).toLocaleDateString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">{Number(insp.km_inspecao).toLocaleString("pt-BR")} km</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {inspections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma inspeção registrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspections;

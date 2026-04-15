import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyWhatsApp } from "@/utils/getCompanyWhatsApp";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, AlertTriangle, Camera, Wrench, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  aberta: "bg-destructive text-destructive-foreground",
  em_andamento: "bg-warning text-warning-foreground",
  resolvida: "bg-success text-success-foreground",
};

const Incidents: React.FC = () => {
  const { user, role, profile } = useAuth();
  const canManage = role === "admin" || role === "frota";
  const [incidents, setIncidents] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewIncident, setViewIncident] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    veiculo_id: "", motorista_id: "", tipo: "outro" as string, descricao: "",
    gravidade: "leve" as string, veiculo_imobilizado: false, custo_estimado: "",
    fotos: [] as File[], fotoPreviews: [] as string[],
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    if (!profile?.company_id) return;
    const cid = profile.company_id;
    const { data } = await supabase.from("incidents").select("*, vehicles(placa, prefixo)").eq("company_id", cid).order("created_at", { ascending: false });
    const { data: allProfiles } = await supabase.from("profiles").select("user_id, nome").eq("company_id", cid);
    const profileMap = Object.fromEntries((allProfiles || []).map((p) => [p.user_id, p.nome]));
    const enriched = (data || []).map((inc) => ({ ...inc, motorista_nome: profileMap[inc.motorista_id] || "?" }));
    setIncidents(enriched);
    const { data: v } = await supabase.from("vehicles").select("id, placa, prefixo").eq("company_id", cid);
    setVehicles(v || []);
    const { data: d } = await supabase.from("profiles").select("user_id, nome").eq("company_id", cid).eq("ativo", true);
    setDrivers(d || []);
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map((f) => URL.createObjectURL(f));
    setForm({ ...form, fotos: [...form.fotos, ...files], fotoPreviews: [...form.fotoPreviews, ...previews] });
  };

  const handleSave = async () => {
    if (saving) return;
    if (!form.veiculo_id || !form.descricao || form.fotos.length === 0) {
      toast.error("Preencha os campos obrigatórios (mínimo 1 foto)");
      return;
    }

    setSaving(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of form.fotos) {
        const path = `avarias/${Date.now()}_${file.name}`;
        await supabase.storage.from("fleet-files").upload(path, file);
        const { data } = supabase.storage.from("fleet-files").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      const { error } = await supabase.from("incidents").insert({
        veiculo_id: form.veiculo_id,
        motorista_id: form.motorista_id || user!.id,
        registrado_por_user_id: user!.id,
        tipo: form.tipo as any,
        descricao: form.descricao,
        gravidade: form.gravidade as any,
        fotos: uploadedUrls,
        veiculo_imobilizado: form.veiculo_imobilizado,
        custo_estimado: form.custo_estimado ? Number(form.custo_estimado) : null,
      } as any);

      if (error) { toast.error(error.message); return; }

      if (form.veiculo_imobilizado) {
        await supabase.from("vehicles").update({ status: "manutencao" as any }).eq("id", form.veiculo_id);
      }
      toast.success("Avaria registrada!");

      const veh = vehicles.find((v) => v.id === form.veiculo_id);
      const driver = drivers.find((d) => d.user_id === (form.motorista_id || user!.id));
      const waPhone = await getCompanyWhatsApp();
      if (waPhone) {
        const msgText = `🚨 *Nova Avaria Registrada*\n\n🚘 *Veículo:* ${veh?.prefixo || veh?.placa}\n🔧 *Tipo:* ${form.tipo}\n⚠️ *Gravidade:* ${form.gravidade.toUpperCase()}\n🧑‍💼 *Motorista:* ${driver?.nome || "—"}\n📝 *Descrição:* ${form.descricao}\n${form.veiculo_imobilizado ? "🛑 *Veículo IMOBILIZADO*" : ""}\n${form.custo_estimado ? `💰 *Custo estimado:* R$ ${Number(form.custo_estimado).toFixed(2)}` : ""}\n🗓️ *Data:* ${new Date().toLocaleString("pt-BR")}`;
        window.open(`https://wa.me/${waPhone.replace(/\D/g, "")}?text=${encodeURIComponent(msgText)}`, "_blank");
      } else {
        toast.error("WhatsApp da empresa não configurado! Vá em Configurações > Empresa.");
      }

      setDialogOpen(false);
      setForm({ veiculo_id: "", motorista_id: "", tipo: "outro", descricao: "", gravidade: "leve", veiculo_imobilizado: false, custo_estimado: "", fotos: [], fotoPreviews: [] });
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const handleSendToMaintenance = async (inc: any) => {
    const { error } = await supabase.from("vehicles").update({ status: "manutencao" as any }).eq("id", inc.veiculo_id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("incidents").update({ status: "em_andamento" as any, veiculo_imobilizado: true }).eq("id", inc.id);
    toast.success("Veículo enviado para manutenção!");
    setViewIncident(null);
    fetchAll();
  };

  const handleResolve = async (inc: any) => {
    await supabase.from("incidents").update({ status: "resolvida" as any }).eq("id", inc.id);
    toast.success("Avaria marcada como resolvida!");
    setViewIncident(null);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("incidents").delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); }
    else { toast.success("Avaria excluída!"); }
    setDeleteTarget(null);
    setViewIncident(null);
    fetchAll();
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Avarias</h1>
          <p className="text-sm text-muted-foreground">{incidents.length} registros</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Avaria</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Veículo *</Label>
                <Select value={form.veiculo_id} onValueChange={(v) => setForm({ ...form, veiculo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.prefixo || v.placa}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Motorista</Label>
                <Select value={form.motorista_id} onValueChange={(v) => setForm({ ...form, motorista_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{drivers.map((d) => <SelectItem key={d.user_id} value={d.user_id}>{d.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arranhao">Arranhão</SelectItem>
                      <SelectItem value="amassado">Amassado</SelectItem>
                      <SelectItem value="pneu">Pneu</SelectItem>
                      <SelectItem value="mecanica">Mecânica</SelectItem>
                      <SelectItem value="eletrica">Elétrica</SelectItem>
                      <SelectItem value="multa">Multa</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Gravidade</Label>
                  <Select value={form.gravidade} onValueChange={(v) => setForm({ ...form, gravidade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leve">Leve</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="grave">Grave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Descrição *</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div><Label>Custo Estimado (R$)</Label><Input type="number" value={form.custo_estimado} onChange={(e) => setForm({ ...form, custo_estimado: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="imobilizado" checked={form.veiculo_imobilizado} onChange={(e) => setForm({ ...form, veiculo_imobilizado: e.target.checked })} />
                <Label htmlFor="imobilizado">Veículo imobilizado?</Label>
              </div>
              <div>
                <Label>Fotos * (mínimo 1)</Label>
                <label className="flex flex-col items-center border-2 border-dashed border-input rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                  <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">{form.fotos.length} foto(s) selecionada(s)</span>
                  <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotos} />
                </label>
                {form.fotoPreviews.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {form.fotoPreviews.map((p, i) => <img key={i} src={p} className="w-16 h-16 rounded object-cover" />)}
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!viewIncident} onOpenChange={(open) => !open && setViewIncident(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {viewIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {viewIncident.vehicles?.prefixo || viewIncident.vehicles?.placa} — {viewIncident.tipo}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={statusColors[viewIncident.status]}>{viewIncident.status}</Badge>
                  <Badge variant="outline" className="capitalize">{viewIncident.gravidade}</Badge>
                </div>
                <div>
                  <p className="text-sm">{viewIncident.descricao}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Motorista: {viewIncident.motorista_nome} • {new Date(viewIncident.created_at).toLocaleString("pt-BR")}
                  </p>
                  {viewIncident.custo_estimado && (
                    <p className="text-xs text-muted-foreground">Custo estimado: R$ {Number(viewIncident.custo_estimado).toFixed(2)}</p>
                  )}
                </div>

                {viewIncident.fotos && viewIncident.fotos.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold">Fotos da Avaria</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {viewIncident.fotos.map((url: string, i: number) => (
                        <img key={i} src={url} alt={`Avaria ${i + 1}`} className="w-full h-32 object-cover rounded-lg border" />
                      ))}
                    </div>
                  </div>
                )}

                {canManage && viewIncident.status === "aberta" && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleSendToMaintenance(viewIncident)}>
                      <Wrench className="w-4 h-4 mr-1" /> Enviar p/ Manutenção
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleResolve(viewIncident)}>
                      Resolver
                    </Button>
                  </div>
                )}
                {canManage && viewIncident.status === "em_andamento" && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleResolve(viewIncident)}>
                    Marcar como Resolvida
                  </Button>
                )}

                {canManage && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(viewIncident); }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Excluir Avaria
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir avaria?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-2">
        {incidents.map((inc) => (
          <Card key={inc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewIncident(inc)}>
            <CardContent className="p-4 flex items-center gap-4">
              {inc.fotos && inc.fotos.length > 0 ? (
                <img src={inc.fotos[0]} alt="Avaria" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{inc.vehicles?.prefixo || inc.vehicles?.placa}</p>
                <p className="text-xs text-muted-foreground truncate">{inc.descricao}</p>
                <p className="text-xs text-muted-foreground capitalize">{inc.motorista_nome} • {new Date(inc.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <Badge className={statusColors[inc.status]}>{inc.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{inc.gravidade}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {incidents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma avaria registrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Incidents;

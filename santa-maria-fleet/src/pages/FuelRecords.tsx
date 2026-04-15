import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Fuel, Camera, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

const FuelRecords: React.FC = () => {
  const { user, profile, role } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    veiculo_id: "", motorista_id: "", tipo_combustivel: "gasolina",
    litros: "", valor_total: "", km_no_abastecimento: "", posto_nome: "",
    comprovante: null as File | null, fotoPreview: "",
  });

  const canManage = role === "admin" || role === "frota";

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    if (!profile?.company_id) return;
    const cid = profile.company_id;
    const { data: r } = await supabase.from("fuel_records").select("*, vehicles(placa, prefixo)").eq("company_id", cid).order("data_hora", { ascending: false });
    const { data: allProfiles } = await supabase.from("profiles").select("user_id, nome").eq("company_id", cid);
    const profileMap = Object.fromEntries((allProfiles || []).map((p) => [p.user_id, p.nome]));
    const enriched = (r || []).map((rec) => ({ ...rec, motorista_nome: profileMap[rec.motorista_id] || "?" }));
    setRecords(enriched);
    const { data: v } = await supabase.from("vehicles").select("id, placa, prefixo").eq("company_id", cid);
    setVehicles(v || []);
    const { data: d } = await supabase.from("profiles").select("user_id, nome").eq("company_id", cid).eq("ativo", true);
    setDrivers(d || []);
  };

  const total = records.reduce((s, r) => s + Number(r.valor_total), 0);

  const resetForm = () => {
    setForm({ veiculo_id: "", motorista_id: "", tipo_combustivel: "gasolina", litros: "", valor_total: "", km_no_abastecimento: "", posto_nome: "", comprovante: null, fotoPreview: "" });
    setEditingId(null);
  };

  const openEdit = (rec: any) => {
    setEditingId(rec.id);
    setForm({
      veiculo_id: rec.veiculo_id,
      motorista_id: rec.motorista_id,
      tipo_combustivel: rec.tipo_combustivel,
      litros: String(rec.litros),
      valor_total: String(rec.valor_total),
      km_no_abastecimento: rec.km_no_abastecimento ? String(rec.km_no_abastecimento) : "",
      posto_nome: rec.posto_nome || "",
      comprovante: null,
      fotoPreview: rec.comprovante_foto || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.veiculo_id || !form.litros || !form.valor_total) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    setSaving(true);

    let comprovante_foto: string | null = null;
    if (form.comprovante) {
      const path = `comprovantes/${Date.now()}_${form.comprovante.name}`;
      await supabase.storage.from("fleet-files").upload(path, form.comprovante);
      const { data } = supabase.storage.from("fleet-files").getPublicUrl(path);
      comprovante_foto = data.publicUrl;
    }

    if (editingId) {
      const updateData: any = {
        veiculo_id: form.veiculo_id,
        motorista_id: form.motorista_id || user!.id,
        tipo_combustivel: form.tipo_combustivel,
        litros: Number(form.litros),
        valor_total: Number(form.valor_total),
        km_no_abastecimento: form.km_no_abastecimento ? Number(form.km_no_abastecimento) : null,
        posto_nome: form.posto_nome || null,
      };
      if (comprovante_foto) updateData.comprovante_foto = comprovante_foto;

      const { error } = await supabase.from("fuel_records").update(updateData).eq("id", editingId);
      if (error) toast.error(error.message);
      else toast.success("Abastecimento atualizado!");
    } else {
      const { error } = await supabase.from("fuel_records").insert({
        veiculo_id: form.veiculo_id,
        motorista_id: form.motorista_id || user!.id,
        registrado_por_user_id: user!.id,
        tipo_combustivel: form.tipo_combustivel as any,
        litros: Number(form.litros),
        valor_total: Number(form.valor_total),
        km_no_abastecimento: form.km_no_abastecimento ? Number(form.km_no_abastecimento) : null,
        posto_nome: form.posto_nome || null,
        comprovante_foto,
      } as any);
      if (error) toast.error(error.message);
      else toast.success("Abastecimento registrado!");
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("fuel_records").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success("Abastecimento excluído!"); fetchAll(); }
    setDeleteId(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Abastecimentos</h1>
          <p className="text-sm text-muted-foreground">Total: R$ {total.toFixed(2)}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Novo</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar Abastecimento" : "Novo Abastecimento"}</DialogTitle></DialogHeader>
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
              <div><Label>Tipo Combustível</Label>
                <Select value={form.tipo_combustivel} onValueChange={(v) => setForm({ ...form, tipo_combustivel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasolina">Gasolina</SelectItem>
                    <SelectItem value="etanol">Etanol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Litros *</Label><Input type="number" value={form.litros} onChange={(e) => setForm({ ...form, litros: e.target.value })} /></div>
                <div><Label>Valor (R$) *</Label><Input type="number" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Km</Label><Input type="number" value={form.km_no_abastecimento} onChange={(e) => setForm({ ...form, km_no_abastecimento: e.target.value })} /></div>
                <div><Label>Posto</Label><Input value={form.posto_nome} onChange={(e) => setForm({ ...form, posto_nome: e.target.value })} /></div>
              </div>
              <div>
                <Label>Comprovante (opcional)</Label>
                <label className="flex items-center justify-center border-2 border-dashed border-input rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                  {form.fotoPreview ? <img src={form.fotoPreview} alt="Comprovante" className="max-h-32 object-contain" /> : <Camera className="w-6 h-6 text-muted-foreground" />}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setForm({ ...form, comprovante: f, fotoPreview: URL.createObjectURL(f) });
                  }} />
                </label>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Registrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {records.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Fuel className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{r.vehicles?.prefixo || r.vehicles?.placa}</p>
                <p className="text-xs text-muted-foreground">{r.motorista_nome} • {r.litros}L {r.tipo_combustivel}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">R$ {Number(r.valor_total).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.data_hora).toLocaleDateString("pt-BR")}</p>
              </div>
              {canManage && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Fuel className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum abastecimento registrado</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir abastecimento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FuelRecords;

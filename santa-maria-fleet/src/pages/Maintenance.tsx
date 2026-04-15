import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Wrench, Pencil } from "lucide-react";
import { toast } from "sonner";

const Maintenance: React.FC = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyForm = {
    veiculo_id: "", tipo_servico: "", descricao: "", data_agendada: "",
    data_realizada: "", km_na_manutencao: "", custo: "", status: "agendada",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    if (!profile?.company_id) return;
    const cid = profile.company_id;
    const { data } = await supabase.from("maintenance").select("*, vehicles(placa, prefixo)").eq("company_id", cid).order("created_at", { ascending: false });
    setRecords(data || []);
    const { data: v } = await supabase.from("vehicles").select("id, placa, prefixo").eq("company_id", cid);
    setVehicles(v || []);
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      veiculo_id: m.veiculo_id,
      tipo_servico: m.tipo_servico,
      descricao: m.descricao || "",
      data_agendada: m.data_agendada || "",
      data_realizada: m.data_realizada || "",
      km_na_manutencao: m.km_na_manutencao?.toString() || "",
      custo: m.custo?.toString() || "",
      status: m.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.veiculo_id || !form.tipo_servico) {
      toast.error("Veículo e tipo de serviço são obrigatórios");
      return;
    }

    const payload = {
      veiculo_id: form.veiculo_id,
      tipo_servico: form.tipo_servico,
      descricao: form.descricao || null,
      data_agendada: form.data_agendada || null,
      data_realizada: form.data_realizada || null,
      km_na_manutencao: form.km_na_manutencao ? Number(form.km_na_manutencao) : null,
      custo: form.custo ? Number(form.custo) : null,
      status: form.status as any,
    };

    const { error } = editingId
      ? await supabase.from("maintenance").update(payload).eq("id", editingId)
      : await supabase.from("maintenance").insert(payload as any);

    if (error) toast.error(error.message);
    else {
      // Atualizar status do veículo conforme status da manutenção
      if (form.status === "realizada") {
        // Buscar km atual do veículo para registrar como km_ultima_revisao
        const { data: veh } = await supabase.from("vehicles").select("km_atual").eq("id", form.veiculo_id).single();
        const kmRevisao = form.km_na_manutencao ? Number(form.km_na_manutencao) : Number(veh?.km_atual ?? 0);
        await supabase.from("vehicles").update({
          status: "disponivel" as any,
          km_ultima_revisao: kmRevisao,
          data_ultima_revisao: new Date().toISOString().split("T")[0],
        }).eq("id", form.veiculo_id);
      } else {
        await supabase.from("vehicles").update({ status: "manutencao" as any }).eq("id", form.veiculo_id);
      }

      toast.success(editingId ? "Manutenção atualizada!" : "Manutenção registrada!");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchAll();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Manutenções</h1>
          <p className="text-sm text-muted-foreground">{records.length} registros</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar Manutenção" : "Nova Manutenção"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Veículo *</Label>
                <Select value={form.veiculo_id} onValueChange={(v) => setForm({ ...form, veiculo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.prefixo || v.placa}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo de Serviço *</Label><Input value={form.tipo_servico} onChange={(e) => setForm({ ...form, tipo_servico: e.target.value })} placeholder="Ex: Troca de óleo" /></div>
              <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data Agendada</Label><Input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} /></div>
                <div><Label>Data Realizada</Label><Input type="date" value={form.data_realizada} onChange={(e) => setForm({ ...form, data_realizada: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Km</Label><Input type="number" value={form.km_na_manutencao} onChange={(e) => setForm({ ...form, km_na_manutencao: e.target.value })} /></div>
                <div><Label>Custo (R$)</Label><Input type="number" value={form.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })} /></div>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave}>{editingId ? "Salvar" : "Registrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {records.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Wrench className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{m.vehicles?.prefixo || m.vehicles?.placa}</p>
                <p className="text-xs text-muted-foreground">{m.tipo_servico}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <div className="text-right">
                <Badge className={m.status === "realizada" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                  {m.status === "realizada" ? "Realizada" : "Agendada"}
                </Badge>
                {m.custo && <p className="text-xs text-muted-foreground mt-1">R$ {Number(m.custo).toFixed(2)}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {records.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Wrench className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma manutenção registrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Maintenance;

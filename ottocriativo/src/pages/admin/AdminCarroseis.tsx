import { useState } from "react";
import { useAllHomeCarousels } from "@/hooks/useHomeCarousels";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";

const TIPOS = [
  { value: "novidades", label: "Novidades (últimos adicionados)" },
  { value: "destaques", label: "Destaques" },
  { value: "categoria", label: "Categoria específica" },
];

const AdminCarroseis = () => {
  const { data: carousels, isLoading } = useAllHomeCarousels();
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({ titulo: "", emoji: "📦", tipo: "novidades", categoria_id: "" });

  const handleAdd = async () => {
    if (!newForm.titulo.trim()) {
      toast.error("Informe o título");
      return;
    }
    const maxOrdem = carousels?.reduce((max, c: any) => Math.max(max, c.ordem), 0) ?? 0;
    const { error } = await supabase.from("home_carousels").insert({
      titulo: newForm.titulo,
      emoji: newForm.emoji || "📦",
      tipo: newForm.tipo,
      categoria_id: newForm.tipo === "categoria" && newForm.categoria_id ? newForm.categoria_id : null,
      ordem: maxOrdem + 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Carrossel adicionado!");
    setNewForm({ titulo: "", emoji: "📦", tipo: "novidades", categoria_id: "" });
    setAdding(false);
    queryClient.invalidateQueries({ queryKey: ["home-carousels"] });
    queryClient.invalidateQueries({ queryKey: ["home-carousels-all"] });
  };

  const handleToggle = async (id: string, ativo: boolean) => {
    const { error } = await supabase.from("home_carousels").update({ ativo }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["home-carousels"] });
    queryClient.invalidateQueries({ queryKey: ["home-carousels-all"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apagar este carrossel?")) return;
    const { error } = await supabase.from("home_carousels").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Carrossel removido");
    queryClient.invalidateQueries({ queryKey: ["home-carousels"] });
    queryClient.invalidateQueries({ queryKey: ["home-carousels-all"] });
  };

  const handleMoveUp = async (index: number) => {
    if (!carousels || index <= 0) return;
    const current = carousels[index] as any;
    const prev = carousels[index - 1] as any;
    await Promise.all([
      supabase.from("home_carousels").update({ ordem: prev.ordem }).eq("id", current.id),
      supabase.from("home_carousels").update({ ordem: current.ordem }).eq("id", prev.id),
    ]);
    queryClient.invalidateQueries({ queryKey: ["home-carousels"] });
    queryClient.invalidateQueries({ queryKey: ["home-carousels-all"] });
  };

  if (isLoading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Carrosséis da Página Inicial</h1>
        <Button onClick={() => setAdding(!adding)} size="sm" className="rounded-full">
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {adding && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Novo Carrossel</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[60px_1fr] gap-2">
              <div>
                <Label>Emoji</Label>
                <Input value={newForm.emoji} onChange={e => setNewForm({ ...newForm, emoji: e.target.value })} className="text-center text-xl" maxLength={4} />
              </div>
              <div>
                <Label>Título</Label>
                <Input value={newForm.titulo} onChange={e => setNewForm({ ...newForm, titulo: e.target.value })} placeholder="Ex: 🐣 Páscoa" />
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={newForm.tipo} onValueChange={v => setNewForm({ ...newForm, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {newForm.tipo === "categoria" && (
              <div>
                <Label>Categoria</Label>
                <Select value={newForm.categoria_id} onValueChange={v => setNewForm({ ...newForm, categoria_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.emoji} {c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleAdd} className="rounded-full">Adicionar</Button>
              <Button variant="ghost" onClick={() => setAdding(false)} className="rounded-full">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {carousels?.map((c: any, i: number) => (
          <Card key={c.id} className={!c.ativo ? "opacity-50" : ""}>
            <CardContent className="flex items-center gap-4 py-4">
              <button onClick={() => handleMoveUp(i)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                <GripVertical className="h-5 w-5" />
              </button>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {c.tipo === "categoria" ? `Categoria: ${c.categories?.emoji || ""} ${c.categories?.nome || "—"}` : TIPOS.find(t => t.value === c.tipo)?.label}
                </p>
              </div>
              <Switch checked={c.ativo} onCheckedChange={v => handleToggle(c.id, v)} />
              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {carousels?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum carrossel configurado.</p>
        )}
      </div>
    </div>
  );
};

export default AdminCarroseis;

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTenant } from "@/contexts/TenantContext";

const AdminCategorias = () => {
  const { data: categories, isLoading } = useCategories(false);
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", slug: "", emoji: "", descricao: "", ordem: 0, ativa: true, destaque: false });

  const resetForm = () => {
    setForm({ nome: "", slug: "", emoji: "", descricao: "", ordem: 0, ativa: true, destaque: false });
    setEditing(null);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    const slug = form.slug || generateSlug(form.nome);
    const payload = { nome: form.nome, slug, emoji: form.emoji, descricao: form.descricao, ordem: form.ordem, ativa: form.ativa, destaque: form.destaque, ...(tenantId && !editing ? { tenant_id: tenantId } : {}) } as any;
    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria atualizada");
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria criada");
    }
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    setOpen(false);
    resetForm();
  };

  const handleEdit = (cat: any) => {
    setForm({ nome: cat.nome, slug: cat.slug, emoji: cat.emoji ?? "", descricao: cat.descricao ?? "", ordem: cat.ordem, ativa: cat.ativa, destaque: cat.destaque ?? false });
    setEditing(cat.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Categoria excluída");
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Categorias</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Nova</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Editar" : "Nova"} Categoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={generateSlug(form.nome)} /></div>
              <div><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="📁" /></div>
              <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.ativa} onCheckedChange={(v) => setForm({ ...form, ativa: v })} /><Label>Ativa</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.destaque} onCheckedChange={(v) => setForm({ ...form, destaque: v })} /><Label>⭐ Destaque</Label></div>
              <Button onClick={handleSave} className="w-full rounded-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {categories?.map((cat: any) => (
            <div key={cat.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.emoji || "📁"}</span>
                <div>
                  <p className="font-medium text-sm">{cat.nome}</p>
                  <p className="text-xs text-muted-foreground">/{cat.slug} • Ordem: {cat.ordem}</p>
                </div>
                {cat.destaque && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">⭐ Destaque</span>}
                {!cat.ativa && <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Inativa</span>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCategorias;

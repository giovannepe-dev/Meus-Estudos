import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

const AdminProdutos = () => {
  const { tenantId } = useTenant();
  const { data: products, isLoading } = useProducts({ onlyActive: false });
  const { data: categories } = useCategories(false);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [form, setForm] = useState({
    nome: "", slug: "", descricao: "", arquivo: "", imagem_url: "",
    preco: "", categoria_id: "", destaque: false, personalizavel: false,
    novidade: false, ativo: true, ordem: 0,
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setForm({ nome: "", slug: "", descricao: "", arquivo: "", imagem_url: "", preco: "", categoria_id: "", destaque: false, personalizavel: false, novidade: false, ativo: true, ordem: 0 });
    setTagsInput("");
    setEditing(null);
  };

  const handleSave = async () => {
    const slug = form.slug || generateSlug(form.nome);
    const data: any = {
      nome: form.nome,
      slug,
      descricao: form.descricao,
      arquivo: form.arquivo,
      imagem_url: form.imagem_url,
      preco: form.preco ? parseFloat(form.preco) : null,
      categoria_id: form.categoria_id || null,
      destaque: form.destaque,
      personalizavel: form.personalizavel,
      novidade: form.novidade,
      ativo: form.ativo,
      ordem: form.ordem,
    };
    if (tenantId && !editing) {
      data.tenant_id = tenantId;
    }

    let productId = editing;

    if (editing) {
      const { error } = await supabase.from("products").update(data).eq("id", editing);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data: newProduct, error } = await supabase.from("products").insert(data).select("id").single();
      if (error) { toast.error(error.message); return; }
      productId = newProduct.id;
    }

    // Handle tags
    if (productId) {
      await supabase.from("product_tags").delete().eq("product_id", productId);
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        await supabase.from("product_tags").insert(tags.map((tag) => ({ product_id: productId!, tag, ...(tenantId ? { tenant_id: tenantId } : {}) })));
      }
    }

    toast.success(editing ? "Produto atualizado" : "Produto criado");
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setOpen(false);
    resetForm();
  };

  const handleEdit = (p: any) => {
    setForm({
      nome: p.nome, slug: p.slug, descricao: p.descricao ?? "", arquivo: p.arquivo ?? "",
      imagem_url: p.imagem_url ?? "", preco: p.preco?.toString() ?? "", categoria_id: p.categoria_id ?? "",
      destaque: p.destaque, personalizavel: p.personalizavel, novidade: p.novidade, ativo: p.ativo, ordem: p.ordem,
    });
    setTagsInput(p.product_tags?.map((t: any) => t.tag).join(", ") ?? "");
    setEditing(p.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produto excluído");
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, file);
    if (error) { toast.error("Erro no upload: " + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
    setForm({ ...form, imagem_url: publicUrl });
    toast.success("Imagem enviada");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Produtos</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Editar" : "Novo"} Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={generateSlug(form.nome)} /></div>
              <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
              <div><Label>Nome do Arquivo</Label><Input value={form.arquivo} onChange={(e) => setForm({ ...form, arquivo: e.target.value })} /></div>
              <div>
                <Label>Imagem</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                {form.imagem_url && <img src={form.imagem_url} alt="Preview" className="h-20 rounded-lg mt-2 object-cover" />}
              </div>
              <div><Label>URL da Imagem (ou upload acima)</Label><Input value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} /></div>
              <div><Label>Preço (opcional)</Label><Input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Tags (separadas por vírgula)</Label><Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="mdf, corte laser, festa" /></div>
              <div><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2"><Switch checked={form.destaque} onCheckedChange={(v) => setForm({ ...form, destaque: v })} /><Label>Destaque</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.personalizavel} onCheckedChange={(v) => setForm({ ...form, personalizavel: v })} /><Label>Personalizável</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.novidade} onCheckedChange={(v) => setForm({ ...form, novidade: v })} /><Label>Novidade</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label>Ativo</Label></div>
              </div>
              <Button onClick={handleSave} className="w-full rounded-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {products?.map((p) => (
            <div key={p.id} className="bg-card rounded-xl border p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                {p.imagem_url ? <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-display">{p.nome[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.nome}</p>
                <p className="text-xs text-muted-foreground">{p.categories?.nome ?? "Sem categoria"} • {p.arquivo ?? ""}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!p.ativo && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Inativo</span>}
                {p.destaque && <span className="text-xs">⭐</span>}
                <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProdutos;

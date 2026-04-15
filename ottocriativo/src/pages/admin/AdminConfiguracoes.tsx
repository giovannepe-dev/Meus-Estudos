import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const AdminConfiguracoes = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nome_site: "", slogan: "", descricao: "", whatsapp: "", instagram: "",
    banner_url: "", mostrar_preco: false, mensagem_padrao: "", cor_destaque: "#E63946",
    hero_bg_url: "",
  });

  const [resetOptions, setResetOptions] = useState({
    products: false,
    categories: false,
    tags: false,
    telegramMessages: false,
  });
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (settings) {
      setForm({
        nome_site: settings.nome_site ?? "",
        slogan: settings.slogan ?? "",
        descricao: settings.descricao ?? "",
        whatsapp: settings.whatsapp ?? "",
        instagram: settings.instagram ?? "",
        banner_url: settings.banner_url ?? "",
        mostrar_preco: settings.mostrar_preco ?? false,
        mensagem_padrao: settings.mensagem_padrao ?? "",
        cor_destaque: settings.cor_destaque ?? "#E63946",
        hero_bg_url: settings.hero_bg_url ?? "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settings?.id) return;
    const { error } = await supabase.from("site_settings").update(form).eq("id", settings.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Configurações salvas");
    queryClient.invalidateQueries({ queryKey: ["site-settings"] });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `banner-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) { toast.error("Erro no upload"); return; }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    setForm({ ...form, banner_url: publicUrl });
    toast.success("Banner enviado");
  };

  const handleHeroBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `hero-bg-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) { toast.error("Erro no upload"); return; }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    setForm({ ...form, hero_bg_url: publicUrl });
    toast.success("Imagem de fundo enviada");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banners").upload(path, file);
    if (error) { toast.error("Erro no upload"); return; }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    // Update tenant logo_url
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from("tenants").update({ logo_url: publicUrl }).eq("owner_id", session.user.id);
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    }
    toast.success("Logo enviada");
  };

  const anyResetSelected = Object.values(resetOptions).some(Boolean);

  const handleReset = async () => {
    if (confirmText !== "APAGAR") {
      toast.error('Digite "APAGAR" para confirmar');
      return;
    }
    if (!anyResetSelected) {
      toast.error("Selecione pelo menos uma opção");
      return;
    }

    setResetting(true);
    try {
      // Order matters: tags → products → categories (foreign keys)
      if (resetOptions.tags) {
        const { error } = await supabase.from("product_tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw error;
      }

      if (resetOptions.products) {
        const { error } = await supabase.from("product_tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw error;
        const { error: err2 } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (err2) throw err2;
      }

      if (resetOptions.categories) {
        // Must delete products first if not already
        if (!resetOptions.products) {
          await supabase.from("product_tags").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        }
        const { error } = await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw error;
      }

      if (resetOptions.telegramMessages) {
        const { error } = await supabase.from("telegram_messages").delete().neq("update_id", -1);
        if (error) throw error;
      }

      toast.success("Dados apagados com sucesso!");
      setResetOptions({ products: false, categories: false, tags: false, telegramMessages: false });
      setConfirmText("");
      queryClient.invalidateQueries();
    } catch (err: any) {
      toast.error("Erro ao apagar: " + (err?.message || "desconhecido"));
    } finally {
      setResetting(false);
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl" />)}</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold mb-6">Configurações</h1>

      <Card>
        <CardHeader><CardTitle className="font-display">Dados do Site</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nome do Site</Label><Input value={form.nome_site} onChange={(e) => setForm({ ...form, nome_site: e.target.value })} /></div>
          <div><Label>Slogan</Label><Input value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div>
            <Label>WhatsApp (com DDI, ex: 5562998816808)</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "") })}
              placeholder="5562998816808"
            />
            {form.whatsapp && !form.whatsapp.startsWith("55") && (
              <p className="text-xs text-destructive mt-1">⚠️ O número deve começar com 55 (código do Brasil). Ex: 55{form.whatsapp}</p>
            )}
          </div>
          <div><Label>Instagram (sem @)</Label><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
          <div>
            <Label>Logo da Loja</Label>
            <Input type="file" accept="image/*" onChange={handleLogoUpload} />
            <p className="text-xs text-muted-foreground mt-1">Aparece no cabeçalho e nos orçamentos. Se não enviar, mostra apenas o nome.</p>
          </div>
          <div>
            <Label>Imagem de Fundo (Hero)</Label>
            <Input type="file" accept="image/*" onChange={handleHeroBgUpload} />
            {form.hero_bg_url && <img src={form.hero_bg_url} alt="Hero BG" className="h-24 rounded-lg mt-2 object-cover w-full" />}
          </div>
          <div>
            <Label>Banner</Label>
            <Input type="file" accept="image/*" onChange={handleBannerUpload} />
            {form.banner_url && <img src={form.banner_url} alt="Banner" className="h-24 rounded-lg mt-2 object-cover" />}
          </div>
          <div><Label>Cor Destaque</Label><Input type="color" value={form.cor_destaque} onChange={(e) => setForm({ ...form, cor_destaque: e.target.value })} className="h-10 w-20" /></div>
          <div><Label>Mensagem Padrão do WhatsApp</Label><Textarea value={form.mensagem_padrao} onChange={(e) => setForm({ ...form, mensagem_padrao: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.mostrar_preco} onCheckedChange={(v) => setForm({ ...form, mostrar_preco: v })} /><Label>Mostrar preços</Label></div>
          <Button onClick={handleSave} className="w-full rounded-full">Salvar Configurações</Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo — Resetar Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione o que deseja apagar. Esta ação é <strong>irreversível</strong>.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="reset-products"
                checked={resetOptions.products}
                onCheckedChange={(v) => setResetOptions({ ...resetOptions, products: !!v })}
              />
              <Label htmlFor="reset-products">Todos os Produtos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="reset-categories"
                checked={resetOptions.categories}
                onCheckedChange={(v) => setResetOptions({ ...resetOptions, categories: !!v })}
              />
              <Label htmlFor="reset-categories">Todas as Categorias (apaga produtos também)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="reset-tags"
                checked={resetOptions.tags}
                onCheckedChange={(v) => setResetOptions({ ...resetOptions, tags: !!v })}
              />
              <Label htmlFor="reset-tags">Todas as Tags de Produtos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="reset-telegram"
                checked={resetOptions.telegramMessages}
                onCheckedChange={(v) => setResetOptions({ ...resetOptions, telegramMessages: !!v })}
              />
              <Label htmlFor="reset-telegram">Mensagens do Telegram</Label>
            </div>
          </div>

          {anyResetSelected && (
            <div className="space-y-2 pt-2">
              <Label className="text-destructive">Digite "APAGAR" para confirmar:</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="APAGAR"
                className="border-destructive/50"
              />
            </div>
          )}

          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={!anyResetSelected || confirmText !== "APAGAR" || resetting}
            className="w-full rounded-full"
          >
            {resetting ? "Apagando..." : "Apagar Selecionados"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminConfiguracoes;

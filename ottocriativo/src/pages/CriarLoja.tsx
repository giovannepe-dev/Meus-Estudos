import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Store } from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

const CriarLoja = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"auth" | "store">("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [tipoPessoa, setTipoPessoa] = useState("fisica");
  const [documento, setDocumento] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setStep("store");
      }
    });
  }, []);

  const handleNomeChange = useCallback((val: string) => {
    setNome(val);
    if (!slugManuallyEdited) {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
      slugTimerRef.current = setTimeout(() => {
        setSlug(slugify(val));
      }, 300);
    }
  }, [slugManuallyEdited]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInErr) {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id ?? null);
      setStep("store");
      setSubmitting(false);
      return;
    }

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) {
      setError(signUpErr.message);
      setSubmitting(false);
      return;
    }

    if (signUpData.user && !signUpData.session) {
      toast.info("Verifique seu e-mail para confirmar o cadastro.");
      setSubmitting(false);
      return;
    }

    setUserId(signUpData.user?.id ?? null);
    setStep("store");
    setSubmitting(false);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setError("");
    setSubmitting(true);

    const finalSlug = slug || slugify(nome);

      const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .insert({
        nome,
        slug: finalSlug,
        owner_id: userId,
        tipo_pessoa: tipoPessoa,
        documento: documento || null,
        nome_responsavel: nomeResponsavel || null,
        ativo: false,
      })
      .select()
      .single();

    if (tenantErr) {
      setError(tenantErr.message);
      setSubmitting(false);
      return;
    }

    await supabase.from("site_settings").insert({
      tenant_id: tenant.id,
      nome_site: nome,
      whatsapp: whatsapp.replace(/\D/g, ""),
    });

    toast.success("Loja criada! Aguarde a aprovação do administrador.");
    navigate("/admin");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Store className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle className="font-display text-2xl">Criar Minha Loja</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Crie seu catálogo online em minutos
          </p>
        </CardHeader>
        <CardContent>
          {step === "auth" ? (
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                {submitting ? "Aguarde..." : "Continuar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <RadioGroup value={tipoPessoa} onValueChange={setTipoPessoa} className="flex gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="fisica" id="pf" />
                    <Label htmlFor="pf">Pessoa Física</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="juridica" id="pj" />
                    <Label htmlFor="pj">Pessoa Jurídica</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>{tipoPessoa === "juridica" ? "Nome da Empresa" : "Nome Completo"}</Label>
                <Input
                  value={nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>{tipoPessoa === "juridica" ? "CNPJ" : "CPF"}</Label>
                <Input
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder={tipoPessoa === "juridica" ? "00.000.000/0000-00" : "000.000.000-00"}
                />
              </div>
              {tipoPessoa === "juridica" && (
                <div>
                  <Label>Nome do Responsável</Label>
                  <Input value={nomeResponsavel} onChange={(e) => setNomeResponsavel(e.target.value)} />
                </div>
              )}
              <div>
                <Label>URL da Loja</Label>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="whitespace-nowrap">/loja/</span>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setSlug(slugify(e.target.value));
                    }}
                    className="flex-1"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>WhatsApp (com DDI)</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                  placeholder="5562998816808"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                {submitting ? "Criando..." : "Criar Loja"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CriarLoja;

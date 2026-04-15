import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, ExternalLink, Lock, Unlock, Building2, Plus, Pencil, Trash2, Copy, Eye,
  Calendar, User, FileText, CheckCircle, XCircle, AlertTriangle, Clock
} from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  ativo: { label: "Ativo", variant: "default", icon: CheckCircle },
  em_carencia: { label: "Em Carência", variant: "secondary", icon: Clock },
  bloqueado: { label: "Bloqueado", variant: "destructive", icon: Lock },
  cancelado: { label: "Cancelado", variant: "outline", icon: XCircle },
};

interface TenantForm {
  nome: string;
  slug: string;
  documento: string;
  nome_responsavel: string;
  tipo_pessoa: string;
  subscription_status: string;
  subscription_due_date: string;
}

const emptyForm: TenantForm = {
  nome: "",
  slug: "",
  documento: "",
  nome_responsavel: "",
  tipo_pessoa: "fisica",
  subscription_status: "ativo",
  subscription_due_date: "",
};

const SuperAdminEmpresas = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [form, setForm] = useState<TenantForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["super-admin-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = tenants?.filter(
    (t) =>
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.documento ?? "").includes(search)
  );

  const generateSlug = (nome: string) =>
    nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleCreate = async () => {
    if (!form.nome || !form.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("tenants").insert({
      nome: form.nome,
      slug: form.slug,
      documento: form.documento || null,
      nome_responsavel: form.nome_responsavel || null,
      tipo_pessoa: form.tipo_pessoa,
      subscription_status: form.subscription_status,
      subscription_due_date: form.subscription_due_date || null,
      subscription_start_date: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("unique") ? "Slug já existe" : error.message);
      return;
    }
    toast.success("Empresa criada com sucesso!");
    setShowCreateDialog(false);
    setForm(emptyForm);
    setSlugManuallyEdited(false);
    queryClient.invalidateQueries({ queryKey: ["super-admin-tenants"] });
  };

  const handleEdit = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    const updates: any = {
      nome: form.nome,
      slug: form.slug,
      documento: form.documento || null,
      nome_responsavel: form.nome_responsavel || null,
      tipo_pessoa: form.tipo_pessoa,
      subscription_status: form.subscription_status,
      subscription_due_date: form.subscription_due_date || null,
    };
    if (form.subscription_status === "bloqueado") updates.subscription_blocked_at = new Date().toISOString();
    if (form.subscription_status === "ativo") {
      updates.subscription_blocked_at = null;
    }

    const { error } = await supabase.from("tenants").update(updates).eq("id", selectedTenant.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Empresa atualizada!");
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: ["super-admin-tenants"] });
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    const { error } = await supabase.from("tenants").delete().eq("id", selectedTenant.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Empresa excluída!");
    setShowDeleteDialog(false);
    setSelectedTenant(null);
    queryClient.invalidateQueries({ queryKey: ["super-admin-tenants"] });
  };

  const updateStatus = async (tenantId: string, newStatus: string) => {
    const updates: any = { subscription_status: newStatus };
    if (newStatus === "bloqueado") updates.subscription_blocked_at = new Date().toISOString();
    if (newStatus === "ativo") updates.subscription_blocked_at = null;

    const { error } = await supabase.from("tenants").update(updates).eq("id", tenantId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status atualizado");
    queryClient.invalidateQueries({ queryKey: ["super-admin-tenants"] });
  };

  const toggleAtivo = async (tenantId: string, currentAtivo: boolean) => {
    const { error } = await supabase.from("tenants").update({ ativo: !currentAtivo }).eq("id", tenantId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(currentAtivo ? "Empresa desativada" : "Empresa ativada");
    queryClient.invalidateQueries({ queryKey: ["super-admin-tenants"] });
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/loja/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const openEdit = (t: any) => {
    setSelectedTenant(t);
    setForm({
      nome: t.nome,
      slug: t.slug,
      documento: t.documento ?? "",
      nome_responsavel: t.nome_responsavel ?? "",
      tipo_pessoa: t.tipo_pessoa ?? "fisica",
      subscription_status: t.subscription_status ?? "ativo",
      subscription_due_date: t.subscription_due_date ? t.subscription_due_date.split("T")[0] : "",
    });
    setShowEditDialog(true);
  };

  const openDetails = (t: any) => {
    setSelectedTenant(t);
    setShowDetailsDialog(true);
  };

  // Stats
  const totalPendentes = tenants?.filter((t) => !t.ativo).length ?? 0;
  const totalAtivos = tenants?.filter((t) => t.subscription_status === "ativo" && t.ativo).length ?? 0;
  const totalBloqueados = tenants?.filter((t) => t.subscription_status === "bloqueado").length ?? 0;
  const totalCarencia = tenants?.filter((t) => t.subscription_status === "em_carencia").length ?? 0;
  const totalCancelados = tenants?.filter((t) => t.subscription_status === "cancelado").length ?? 0;

  const handleNomeFieldChange = useCallback((newNome: string, isEdit: boolean) => {
    setForm((prev) => ({ ...prev, nome: newNome }));
    if (!isEdit && !slugManuallyEdited) {
      if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
      slugTimerRef.current = setTimeout(() => {
        setForm((prev) => ({ ...prev, slug: generateSlug(newNome) }));
      }, 300);
    }
  }, [slugManuallyEdited]);

  const renderFormFields = (isEdit: boolean) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome da Empresa *</Label>
          <Input value={form.nome} onChange={(e) => handleNomeFieldChange(e.target.value, isEdit)} placeholder="Nome da empresa" />
        </div>
        <div className="space-y-2">
          <Label>Slug (URL) *</Label>
          <Input value={form.slug} onChange={(e) => {
            setSlugManuallyEdited(true);
            setForm((prev) => ({ ...prev, slug: e.target.value }));
          }} placeholder="slug-da-empresa" />
          {!isEdit && !slugManuallyEdited && form.slug && (
            <p className="text-xs text-muted-foreground">Gerado automaticamente do nome</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Input value={form.nome_responsavel} onChange={(e) => setForm((prev) => ({ ...prev, nome_responsavel: e.target.value }))} placeholder="Nome do responsável" />
        </div>
        <div className="space-y-2">
          <Label>Documento (CPF/CNPJ)</Label>
          <Input value={form.documento} onChange={(e) => setForm((prev) => ({ ...prev, documento: e.target.value }))} placeholder="CPF ou CNPJ" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tipo Pessoa</Label>
          <Select value={form.tipo_pessoa} onValueChange={(v) => setForm((prev) => ({ ...prev, tipo_pessoa: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fisica">Pessoa Física</SelectItem>
              <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status Assinatura</Label>
          <Select value={form.subscription_status} onValueChange={(v) => setForm((prev) => ({ ...prev, subscription_status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="em_carencia">Em Carência</SelectItem>
              <SelectItem value="bloqueado">Bloqueado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Vencimento</Label>
          <Input type="date" value={form.subscription_due_date} onChange={(e) => setForm((prev) => ({ ...prev, subscription_due_date: e.target.value }))} />
        </div>
      </div>
    </div>
  );

  if (isLoading) return <div className="animate-pulse space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" /> Gestão de Empresas
        </h1>
        <Button onClick={() => { setForm(emptyForm); setSlugManuallyEdited(false); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Empresa
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={totalPendentes > 0 ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${totalPendentes > 0 ? "text-orange-500 animate-pulse" : "text-muted-foreground"}`} />
            <div><p className="text-2xl font-bold">{totalPendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
          </CardContent>
        </Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-primary" />
          <div><p className="text-2xl font-bold">{totalAtivos}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-secondary" />
          <div><p className="text-2xl font-bold">{totalCarencia}</p><p className="text-xs text-muted-foreground">Em Carência</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Lock className="h-5 w-5 text-destructive" />
          <div><p className="text-2xl font-bold">{totalBloqueados}</p><p className="text-xs text-muted-foreground">Bloqueados</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-muted-foreground" />
          <div><p className="text-2xl font-bold">{totalCancelados}</p><p className="text-xs text-muted-foreground">Cancelados</p></div>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, slug ou documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} empresas encontradas</p>

      {/* Tenant list */}
      <div className="space-y-4">
        {filtered?.map((t) => {
          const status = statusLabels[t.subscription_status] ?? statusLabels.ativo;
          const StatusIcon = status.icon;
          return (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-lg">{t.nome}</h3>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      {!t.ativo && <Badge variant="outline" className="text-orange-600 border-orange-400">Pendente</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">/{t.slug}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {t.documento && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{t.documento}</span>}
                      {t.nome_responsavel && <span className="flex items-center gap-1"><User className="h-3 w-3" />{t.nome_responsavel}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Criado: {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      {t.subscription_due_date && (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Venc: {new Date(t.subscription_due_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Approve button for pending stores */}
                    {!t.ativo && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
                        onClick={() => toggleAtivo(t.id, false)}
                      >
                        <CheckCircle className="h-4 w-4" /> Aprovar
                      </Button>
                    )}
                    {/* Quick status change */}
                    <Select
                      value={t.subscription_status ?? "ativo"}
                      onValueChange={(v) => updateStatus(t.id, v)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="em_carencia">Em Carência</SelectItem>
                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" size="sm" title="Ver detalhes" onClick={() => openDetails(t)}>
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" title="Editar" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      title={t.ativo ? "Desativar" : "Ativar"}
                      onClick={() => toggleAtivo(t.id, t.ativo)}
                    >
                      {t.ativo ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </Button>

                    <Button variant="outline" size="sm" title="Copiar link" onClick={() => copyLink(t.slug)}>
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" title="Abrir vitrine" onClick={() => window.open(`/loja/${t.slug}`, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      title="Excluir"
                      onClick={() => { setSelectedTenant(t); setShowDeleteDialog(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma empresa encontrada.</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>Preencha os dados para criar uma nova empresa.</DialogDescription>
          </DialogHeader>
          {renderFormFields(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Criando..." : "Criar Empresa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Altere os dados da empresa.</DialogDescription>
          </DialogHeader>
          {renderFormFields(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Empresa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{selectedTenant?.nome}</strong>? Esta ação não pode ser desfeita. Todos os dados associados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving ? "Excluindo..." : "Excluir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Empresa</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{selectedTenant.nome}</span>

                <span className="text-muted-foreground">Slug:</span>
                <span className="font-mono">{selectedTenant.slug}</span>

                <span className="text-muted-foreground">Responsável:</span>
                <span>{selectedTenant.nome_responsavel ?? "—"}</span>

                <span className="text-muted-foreground">Documento:</span>
                <span>{selectedTenant.documento ?? "—"}</span>

                <span className="text-muted-foreground">Tipo:</span>
                <span>{selectedTenant.tipo_pessoa === "juridica" ? "Pessoa Jurídica" : "Pessoa Física"}</span>

                <span className="text-muted-foreground">Status:</span>
                <Badge variant={statusLabels[selectedTenant.subscription_status]?.variant ?? "default"}>
                  {statusLabels[selectedTenant.subscription_status]?.label ?? selectedTenant.subscription_status}
                </Badge>

                <span className="text-muted-foreground">Ativo:</span>
                <span>{selectedTenant.ativo ? "Sim" : "Não"}</span>

                <span className="text-muted-foreground">Criado em:</span>
                <span>{new Date(selectedTenant.created_at).toLocaleDateString("pt-BR")}</span>

                <span className="text-muted-foreground">Início assinatura:</span>
                <span>{selectedTenant.subscription_start_date ? new Date(selectedTenant.subscription_start_date).toLocaleDateString("pt-BR") : "—"}</span>

                <span className="text-muted-foreground">Vencimento:</span>
                <span>{selectedTenant.subscription_due_date ? new Date(selectedTenant.subscription_due_date).toLocaleDateString("pt-BR") : "—"}</span>

                <span className="text-muted-foreground">Bloqueado em:</span>
                <span>{selectedTenant.subscription_blocked_at ? new Date(selectedTenant.subscription_blocked_at).toLocaleDateString("pt-BR") : "—"}</span>

                <span className="text-muted-foreground">Link vitrine:</span>
                <span className="font-mono text-xs break-all">{window.location.origin}/loja/{selectedTenant.slug}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => copyLink(selectedTenant.slug)}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar Link
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(`/loja/${selectedTenant.slug}`, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-1" /> Abrir Vitrine
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminEmpresas;

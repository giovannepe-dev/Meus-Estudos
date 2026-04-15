import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Plus, X, Save, Users, Settings, List, Pencil, Trash2, Building2, Upload, MapPin, Camera, QrCode, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const SettingsPage: React.FC = () => {

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Configurações</h1>
      <Tabs defaultValue="empresa">
        <TabsList className="w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="empresa" className="flex-1"><Building2 className="w-4 h-4 mr-1" />Empresa</TabsTrigger>
          <TabsTrigger value="geral" className="flex-1"><Settings className="w-4 h-4 mr-1" />Geral</TabsTrigger>
          <TabsTrigger value="motivos" className="flex-1"><List className="w-4 h-4 mr-1" />Motivos</TabsTrigger>
          <TabsTrigger value="usuarios" className="flex-1"><Users className="w-4 h-4 mr-1" />Usuários</TabsTrigger>
        </TabsList>
        <TabsContent value="empresa"><CompanySettings /></TabsContent>
        <TabsContent value="geral"><GeneralSettings /></TabsContent>
        <TabsContent value="motivos"><MotivosSettings /></TabsContent>
        <TabsContent value="usuarios"><UsersSettings /></TabsContent>
      </Tabs>
    </div>
  );
};

const CompanySettings: React.FC = () => {
  const { profile } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [kmEditEnabled, setKmEditEnabled] = useState(false);
  const [kmEditLoading, setKmEditLoading] = useState(false);
  const [placaOcrEnabled, setPlacaOcrEnabled] = useState(true);
  const [placaOcrLoading, setPlacaOcrLoading] = useState(false);
  const [qrcodeEnabled, setQrcodeEnabled] = useState(true);
  const [qrcodeLoading, setQrcodeLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.company_id) {
      fetchCompany();
      fetchTrackingSetting();
      fetchKmEditSetting();
      fetchValidationSettings();
    }
  }, [profile?.company_id]);

  const fetchCompany = async () => {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile!.company_id)
      .single();
    setCompany(data);
  };

  const fetchTrackingSetting = async () => {
    const { data } = await supabase
      .from("settings")
      .select("rastreamento_ativo")
      .eq("company_id", profile!.company_id)
      .limit(1)
      .single();
    setTrackingEnabled(!!(data as any)?.rastreamento_ativo);
  };

  const fetchKmEditSetting = async () => {
    const { data } = await supabase
      .from("settings")
      .select("permitir_edicao_km")
      .eq("company_id", profile!.company_id)
      .limit(1)
      .single();
    setKmEditEnabled(!!(data as any)?.permitir_edicao_km);
  };

  const fetchValidationSettings = async () => {
    const { data } = await supabase
      .from("settings")
      .select("validacao_placa_ocr, validacao_qrcode")
      .eq("company_id", profile!.company_id)
      .limit(1)
      .single();
    if (data) {
      setPlacaOcrEnabled(!!(data as any).validacao_placa_ocr);
      setQrcodeEnabled(!!(data as any).validacao_qrcode);
    }
  };

  const toggleValidationSetting = async (field: string, checked: boolean, setter: (v: boolean) => void, loaderSetter: (v: boolean) => void) => {
    // Don't allow disabling both
    if (!checked) {
      if (field === "validacao_placa_ocr" && !qrcodeEnabled) {
        toast.error("Pelo menos um método de validação deve estar ativo.");
        return;
      }
      if (field === "validacao_qrcode" && !placaOcrEnabled) {
        toast.error("Pelo menos um método de validação deve estar ativo.");
        return;
      }
    }
    loaderSetter(true);
    const { data: settings } = await supabase
      .from("settings")
      .select("id")
      .eq("company_id", profile!.company_id)
      .limit(1)
      .single();
    if (settings) {
      await supabase
        .from("settings")
        .update({ [field]: checked } as any)
        .eq("id", settings.id);
      setter(checked);
      toast.success(checked ? "Método de validação ativado!" : "Método de validação desativado");
    }
    loaderSetter(false);
  };

  const toggleKmEdit = async (checked: boolean) => {
    setKmEditLoading(true);
    const { data: settings } = await supabase
      .from("settings")
      .select("id")
      .eq("company_id", profile!.company_id)
      .limit(1)
      .single();
    if (settings) {
      await supabase
        .from("settings")
        .update({ permitir_edicao_km: checked } as any)
        .eq("id", settings.id);
      setKmEditEnabled(checked);
      toast.success(checked ? "Edição de KM ativada!" : "Edição de KM desativada");
    }
    setKmEditLoading(false);
  };

  const toggleTracking = async (checked: boolean) => {
    setTrackingLoading(true);
    const { data: settings } = await supabase
      .from("settings")
      .select("id")
      .eq("company_id", profile!.company_id)
      .limit(1)
      .single();
    if (settings) {
      await supabase
        .from("settings")
        .update({ rastreamento_ativo: checked } as any)
        .eq("id", settings.id);
      setTrackingEnabled(checked);
      toast.success(checked ? "Rastreamento ativado!" : "Rastreamento desativado");
    }
    setTrackingLoading(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logos/${company.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("fleet-files")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar logo");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("fleet-files")
      .getPublicUrl(path);

    const logoUrl = urlData.publicUrl + "?t=" + Date.now();

    const { error } = await supabase
      .from("companies")
      .update({ logo_url: logoUrl })
      .eq("id", company.id);

    if (error) {
      toast.error("Erro ao salvar logo");
    } else {
      setCompany({ ...company, logo_url: logoUrl });
      toast.success("Logo atualizada!");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        nome: company.nome,
        cnpj: company.cnpj || null,
        telefone: company.telefone || null,
        endereco: company.endereco || null,
      })
      .eq("id", company.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Dados da empresa salvos!");
  };

  if (!company) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Logo da Empresa</Label>
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt="Logo"
                className="w-20 h-20 object-contain rounded-lg border border-border bg-muted p-1"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Enviando..." : "Enviar Logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG ou JPG, máx 2MB</p>
            </div>
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-1">
          <Label>Nome da Empresa</Label>
          <Input
            value={company.nome || ""}
            onChange={(e) => setCompany({ ...company, nome: e.target.value })}
          />
        </div>

        {/* CNPJ */}
        <div className="space-y-1">
          <Label>CNPJ</Label>
          <Input
            value={company.cnpj || ""}
            onChange={(e) => setCompany({ ...company, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
          />
        </div>

        {/* Telefone */}
        <div className="space-y-1">
          <Label>Telefone / WhatsApp</Label>
          <Input
            value={company.telefone || ""}
            onChange={(e) => setCompany({ ...company, telefone: e.target.value })}
            placeholder="(11) 99999-9999"
          />
        </div>

        {/* Endereço */}
        <div className="space-y-1">
          <Label>Endereço</Label>
          <Textarea
            value={company.endereco || ""}
            onChange={(e) => setCompany({ ...company, endereco: e.target.value })}
            placeholder="Rua, número, bairro, cidade - UF"
            rows={2}
          />
        </div>

        {/* Rastreamento */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Rastreamento em Tempo Real
              </Label>
              <p className="text-xs text-muted-foreground">
                Acompanhe a localização dos motoristas durante checkouts abertos (usa GPS do celular)
              </p>
            </div>
            <Switch
              checked={trackingEnabled}
              onCheckedChange={toggleTracking}
              disabled={trackingLoading}
            />
          </div>
        </div>

        {/* Edição de KM */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Permitir Edição de KM
              </Label>
              <p className="text-xs text-muted-foreground">
                Permite que administradores editem o km atual dos veículos diretamente na página de veículos
              </p>
            </div>
            <Switch
              checked={kmEditEnabled}
              onCheckedChange={toggleKmEdit}
              disabled={kmEditLoading}
            />
          </div>
        </div>

        {/* Validação de Veículo - Foto da Placa (OCR) */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Validação por Foto da Placa (OCR)
              </Label>
              <p className="text-xs text-muted-foreground">
                Motorista tira foto da placa e o sistema verifica automaticamente via IA.
              </p>
            </div>
            <Switch
              checked={placaOcrEnabled}
              onCheckedChange={(c) => toggleValidationSetting("validacao_placa_ocr", c, setPlacaOcrEnabled, setPlacaOcrLoading)}
              disabled={placaOcrLoading}
            />
          </div>
        </div>

        {/* Validação de Veículo - QR Code */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Validação por QR Code
              </Label>
              <p className="text-xs text-muted-foreground">
                Motorista escaneia o QR Code colado no veículo.
              </p>
            </div>
            <Switch
              checked={qrcodeEnabled}
              onCheckedChange={(c) => toggleValidationSetting("validacao_qrcode", c, setQrcodeEnabled, setQrcodeLoading)}
              disabled={qrcodeLoading}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
        </Button>
      </CardContent>
    </Card>
  );
};

const GeneralSettings: React.FC = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile?.company_id) fetchSettings(); }, [profile?.company_id]);

  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("*").eq("company_id", profile!.company_id).limit(1).maybeSingle();
    if (data) {
      setSettings(data);
    } else {
      // Create settings for this company
      const { data: created } = await supabase.from("settings").insert({ company_id: profile!.company_id } as any).select("*").single();
      setSettings(created);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("settings").update({
      manutencao_intervalo_km_padrao: Number(settings.manutencao_intervalo_km_padrao),
    }).eq("id", settings.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Configurações salvas!");
  };

  if (!settings) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <Label>Intervalo de Revisão (km)</Label>
          <Input type="number" value={settings.manutencao_intervalo_km_padrao} onChange={(e) => setSettings({ ...settings, manutencao_intervalo_km_padrao: e.target.value })} />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
        </Button>
      </CardContent>
    </Card>
  );
};

const MotivosSettings: React.FC = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [newMotivo, setNewMotivo] = useState("");

  useEffect(() => {
    if (profile?.company_id) {
      supabase.from("settings").select("*").eq("company_id", profile.company_id).limit(1).maybeSingle().then(async ({ data }) => {
        if (data) {
          setSettings(data);
        } else {
          const { data: created } = await supabase.from("settings").insert({ company_id: profile.company_id } as any).select("*").single();
          setSettings(created);
        }
      });
    }
  }, [profile?.company_id]);

  const addMotivo = async () => {
    if (!newMotivo.trim() || !settings) return;
    const updated = [...(settings.motivos_padrao || []), newMotivo.trim()];
    const { error } = await supabase.from("settings").update({ motivos_padrao: updated }).eq("id", settings.id);
    if (!error) {
      setSettings({ ...settings, motivos_padrao: updated });
      setNewMotivo("");
      toast.success("Motivo adicionado!");
    }
  };

  const removeMotivo = async (index: number) => {
    if (!settings) return;
    const updated = settings.motivos_padrao.filter((_: any, i: number) => i !== index);
    const { error } = await supabase.from("settings").update({ motivos_padrao: updated }).eq("id", settings.id);
    if (!error) {
      setSettings({ ...settings, motivos_padrao: updated });
      toast.success("Motivo removido!");
    }
  };

  if (!settings) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input value={newMotivo} onChange={(e) => setNewMotivo(e.target.value)} placeholder="Novo motivo..." className="flex-1" />
          <Button size="sm" onClick={addMotivo}><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-2">
          {settings.motivos_padrao?.map((m: string, i: number) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg">
              <span className="text-sm">{m}</span>
              <button onClick={() => removeMotivo(i)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const UsersSettings: React.FC = () => {
  const { profile, session } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ nome: "", setor: "", role: "" });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ nome: "", email: "", password: "", setor: "", telefone: "", role: "motorista" });
  const [creating, setCreating] = useState(false);
  const [companySlug, setCompanySlug] = useState("");
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => { fetchUsers(); fetchCompanySlug(); }, []);

  const fetchCompanySlug = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase.from("companies").select("slug").eq("id", profile.company_id).single();
    if (data) setCompanySlug(data.slug);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("ativo").order("nome");
    const { data: roles } = await supabase.from("user_roles").select("*");
    
    const rolesMap = new Map<string, string>();
    roles?.forEach((r: any) => rolesMap.set(r.user_id, r.role));
    
    const merged = (profiles || []).map((p: any) => ({
      ...p,
      role: rolesMap.get(p.user_id) || "motorista",
    }));
    setUsers(merged);
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    await supabase.from("profiles").update({ ativo: !currentActive }).eq("user_id", userId);
    fetchUsers();
    toast.success(currentActive ? "Usuário desativado" : "Usuário aprovado!");
  };

  const openEdit = (u: any) => {
    setEditForm({ nome: u.nome, setor: u.setor || "", role: u.role });
    setEditUser(u);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    const { error: profileError } = await supabase.from("profiles").update({
      nome: editForm.nome.trim(),
      setor: editForm.setor.trim() || null,
    }).eq("user_id", editUser.user_id);

    const { error: roleError } = await supabase.from("user_roles").update({
      role: editForm.role as "admin" | "frota" | "motorista",
    }).eq("user_id", editUser.user_id);

    if (profileError || roleError) {
      toast.error("Erro ao atualizar usuário");
    } else {
      toast.success("Usuário atualizado!");
      setEditUser(null);
      fetchUsers();
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    // Delete profile and role records
    await supabase.from("user_roles").delete().eq("user_id", deleteUser.user_id);
    await supabase.from("profiles").delete().eq("user_id", deleteUser.user_id);
    toast.success("Usuário excluído com sucesso!");
    setDeleteUser(null);
    fetchUsers();
  };

  const pendingUsers = users.filter((u) => !u.ativo);
  const activeUsers = users.filter((u) => u.ativo);

  const roleLabels: Record<string, string> = { admin: "Admin", frota: "Frota", motorista: "Motorista" };

  const UserRow = ({ u, actions }: { u: any; actions: React.ReactNode }) => (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{u.nome}</p>
        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
        {u.telefone && <p className="text-xs text-muted-foreground">📱 {u.telefone}</p>}
        {u.setor && <p className="text-xs text-muted-foreground">🏢 {u.setor}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <Badge variant="outline" className="capitalize text-xs">{roleLabels[u.role] || u.role}</Badge>
        {actions}
      </div>
    </div>
  );

  const handleCreateDriver = async () => {
    if (!createForm.nome.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error("Nome, email e senha são obrigatórios");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-driver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(createForm),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro ao cadastrar");
      } else {
        toast.success("Motorista cadastrado com sucesso! Já pode fazer login.");
        setShowCreateDialog(false);
        setCreateForm({ nome: "", email: "", password: "", setor: "", telefone: "", role: "motorista" });
        fetchUsers();
      }
    } catch {
      toast.error("Erro de conexão");
    }
    setCreating(false);
  };

  const inviteLink = companySlug ? `${window.location.origin}/c/${companySlug}` : "";

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copiado!");
  };

  const shareInviteWhatsApp = () => {
    const text = encodeURIComponent(`Cadastre-se na nossa frota: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />Cadastrar Motorista
        </Button>
        {inviteLink && (
          <>
            <Button variant="outline" onClick={copyInviteLink}>
              📋 Copiar Link de Convite
            </Button>
            <Button variant="outline" onClick={shareInviteWhatsApp}>
              📱 Enviar via WhatsApp
            </Button>
          </>
        )}
      </div>

      {pendingUsers.length > 0 && (
        <Card className="border-warning/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive" className="text-xs">
                {pendingUsers.length} pendente{pendingUsers.length > 1 ? "s" : ""}
              </Badge>
              <span className="text-sm font-medium">Aguardando aprovação</span>
            </div>
            {pendingUsers.map((u) => (
              <UserRow key={u.id} u={u} actions={
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => toggleActive(u.user_id, u.ativo)}>Aprovar</Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteUser(u)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              } />
            ))}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-4 space-y-2">
          {activeUsers.map((u) => (
            <UserRow key={u.id} u={u} actions={
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)} title="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setResetPasswordUser(u); setNewPassword(""); }} title="Alterar senha">
                  <KeyRound className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteUser(u)} title="Excluir">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(u.user_id, u.ativo)}>
                  Desativar
                </Button>
              </div>
            } />
          ))}
          {activeUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário ativo</p>}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
            </div>
            <div>
              <Label>Setor</Label>
              <Input value={editForm.setor} onChange={(e) => setEditForm({ ...editForm, setor: e.target.value })} placeholder="Ex: Enfermagem" />
            </div>
            <div>
              <Label>Perfil</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="frota">Frota</SelectItem>
                  <SelectItem value="motorista">Motorista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleEditSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteUser?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Create Driver Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cadastrar Motorista</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={createForm.nome} onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Senha Inicial *</Label>
              <Input type="text" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input value={createForm.telefone} onChange={(e) => setCreateForm({ ...createForm, telefone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>Setor</Label>
              <Input value={createForm.setor} onChange={(e) => setCreateForm({ ...createForm, setor: e.target.value })} placeholder="Ex: Enfermagem" />
            </div>
            <div>
              <Label>Perfil</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="motorista">Motorista</SelectItem>
                  <SelectItem value="frota">Frota</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateDriver} disabled={creating}>
              {creating ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Definir nova senha para <strong>{resetPasswordUser?.nome}</strong>
          </p>
          <div className="space-y-3">
            <div>
              <Label>Nova Senha</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordUser(null)}>Cancelar</Button>
            <Button
              disabled={resettingPassword}
              onClick={async () => {
                if (!newPassword || newPassword.length < 6) {
                  toast.error("A senha deve ter no mínimo 6 caracteres");
                  return;
                }
                setResettingPassword(true);
                try {
                  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${session?.access_token}`,
                    },
                    body: JSON.stringify({
                      target_user_id: resetPasswordUser.user_id,
                      new_password: newPassword,
                    }),
                  });
                  const result = await res.json();
                  if (!res.ok) {
                    toast.error(result.error || "Erro ao alterar senha");
                  } else {
                    toast.success("Senha alterada com sucesso!");
                    setResetPasswordUser(null);
                  }
                } catch {
                  toast.error("Erro de conexão");
                }
                setResettingPassword(false);
              }}
            >
              {resettingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;

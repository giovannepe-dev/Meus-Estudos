import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Plus, Pencil, Trash2, Building, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles"> & { role?: string };

const ConfiguracoesPage = () => {
  const { user, isAdmin, companyId, refreshCompany } = useAuth();
  const [company, setCompany] = useState({ name: "", cnpj: "", sector: "", size: "" });
  const [users, setUsers] = useState<Profile[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role: "user" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompany();
    fetchUsers();
  }, [companyId, user?.id]);

  const fetchCompany = async () => {
    if (!user?.id) return;

    const query = companyId
      ? supabase.from("companies").select("*").eq("id", companyId)
      : supabase.from("companies").select("*").eq("created_by", user.id).order("created_at", { ascending: false }).limit(1);

    const { data } = await query.maybeSingle();

    if (data) {
      setCompany({ name: data.name, cnpj: data.cnpj || "", sector: data.sector || "", size: data.size || "" });
      return;
    }

    setCompany({ name: "", cnpj: "", sector: "", size: "" });
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (!profiles) return;
    const { data: roles } = await supabase.from("user_roles").select("*");
    const merged = profiles.map((p) => ({
      ...p,
      role: roles?.find((r) => r.user_id === p.user_id)?.role || "user",
    }));
    setUsers(merged);
  };

  const saveCompany = async () => {
    if (!user?.id || !company.name.trim()) {
      toast.error("Informe ao menos o nome da empresa");
      return;
    }

    setSaving(true);

    const operation = companyId
      ? supabase.from("companies").update(company).eq("id", companyId)
      : supabase.from("companies").insert({ ...company, created_by: user.id });

    const { error } = await operation;

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    await refreshCompany();
    await fetchCompany();

    toast.success("Dados da empresa salvos!");
    setSaving(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: { data: { full_name: newUser.full_name } },
    });
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    if (data.user && newUser.role === "admin") {
      await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "admin" as const });
    }
    toast.success("Usuário criado!");
    setDialogOpen(false);
    setNewUser({ email: "", password: "", full_name: "", role: "user" });
    setTimeout(fetchUsers, 1000);
    setSaving(false);
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").upsert({ user_id: userId, role: role as "admin" | "user" });
    toast.success("Papel atualizado!");
    fetchUsers();
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (!confirm(`Remover o usuário ${profile.full_name || profile.email}?`)) return;
    // We can only delete their profile and role - auth user deletion requires admin API
    await supabase.from("user_roles").delete().eq("user_id", profile.user_id);
    await supabase.from("profiles").delete().eq("user_id", profile.user_id);
    toast.success("Usuário removido!");
    fetchUsers();
  };

  const handleUpdateUserName = async () => {
    if (!editingUser) return;
    await supabase.from("profiles").update({ full_name: editingUser.full_name }).eq("user_id", editingUser.user_id);
    toast.success("Usuário atualizado!");
    setEditingUser(null);
    fetchUsers();
  };

  const handleResetSystem = async () => {
    if (!companyId) {
      toast.error("Nenhuma empresa selecionada.");
      return;
    }

    try {
      setSaving(true);
      
      // We need to delete in order due to foreign keys.
      // 1. indicator_values (needs indicator_id)
      // We first need to get all indicators for the company
      const { data: indicators } = await supabase
        .from('indicators')
        .select('id')
        .eq('company_id', companyId);

      if (indicators && indicators.length > 0) {
        const indicatorIds = indicators.map(ind => ind.id);
        
        // Delete indicator_values in chunks if there are many
        // Assuming max 100 indicators for a simple IN clause
        for (let i = 0; i < indicatorIds.length; i += 100) {
          const chunk = indicatorIds.slice(i, i + 100);
          await supabase
            .from('indicator_values')
            .delete()
            .in('indicator_id', chunk);
        }
      }

      // 2. evidences (needs company_id)
      await supabase.from('evidences').delete().eq('company_id', companyId);

      // 3. goals (needs company_id)
      await supabase.from('goals').delete().eq('company_id', companyId);

      // 4. indicators (needs company_id)
      await supabase.from('indicators').delete().eq('company_id', companyId);

      toast.success("Todos os dados do sistema foram excluídos com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao limpar dados: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie empresa e usuários</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa" className="gap-2"><Building className="h-4 w-4" /> Empresa</TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" /> Dados da Empresa</CardTitle>
              <p className="text-xs text-muted-foreground">💡 Esses dados são usados para identificar sua empresa nos relatórios ESG</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Nome da empresa" />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={company.cnpj} onChange={(e) => setCompany({ ...company, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Input value={company.sector} onChange={(e) => setCompany({ ...company, sector: e.target.value })} placeholder="Ex: Tecnologia" />
                </div>
                <div className="space-y-2">
                  <Label>Porte</Label>
                  <Select value={company.size} onValueChange={(v) => setCompany({ ...company, size: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="micro">Micro</SelectItem>
                      <SelectItem value="pequena">Pequena</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveCompany} disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="mt-6 border-destructive">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Zona de Perigo
                </CardTitle>
                <p className="text-xs text-muted-foreground">Ações destrutivas para o sistema.</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Ao zerar o sistema, todos os dados operacionais (indicadores, valores, metas e evidências) desta empresa serão excluídos permanentemente. Essa ação não pode ser desfeita. Os usuários e os dados da empresa não serão afetados.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-fit" disabled={saving}>
                        {saving ? "Processando..." : "Zerar Todo o Sistema"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente todos os indicadores, valores de indicadores, metas e evidências associados a esta empresa.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetSystem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Sim, zerar o sistema
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usuarios">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Usuários</CardTitle>
              {isAdmin && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Usuário</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome completo</Label>
                        <Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Senha</Label>
                        <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Papel</Label>
                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreateUser} disabled={saving} className="w-full">
                        {saving ? "Criando..." : "Criar usuário"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    {isAdmin && <TableHead className="w-24">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.full_name || "—"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {isAdmin && u.user_id !== user?.id ? (
                          <Select value={u.role || "user"} onValueChange={(v) => handleUpdateRole(u.user_id, v)}>
                            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role === "admin" ? "Admin" : "Usuário"}</Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {u.user_id !== user?.id && (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setEditingUser(u)}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteUser(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit user dialog */}
          <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
              {editingUser && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input value={editingUser.full_name} onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })} />
                  </div>
                  <Button onClick={handleUpdateUserName} className="w-full">Salvar</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesPage;

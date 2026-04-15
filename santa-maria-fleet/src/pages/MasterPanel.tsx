import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Building2, Users, Car, Plus, Copy, Shield, Trash2 } from "lucide-react";
import { Navigate } from "react-router-dom";

const MasterPanel: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCnpj, setNewCompanyCnpj] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "company" | "user"; id: string; name: string } | null>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["master-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  const { data: companyCounts = {} } = useQuery({
    queryKey: ["master-company-counts"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("company_id");
      const { data: vehicles } = await supabase.from("vehicles").select("company_id");
      
      const counts: Record<string, { users: number; vehicles: number }> = {};
      profiles?.forEach((p) => {
        if (!counts[p.company_id]) counts[p.company_id] = { users: 0, vehicles: 0 };
        counts[p.company_id].users++;
      });
      vehicles?.forEach((v) => {
        if (!counts[v.company_id]) counts[v.company_id] = { users: 0, vehicles: 0 };
        counts[v.company_id].vehicles++;
      });
      return counts;
    },
    enabled: isSuperAdmin,
  });

  const toggleCompany = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("companies").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-companies"] });
      toast.success("Status da empresa atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });


  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("settings").delete().eq("company_id", id);
      await supabase.from("vehicle_bookings").delete().eq("company_id", id);
      await supabase.from("driver_locations").delete().eq("company_id", id);
      await supabase.from("km_divergences").delete().eq("company_id", id);
      await supabase.from("fuel_records").delete().eq("company_id", id);
      await supabase.from("incidents").delete().eq("company_id", id);
      await supabase.from("inspections").delete().eq("company_id", id);
      await supabase.from("maintenance").delete().eq("company_id", id);
      await supabase.from("traffic_tickets").delete().eq("company_id", id);
      await supabase.from("checkouts").delete().eq("company_id", id);
      await supabase.from("monthly_closings").delete().eq("company_id", id);
      await supabase.from("vehicles").delete().eq("company_id", id);
      const { data: companyProfiles } = await supabase.from("profiles").select("user_id").eq("company_id", id);
      for (const p of companyProfiles || []) {
        await supabase.from("user_roles").delete().eq("user_id", p.user_id);
      }
      await supabase.from("profiles").delete().eq("company_id", id);
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-companies"] });
      queryClient.invalidateQueries({ queryKey: ["master-users"] });
      queryClient.invalidateQueries({ queryKey: ["master-company-counts"] });
      setDeleteTarget(null);
      toast.success("Empresa excluída com sucesso");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir empresa"),
  });

  const deleteUserMut = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-users"] });
      queryClient.invalidateQueries({ queryKey: ["master-company-counts"] });
      setDeleteTarget(null);
      toast.success("Usuário excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir usuário"),
  });

  const createCompany = useMutation({
    mutationFn: async () => {
      const slug = newCompanyName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      
      const { error } = await supabase.from("companies").insert({
        nome: newCompanyName,
        cnpj: newCompanyCnpj || null,
        slug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-companies"] });
      setNewCompanyName("");
      setNewCompanyCnpj("");
      setDialogOpen(false);
      toast.success("Empresa criada com sucesso");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar empresa"),
  });

  const copySignupLink = (slug: string) => {
    const baseUrl = "https://smfrotas.smartsoluções.store";
    const link = `${baseUrl}/c/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de cadastro copiado!");
  };


  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Painel Master</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="Ex: Transportadora ABC" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ (opcional)</Label>
                <Input value={newCompanyCnpj} onChange={(e) => setNewCompanyCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <Button className="w-full" onClick={() => createCompany.mutate()} disabled={!newCompanyName.trim() || createCompany.isPending}>
                {createCompany.isPending ? "Criando..." : "Criar Empresa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{companies.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{companies.filter(c => c.ativo).length}</p>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{companies.filter(c => !c.ativo && !(c as any).ja_ativada).length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{companies.filter(c => !c.ativo && (c as any).ja_ativada).length}</p>
                <p className="text-sm text-muted-foreground">Desativadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Companies (never activated) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">
              {companies.filter(c => !c.ativo && !(c as any).ja_ativada).length}
            </Badge>
            Empresas Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.filter(c => !c.ativo && !(c as any).ja_ativada).length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Nenhuma empresa pendente no momento.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ativar</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.filter(c => !c.ativo && !(c as any).ja_ativada).map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{company.cnpj || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(company.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={false}
                        onCheckedChange={() => toggleCompany.mutate({ id: company.id, ativo: true })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: "company", id: company.id, name: company.nome })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deactivated Companies (were active before) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="destructive">
              {companies.filter(c => !c.ativo && (c as any).ja_ativada).length}
            </Badge>
            Empresas Desativadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.filter(c => !c.ativo && (c as any).ja_ativada).length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Nenhuma empresa desativada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Reativar</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.filter(c => !c.ativo && (c as any).ja_ativada).map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{company.cnpj || "—"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={false}
                        onCheckedChange={() => toggleCompany.mutate({ id: company.id, ativo: true })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: "company", id: company.id, name: company.nome })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead className="text-center"><Users className="w-4 h-4 inline" /> Usuários</TableHead>
                  <TableHead className="text-center"><Car className="w-4 h-4 inline" /> Veículos</TableHead>
                  <TableHead>Status</TableHead>
                   <TableHead>Link Cadastro</TableHead>
                   <TableHead>Ativo</TableHead>
                   <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{company.cnpj || "—"}</TableCell>
                    <TableCell className="text-center">{companyCounts[company.id]?.users || 0}</TableCell>
                    <TableCell className="text-center">{companyCounts[company.id]?.vehicles || 0}</TableCell>
                    <TableCell>
                      <Badge variant={company.ativo ? "default" : "destructive"}>
                        {company.ativo ? "Ativa" : "Bloqueada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => copySignupLink(company.slug)}>
                        <Copy className="w-4 h-4 mr-1" />Copiar
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={company.ativo}
                        onCheckedChange={(checked) => toggleCompany.mutate({ id: company.id, ativo: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ type: "company", id: company.id, name: company.nome })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "company" ? "Excluir Empresa" : "Excluir Usuário"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>?
              {deleteTarget?.type === "company" && " Todos os dados da empresa (veículos, checkouts, etc.) serão removidos."}
              {" "}Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget?.type === "company") {
                  deleteCompany.mutate(deleteTarget.id);
                } else if (deleteTarget?.type === "user") {
                  deleteUserMut.mutate(deleteTarget.id);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MasterPanel;

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Database, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EsgRequirementsGuide, { dadosRequirements } from "@/components/EsgRequirementsGuide";

interface Indicator {
  id: string;
  name: string;
  category: string;
  unit: string;
  target: number;
  lower_is_better: boolean;
  company_id: string;
}

interface IndicatorValue {
  id: string;
  indicator_id: string;
  value: number;
  period: string;
  indicator?: Indicator;
}

const categorySuggestions: Record<string, { name: string; unit: string; lower_is_better: boolean; unitHint: string; targetHint: string; targetExample: number }[]> = {
  ambiental: [
    { name: "Consumo de Energia", unit: "kWh", lower_is_better: true, unitHint: "Quilowatt-hora consumido por mês", targetHint: "Meta máxima de consumo mensal", targetExample: 5000 },
    { name: "Consumo de Água", unit: "m³", lower_is_better: true, unitHint: "Metros cúbicos de água por mês", targetHint: "Meta máxima de consumo mensal", targetExample: 200 },
    { name: "Resíduos Gerados", unit: "kg", lower_is_better: true, unitHint: "Quilos de resíduos gerados por mês", targetHint: "Meta máxima de resíduos por mês", targetExample: 500 },
    { name: "Reciclagem", unit: "%", lower_is_better: false, unitHint: "Percentual de resíduos reciclados", targetHint: "Meta mínima de taxa de reciclagem", targetExample: 80 },
    { name: "Emissões CO₂", unit: "ton", lower_is_better: true, unitHint: "Toneladas de CO₂ emitidas por mês", targetHint: "Meta máxima de emissão mensal", targetExample: 50 },
    { name: "Energia Solar Gerada", unit: "kWh", lower_is_better: false, unitHint: "Quilowatt-hora gerado por painéis solares por mês", targetHint: "Meta mínima de geração mensal", targetExample: 1000 },
    { name: "% de Energia Renovável", unit: "%", lower_is_better: false, unitHint: "Percentual de energia de fontes renováveis", targetHint: "Meta mínima de uso de energia renovável", targetExample: 30 },
  ],
  social: [
    { name: "Treinamentos", unit: "horas", lower_is_better: false, unitHint: "Horas de treinamento por colaborador/ano", targetHint: "Meta mínima de horas de capacitação", targetExample: 40 },
    { name: "Diversidade", unit: "%", lower_is_better: false, unitHint: "Percentual de diversidade no quadro", targetHint: "Meta mínima de representatividade", targetExample: 50 },
    { name: "Segurança do Trabalho", unit: "incidentes", lower_is_better: true, unitHint: "Número de acidentes/incidentes por mês", targetHint: "Meta máxima de incidentes aceitável", targetExample: 0 },
    { name: "Ações Sociais", unit: "projetos", lower_is_better: false, unitHint: "Quantidade de projetos sociais ativos", targetHint: "Meta mínima de projetos por ano", targetExample: 5 },
    { name: "Satisfação dos Colaboradores", unit: "%", lower_is_better: false, unitHint: "Percentual de satisfação em pesquisa interna", targetHint: "Meta mínima de satisfação da equipe", targetExample: 85 },
  ],
  governanca: [
    { name: "Compliance", unit: "%", lower_is_better: false, unitHint: "Percentual de conformidade regulatória", targetHint: "Meta mínima de conformidade", targetExample: 100 },
    { name: "Políticas Internas", unit: "docs", lower_is_better: false, unitHint: "Número de políticas documentadas", targetHint: "Meta mínima de documentos vigentes", targetExample: 10 },
    { name: "Auditorias", unit: "realizadas", lower_is_better: false, unitHint: "Número de auditorias realizadas por ano", targetHint: "Meta mínima de auditorias anuais", targetExample: 4 },
    { name: "Gestão de Riscos", unit: "%", lower_is_better: false, unitHint: "Percentual de riscos mapeados e tratados", targetHint: "Meta mínima de cobertura de riscos", targetExample: 90 },
    { name: "Documentos Obrigatórios", unit: "docs", lower_is_better: false, unitHint: "Número de documentos obrigatórios em dia", targetHint: "Meta mínima de documentos atualizados", targetExample: 15 },
  ],
};

const categories = [
  { value: "ambiental", label: "Ambiental" },
  { value: "social", label: "Social" },
  { value: "governanca", label: "Governança" },
];

const DadosPage = () => {
  const { user, companyId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [values, setValues] = useState<IndicatorValue[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [newIndicator, setNewIndicator] = useState({ name: "", category: "ambiental", unit: "", target: 0, lower_is_better: false });
  const [newValue, setNewValue] = useState({ indicator_id: "", value: 0, period: "" });
  const [saving, setSaving] = useState(false);

  // Auto-open dialog from URL params (e.g. from pillar pages)
  useEffect(() => {
    if (searchParams.get("open") === "new" && companyId) {
      const cat = searchParams.get("category") || "ambiental";
      const normalizedCat = cat === "governança" ? "governanca" : cat;
      const first = categorySuggestions[normalizedCat]?.[0];
      setNewIndicator({
        name: first?.name || "",
        category: normalizedCat,
        unit: first?.unit || "",
        target: first?.targetExample || 0,
        lower_is_better: first?.lower_is_better || false,
      });
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, companyId]);

  useEffect(() => {
    if (companyId) {
      fetchIndicators();
      fetchValues();
    }
  }, [companyId]);

  const fetchIndicators = async () => {
    const { data } = await supabase.from("indicators").select("*").eq("company_id", companyId!);
    setIndicators(data || []);
  };

  const fetchValues = async () => {
    const { data } = await supabase
      .from("indicator_values")
      .select("*, indicators(*)")
      .order("period", { ascending: false });
    if (data) {
      setValues(data.map((v: any) => ({ ...v, indicator: v.indicators })));
    }
  };

  const handleCreateIndicator = async () => {
    if (!newIndicator.name || !newIndicator.unit || !companyId) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("indicators").insert({
      ...newIndicator,
      company_id: companyId,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Indicador criado!");
    setDialogOpen(false);
    setNewIndicator({ name: "", category: "ambiental", unit: "", target: 0, lower_is_better: false });
    fetchIndicators();
  };

  const handleUpdateIndicator = async () => {
    if (!editingIndicator) return;
    setSaving(true);
    await supabase.from("indicators").update({
      name: editingIndicator.name,
      category: editingIndicator.category,
      unit: editingIndicator.unit,
      target: editingIndicator.target,
      lower_is_better: editingIndicator.lower_is_better,
    }).eq("id", editingIndicator.id);
    setSaving(false);
    toast.success("Indicador atualizado!");
    setEditingIndicator(null);
    fetchIndicators();
  };

  const handleDeleteIndicator = async (id: string) => {
    if (!confirm("Excluir este indicador e todos os seus valores?")) return;
    await supabase.from("indicators").delete().eq("id", id);
    toast.success("Indicador excluído!");
    fetchIndicators();
    fetchValues();
  };

  const handleAddValue = async () => {
    if (!newValue.indicator_id || !newValue.period || !user) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("indicator_values").insert({
      indicator_id: newValue.indicator_id,
      value: newValue.value,
      period: newValue.period,
      created_by: user.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Valor registrado!");
    setValueDialogOpen(false);
    setNewValue({ indicator_id: "", value: 0, period: "" });
    fetchValues();
  };

  const handleDeleteValue = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    await supabase.from("indicator_values").delete().eq("id", id);
    toast.success("Registro excluído!");
    fetchValues();
  };

  if (!companyId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Dados ESG</h1>
          <p className="text-muted-foreground text-sm">Cadastre indicadores e registre valores para alimentar o dashboard</p>
        </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center py-12 text-center gap-3">
            <Database className="h-10 w-10 text-primary/50" />
            <p className="font-medium">Empresa não cadastrada</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Para começar a registrar dados ESG, primeiro cadastre sua empresa em <strong>Configurações → Empresa</strong>.
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.href = '/dashboard/configuracoes'}>
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dados ESG</h1>
        <p className="text-muted-foreground text-sm">Cadastre indicadores e registre valores para alimentar o dashboard</p>
      </div>

      <Tabs defaultValue="indicadores">
        <TabsList>
          <TabsTrigger value="indicadores" className="gap-2"><Database className="h-4 w-4" /> Indicadores</TabsTrigger>
          <TabsTrigger value="valores" className="gap-2"><BarChart3 className="h-4 w-4" /> Registrar Valores</TabsTrigger>
        </TabsList>

        <TabsContent value="indicadores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Indicadores ESG</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Indicador</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Indicador</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={newIndicator.name} onChange={(e) => setNewIndicator({ ...newIndicator, name: e.target.value })} placeholder="Ex: Consumo de Energia" />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={newIndicator.category} onValueChange={(v) => {
                        const first = categorySuggestions[v]?.[0];
                        setNewIndicator({
                          ...newIndicator,
                          category: v,
                          name: first?.name || "",
                          unit: first?.unit || "",
                          target: first?.targetExample || 0,
                          lower_is_better: first?.lower_is_better || false,
                        });
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {categorySuggestions[newIndicator.category] && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Sugestões de indicador</Label>
                        <div className="flex flex-wrap gap-2">
                          {categorySuggestions[newIndicator.category].map((sug) => (
                            <Button
                              key={sug.name}
                              type="button"
                              variant={newIndicator.name === sug.name ? "default" : "outline"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => setNewIndicator({
                                ...newIndicator,
                                name: sug.name,
                                unit: sug.unit,
                                target: sug.targetExample,
                                lower_is_better: sug.lower_is_better,
                              })}
                            >
                              {sug.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(() => {
                      const activeSug = categorySuggestions[newIndicator.category]?.find(s => s.name === newIndicator.name);
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Unidade</Label>
                              <Input value={newIndicator.unit} onChange={(e) => setNewIndicator({ ...newIndicator, unit: e.target.value })} placeholder="kWh, %, ton..." />
                              {activeSug && <p className="text-xs text-muted-foreground">💡 {activeSug.unitHint}</p>}
                            </div>
                            <div className="space-y-2">
                              <Label>Meta</Label>
                              <Input type="number" value={newIndicator.target} onChange={(e) => setNewIndicator({ ...newIndicator, target: Number(e.target.value) })} />
                              {activeSug && <p className="text-xs text-muted-foreground">💡 {activeSug.targetHint}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="lower" checked={newIndicator.lower_is_better} onChange={(e) => setNewIndicator({ ...newIndicator, lower_is_better: e.target.checked })} />
                            <Label htmlFor="lower">Menor é melhor (ex: emissões, resíduos)</Label>
                          </div>
                          {activeSug && (
                            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                              <p className="font-medium text-foreground">📋 Resumo do indicador</p>
                              <p><strong>Unidade ({activeSug.unit}):</strong> {activeSug.unitHint}</p>
                              <p><strong>Meta sugerida:</strong> {activeSug.lower_is_better ? "No máximo" : "No mínimo"} {activeSug.targetExample} {activeSug.unit}</p>
                              <p><strong>Lógica:</strong> {activeSug.lower_is_better ? "Quanto menor o valor, melhor o desempenho" : "Quanto maior o valor, melhor o desempenho"}</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <Button onClick={handleCreateIndicator} disabled={saving} className="w-full">
                      {saving ? "Criando..." : "Criar Indicador"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicators.map((ind) => (
                    <TableRow key={ind.id}>
                      <TableCell className="font-medium">{ind.name}</TableCell>
                      <TableCell className="capitalize">{ind.category}</TableCell>
                      <TableCell>{ind.unit}</TableCell>
                      <TableCell>{ind.target}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditingIndicator(ind)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteIndicator(ind.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {indicators.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum indicador cadastrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={!!editingIndicator} onOpenChange={(open) => !open && setEditingIndicator(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Editar Indicador</DialogTitle></DialogHeader>
              {editingIndicator && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={editingIndicator.name} onChange={(e) => setEditingIndicator({ ...editingIndicator, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={editingIndicator.category} onValueChange={(v) => setEditingIndicator({ ...editingIndicator, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Unidade</Label>
                      <Input value={editingIndicator.unit} onChange={(e) => setEditingIndicator({ ...editingIndicator, unit: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta</Label>
                      <Input type="number" value={editingIndicator.target} onChange={(e) => setEditingIndicator({ ...editingIndicator, target: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="edit-lower" checked={editingIndicator.lower_is_better} onChange={(e) => setEditingIndicator({ ...editingIndicator, lower_is_better: e.target.checked })} />
                    <Label htmlFor="edit-lower">Menor é melhor</Label>
                  </div>
                  <Button onClick={handleUpdateIndicator} disabled={saving} className="w-full">Salvar</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="valores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Valores dos Indicadores</CardTitle>
              <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Registrar Valor</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Valor</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Indicador</Label>
                      <Select value={newValue.indicator_id} onValueChange={(v) => setNewValue({ ...newValue, indicator_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {indicators.map((ind) => <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valor</Label>
                        <Input type="number" value={newValue.value} onChange={(e) => setNewValue({ ...newValue, value: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Período</Label>
                        <Input type="month" value={newValue.period} onChange={(e) => setNewValue({ ...newValue, period: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={handleAddValue} disabled={saving} className="w-full">
                      {saving ? "Salvando..." : "Registrar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicador</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="w-16">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {values.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.indicator?.name || "—"}</TableCell>
                      <TableCell>{v.value} {v.indicator?.unit}</TableCell>
                      <TableCell>{v.period}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteValue(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {values.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum valor registrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EsgRequirementsGuide title="Dados ESG" items={dadosRequirements} />
    </div>
  );
};

export default DadosPage;

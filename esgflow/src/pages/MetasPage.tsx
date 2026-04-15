import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Plus, CheckCircle, Pencil, Trash2 } from "lucide-react";
import EsgRequirementsGuide, { metasRequirements } from "@/components/EsgRequirementsGuide";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DeadlineType = "date" | "month" | "year";

const formatDeadline = (deadline: string, deadlineType?: string) => {
  if (deadlineType === "year") return deadline.substring(0, 4);
  if (deadlineType === "month") {
    const [y, m] = deadline.split("-");
    return `${m}/${y}`;
  }
  return new Date(deadline).toLocaleDateString("pt-BR");
};

const statusMap: Record<string, { label: string; variant: "outline" | "default" | "destructive" }> = {
  em_andamento: { label: "Em andamento", variant: "outline" },
  concluida: { label: "Concluída", variant: "default" },
  atrasada: { label: "Atrasada", variant: "destructive" },
};

const GoalCard = ({ goal, onUpdateProgress, onMarkDone, onEdit, onDelete }: {
  goal: any;
  onUpdateProgress: (id: string, progress: number) => void;
  onMarkDone: (id: string) => void;
  onEdit: (goal: any) => void;
  onDelete: (id: string) => void;
}) => {
  const [localProgress, setLocalProgress] = useState(goal.progress);
  const st = statusMap[goal.status] || statusMap.em_andamento;
  const isDone = goal.status === "concluida";

  useEffect(() => {
    setLocalProgress(goal.progress);
  }, [goal.progress]);

  return (
    <Card className={isDone ? "border-primary/30 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isDone ? <CheckCircle className="h-4 w-4 text-primary" /> : <Target className="h-4 w-4 text-primary" />}
            {goal.indicator_name}
          </CardTitle>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Meta:</span> {goal.target}</div>
          <div><span className="text-muted-foreground">Prazo:</span> {formatDeadline(goal.deadline, goal.deadline_type)}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Responsável:</span> {goal.responsible}</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progresso</span>
            <span className="font-medium">{localProgress}%</span>
          </div>
          <Slider
            value={[localProgress]}
            max={100}
            step={5}
            disabled={isDone}
            onValueChange={(val) => setLocalProgress(val[0])}
            onValueCommit={(val) => onUpdateProgress(goal.id, val[0])}
            className="cursor-pointer py-2"
          />
        </div>

        <div className="flex gap-2 pt-1">
          {!isDone && (
            <Button size="sm" variant="default" className="flex-1" onClick={() => onMarkDone(goal.id)}>
              <CheckCircle className="h-4 w-4 mr-1" /> Concluída
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit({ ...goal })}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(goal.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const toInputDeadline = (deadline: string, deadlineType: DeadlineType): string => {
  if (!deadline) return "";
  const [year, month, day] = deadline.split("-");

  if (deadlineType === "year") return year || "";
  if (deadlineType === "month") return year && month ? `${year}-${month}` : "";
  if (year && month && day) return `${year}-${month}-${day}`;

  return deadline;
};

const DeadlineInput = ({ deadlineType, deadline, onTypeChange, onDeadlineChange }: {
  deadlineType: DeadlineType;
  deadline: string;
  onTypeChange: (type: DeadlineType) => void;
  onDeadlineChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <Label>Tipo de Prazo</Label>
    <Select
      value={deadlineType}
      onValueChange={(v) => {
        const newType = v as DeadlineType;
        onTypeChange(newType);
        onDeadlineChange(toInputDeadline(deadline, newType));
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="date">Data exata</SelectItem>
        <SelectItem value="month">Mês/Ano</SelectItem>
        <SelectItem value="year">Ano</SelectItem>
      </SelectContent>
    </Select>
    <Label>Prazo</Label>
    {deadlineType === "date" && (
      <Input type="date" value={deadline} onChange={(e) => onDeadlineChange(e.target.value)} />
    )}
    {deadlineType === "month" && (
      <Input type="month" value={deadline} onChange={(e) => onDeadlineChange(e.target.value)} />
    )}
    {deadlineType === "year" && (
      <Input type="number" min={2024} max={2100} placeholder="Ex: 2025" value={deadline} onChange={(e) => onDeadlineChange(e.target.value)} />
    )}
  </div>
);

const normalizeDeadline = (deadline: string, deadlineType: DeadlineType): string => {
  if (deadlineType === "year") return `${deadline}-12-31`;
  if (deadlineType === "month") return `${deadline}-01`;
  return deadline;
};

const denormalizeDeadline = (deadline: string, deadlineType?: string): string => {
  if (deadlineType === "year") return deadline.substring(0, 4);
  if (deadlineType === "month") return deadline.substring(0, 7);
  return deadline;
};

const MetasPage = () => {
  const { companyId } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<any | null>(null);
  const [newGoal, setNewGoal] = useState({ indicator_name: "", target: 0, deadline: "", responsible: "", deadline_type: "date" as DeadlineType });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) fetchGoals();
    else setLoading(false);
  }, [companyId]);

  const fetchGoals = async () => {
    const { data } = await supabase.from("goals").select("*").eq("company_id", companyId!).order("created_at", { ascending: false });
    setGoals(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newGoal.indicator_name || !newGoal.deadline || !newGoal.responsible || !companyId) {
      toast.error("Preencha todos os campos");
      return;
    }
    const deadline = normalizeDeadline(newGoal.deadline, newGoal.deadline_type);
    const { error } = await supabase.from("goals").insert({
      indicator_name: newGoal.indicator_name,
      target: newGoal.target,
      deadline,
      responsible: newGoal.responsible,
      company_id: companyId,
      deadline_type: newGoal.deadline_type,
    } as any);
    if (error) {
      toast.error("Erro ao criar meta");
      return;
    }
    toast.success("Meta criada!");
    setDialogOpen(false);
    setNewGoal({ indicator_name: "", target: 0, deadline: "", responsible: "", deadline_type: "date" });
    fetchGoals();
  };

  const handleUpdateProgress = async (goalId: string, progress: number) => {
    const status = progress >= 100 ? "concluida" : "em_andamento";
    await supabase.from("goals").update({ progress, status }).eq("id", goalId);
    fetchGoals();
  };

  const handleMarkDone = async (goalId: string) => {
    await supabase.from("goals").update({ progress: 100, status: "concluida" }).eq("id", goalId);
    toast.success("Meta marcada como concluída! 🎉");
    fetchGoals();
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Excluir esta meta?")) return;
    await supabase.from("goals").delete().eq("id", goalId);
    toast.success("Meta excluída");
    fetchGoals();
  };

  const handleSaveEdit = async () => {
    if (!editGoal) return;
    const deadlineType = editGoal.deadline_type || "date";
    const deadline = normalizeDeadline(editGoal.deadline, deadlineType);
    await supabase.from("goals").update({
      indicator_name: editGoal.indicator_name,
      target: editGoal.target,
      deadline,
      deadline_type: deadlineType,
      responsible: editGoal.responsible,
      progress: editGoal.progress,
      status: editGoal.progress >= 100 ? "concluida" : editGoal.status,
    } as any).eq("id", editGoal.id);
    toast.success("Meta atualizada!");
    setEditGoal(null);
    fetchGoals();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Metas</h1>
          <p className="text-muted-foreground text-sm">Acompanhe as metas ESG da empresa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Indicador</Label>
                <Input value={newGoal.indicator_name} onChange={(e) => setNewGoal({ ...newGoal, indicator_name: e.target.value })} placeholder="Ex: Consumo de Energia" />
                <p className="text-xs text-muted-foreground">💡 Use o mesmo nome do indicador cadastrado em Dados ESG</p>
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input type="number" value={newGoal.target} onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground">💡 Valor numérico que deseja alcançar (ex: 3500 kWh, 80%)</p>
              </div>
              <DeadlineInput
                deadlineType={newGoal.deadline_type}
                deadline={newGoal.deadline}
                onTypeChange={(type) => setNewGoal((prev) => ({ ...prev, deadline_type: type }))}
                onDeadlineChange={(value) => setNewGoal((prev) => ({ ...prev, deadline: value }))}
              />
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={newGoal.responsible} onChange={(e) => setNewGoal({ ...newGoal, responsible: e.target.value })} />
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <EsgRequirementsGuide title="Metas" items={metasRequirements} />

      {goals.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma meta cadastrada.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdateProgress={handleUpdateProgress} onMarkDone={handleMarkDone} onEdit={(g) => setEditGoal({ ...g, deadline: denormalizeDeadline(g.deadline, g.deadline_type) })} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Dialog open={!!editGoal} onOpenChange={(open) => !open && setEditGoal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Meta</DialogTitle></DialogHeader>
          {editGoal && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Indicador</Label>
                <Input value={editGoal.indicator_name} onChange={(e) => setEditGoal({ ...editGoal, indicator_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input type="number" value={editGoal.target} onChange={(e) => setEditGoal({ ...editGoal, target: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Progresso (%)</Label>
                <Input type="number" min={0} max={100} value={editGoal.progress} onChange={(e) => setEditGoal({ ...editGoal, progress: Math.min(100, Math.max(0, Number(e.target.value))) })} />
              </div>
              <DeadlineInput
                deadlineType={editGoal.deadline_type || "date"}
                deadline={editGoal.deadline}
                onTypeChange={(type) => setEditGoal((prev: any) => ({ ...prev, deadline_type: type }))}
                onDeadlineChange={(value) => setEditGoal((prev: any) => ({ ...prev, deadline: value }))}
              />
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={editGoal.responsible} onChange={(e) => setEditGoal({ ...editGoal, responsible: e.target.value })} />
              </div>
              <Button onClick={handleSaveEdit} className="w-full">Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MetasPage;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import EsgGauge from "@/components/EsgGauge";
import { useEsgData } from "@/hooks/useEsgData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { AlertTriangle, TrendingUp, Leaf, Users, Shield, Target, CheckCircle } from "lucide-react";
import EsgRequirementsGuide, { dashboardRequirements } from "@/components/EsgRequirementsGuide";
import OnboardingWizard from "@/components/OnboardingWizard";
import EnergyMatrixChart from "@/components/EnergyMatrixChart";
import Co2AvoidedCard from "@/components/Co2AvoidedCard";
import EnergySustainabilityReport from "@/components/EnergySustainabilityReport";

const statusMap: Record<string, { label: string; variant: "outline" | "default" | "destructive" }> = {
  em_andamento: { label: "Em andamento", variant: "outline" },
  concluida: { label: "Concluída", variant: "default" },
  atrasada: { label: "Atrasada", variant: "destructive" },
};

const formatDeadline = (deadline: string, deadlineType?: string) => {
  if (deadlineType === "year") return deadline.substring(0, 4);
  if (deadlineType === "month") {
    const [y, m] = deadline.split("-");
    return `${m}/${y}`;
  }
  return new Date(deadline).toLocaleDateString("pt-BR");
};

const DashboardPage = () => {
  const { indicators, loading, byCategory, calculateScore, getClassification } = useEsgData();
  const { companyId } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    if (companyId) {
      supabase.from("goals").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(6)
        .then(({ data }) => setGoals(data || []));
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const envInds = byCategory("ambiental");
  const socInds = byCategory("social");
  const govInds = byCategory("governanca");

  const envScore = calculateScore(envInds);
  const socScore = calculateScore(socInds);
  const govScore = calculateScore(govInds);
  const overallScore = indicators.length > 0 ? Math.round((envScore + socScore + govScore) / 3) : 0;
  const classification = getClassification(overallScore);

  // Build evolution data as performance scores (0-100) per month
  const monthsSet = new Set<string>();
  indicators.forEach((ind) => ind.history.forEach((h) => monthsSet.add(h.month)));
  const months = Array.from(monthsSet).sort();

  const scoreAtMonth = (inds: typeof indicators, month: string) => {
    const relevant = inds.filter((i) => i.history.some((h) => h.month === month));
    if (relevant.length === 0) return null;
    const scores = relevant.map((ind) => {
      const entry = ind.history.find((h) => h.month === month);
      const val = entry ? entry.value : 0;
      if (val === 0 && ind.target === 0) return 100;
      if (ind.lower_is_better) {
        if (val <= ind.target) return 100;
        return Math.max(0, Math.round((ind.target / val) * 100));
      }
      if (val >= ind.target) return 100;
      return Math.max(0, Math.round((val / ind.target) * 100));
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const esgHistoryData = months.map((month) => ({
    month,
    ambiental: scoreAtMonth(envInds, month),
    social: scoreAtMonth(socInds, month),
    governanca: scoreAtMonth(govInds, month),
  }));

  const belowTarget = indicators.filter((ind) =>
    ind.lower_is_better ? ind.currentValue > ind.target : ind.currentValue < ind.target
  );

  const pillars = [
    { name: "Ambiental", score: envScore, icon: Leaf, color: "bg-primary" },
    { name: "Social", score: socScore, icon: Users, color: "bg-esg-info" },
    { name: "Governança", score: govScore, icon: Shield, color: "bg-esg-warning" },
  ];

  if (indicators.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Dashboard ESG</h1>
          <p className="text-muted-foreground text-sm">Visão geral do desempenho ESG da empresa</p>
        </div>
        <OnboardingWizard />
        <EsgRequirementsGuide title="Dashboard" items={dashboardRequirements} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard ESG</h1>
        <p className="text-muted-foreground text-sm">Visão geral do desempenho ESG da empresa</p>
      </div>

      <OnboardingWizard />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6">
          <div className="relative">
            <EsgGauge score={overallScore} />
          </div>
          <span className={`mt-2 text-sm font-semibold ${classification.color}`}>{classification.label}</span>
        </Card>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <Card key={p.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <p.icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{p.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{p.score}</div>
                <Progress value={p.score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{getClassification(p.score).label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {esgHistoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Evolução ESG <span className="text-xs font-normal text-muted-foreground ml-1">— score de performance por pilar (0–100)</span></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={esgHistoryData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} width={32} />
                  <ReferenceLine y={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Excelente", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <ReferenceLine y={60} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Bom", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: 13 }}
                    formatter={(value: number | null) => value !== null ? [`${value}`, undefined] : ["–", undefined]}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Legend iconType="circle" iconSize={8} />
                  <Line type="monotone" dataKey="ambiental" stroke="hsl(145, 78%, 40%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(145, 78%, 40%)" }} activeDot={{ r: 6 }} name="Ambiental" connectNulls />
                  <Line type="monotone" dataKey="social" stroke="hsl(210, 80%, 55%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(210, 80%, 55%)" }} activeDot={{ r: 6 }} name="Social" connectNulls />
                  <Line type="monotone" dataKey="governanca" stroke="hsl(38, 92%, 50%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(38, 92%, 50%)" }} activeDot={{ r: 6 }} name="Governança" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Co2AvoidedCard indicators={indicators} />

      <EnergyMatrixChart indicators={indicators} />

      <EnergySustainabilityReport indicators={indicators} />

      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Metas ESG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {goals.map((goal) => {
                const st = statusMap[goal.status] || statusMap.em_andamento;
                const isDone = goal.status === "concluida";
                return (
                  <div key={goal.id} className={`p-3 rounded-lg border space-y-2 ${isDone ? "border-primary/30 bg-primary/5" : "bg-secondary/30"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {isDone ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Target className="h-3.5 w-3.5 text-muted-foreground" />}
                        {goal.indicator_name}
                      </span>
                      <Badge variant={st.variant} className="text-[10px] px-1.5 py-0">{st.label}</Badge>
                    </div>
                    <Progress value={goal.progress} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{goal.progress}%</span>
                      <span>{formatDeadline(goal.deadline, goal.deadline_type)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {belowTarget.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-esg-warning" /> Alertas e Recomendações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {belowTarget.slice(0, 5).map((ind) => (
              <div key={ind.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <AlertTriangle className="h-4 w-4 text-esg-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{ind.name} fora da meta</p>
                  <p className="text-xs text-muted-foreground">
                    Atual: {ind.currentValue} {ind.unit} | Meta: {ind.target} {ind.unit}
                  </p>
                  <p className="text-xs text-primary mt-1">Sugestão: implementar medidas para otimizar {ind.name.toLowerCase()}.</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;

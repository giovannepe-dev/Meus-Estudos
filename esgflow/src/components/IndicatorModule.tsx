import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { IndicatorWithValue } from "@/hooks/useEsgData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PeriodView = "mensal" | "semestral" | "anual";

function aggregateHistory(history: { month: string; value: number }[], period: PeriodView) {
  if (period === "mensal" || history.length === 0) return history;

  const groups: Record<string, { sum: number; count: number }> = {};

  history.forEach((h) => {
    // month format: "MM/YY"
    const parts = h.month.split("/");
    const mm = parseInt(parts[0], 10);
    const yy = parts[1] || "00";
    let key: string;

    if (period === "semestral") {
      const sem = mm <= 6 ? "1" : "2";
      key = `${sem}ºSem/${yy}`;
    } else {
      key = `20${yy}`;
    }

    if (!groups[key]) groups[key] = { sum: 0, count: 0 };
    groups[key].sum += h.value;
    groups[key].count += 1;
  });

  return Object.entries(groups).map(([label, { sum, count }]) => ({
    month: label,
    value: Math.round(sum / count * 100) / 100,
  }));
}
interface IndicatorModuleProps {
  title: string;
  description: string;
  indicators: IndicatorWithValue[];
  color: string;
  loading?: boolean;
}

const trendIcons = { up: TrendingUp, down: TrendingDown, stable: Minus };

const IndicatorModule = ({ title, description, indicators, color, loading }: IndicatorModuleProps) => {
  const navigate = useNavigate();
  const [periodView, setPeriodView] = useState<PeriodView>("mensal");

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">
              Nenhum indicador cadastrado para <strong>{title}</strong>.
            </p>
            <Button onClick={() => navigate(`/dashboard/dados?open=new&category=${title.toLowerCase()}`)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Cadastrar Indicador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/dados")}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar / Editar <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {indicators.map((ind) => {
          const TrendIcon = trendIcons[ind.trend];
          const progress = ind.lower_is_better
            ? ind.currentValue <= ind.target ? 100 : Math.min(100, Math.round((ind.target / ind.currentValue) * 100))
            : ind.currentValue >= ind.target ? 100 : Math.min(100, Math.round((ind.currentValue / ind.target) * 100));
          const onTarget = ind.lower_is_better ? ind.currentValue <= ind.target : ind.currentValue >= ind.target;

          return (
            <Card key={ind.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{ind.name}</CardTitle>
                  <TrendIcon className={`h-4 w-4 ${
                    (ind.trend === "up" && !ind.lower_is_better) || (ind.trend === "down" && ind.lower_is_better)
                      ? "text-primary" : "text-muted-foreground"
                  }`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{ind.currentValue}</span>
                  <span className="text-xs text-muted-foreground">{ind.unit}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Meta: {ind.target} {ind.unit}</span>
                  <span className={onTarget ? "text-primary font-medium" : "text-esg-warning font-medium"}>
                    {onTarget ? "✓ Atingida" : `${progress}%`}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {indicators[0]?.history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Histórico</CardTitle>
              <Select value={periodView} onValueChange={(v) => setPeriodView(v as PeriodView)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregateHistory(indicators[0].history, periodView)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} name={indicators[0].name} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndicatorModule;

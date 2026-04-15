import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Zap } from "lucide-react";
import { IndicatorWithValue } from "@/hooks/useEsgData";

interface EnergyMatrixChartProps {
  indicators: IndicatorWithValue[];
}

const ENERGY_KEYWORDS = {
  conventional: ["convencional", "consumo de energia", "energia elétrica", "energia consumida"],
  renewable: ["renovável", "solar", "eólica", "fotovoltaica", "energia limpa"],
};

function matchesKeywords(name: string, keywords: string[]) {
  const lower = name.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

const EnergyMatrixChart = ({ indicators }: EnergyMatrixChartProps) => {
  const conventional = indicators.filter((i) => matchesKeywords(i.name, ENERGY_KEYWORDS.conventional));
  const renewable = indicators.filter((i) => matchesKeywords(i.name, ENERGY_KEYWORDS.renewable));

  if (conventional.length === 0 && renewable.length === 0) return null;

  // Build monthly data combining all energy indicators
  const monthsSet = new Set<string>();
  [...conventional, ...renewable].forEach((ind) =>
    ind.history.forEach((h) => monthsSet.add(h.month))
  );
  const months = Array.from(monthsSet).sort();

  const sumAtMonth = (inds: IndicatorWithValue[], month: string) =>
    inds.reduce((sum, ind) => {
      const entry = ind.history.find((h) => h.month === month);
      return sum + (entry ? entry.value : 0);
    }, 0);

  const data = months.map((month) => ({
    month,
    convencional: sumAtMonth(conventional, month),
    renovavel: sumAtMonth(renewable, month),
  }));

  const totalConv = conventional.reduce((s, i) => s + i.currentValue, 0);
  const totalRen = renewable.reduce((s, i) => s + i.currentValue, 0);
  const total = totalConv + totalRen;
  const renewablePct = total > 0 ? Math.round((totalRen / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-esg-warning" />
          Matriz Energética
          <span className="text-xs font-normal text-muted-foreground ml-1">
            — {renewablePct}% renovável
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={48} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  fontSize: 13,
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="convencional" name="Convencional" fill="hsl(var(--esg-warning))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="renovavel" name="Renovável" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnergyMatrixChart;

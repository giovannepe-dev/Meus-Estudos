import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BatteryCharging } from "lucide-react";
import { IndicatorWithValue } from "@/hooks/useEsgData";

interface EnergySustainabilityReportProps {
  indicators: IndicatorWithValue[];
}

const CONSUMED_KEYWORDS = ["consumo de energia", "energia elétrica", "convencional", "energia consumida"];
const SOLAR_KEYWORDS = ["solar", "fotovoltaica", "energia limpa"];

function matchesKeywords(name: string, keywords: string[]) {
  const lower = name.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

const EnergySustainabilityReport = ({ indicators }: EnergySustainabilityReportProps) => {
  const consumed = indicators.filter((i) => matchesKeywords(i.name, CONSUMED_KEYWORDS));
  const solar = indicators.filter((i) => matchesKeywords(i.name, SOLAR_KEYWORDS));

  if (consumed.length === 0 && solar.length === 0) return null;

  const monthsSet = new Set<string>();
  [...consumed, ...solar].forEach((ind) =>
    ind.history.forEach((h) => monthsSet.add(h.month))
  );
  const months = Array.from(monthsSet).sort();

  const sumAtMonth = (inds: IndicatorWithValue[], month: string) =>
    inds.reduce((sum, ind) => {
      const entry = ind.history.find((h) => h.month === month);
      return sum + (entry ? entry.value : 0);
    }, 0);

  const data = months.map((month) => {
    const consumedVal = sumAtMonth(consumed, month);
    const solarVal = sumAtMonth(solar, month);
    return {
      month,
      consumida: consumedVal,
      solar_gerada: solarVal,
      economia: consumedVal > 0 ? Math.round((solarVal / consumedVal) * 100) : 0,
    };
  });

  const lastEntry = data[data.length - 1];
  const coveragePct = lastEntry?.economia ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BatteryCharging className="h-4 w-4 text-primary" />
          Sustentabilidade Energética
          <span className="text-xs font-normal text-muted-foreground ml-1">
            — {coveragePct}% coberto por solar
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConsumed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--esg-danger))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--esg-danger))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area type="monotone" dataKey="consumida" name="Energia Consumida" stroke="hsl(var(--esg-danger))" fill="url(#colorConsumed)" strokeWidth={2} />
              <Area type="monotone" dataKey="solar_gerada" name="Solar Gerada" stroke="hsl(var(--primary))" fill="url(#colorSolar)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnergySustainabilityReport;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import { IndicatorWithValue } from "@/hooks/useEsgData";

interface Co2AvoidedCardProps {
  indicators: IndicatorWithValue[];
}

// Brazilian grid emission factor: ~0.0817 tCO₂/MWh (or 81.7 gCO₂/kWh)
const CO2_FACTOR_KG_PER_KWH = 0.0817;

const SOLAR_KEYWORDS = ["solar", "fotovoltaica", "renovável", "energia limpa"];

function matchesSolar(name: string) {
  const lower = name.toLowerCase();
  return SOLAR_KEYWORDS.some((k) => lower.includes(k));
}

const Co2AvoidedCard = ({ indicators }: Co2AvoidedCardProps) => {
  const solarIndicators = indicators.filter((i) => matchesSolar(i.name));

  if (solarIndicators.length === 0) return null;

  const totalSolarKwh = solarIndicators.reduce((sum, i) => sum + i.currentValue, 0);

  // Determine unit scale
  const isMwh = solarIndicators.some((i) => i.unit.toLowerCase().includes("mwh"));
  const kwhValue = isMwh ? totalSolarKwh * 1000 : totalSolarKwh;

  const co2AvoidedKg = kwhValue * CO2_FACTOR_KG_PER_KWH;
  const co2AvoidedTon = co2AvoidedKg / 1000;

  const displayValue = co2AvoidedTon >= 1
    ? `${co2AvoidedTon.toFixed(2)} tCO₂`
    : `${co2AvoidedKg.toFixed(1)} kgCO₂`;

  // Equivalent trees (1 tree absorbs ~22kg CO₂/year)
  const treesEquivalent = Math.round(co2AvoidedKg / 22);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          CO₂ Evitado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{displayValue}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Baseado em {totalSolarKwh.toLocaleString("pt-BR")} {isMwh ? "MWh" : "kWh"} de energia renovável
        </p>
        {treesEquivalent > 0 && (
          <p className="text-xs text-primary/80 mt-1">
            🌳 Equivalente a {treesEquivalent.toLocaleString("pt-BR")} árvores/ano
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Co2AvoidedCard;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface IndicatorWithValue {
  id: string;
  name: string;
  category: string;
  unit: string;
  target: number;
  lower_is_better: boolean;
  currentValue: number;
  trend: "up" | "down" | "stable";
  history: { month: string; value: number }[];
}

function determineTrend(history: { month: string; value: number }[]): "up" | "down" | "stable" {
  if (history.length < 2) return "stable";
  const last = history[history.length - 1].value;
  const prev = history[history.length - 2].value;
  if (last > prev) return "up";
  if (last < prev) return "down";
  return "stable";
}

export function useEsgData() {
  const { companyId } = useAuth();
  const [indicators, setIndicators] = useState<IndicatorWithValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) { setLoading(false); return; }
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: inds } = await supabase
      .from("indicators")
      .select("*")
      .eq("company_id", companyId!);

    if (!inds || inds.length === 0) {
      setIndicators([]);
      setLoading(false);
      return;
    }

    const { data: values } = await supabase
      .from("indicator_values")
      .select("*")
      .in("indicator_id", inds.map((i) => i.id))
      .order("period", { ascending: true });

    const result: IndicatorWithValue[] = inds.map((ind) => {
      const indValues = (values || [])
        .filter((v) => v.indicator_id === ind.id)
        .map((v) => ({
          month: v.period.length >= 7 ? v.period.substring(5, 7) + "/" + v.period.substring(2, 4) : v.period,
          value: Number(v.value),
        }));

      const currentValue = indValues.length > 0 ? indValues[indValues.length - 1].value : 0;
      const trend = determineTrend(indValues);

      return {
        id: ind.id,
        name: ind.name,
        category: ind.category,
        unit: ind.unit,
        target: Number(ind.target),
        lower_is_better: ind.lower_is_better,
        currentValue,
        trend,
        history: indValues,
      };
    });

    setIndicators(result);
    setLoading(false);
  };

  const byCategory = (cat: string) => indicators.filter((i) => i.category === cat);

  const calculateScore = (inds: IndicatorWithValue[]): number => {
    if (inds.length === 0) return 0;
    const scores = inds.map((ind) => {
      if (ind.currentValue === 0 && ind.target === 0) return 100;
      if (ind.lower_is_better) {
        if (ind.currentValue <= ind.target) return 100;
        return Math.max(0, Math.round((ind.target / ind.currentValue) * 100));
      }
      if (ind.currentValue >= ind.target) return 100;
      return Math.max(0, Math.round((ind.currentValue / ind.target) * 100));
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getClassification = (score: number) => {
    if (score >= 80) return { label: "Excelente", color: "text-primary" };
    if (score >= 60) return { label: "Bom", color: "text-esg-green-light" };
    if (score >= 40) return { label: "Em desenvolvimento", color: "text-esg-warning" };
    return { label: "Crítico", color: "text-esg-danger" };
  };

  return { indicators, loading, byCategory, calculateScore, getClassification, refetch: fetchData };
}

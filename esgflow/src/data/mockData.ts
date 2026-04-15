export interface Indicator {
  id: string;
  name: string;
  category: "ambiental" | "social" | "governanca";
  currentValue: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
  history: { month: string; value: number }[];
}

export interface Goal {
  id: string;
  indicator: string;
  target: number;
  deadline: string;
  responsible: string;
  progress: number;
  status: "em_andamento" | "concluida" | "atrasada";
}

export interface Evidence {
  id: string;
  name: string;
  type: "pdf" | "image" | "doc";
  indicator: string;
  date: string;
  size: string;
}

export const environmentalIndicators: Indicator[] = [
  { id: "e1", name: "Consumo de Energia", category: "ambiental", currentValue: 4200, target: 3500, unit: "kWh", trend: "down", history: [{ month: "Jan", value: 5000 }, { month: "Fev", value: 4800 }, { month: "Mar", value: 4600 }, { month: "Abr", value: 4500 }, { month: "Mai", value: 4300 }, { month: "Jun", value: 4200 }] },
  { id: "e2", name: "Consumo de Água", category: "ambiental", currentValue: 120, target: 100, unit: "m³", trend: "down", history: [{ month: "Jan", value: 160 }, { month: "Fev", value: 150 }, { month: "Mar", value: 140 }, { month: "Abr", value: 135 }, { month: "Mai", value: 128 }, { month: "Jun", value: 120 }] },
  { id: "e3", name: "Resíduos Gerados", category: "ambiental", currentValue: 800, target: 500, unit: "kg", trend: "stable", history: [{ month: "Jan", value: 900 }, { month: "Fev", value: 880 }, { month: "Mar", value: 850 }, { month: "Abr", value: 830 }, { month: "Mai", value: 810 }, { month: "Jun", value: 800 }] },
  { id: "e4", name: "Reciclagem", category: "ambiental", currentValue: 65, target: 80, unit: "%", trend: "up", history: [{ month: "Jan", value: 45 }, { month: "Fev", value: 50 }, { month: "Mar", value: 55 }, { month: "Abr", value: 58 }, { month: "Mai", value: 62 }, { month: "Jun", value: 65 }] },
  { id: "e5", name: "Emissões CO₂", category: "ambiental", currentValue: 12, target: 8, unit: "ton", trend: "down", history: [{ month: "Jan", value: 18 }, { month: "Fev", value: 16 }, { month: "Mar", value: 15 }, { month: "Abr", value: 14 }, { month: "Mai", value: 13 }, { month: "Jun", value: 12 }] },
  { id: "e6", name: "Energia Solar Gerada", category: "ambiental", currentValue: 1200, target: 1000, unit: "kWh", trend: "up", history: [{ month: "Jan", value: 800 }, { month: "Fev", value: 850 }, { month: "Mar", value: 900 }, { month: "Abr", value: 1000 }, { month: "Mai", value: 1100 }, { month: "Jun", value: 1200 }] },
  { id: "e7", name: "% de Energia Renovável", category: "ambiental", currentValue: 35, target: 30, unit: "%", trend: "up", history: [{ month: "Jan", value: 15 }, { month: "Fev", value: 18 }, { month: "Mar", value: 20 }, { month: "Abr", value: 25 }, { month: "Mai", value: 30 }, { month: "Jun", value: 35 }] },
];

export const socialIndicators: Indicator[] = [
  { id: "s1", name: "Treinamentos", category: "social", currentValue: 85, target: 100, unit: "horas", trend: "up", history: [{ month: "Jan", value: 40 }, { month: "Fev", value: 50 }, { month: "Mar", value: 60 }, { month: "Abr", value: 70 }, { month: "Mai", value: 78 }, { month: "Jun", value: 85 }] },
  { id: "s2", name: "Diversidade", category: "social", currentValue: 42, target: 50, unit: "%", trend: "up", history: [{ month: "Jan", value: 35 }, { month: "Fev", value: 36 }, { month: "Mar", value: 38 }, { month: "Abr", value: 39 }, { month: "Mai", value: 41 }, { month: "Jun", value: 42 }] },
  { id: "s3", name: "Segurança do Trabalho", category: "social", currentValue: 2, target: 0, unit: "incidentes", trend: "down", history: [{ month: "Jan", value: 5 }, { month: "Fev", value: 4 }, { month: "Mar", value: 4 }, { month: "Abr", value: 3 }, { month: "Mai", value: 3 }, { month: "Jun", value: 2 }] },
  { id: "s4", name: "Ações Sociais", category: "social", currentValue: 8, target: 12, unit: "projetos", trend: "up", history: [{ month: "Jan", value: 3 }, { month: "Fev", value: 4 }, { month: "Mar", value: 5 }, { month: "Abr", value: 6 }, { month: "Mai", value: 7 }, { month: "Jun", value: 8 }] },
  { id: "s5", name: "Satisfação dos Colaboradores", category: "social", currentValue: 78, target: 85, unit: "%", trend: "up", history: [{ month: "Jan", value: 70 }, { month: "Fev", value: 72 }, { month: "Mar", value: 73 }, { month: "Abr", value: 75 }, { month: "Mai", value: 76 }, { month: "Jun", value: 78 }] },
];

export const governanceIndicators: Indicator[] = [
  { id: "g1", name: "Compliance", category: "governanca", currentValue: 92, target: 100, unit: "%", trend: "up", history: [{ month: "Jan", value: 80 }, { month: "Fev", value: 83 }, { month: "Mar", value: 85 }, { month: "Abr", value: 88 }, { month: "Mai", value: 90 }, { month: "Jun", value: 92 }] },
  { id: "g2", name: "Políticas Internas", category: "governanca", currentValue: 18, target: 20, unit: "docs", trend: "up", history: [{ month: "Jan", value: 12 }, { month: "Fev", value: 13 }, { month: "Mar", value: 14 }, { month: "Abr", value: 15 }, { month: "Mai", value: 17 }, { month: "Jun", value: 18 }] },
  { id: "g3", name: "Auditorias", category: "governanca", currentValue: 4, target: 6, unit: "realizadas", trend: "up", history: [{ month: "Jan", value: 1 }, { month: "Fev", value: 1 }, { month: "Mar", value: 2 }, { month: "Abr", value: 3 }, { month: "Mai", value: 3 }, { month: "Jun", value: 4 }] },
  { id: "g4", name: "Gestão de Riscos", category: "governanca", currentValue: 75, target: 90, unit: "%", trend: "up", history: [{ month: "Jan", value: 55 }, { month: "Fev", value: 60 }, { month: "Mar", value: 63 }, { month: "Abr", value: 67 }, { month: "Mai", value: 71 }, { month: "Jun", value: 75 }] },
  { id: "g5", name: "Documentos Obrigatórios", category: "governanca", currentValue: 15, target: 15, unit: "docs", trend: "stable", history: [{ month: "Jan", value: 10 }, { month: "Fev", value: 11 }, { month: "Mar", value: 12 }, { month: "Abr", value: 13 }, { month: "Mai", value: 14 }, { month: "Jun", value: 15 }] },
];

export const goals: Goal[] = [
  { id: "m1", indicator: "Consumo de Energia", target: 3500, deadline: "2026-12-31", responsible: "Maria Silva", progress: 72, status: "em_andamento" },
  { id: "m2", indicator: "Reciclagem", target: 80, deadline: "2026-09-30", responsible: "João Santos", progress: 81, status: "em_andamento" },
  { id: "m3", indicator: "Diversidade", target: 50, deadline: "2026-12-31", responsible: "Ana Costa", progress: 84, status: "em_andamento" },
  { id: "m4", indicator: "Compliance", target: 100, deadline: "2026-06-30", responsible: "Carlos Oliveira", progress: 92, status: "em_andamento" },
  { id: "m5", indicator: "Documentos Obrigatórios", target: 15, deadline: "2026-03-31", responsible: "Paulo Mendes", progress: 100, status: "concluida" },
];

export const evidences: Evidence[] = [
  { id: "ev1", name: "Relatório Energia Q1.pdf", type: "pdf", indicator: "Consumo de Energia", date: "2026-03-01", size: "2.4 MB" },
  { id: "ev2", name: "Certificado Reciclagem.pdf", type: "pdf", indicator: "Reciclagem", date: "2026-02-15", size: "1.1 MB" },
  { id: "ev3", name: "Foto Ação Social.jpg", type: "image", indicator: "Ações Sociais", date: "2026-02-20", size: "3.2 MB" },
  { id: "ev4", name: "Política Compliance.docx", type: "doc", indicator: "Compliance", date: "2026-01-10", size: "540 KB" },
  { id: "ev5", name: "Auditoria Interna.pdf", type: "pdf", indicator: "Auditorias", date: "2026-03-05", size: "4.8 MB" },
];

export function calculateScore(indicators: Indicator[]): number {
  if (indicators.length === 0) return 0;
  const scores = indicators.map((ind) => {
    // For indicators where lower is better (like incidents, emissions)
    if (ind.unit === "incidentes" || ind.name.includes("Resíduos") || ind.name.includes("Emissões") || ind.name.includes("Consumo")) {
      if (ind.currentValue <= ind.target) return 100;
      const ratio = ind.target / ind.currentValue;
      return Math.max(0, Math.round(ratio * 100));
    }
    // For indicators where higher is better
    if (ind.currentValue >= ind.target) return 100;
    return Math.max(0, Math.round((ind.currentValue / ind.target) * 100));
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function getClassification(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excelente", color: "text-primary" };
  if (score >= 60) return { label: "Bom", color: "text-esg-green-light" };
  if (score >= 40) return { label: "Em desenvolvimento", color: "text-esg-warning" };
  return { label: "Crítico", color: "text-esg-danger" };
}

export const esgHistoryData = [
  { month: "Jan", ambiental: 55, social: 60, governanca: 65, geral: 60 },
  { month: "Fev", ambiental: 58, social: 62, governanca: 68, geral: 63 },
  { month: "Mar", ambiental: 61, social: 65, governanca: 70, geral: 65 },
  { month: "Abr", ambiental: 63, social: 67, governanca: 73, geral: 68 },
  { month: "Mai", ambiental: 66, social: 70, governanca: 76, geral: 71 },
  { month: "Jun", ambiental: 68, social: 73, governanca: 80, geral: 74 },
];

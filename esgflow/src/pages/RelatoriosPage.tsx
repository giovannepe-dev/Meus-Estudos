import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEsgData } from "@/hooks/useEsgData";
import { toast } from "sonner";
import EnergySustainabilityReport from "@/components/EnergySustainabilityReport";
import Co2AvoidedCard from "@/components/Co2AvoidedCard";

const RelatoriosPage = () => {
  const { indicators, loading, byCategory, calculateScore, getClassification } = useEsgData();
  const reportRef = useRef<HTMLDivElement>(null);

  const ambientalScore = calculateScore(byCategory("ambiental"));
  const socialScore = calculateScore(byCategory("social"));
  const governancaScore = calculateScore(byCategory("governanca"));
  const overallScore = indicators.length > 0 ? calculateScore(indicators) : 0;

  const hasData = indicators.length > 0;

  const handleDownloadPdf = () => {
    if (!hasData) {
      toast.error("Nenhum dado disponível para gerar o relatório");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Permita pop-ups para baixar o relatório");
      return;
    }

    const now = new Date().toLocaleDateString("pt-BR");
    const categories = [
      { label: "Ambiental", data: byCategory("ambiental"), score: ambientalScore },
      { label: "Social", data: byCategory("social"), score: socialScore },
      { label: "Governança", data: byCategory("governanca"), score: governancaScore },
    ];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório ESG - ${now}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 4px; color: #0d6e3f; }
          h2 { font-size: 18px; margin: 28px 0 12px; color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
          .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
          .scores { display: flex; gap: 16px; margin-bottom: 24px; }
          .score-box { flex: 1; text-align: center; padding: 16px; border-radius: 8px; background: #f3f4f6; }
          .score-box .label { font-size: 12px; color: #666; }
          .score-box .value { font-size: 28px; font-weight: bold; color: #0d6e3f; }
          .score-box .tag { font-size: 11px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 13px; }
          th { background: #f9fafb; text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
          td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
          .empty { color: #999; font-style: italic; padding: 12px 0; }
          .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Relatório ESG</h1>
        <p class="subtitle">Gerado em ${now}</p>

        <div class="scores">
          <div class="score-box">
            <div class="label">Score Geral</div>
            <div class="value">${overallScore}%</div>
          </div>
          ${categories.map(c => `
            <div class="score-box">
              <div class="label">${c.label}</div>
              <div class="value" style="font-size:22px">${c.score}%</div>
            </div>
          `).join("")}
        </div>

        ${categories.map(c => `
          <h2>${c.label} (${c.data.length} indicadores)</h2>
          ${c.data.length === 0 ? '<p class="empty">Nenhum indicador cadastrado.</p>' : `
            <table>
              <thead><tr><th>Indicador</th><th>Atual</th><th>Meta</th><th>Unidade</th><th>Progresso</th></tr></thead>
              <tbody>
                ${c.data.map(ind => {
                  const pct = ind.target > 0 ? Math.round((ind.currentValue / ind.target) * 100) : 0;
                  return `<tr>
                    <td>${ind.name}</td>
                    <td>${ind.currentValue}</td>
                    <td>${ind.target}</td>
                    <td>${ind.unit}</td>
                    <td>${pct}%</td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table>
          `}
        `).join("")}

        <div class="footer">ESG Flow · Relatório gerado automaticamente em ${now}</div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success("Relatório gerado! Use 'Salvar como PDF' na janela de impressão.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Visualize o resumo dos seus dados ESG</p>
        </div>
        {hasData && (
          <Button size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-1" /> Baixar PDF
          </Button>
        )}
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Info className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum dado disponível para gerar relatórios.</p>
            <p className="text-xs text-muted-foreground">
              Cadastre indicadores e registre valores na página <strong>Dados ESG</strong> para visualizar relatórios aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" ref={reportRef}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Resumo ESG</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Geral", score: overallScore },
                  { label: "Ambiental", score: ambientalScore },
                  { label: "Social", score: socialScore },
                  { label: "Governança", score: governancaScore },
                ].map((item) => {
                  const cls = getClassification(item.score);
                  return (
                    <div key={item.label} className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className={`text-2xl font-bold ${cls.color}`}>{item.score}%</p>
                      <p className={`text-xs ${cls.color}`}>{cls.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Co2AvoidedCard indicators={indicators} />
          <EnergySustainabilityReport indicators={indicators} />

          <Tabs defaultValue="todos">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="ambiental">Ambiental</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="governanca">Governança</TabsTrigger>
            </TabsList>

            {["todos", "ambiental", "social", "governanca"].map((tab) => {
              const filtered = tab === "todos" ? indicators : byCategory(tab);
              return (
                <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                  {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhum indicador nesta categoria.
                    </p>
                  ) : (
                    filtered.map((ind) => {
                      const pct = ind.target > 0
                        ? Math.round((ind.currentValue / ind.target) * 100)
                        : 0;
                      return (
                        <Card key={ind.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{ind.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Atual: {ind.currentValue} {ind.unit} · Meta: {ind.target} {ind.unit} · {pct}%
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default RelatoriosPage;

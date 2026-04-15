import jsPDF from "jspdf";
import { loadCompanyLogoBase64, getCompanyName } from "@/utils/pdfLogo";

const statusLabel = (val: string) => {
  if (val === "ok") return "✅ OK";
  if (val === "baixo") return "⚠️ Baixo";
  if (val === "critico") return "🔴 Crítico";
  return val;
};

interface InspectionData {
  veiculo_nome: string;
  placa: string;
  data_inspecao: string;
  calibracao_pneus: string;
  nivel_agua: string;
  nivel_oleo: string;
  abastecido: boolean;
  km_inspecao: number;
  avarias_encontradas: string | null;
  observacoes: string | null;
  inspetor_nome: string;
  avarias_abertas: { tipo: string; gravidade: string; descricao: string }[];
}

export const generateInspectionPdf = async (data: InspectionData) => {
  const doc = new jsPDF();
  const logoData = await loadCompanyLogoBase64();
  const companyName = await getCompanyName();
  let y = 14;

  if (logoData) {
    doc.addImage(logoData, "PNG", 14, 10, 18, 18);
    doc.setFontSize(14);
    doc.text("Relatório de Inspeção Veicular", 36, 20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${companyName} - Gestão de Frotas`, 36, 26);
    doc.setTextColor(0);
    y = 36;
  } else {
    doc.setFontSize(14);
    doc.text("Relatório de Inspeção Veicular", 14, 20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(companyName, 14, 26);
    doc.setTextColor(0);
    y = 32;
  }

  doc.setDrawColor(200);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(10);
  const fields: [string, string][] = [
    ["Veículo", data.veiculo_nome],
    ["Placa", data.placa],
    ["Data da Inspeção", new Date(data.data_inspecao).toLocaleString("pt-BR")],
    ["Inspetor", data.inspetor_nome],
    ["Km na Inspeção", Number(data.km_inspecao).toLocaleString("pt-BR")],
    ["Calibração dos Pneus", statusLabel(data.calibracao_pneus)],
    ["Nível de Água", statusLabel(data.nivel_agua)],
    ["Nível de Óleo", statusLabel(data.nivel_oleo)],
    ["Abastecido", data.abastecido ? "Sim" : "Não"],
  ];

  if (data.avarias_encontradas) {
    fields.push(["Avarias Encontradas", data.avarias_encontradas]);
  }
  if (data.observacoes) {
    fields.push(["Observações", data.observacoes]);
  }

  fields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(String(value), 120);
    doc.text(lines, 65, y);
    y += 7 * lines.length;
  });

  // Open incidents
  if (data.avarias_abertas.length > 0) {
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Avarias Abertas no Veículo", 14, y);
    y += 8;
    doc.setFontSize(10);

    data.avarias_abertas.forEach((av) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`• ${av.tipo} (${av.gravidade})`, 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(av.descricao, 160);
      doc.text(lines, 18, y);
      y += 6 * lines.length;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} — ${companyName} — Pág ${i}/${pageCount}`, 14, 285);
    doc.setTextColor(0);
  }

  doc.save(`inspecao_${data.veiculo_nome}_${new Date(data.data_inspecao).toISOString().split("T")[0]}.pdf`);
};

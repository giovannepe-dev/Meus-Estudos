import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { loadCompanyLogoBase64, getCompanyName } from "@/utils/pdfLogo";
import { addImageSafe } from "@/utils/pdfImageUtils";

export const generateCheckoutReturnPdf = async (checkoutId: string) => {
  // Fetch checkout with vehicle
  const { data: checkout } = await supabase
    .from("checkouts")
    .select("*, vehicles(placa, prefixo, marca, modelo)")
    .eq("id", checkoutId)
    .single();

  if (!checkout) return;

  // Fetch driver name
  const { data: driverProfile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("user_id", checkout.motorista_id)
    .single();

  // Fetch incidents for this checkout
  const { data: incidents } = await supabase
    .from("incidents")
    .select("*")
    .eq("checkout_id", checkoutId);

  // Fetch fuel records for this vehicle in the checkout period
  const { data: fuelRecords } = await supabase
    .from("fuel_records")
    .select("*")
    .eq("veiculo_id", checkout.veiculo_id)
    .gte("data_hora", checkout.data_hora_retirada)
    .lte("data_hora", checkout.data_hora_devolucao || new Date().toISOString());

  const doc = new jsPDF();
  const logoData = await loadCompanyLogoBase64();
  const companyName = await getCompanyName();
  let y = 14;

  // Header
  if (logoData) {
    doc.addImage(logoData, "PNG", 14, 10, 18, 18);
    doc.setFontSize(14);
    doc.text("Relatório de Checkout / Devolução", 36, 20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${companyName} - Gestão de Frotas`, 36, 26);
    doc.setTextColor(0);
    y = 36;
  } else {
    doc.setFontSize(14);
    doc.text("Relatório de Checkout / Devolução", 14, 20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(companyName, 14, 26);
    doc.setTextColor(0);
    y = 32;
  }

  doc.setDrawColor(200);
  doc.line(14, y, 196, y);
  y += 8;

  const veh = checkout.vehicles;
  const vehName = veh?.prefixo || veh?.placa || "?";

  // Info table
  doc.setFontSize(10);
  const fields: [string, string][] = [
    ["Veículo", `${vehName} — ${veh?.marca || ""} ${veh?.modelo || ""} (${veh?.placa})`],
    ["Motorista", driverProfile?.nome || "?"],
    ["Motivo de Uso", checkout.motivo_uso],
    ["Destino/Rota", checkout.destino_rota || "—"],
    ["Retirada", new Date(checkout.data_hora_retirada).toLocaleString("pt-BR")],
    ["Devolução", checkout.data_hora_devolucao ? new Date(checkout.data_hora_devolucao).toLocaleString("pt-BR") : "—"],
    ["Km Retirada", Number(checkout.km_retirada).toLocaleString("pt-BR")],
    ["Km Devolução", checkout.km_devolucao ? Number(checkout.km_devolucao).toLocaleString("pt-BR") : "—"],
    ["Km Rodado", checkout.km_rodado ? Number(checkout.km_rodado).toLocaleString("pt-BR") : "—"],
    ["Combustível Retirada", checkout.nivel_combustivel_retirada || "—"],
    ["Combustível Devolução", checkout.nivel_combustivel_devolucao || "—"],
    ["Divergência Km", checkout.km_divergente ? "SIM ⚠️" : "Não"],
    ["Status", checkout.status],
    ["Observações Retirada", checkout.observacoes_retirada || "—"],
    ["Observações Devolução", checkout.observacoes_devolucao || "—"],
  ];

  fields.forEach(([label, value]) => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(String(value), 120);
    doc.text(lines, 65, y);
    y += 7 * lines.length;
  });

  y += 5;

  // Photos section
  const photoSections: { label: string; url: string | null }[] = [
    { label: "Foto Hodômetro - Retirada", url: checkout.foto_hodometro_retirada },
    { label: "Foto Hodômetro - Devolução", url: checkout.foto_hodometro_devolucao },
  ];

  for (const section of photoSections) {
    if (!section.url || section.url === "admin_manual") continue;
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(section.label, 14, y);
    y += 5;
    const added = await addImageSafe(doc, section.url, 14, y, 80, 50);
    y += added ? 55 : 0;
    if (!added) {
      doc.setFont("helvetica", "italic");
      doc.text("(Imagem não disponível)", 14, y);
      y += 7;
    }
  }

  // Signatures
  const sigSections: { label: string; url: string | null }[] = [
    { label: "Assinatura - Retirada", url: checkout.assinatura_retirada },
    { label: "Assinatura - Devolução", url: checkout.assinatura_devolucao },
  ];

  for (const section of sigSections) {
    if (!section.url || section.url === "admin_manual") continue;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(section.label, 14, y);
    y += 5;
    const added = await addImageSafe(doc, section.url, 14, y, 60, 30);
    y += added ? 35 : 0;
  }

  // Incidents / Avarias
  if (incidents && incidents.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Avarias Registradas", 14, y);
    y += 8;

    for (const inc of incidents) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`• ${inc.tipo} (${inc.gravidade})`, 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`Descrição: ${inc.descricao}`, 18, y);
      y += 6;
      doc.text(`Status: ${inc.status} | Custo est.: R$ ${(inc.custo_estimado || 0).toFixed(2)}`, 18, y);
      y += 6;

      // Incident photos
      if (inc.fotos && inc.fotos.length > 0) {
        for (const fotoUrl of inc.fotos.slice(0, 3)) {
          if (y > 220) { doc.addPage(); y = 20; }
          const added = await addImageSafe(doc, fotoUrl, 18, y, 60, 40);
          y += added ? 45 : 0;
        }
      }
      y += 4;
    }
  }

  // Fuel records
  if (fuelRecords && fuelRecords.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Abastecimentos no Período", 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Data", "Tipo", "Litros", "Valor (R$)", "Posto"]],
      body: fuelRecords.map((f) => [
        new Date(f.data_hora).toLocaleDateString("pt-BR"),
        f.tipo_combustivel,
        Number(f.litros).toFixed(2),
        Number(f.valor_total).toFixed(2),
        f.posto_nome || "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 95] },
    });

    y = (doc as any).lastAutoTable?.finalY + 10 || y + 30;

    // Fuel receipt photos
    for (const f of fuelRecords) {
      if (f.comprovante_foto) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`Comprovante - ${new Date(f.data_hora).toLocaleDateString("pt-BR")}`, 14, y);
        y += 5;
        const added = await addImageSafe(doc, f.comprovante_foto, 14, y, 60, 40);
        y += added ? 45 : 5;
      }
    }
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

  doc.save(`checkout_${vehName}_${new Date(checkout.data_hora_retirada).toISOString().split("T")[0]}.pdf`);
};

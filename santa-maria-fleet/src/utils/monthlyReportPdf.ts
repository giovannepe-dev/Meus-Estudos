import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { loadCompanyLogoBase64, getCompanyName } from "@/utils/pdfLogo";

export const generateMonthlyReportPdf = async (year: number, month: number) => {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const startISO = startOfMonth.toISOString();
  const endISO = endOfMonth.toISOString();
  const monthLabel = startOfMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // Fetch all data in parallel
  const [
    { data: vehicles },
    { data: profiles },
    { data: checkouts },
    { data: fuelRecords },
    { data: maintenanceRecords },
    { data: incidents },
    { data: trafficTickets },
  ] = await Promise.all([
    supabase.from("vehicles").select("*"),
    supabase.from("profiles").select("user_id, nome"),
    supabase.from("checkouts").select("*").gte("created_at", startISO).lte("created_at", endISO).eq("status", "fechado"),
    supabase.from("fuel_records").select("*").gte("data_hora", startISO).lte("data_hora", endISO),
    supabase.from("maintenance").select("*").gte("created_at", startISO).lte("created_at", endISO),
    supabase.from("incidents").select("*").gte("created_at", startISO).lte("created_at", endISO),
    supabase.from("traffic_tickets").select("*").gte("data_infracao", startISO).lte("data_infracao", endISO),
  ]);

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.nome]));
  const vehicleMap = Object.fromEntries((vehicles || []).map((v) => [v.id, v]));

  const doc = new jsPDF();
  const logoData = await loadCompanyLogoBase64();
  const companyName = await getCompanyName();
  let y = 14;

  // Header
  if (logoData) {
    doc.addImage(logoData, "PNG", 14, 10, 18, 18);
    doc.setFontSize(14);
    doc.text("Relatório Mensal de Frota", 36, 20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${companyName} - Gestão de Frotas — ${monthLabel}`, 36, 26);
    doc.setTextColor(0);
    y = 36;
  } else {
    doc.setFontSize(14);
    doc.text(`Relatório Mensal de Frota — ${monthLabel}`, 14, 20);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(companyName, 14, 26);
    doc.setTextColor(0);
    y = 32;
  }

  doc.setDrawColor(200);
  doc.line(14, y, 196, y);
  y += 8;

  // Summary
  const totalKm = (checkouts || []).reduce((s, c) => s + (Number(c.km_rodado) || 0), 0);
  const totalFuel = (fuelRecords || []).reduce((s, f) => s + Number(f.valor_total), 0);
  const totalMaint = (maintenanceRecords || []).reduce((s, m) => s + (Number(m.custo) || 0), 0);
  const totalIncidents = (incidents || []).length;
  const totalTickets = (trafficTickets || []).length;
  const totalTicketValue = (trafficTickets || []).reduce((s, t) => s + Number(t.valor), 0);
  const totalTicketPoints = (trafficTickets || []).reduce((s, t) => s + (Number(t.pontos) || 0), 0);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral", 14, y);
  y += 7;

  const summaryData = [
    ["Km Total Rodados", totalKm.toLocaleString("pt-BR")],
    ["Gastos com Combustível", `R$ ${totalFuel.toFixed(2)}`],
    ["Gastos com Manutenção", `R$ ${totalMaint.toFixed(2)}`],
    ["Total de Avarias", String(totalIncidents)],
    ["Checkouts Realizados", String((checkouts || []).length)],
    ["Multas de Trânsito", String(totalTickets)],
    ["Valor Total em Multas", `R$ ${totalTicketValue.toFixed(2)}`],
    ["Pontos Totais em Multas", String(totalTicketPoints)],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Indicador", "Valor"]],
    body: summaryData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 58, 95] },
    theme: "grid",
  });
  y = (doc as any).lastAutoTable?.finalY + 10 || y + 40;

  // Per Vehicle
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento por Veículo", 14, y);
  y += 5;

  const vehicleRows = (vehicles || []).map((v) => {
    const vCheckouts = (checkouts || []).filter((c) => c.veiculo_id === v.id);
    const vKm = vCheckouts.reduce((s, c) => s + (Number(c.km_rodado) || 0), 0);
    const vFuel = (fuelRecords || []).filter((f) => f.veiculo_id === v.id).reduce((s, f) => s + Number(f.valor_total), 0);
    const vMaint = (maintenanceRecords || []).filter((m) => m.veiculo_id === v.id).reduce((s, m) => s + (Number(m.custo) || 0), 0);
    const vInc = (incidents || []).filter((i) => i.veiculo_id === v.id).length;
    return [v.prefixo || v.placa, `${vKm.toLocaleString("pt-BR")} km`, `R$ ${vFuel.toFixed(2)}`, `R$ ${vMaint.toFixed(2)}`, String(vInc), String(vCheckouts.length)];
  });

  autoTable(doc, {
    startY: y,
    head: [["Veículo", "Km Rodados", "Combustível", "Manutenção", "Avarias", "Checkouts"]],
    body: vehicleRows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 58, 95] },
  });
  y = (doc as any).lastAutoTable?.finalY + 10 || y + 40;

  // Per Driver
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhamento por Motorista", 14, y);
  y += 5;

  const driverIds = [...new Set((checkouts || []).map((c) => c.motorista_id))];
  const driverRows = driverIds.map((did) => {
    const dCheckouts = (checkouts || []).filter((c) => c.motorista_id === did);
    const dKm = dCheckouts.reduce((s, c) => s + (Number(c.km_rodado) || 0), 0);
    const dFuel = (fuelRecords || []).filter((f) => f.motorista_id === did).reduce((s, f) => s + Number(f.valor_total), 0);
    const dInc = (incidents || []).filter((i) => i.motorista_id === did).length;
    return [profileMap[did] || "?", `${dKm.toLocaleString("pt-BR")} km`, `R$ ${dFuel.toFixed(2)}`, String(dInc), String(dCheckouts.length)];
  });

  // Traffic Tickets Section
  if ((trafficTickets || []).length > 0) {
    y = (doc as any).lastAutoTable?.finalY + 10 || y + 40;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Multas de Trânsito por Motorista", 14, y);
    y += 5;

    // Group by driver
    const ticketsByDriver: Record<string, { nome: string; count: number; valor: number; pontos: number }> = {};
    (trafficTickets || []).forEach((t: any) => {
      const driverId = t.motorista_id || "sem_motorista";
      const driverName = t.motorista_id ? (profileMap[t.motorista_id] || "Desconhecido") : "Não identificado";
      if (!ticketsByDriver[driverId]) ticketsByDriver[driverId] = { nome: driverName, count: 0, valor: 0, pontos: 0 };
      ticketsByDriver[driverId].count++;
      ticketsByDriver[driverId].valor += Number(t.valor) || 0;
      ticketsByDriver[driverId].pontos += Number(t.pontos) || 0;
    });

    const ticketRows = Object.values(ticketsByDriver).map((d) => [
      d.nome, String(d.count), `R$ ${d.valor.toFixed(2)}`, String(d.pontos),
    ]);
    ticketRows.push(["TOTAL", String(totalTickets), `R$ ${totalTicketValue.toFixed(2)}`, String(totalTicketPoints)]);

    autoTable(doc, {
      startY: y,
      head: [["Motorista", "Qtd. Multas", "Valor Total", "Pontos"]],
      body: ticketRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 95] },
    });
  }

  autoTable(doc, {
    startY: y,
    head: [["Motorista", "Km Rodados", "Combustível", "Avarias", "Checkouts"]],
    body: driverRows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 58, 95] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} — ${companyName} — Pág ${i}/${pageCount}`, 14, 285);
    doc.setTextColor(0);
  }

  doc.save(`relatorio_mensal_${year}_${String(month + 1).padStart(2, "0")}.pdf`);
};

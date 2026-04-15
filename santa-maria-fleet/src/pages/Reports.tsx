import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, FileDown, AlertTriangle, Trash2, ClipboardCheck, Fuel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Reports: React.FC = () => {
  const { profile } = useAuth();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reportType, setReportType] = useState("km_veiculo");
  const [data, setData] = useState<any[]>([]);
  const [geralData, setGeralData] = useState<{ veiculos: any[]; totals: { km: number; combustivel: number; manutencao: number; total: number } } | null>(null);
  const [divergenceData, setDivergenceData] = useState<any[]>([]);
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [inspectionData, setInspectionData] = useState<any[]>([]);
  const [kmlData, setKmlData] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("todos");

  useEffect(() => {
    if (!profile?.company_id) return;
    supabase.from("vehicles").select("id, placa, prefixo").eq("company_id", profile.company_id).order("prefixo").then(({ data }) => setVehicles(data || []));
  }, [profile?.company_id]);

  useEffect(() => { fetchReport(); }, [reportType, startDate, endDate, selectedVehicleId]);

  const fetchReport = async () => {
    const start = `${startDate}T00:00:00`;
    const end = `${endDate}T23:59:59`;
    setGeralData(null);
    setDivergenceData([]);
    setIncidentData([]);
    setInspectionData([]);
    setKmlData([]);
    switch (reportType) {
      case "geral": {
        // Checkouts (km)
        const { data: checkouts } = await supabase
          .from("checkouts")
          .select("km_rodado, veiculo_id, vehicles(placa, prefixo)")
          .eq("status", "fechado")
          .gte("data_hora_retirada", start)
          .lte("data_hora_retirada", end);
        // Fuel
        const { data: fuel } = await supabase
          .from("fuel_records")
          .select("valor_total, veiculo_id, vehicles(placa, prefixo)")
          .gte("data_hora", start)
          .lte("data_hora", end);
        // Maintenance
        const { data: maint } = await supabase
          .from("maintenance")
          .select("custo, veiculo_id, vehicles(placa, prefixo)")
          .eq("status", "realizada")
          .gte("data_realizada", startDate)
          .lte("data_realizada", endDate);

        const veicMap: Record<string, { nome: string; km: number; combustivel: number; manutencao: number }> = {};
        const ensure = (id: string, nome: string) => {
          if (!veicMap[id]) veicMap[id] = { nome, km: 0, combustivel: 0, manutencao: 0 };
        };
        checkouts?.forEach((c) => { ensure(c.veiculo_id, c.vehicles?.prefixo || c.vehicles?.placa || "?"); veicMap[c.veiculo_id].km += Number(c.km_rodado) || 0; });
        fuel?.forEach((f) => { ensure(f.veiculo_id, f.vehicles?.prefixo || f.vehicles?.placa || "?"); veicMap[f.veiculo_id].combustivel += Number(f.valor_total) || 0; });
        maint?.forEach((m) => { ensure(m.veiculo_id, m.vehicles?.prefixo || m.vehicles?.placa || "?"); veicMap[m.veiculo_id].manutencao += Number(m.custo) || 0; });

        const veiculos = Object.values(veicMap).map((v) => ({ ...v, total: v.combustivel + v.manutencao }));
        veiculos.sort((a, b) => b.total - a.total);
        const totals = veiculos.reduce((acc, v) => ({ km: acc.km + v.km, combustivel: acc.combustivel + v.combustivel, manutencao: acc.manutencao + v.manutencao, total: acc.total + v.total }), { km: 0, combustivel: 0, manutencao: 0, total: 0 });
        setGeralData({ veiculos, totals });
        setData([]);
        break;
      }
      case "km_veiculo": {
        const { data: checkouts } = await supabase
          .from("checkouts")
          .select("km_rodado, vehicles(placa, prefixo)")
          .eq("status", "fechado")
          .gte("data_hora_retirada", start)
          .lte("data_hora_retirada", end);
        const grouped: Record<string, number> = {};
        checkouts?.forEach((c) => {
          const key = c.vehicles?.prefixo || c.vehicles?.placa || "?";
          grouped[key] = (grouped[key] || 0) + (Number(c.km_rodado) || 0);
        });
        setData(Object.entries(grouped).map(([name, km]) => ({ name, value: km, label: `${km.toLocaleString("pt-BR")} km` })));
        break;
      }
      case "km_motorista": {
        const { data: checkouts } = await supabase
          .from("checkouts")
          .select("km_rodado, motorista_id")
          .eq("status", "fechado")
          .gte("data_hora_retirada", start)
          .lte("data_hora_retirada", end);
        const { data: profiles } = await supabase.from("profiles").select("user_id, nome");
        const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.nome]));
        const grouped: Record<string, number> = {};
        checkouts?.forEach((c) => {
          const key = profileMap[c.motorista_id] || "?";
          grouped[key] = (grouped[key] || 0) + (Number(c.km_rodado) || 0);
        });
        setData(Object.entries(grouped).map(([name, km]) => ({ name, value: km, label: `${km.toLocaleString("pt-BR")} km` })));
        break;
      }
      case "gastos_veiculo": {
        const { data: fuel } = await supabase
          .from("fuel_records")
          .select("valor_total, vehicles(placa, prefixo)")
          .gte("data_hora", start)
          .lte("data_hora", end);
        const grouped: Record<string, number> = {};
        fuel?.forEach((f) => {
          const key = f.vehicles?.prefixo || f.vehicles?.placa || "?";
          grouped[key] = (grouped[key] || 0) + Number(f.valor_total);
        });
        setData(Object.entries(grouped).map(([name, val]) => ({ name, value: val, label: `R$ ${val.toFixed(2)}` })));
        break;
      }
      case "gastos_motorista": {
        const { data: fuel } = await supabase
          .from("fuel_records")
          .select("valor_total, motorista_id")
          .gte("data_hora", start)
          .lte("data_hora", end);
        const { data: profs } = await supabase.from("profiles").select("user_id, nome");
        const profMap = Object.fromEntries((profs || []).map((p) => [p.user_id, p.nome]));
        const grouped: Record<string, number> = {};
        fuel?.forEach((f) => {
          const key = profMap[f.motorista_id] || "?";
          grouped[key] = (grouped[key] || 0) + Number(f.valor_total);
        });
        setData(Object.entries(grouped).map(([name, val]) => ({ name, value: val, label: `R$ ${val.toFixed(2)}` })));
        break;
      }
      case "km_divergente": {
        let query = supabase
          .from("km_divergences" as any)
          .select("*, vehicles(placa, prefixo)")
          .gte("data_hora", start)
          .lte("data_hora", end)
          .order("data_hora", { ascending: false });
        if (selectedVehicleId !== "todos") {
          query = query.eq("veiculo_id", selectedVehicleId);
        }
        const { data: divs } = await query;
        const { data: profs2 } = await supabase.from("profiles").select("user_id, nome");
        const profMap2 = Object.fromEntries((profs2 || []).map((p: any) => [p.user_id, p.nome]));
        setDivergenceData((divs || []).map((d: any) => ({
          ...d,
          veiculo_nome: d.vehicles?.prefixo || d.vehicles?.placa || "?",
          motorista_nome: profMap2[d.motorista_id] || "?",
        })));
        setData([]);
        break;
      }
      case "avarias": {
        let query = supabase
          .from("incidents")
          .select("*, vehicles(placa, prefixo)")
          .gte("created_at", start)
          .lte("created_at", end)
          .order("created_at", { ascending: false });
        if (selectedVehicleId !== "todos") {
          query = query.eq("veiculo_id", selectedVehicleId);
        }
        const { data: incs } = await query;
        const { data: profs3 } = await supabase.from("profiles").select("user_id, nome");
        const profMap3 = Object.fromEntries((profs3 || []).map((p: any) => [p.user_id, p.nome]));
        setIncidentData((incs || []).map((d: any) => ({
          ...d,
          veiculo_nome: d.vehicles?.prefixo || d.vehicles?.placa || "?",
          motorista_nome: profMap3[d.motorista_id] || "?",
        })));
        setData([]);
        break;
      }
      case "inspecoes": {
        let query = supabase
          .from("inspections")
          .select("*, vehicles(placa, prefixo)")
          .gte("data_inspecao", start)
          .lte("data_inspecao", end)
          .order("data_inspecao", { ascending: false });
        if (selectedVehicleId !== "todos") {
          query = query.eq("veiculo_id", selectedVehicleId);
        }
        const { data: insps } = await query;
        const { data: profs4 } = await supabase.from("profiles").select("user_id, nome");
        const profMap4 = Object.fromEntries((profs4 || []).map((p: any) => [p.user_id, p.nome]));
        setInspectionData((insps || []).map((d: any) => ({
          ...d,
          veiculo_nome: d.vehicles?.prefixo || d.vehicles?.placa || "?",
          inspetor_nome: profMap4[d.inspecionado_por_user_id] || "?",
        })));
        setData([]);
        break;
      }
      case "km_por_litro": {
        // Checkouts for km
        let ckQuery = supabase
          .from("checkouts")
          .select("km_rodado, veiculo_id, vehicles(placa, prefixo)")
          .eq("status", "fechado")
          .gte("data_hora_retirada", start)
          .lte("data_hora_retirada", end);
        if (selectedVehicleId !== "todos") ckQuery = ckQuery.eq("veiculo_id", selectedVehicleId);
        const { data: ckData } = await ckQuery;

        // Fuel records for liters
        let fuelQuery = supabase
          .from("fuel_records")
          .select("litros, valor_total, veiculo_id, vehicles(placa, prefixo)")
          .gte("data_hora", start)
          .lte("data_hora", end);
        if (selectedVehicleId !== "todos") fuelQuery = fuelQuery.eq("veiculo_id", selectedVehicleId);
        const { data: fuelRecs } = await fuelQuery;

        const veicMap: Record<string, { nome: string; km: number; litros: number; gasto: number }> = {};
        const ensureV = (id: string, nome: string) => {
          if (!veicMap[id]) veicMap[id] = { nome, km: 0, litros: 0, gasto: 0 };
        };
        ckData?.forEach((c) => {
          ensureV(c.veiculo_id, c.vehicles?.prefixo || c.vehicles?.placa || "?");
          veicMap[c.veiculo_id].km += Number(c.km_rodado) || 0;
        });
        fuelRecs?.forEach((f) => {
          ensureV(f.veiculo_id, f.vehicles?.prefixo || f.vehicles?.placa || "?");
          veicMap[f.veiculo_id].litros += Number(f.litros) || 0;
          veicMap[f.veiculo_id].gasto += Number(f.valor_total) || 0;
        });

        const result = Object.values(veicMap)
          .map((v) => ({
            ...v,
            kmPorLitro: v.litros > 0 ? v.km / v.litros : 0,
            custoPorKm: v.km > 0 ? v.gasto / v.km : 0,
          }))
          .sort((a, b) => b.kmPorLitro - a.kmPorLitro);

        setKmlData(result);
        setData([]);
        break;
      }
      default:
        setData([]);
    }
  };

  const reportTypeLabels: Record<string, string> = {
    geral: "Relatório Geral",
    km_veiculo: "Km por Veículo",
    km_motorista: "Km por Motorista",
    gastos_veiculo: "Gastos por Veículo",
    gastos_motorista: "Gastos por Motorista",
    km_divergente: "Km Divergente",
    avarias: "Avarias",
    inspecoes: "Inspeções",
    km_por_litro: "Km por Litro",
  };

  const loadLogoBase64 = (): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve("");
      img.src = "/logo-smartfrota.png";
    });
  };

  const addHeader = (doc: jsPDF, logoData: string, title: string, periodo: string) => {
    let startY = 14;
    if (logoData) {
      doc.addImage(logoData, "PNG", 14, 10, 18, 18);
      doc.setFontSize(16);
      doc.text(title, 36, 20);
      doc.setFontSize(10);
      doc.text(periodo, 36, 27);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text("SmartFrota - Gestão Inteligente de Frotas", 36, 32);
      doc.setTextColor(0);
      startY = 38;
    } else {
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      doc.setFontSize(10);
      doc.text(periodo, 14, 28);
      startY = 35;
    }
    return startY;
  };

  const exportPDF = async () => {
    const logoData = await loadLogoBase64();
    const periodo = `Período: ${startDate.split("-").reverse().join("/")} a ${endDate.split("-").reverse().join("/")}`;

    if (reportType === "geral") {
      if (!geralData || geralData.veiculos.length === 0) return;
      const doc = new jsPDF();
      const startY = addHeader(doc, logoData, "Relatório Geral da Frota", periodo);

      autoTable(doc, {
        startY,
        head: [["Veículo", "Km Rodado", "Combustível (R$)", "Manutenção (R$)", "Total (R$)"]],
        body: [
          ...geralData.veiculos.map((v) => [v.nome, v.km.toLocaleString("pt-BR"), v.combustivel.toFixed(2), v.manutencao.toFixed(2), v.total.toFixed(2)]),
          ["TOTAL", geralData.totals.km.toLocaleString("pt-BR"), geralData.totals.combustivel.toFixed(2), geralData.totals.manutencao.toFixed(2), geralData.totals.total.toFixed(2)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
        foot: [],
      });

      doc.save(`relatorio_geral_${startDate}_${endDate}.pdf`);
      return;
    }

    if (reportType === "km_divergente") {
      if (divergenceData.length === 0) return;
      const doc = new jsPDF({ orientation: "landscape" });
      const vehicleName = selectedVehicleId !== "todos"
        ? vehicles.find(v => v.id === selectedVehicleId)?.prefixo || vehicles.find(v => v.id === selectedVehicleId)?.placa || ""
        : "Todos os Veículos";
      const startY = addHeader(doc, logoData, `Divergências de Km — ${vehicleName}`, periodo);
      autoTable(doc, {
        startY,
        head: [["Data", "Veículo", "Motorista", "Km Esperado", "Km Informado", "Divergência", "Severidade", "Motivo", "Status"]],
        body: divergenceData.map((d: any) => [
          new Date(d.data_hora).toLocaleDateString("pt-BR"),
          d.veiculo_nome,
          d.motorista_nome,
          Number(d.km_esperado).toLocaleString("pt-BR"),
          Number(d.km_informado).toLocaleString("pt-BR"),
          Number(d.km_divergente).toLocaleString("pt-BR"),
          (d.severidade || "—").toUpperCase(),
          d.motivo || "—",
          d.status,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
      });
      doc.save(`relatorio_km_divergente_${selectedVehicleId !== "todos" ? vehicleName + "_" : ""}${startDate}_${endDate}.pdf`);
      return;
    }

    if (reportType === "avarias") {
      if (incidentData.length === 0) return;
      const doc = new jsPDF();
      const vehicleName = selectedVehicleId !== "todos"
        ? vehicles.find(v => v.id === selectedVehicleId)?.prefixo || vehicles.find(v => v.id === selectedVehicleId)?.placa || ""
        : "Todos os Veículos";
      const startY = addHeader(doc, logoData, `Relatório de Avarias — ${vehicleName}`, periodo);
      autoTable(doc, {
        startY,
        head: [["Data", "Veículo", "Tipo", "Gravidade", "Motorista", "Descrição", "Status", "Custo Est."]],
        body: incidentData.map((d: any) => [
          new Date(d.created_at).toLocaleDateString("pt-BR"),
          d.veiculo_nome,
          d.tipo,
          d.gravidade,
          d.motorista_nome,
          (d.descricao || "").slice(0, 50),
          d.status,
          d.custo_estimado ? `R$ ${Number(d.custo_estimado).toFixed(2)}` : "—",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
      });
      doc.save(`relatorio_avarias_${selectedVehicleId !== "todos" ? vehicleName + "_" : ""}${startDate}_${endDate}.pdf`);
      return;
    }

    if (reportType === "inspecoes") {
      if (inspectionData.length === 0) return;
      const doc = new jsPDF({ orientation: "landscape" });
      const vehicleName = selectedVehicleId !== "todos"
        ? vehicles.find(v => v.id === selectedVehicleId)?.prefixo || vehicles.find(v => v.id === selectedVehicleId)?.placa || ""
        : "Todos os Veículos";
      const startY = addHeader(doc, logoData, `Relatório de Inspeções — ${vehicleName}`, periodo);
      const statusLabel = (v: string) => v === "ok" ? "OK" : v === "baixo" ? "Baixo" : v === "critico" ? "Critico" : v;
      autoTable(doc, {
        startY,
        head: [["Data", "Veículo", "Inspetor", "Pneus", "Água", "Óleo", "Abastecido", "Km", "Avarias"]],
        body: inspectionData.map((d: any) => [
          new Date(d.data_inspecao).toLocaleDateString("pt-BR"),
          d.veiculo_nome,
          d.inspetor_nome,
          statusLabel(d.calibracao_pneus),
          statusLabel(d.nivel_agua),
          statusLabel(d.nivel_oleo),
          d.abastecido ? "Sim" : "Não",
          Number(d.km_inspecao).toLocaleString("pt-BR"),
          (d.avarias_encontradas || "—").slice(0, 40),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
      });
      doc.save(`relatorio_inspecoes_${selectedVehicleId !== "todos" ? vehicleName + "_" : ""}${startDate}_${endDate}.pdf`);
      return;
    }

    if (reportType === "km_por_litro") {
      if (kmlData.length === 0) return;
      const doc = new jsPDF();
      const vehicleName = selectedVehicleId !== "todos"
        ? vehicles.find(v => v.id === selectedVehicleId)?.prefixo || vehicles.find(v => v.id === selectedVehicleId)?.placa || ""
        : "Todos os Veículos";
      const startY = addHeader(doc, logoData, `Km por Litro — ${vehicleName}`, periodo);
      const totKm = kmlData.reduce((s, v) => s + v.km, 0);
      const totLitros = kmlData.reduce((s, v) => s + v.litros, 0);
      const totGasto = kmlData.reduce((s, v) => s + v.gasto, 0);
      autoTable(doc, {
        startY,
        head: [["Veículo", "Km Rodado", "Litros", "Km/L", "Gasto (R$)", "R$/Km"]],
        body: [
          ...kmlData.map((v) => [
            v.nome,
            v.km.toLocaleString("pt-BR"),
            v.litros.toFixed(1),
            v.kmPorLitro.toFixed(2),
            v.gasto.toFixed(2),
            v.custoPorKm.toFixed(2),
          ]),
          ["TOTAL", totKm.toLocaleString("pt-BR"), totLitros.toFixed(1), totLitros > 0 ? (totKm / totLitros).toFixed(2) : "—", totGasto.toFixed(2), totKm > 0 ? (totGasto / totKm).toFixed(2) : "—"],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 58, 95] },
      });
      doc.save(`relatorio_km_por_litro_${selectedVehicleId !== "todos" ? vehicleName + "_" : ""}${startDate}_${endDate}.pdf`);
      return;
    }

    const doc = new jsPDF();
    const title = reportTypeLabels[reportType] || "Relatório";
    const startY = addHeader(doc, logoData, `Relatório: ${title}`, periodo);

    autoTable(doc, {
      startY,
      head: [["Nome", "Valor"]],
      body: data.map((d) => [d.name, d.label]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 58, 95] },
    });

    doc.save(`relatorio_${reportType}_${startDate}_${endDate}.pdf`);
  };

  const canExport = reportType === "geral" ? (geralData && geralData.veiculos.length > 0) : reportType === "km_divergente" ? divergenceData.length > 0 : reportType === "avarias" ? incidentData.length > 0 : reportType === "inspecoes" ? inspectionData.length > 0 : reportType === "km_por_litro" ? kmlData.length > 0 : data.length > 0;

  const statusLabels: Record<string, string> = { pendente: "Pendente", justificado: "Justificado", resolvido: "Resolvido" };
  const statusColors: Record<string, string> = { pendente: "destructive", justificado: "secondary", resolvido: "default" };

  const updateDivergenceStatus = async (id: string, status: string, justificativa?: string) => {
    const update: any = { status };
    if (justificativa !== undefined) update.justificativa = justificativa;
    await supabase.from("km_divergences" as any).update(update).eq("id", id);
    fetchReport();
  };

  const deleteDivergence = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar esta divergência? Esta ação não pode ser desfeita.")) return;
    await supabase.from("km_divergences" as any).delete().eq("id", id);
    fetchReport();
  };

  

  const exportDivergencePdf = async (d: any) => {
    const logoData = await loadLogoBase64();
    const doc = new jsPDF();

    // Header
    let y = 14;
    if (logoData) {
      doc.addImage(logoData, "PNG", 14, 10, 18, 18);
      doc.setFontSize(14);
      doc.text("Relatório de Divergência de KM", 36, 20);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text("SmartFrota - Gestão Inteligente de Frotas", 36, 26);
      doc.setTextColor(0);
      y = 36;
    } else {
      doc.setFontSize(14);
      doc.text("Relatório de Divergência de KM", 14, 20);
      y = 30;
    }

    // Separator
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 8;

    // Info
    doc.setFontSize(10);
    const info = [
      ["Data/Hora", new Date(d.data_hora).toLocaleString("pt-BR")],
      ["Veículo", d.veiculo_nome],
      ["Motorista", d.motorista_nome],
      ["Km Esperado", Number(d.km_esperado).toLocaleString("pt-BR")],
      ["Km Informado", Number(d.km_informado).toLocaleString("pt-BR")],
      ["Divergência (Δ)", `${Number(d.km_divergente).toLocaleString("pt-BR")} km`],
      ["Severidade", (d.severidade || "—").toUpperCase()],
      ["Motivo", d.motivo || "—"],
      ["KM via OCR", d.km_ocr ? Number(d.km_ocr).toLocaleString("pt-BR") : "Não disponível"],
      ["Status", statusLabels[d.status] || d.status],
      ["Justificativa", d.justificativa || "—"],
    ];

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 60, y);
      y += 7;
    });

    y += 5;

    // Foto do hodômetro
    const fotoUrl = d.foto_odometro;
    if (fotoUrl) {
      doc.setFont("helvetica", "bold");
      doc.text("Foto do Hodômetro:", 14, y);
      y += 5;
      try {
        const { loadImageCompressed } = await import("@/utils/pdfImageUtils");
        const imgData = await loadImageCompressed(fotoUrl);
        if (imgData) {
          doc.addImage(imgData, "JPEG", 14, y, 80, 50);
          y += 55;
        } else {
          doc.setFont("helvetica", "italic");
          doc.text("(Imagem não disponível)", 14, y);
          y += 7;
        }
      } catch {
        doc.setFont("helvetica", "italic");
        doc.text("(Erro ao carregar imagem)", 14, y);
        y += 7;
      }
    }

    // Buscar checkout para pegar assinatura
    if (d.checkout_id) {
      const { data: checkout } = await supabase
        .from("checkouts")
        .select("assinatura_retirada, assinatura_devolucao")
        .eq("id", d.checkout_id)
        .single();

      if (checkout) {
        const sigUrl = checkout.assinatura_devolucao || checkout.assinatura_retirada;
        if (sigUrl) {
          if (y > 240) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "bold");
          doc.text("Assinatura do Motorista:", 14, y);
          y += 5;
          try {
            const { loadImageCompressed } = await import("@/utils/pdfImageUtils");
            const sigData = await loadImageCompressed(sigUrl);
            if (sigData) {
              doc.addImage(sigData, "JPEG", 14, y, 60, 30);
              y += 35;
            }
          } catch { /* ignore */ }
        }
      }
    }

    // Footer
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} — SmartFrota`, 14, 285);

    doc.save(`divergencia_${d.veiculo_nome}_${new Date(d.data_hora).toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Relatórios</h1>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div><Label>Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">📊 Relatório Geral</SelectItem>
                <SelectItem value="km_veiculo">Km por Veículo</SelectItem>
                <SelectItem value="km_motorista">Km por Motorista</SelectItem>
                <SelectItem value="gastos_veiculo">Gastos por Veículo</SelectItem>
                <SelectItem value="gastos_motorista">Gastos por Motorista</SelectItem>
                <SelectItem value="km_divergente">⚠️ Km Divergente</SelectItem>
                <SelectItem value="avarias">🚨 Avarias</SelectItem>
                <SelectItem value="inspecoes">📋 Inspeções</SelectItem>
                <SelectItem value="km_por_litro">⛽ Km por Litro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(reportType === "km_divergente" || reportType === "avarias" || reportType === "inspecoes" || reportType === "km_por_litro") && (
            <div>
              <Label>Veículo</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Veículos</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.prefixo || v.placa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Início</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>Fim</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={!canExport}>
            <FileDown className="w-4 h-4 mr-1" /> Exportar PDF
          </Button>
        </CardContent>
      </Card>

      {/* Relatório Geral */}
      {reportType === "geral" && geralData && geralData.veiculos.length > 0 && (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Veículo</th>
                  <th className="py-2 font-medium text-right">Km</th>
                  <th className="py-2 font-medium text-right">Combustível</th>
                  <th className="py-2 font-medium text-right">Manutenção</th>
                  <th className="py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {geralData.veiculos.map((v, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{v.nome}</td>
                    <td className="py-2 text-right">{v.km.toLocaleString("pt-BR")}</td>
                    <td className="py-2 text-right">R$ {v.combustivel.toFixed(2)}</td>
                    <td className="py-2 text-right">R$ {v.manutencao.toFixed(2)}</td>
                    <td className="py-2 text-right font-semibold">R$ {v.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-bold">
                  <td className="py-2">TOTAL</td>
                  <td className="py-2 text-right">{geralData.totals.km.toLocaleString("pt-BR")}</td>
                  <td className="py-2 text-right">R$ {geralData.totals.combustivel.toFixed(2)}</td>
                  <td className="py-2 text-right">R$ {geralData.totals.manutencao.toFixed(2)}</td>
                  <td className="py-2 text-right">R$ {geralData.totals.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Divergências - tabela detalhada */}
      {reportType === "km_divergente" && divergenceData.length > 0 && (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Data</th>
                  <th className="py-2 font-medium">Veículo</th>
                  <th className="py-2 font-medium">Motorista</th>
                  <th className="py-2 font-medium text-right">Esperado</th>
                  <th className="py-2 font-medium text-right">Informado</th>
                  <th className="py-2 font-medium text-right">Δ Km</th>
                  <th className="py-2 font-medium">Severidade</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-center">PDF</th>
                  <th className="py-2 font-medium text-center">Apagar</th>
                </tr>
              </thead>
              <tbody>
                {divergenceData.map((d: any, i: number) => (
                  <tr key={d.id || i} className="border-b last:border-0">
                    <td className="py-2 whitespace-nowrap">{new Date(d.data_hora).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{d.veiculo_nome}</td>
                    <td className="py-2">{d.motorista_nome}</td>
                    <td className="py-2 text-right">{Number(d.km_esperado).toLocaleString("pt-BR")}</td>
                    <td className="py-2 text-right">{Number(d.km_informado).toLocaleString("pt-BR")}</td>
                    <td className="py-2 text-right font-semibold">{Number(d.km_divergente).toLocaleString("pt-BR")}</td>
                    <td className="py-2">
                      <Badge variant={d.severidade === "critico" ? "destructive" : "secondary"} className="text-xs">
                        {(d.severidade || "—").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={(statusColors[d.status] || "default") as any} className="text-xs">
                        {statusLabels[d.status] || d.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-center">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => exportDivergencePdf(d)} title="Baixar PDF">
                        <FileDown className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="py-2 text-center">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteDivergence(d.id)} title="Apagar divergência">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {reportType === "km_divergente" && divergenceData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Sem divergências no período selecionado</p>
        </div>
      )}

      {/* Avarias table */}
      {reportType === "avarias" && incidentData.length > 0 && (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Data</th>
                  <th className="py-2 font-medium">Veículo</th>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium">Gravidade</th>
                  <th className="py-2 font-medium">Motorista</th>
                  <th className="py-2 font-medium">Descrição</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Custo Est.</th>
                </tr>
              </thead>
              <tbody>
                {incidentData.map((d: any) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 whitespace-nowrap">{new Date(d.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{d.veiculo_nome}</td>
                    <td className="py-2 capitalize">{d.tipo}</td>
                    <td className="py-2">
                      <Badge variant={d.gravidade === "grave" ? "destructive" : "secondary"} className="text-xs capitalize">
                        {d.gravidade}
                      </Badge>
                    </td>
                    <td className="py-2">{d.motorista_nome}</td>
                    <td className="py-2 max-w-[200px] truncate">{d.descricao}</td>
                    <td className="py-2">
                      <Badge variant={d.status === "aberta" ? "destructive" : d.status === "resolvida" ? "default" : "secondary"} className="text-xs">
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">{d.custo_estimado ? `R$ ${Number(d.custo_estimado).toFixed(2)}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {reportType === "avarias" && incidentData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Sem avarias no período selecionado</p>
        </div>
      )}

      {/* Inspeções table */}
      {reportType === "inspecoes" && inspectionData.length > 0 && (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Data</th>
                  <th className="py-2 font-medium">Veículo</th>
                  <th className="py-2 font-medium">Inspetor</th>
                  <th className="py-2 font-medium">Pneus</th>
                  <th className="py-2 font-medium">Água</th>
                  <th className="py-2 font-medium">Óleo</th>
                  <th className="py-2 font-medium">Abastecido</th>
                  <th className="py-2 font-medium text-right">Km</th>
                  <th className="py-2 font-medium">Avarias</th>
                </tr>
              </thead>
              <tbody>
                {inspectionData.map((d: any) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 whitespace-nowrap">{new Date(d.data_inspecao).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2">{d.veiculo_nome}</td>
                    <td className="py-2">{d.inspetor_nome}</td>
                    <td className="py-2">
                      <Badge variant={d.calibracao_pneus === "ok" ? "default" : "destructive"} className="text-xs">
                        {d.calibracao_pneus === "ok" ? "OK" : d.calibracao_pneus}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={d.nivel_agua === "ok" ? "default" : "destructive"} className="text-xs">
                        {d.nivel_agua === "ok" ? "OK" : d.nivel_agua}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={d.nivel_oleo === "ok" ? "default" : "destructive"} className="text-xs">
                        {d.nivel_oleo === "ok" ? "OK" : d.nivel_oleo}
                      </Badge>
                    </td>
                    <td className="py-2">{d.abastecido ? "Sim" : "Não"}</td>
                    <td className="py-2 text-right">{Number(d.km_inspecao).toLocaleString("pt-BR")}</td>
                    <td className="py-2 max-w-[150px] truncate">{d.avarias_encontradas || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {reportType === "inspecoes" && inspectionData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Sem inspeções no período selecionado</p>
        </div>
      )}

      {/* Km por Litro table */}
      {reportType === "km_por_litro" && kmlData.length > 0 && (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Veículo</th>
                  <th className="py-2 font-medium text-right">Km Rodado</th>
                  <th className="py-2 font-medium text-right">Litros</th>
                  <th className="py-2 font-medium text-right">Km/L</th>
                  <th className="py-2 font-medium text-right">Gasto (R$)</th>
                  <th className="py-2 font-medium text-right">R$/Km</th>
                </tr>
              </thead>
              <tbody>
                {kmlData.map((v, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{v.nome}</td>
                    <td className="py-2 text-right">{v.km.toLocaleString("pt-BR")}</td>
                    <td className="py-2 text-right">{v.litros.toFixed(1)}</td>
                    <td className="py-2 text-right font-semibold">{v.kmPorLitro.toFixed(2)}</td>
                    <td className="py-2 text-right">R$ {v.gasto.toFixed(2)}</td>
                    <td className="py-2 text-right">R$ {v.custoPorKm.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {(() => {
                  const totKm = kmlData.reduce((s, v) => s + v.km, 0);
                  const totLitros = kmlData.reduce((s, v) => s + v.litros, 0);
                  const totGasto = kmlData.reduce((s, v) => s + v.gasto, 0);
                  return (
                    <tr className="border-t font-bold">
                      <td className="py-2">TOTAL</td>
                      <td className="py-2 text-right">{totKm.toLocaleString("pt-BR")}</td>
                      <td className="py-2 text-right">{totLitros.toFixed(1)}</td>
                      <td className="py-2 text-right">{totLitros > 0 ? (totKm / totLitros).toFixed(2) : "—"}</td>
                      <td className="py-2 text-right">R$ {totGasto.toFixed(2)}</td>
                      <td className="py-2 text-right">{totKm > 0 ? `R$ ${(totGasto / totKm).toFixed(2)}` : "—"}</td>
                    </tr>
                  );
                })()}
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {reportType === "km_por_litro" && kmlData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Fuel className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Sem dados de consumo no período selecionado</p>
        </div>
      )}

      {/* Relatórios simples */}
      {reportType !== "geral" && reportType !== "km_divergente" && reportType !== "avarias" && reportType !== "inspecoes" && reportType !== "km_por_litro" && (
        <div className="space-y-2">
          {data.map((d, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between">
                <p className="text-sm font-medium">{d.name}</p>
                <p className="text-sm font-bold text-primary">{d.label}</p>
              </CardContent>
            </Card>
          ))}
          {data.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Sem dados no período selecionado</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state geral */}
      {reportType === "geral" && (!geralData || geralData.veiculos.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Sem dados no período selecionado</p>
        </div>
      )}
    </div>
  );
};

export default Reports;

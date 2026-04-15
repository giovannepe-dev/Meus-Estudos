import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '@/assets/logo.png';

type ReportType = 'items_by_room' | 'critical_items' | 'maintenance_due' | 'movements';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('items_by_room');
  const printRef = useRef<HTMLDivElement>(null);

  const { data: reportData } = useQuery({
    queryKey: ['report', reportType],
    queryFn: async () => {
      if (reportType === 'items_by_room') {
        const { data } = await supabase
          .from('items')
          .select('tombo, nome_item, status, estado, rooms(nome, sectors(nome, units(nome)))')
          .eq('is_active', true)
          .order('tombo');
        return data || [];
      }
      if (reportType === 'critical_items') {
        const { data } = await supabase
          .from('items')
          .select('tombo, nome_item, criticidade, status, rooms(nome)')
          .eq('criticidade', 'ALTA')
          .eq('is_active', true);
        return data || [];
      }
      if (reportType === 'maintenance_due') {
        const { data } = await supabase
          .from('maintenances')
          .select('*, items(tombo, nome_item)')
          .not('proxima_manutencao_data', 'is', null)
          .lte('proxima_manutencao_data', new Date().toISOString().split('T')[0])
          .order('proxima_manutencao_data');
        return data || [];
      }
      if (reportType === 'movements') {
        const { data } = await supabase
          .from('movements')
          .select('*, items(tombo, nome_item), de_sala:rooms!movements_de_sala_id_fkey(nome), para_sala:rooms!movements_para_sala_id_fkey(nome)')
          .order('created_at', { ascending: false })
          .limit(100);
        return data || [];
      }
      return [];
    }
  });

  const exportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const keys = Object.keys(reportData[0]).filter(k => typeof reportData[0][k] !== 'object');
    const csv = [keys.join(','), ...reportData.map((r: any) => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}.csv`;
    a.click();
  };

  const reportLabels: Record<ReportType, string> = {
    items_by_room: 'Itens por Sala',
    critical_items: 'Itens Críticos',
    maintenance_due: 'Manutenção Vencida',
    movements: 'Movimentações',
  };

  const exportPDF = async () => {
    if (!printRef.current || !reportData || reportData.length === 0) return;
    const el = printRef.current;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = 210;
    const margin = 10;

    // Add logo
    const logoImg = new Image();
    logoImg.src = logo;
    await new Promise((res) => { logoImg.onload = res; logoImg.onerror = res; });
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const logoH = 15;
      const logoW = (logoImg.naturalWidth / logoImg.naturalHeight) * logoH;
      pdf.addImage(logoImg, 'PNG', margin, 8, logoW, logoH);
    }

    // Title
    pdf.setFontSize(14);
    pdf.text(reportLabels[reportType], pdfW / 2, 18, { align: 'center' });
    pdf.setFontSize(9);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pdfW - margin, 18, { align: 'right' });

    // Table image
    const contentW = pdfW - margin * 2;
    const ratio = canvas.width / canvas.height;
    const contentH = contentW / ratio;
    let yPos = 28;

    if (contentH + yPos > 287) {
      // Multi-page: scale to fit width, split pages
      const pageH = 287 - yPos;
      const scaledH = (canvas.height * contentW) / canvas.width;
      let remainH = scaledH;
      let srcY = 0;
      while (remainH > 0) {
        const sliceH = Math.min(pageH, remainH);
        const srcSliceH = (sliceH / scaledH) * canvas.height;
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcSliceH;
        sliceCanvas.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, srcSliceH, 0, 0, canvas.width, srcSliceH);
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, yPos, contentW, sliceH);
        remainH -= sliceH;
        srcY += srcSliceH;
        if (remainH > 0) { pdf.addPage(); yPos = 10; }
      }
    } else {
      pdf.addImage(imgData, 'PNG', margin, yPos, contentW, contentH);
    }

    pdf.save(`relatorio-${reportType}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5" />
          <Select value={reportType} onValueChange={v => setReportType(v as ReportType)}>
            <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="items_by_room">Itens por Sala</SelectItem>
              <SelectItem value="critical_items">Itens Críticos</SelectItem>
              <SelectItem value="maintenance_due">Manutenção Vencida</SelectItem>
              <SelectItem value="movements">Movimentações</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} className="gap-2">
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div ref={printRef}>
        <Card>
          <CardContent className="p-0">
            {reportData && reportData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {reportType === 'items_by_room' && <>
                      <TableHead>Tombo</TableHead><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead>Local</TableHead>
                    </>}
                    {reportType === 'critical_items' && <>
                      <TableHead>Tombo</TableHead><TableHead>Nome</TableHead><TableHead>Criticidade</TableHead><TableHead>Status</TableHead>
                    </>}
                    {reportType === 'maintenance_due' && <>
                      <TableHead>Tombo</TableHead><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Data Prevista</TableHead>
                    </>}
                    {reportType === 'movements' && <>
                      <TableHead>Tombo</TableHead><TableHead>De</TableHead><TableHead>Para</TableHead><TableHead>Motivo</TableHead>
                    </>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((r: any, i: number) => (
                    <TableRow key={i}>
                      {reportType === 'items_by_room' && <>
                        <TableCell>{r.tombo}</TableCell>
                        <TableCell>{r.nome_item}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>{(r.rooms as any)?.nome}</TableCell>
                      </>}
                      {reportType === 'critical_items' && <>
                        <TableCell>{r.tombo}</TableCell>
                        <TableCell>{r.nome_item}</TableCell>
                        <TableCell>{r.criticidade}</TableCell>
                        <TableCell>{r.status}</TableCell>
                      </>}
                      {reportType === 'maintenance_due' && <>
                        <TableCell>{(r.items as any)?.tombo}</TableCell>
                        <TableCell>{(r.items as any)?.nome_item}</TableCell>
                        <TableCell>{r.tipo}</TableCell>
                        <TableCell>{r.proxima_manutencao_data}</TableCell>
                      </>}
                      {reportType === 'movements' && <>
                        <TableCell>{(r.items as any)?.tombo}</TableCell>
                        <TableCell>{(r.de_sala as any)?.nome}</TableCell>
                        <TableCell>{(r.para_sala as any)?.nome}</TableCell>
                        <TableCell>{r.motivo}</TableCell>
                      </>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum dado encontrado.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;

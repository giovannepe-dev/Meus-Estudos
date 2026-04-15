import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Printer, Package, CheckSquare, Wifi, WifiOff, RefreshCw, Monitor } from 'lucide-react';
import qz from 'qz-tray';
import { KJUR, KEYUTIL, stob64, hextorstr } from 'jsrsasign';

interface LabelElement {
  id: string;
  type: 'text' | 'variable' | 'qrcode' | 'barcode' | 'line' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  variable?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  rotation?: number;
}

const MM_TO_PX = 3.78;

const MassPrint: React.FC = () => {
  const { toast } = useToast();
  const [roomId, setRoomId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [printProfileId, setPrintProfileId] = useState('system');

  const { data: rooms } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('id, nome, sectors(nome, units(nome))').order('nome');
      return data || [];
    }
  });

  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ['room-items-print', roomId],
    queryFn: async () => {
      const { data } = await supabase
        .from('items')
        .select('id, tombo, nome_item, marca, modelo, numero_serie, responsavel, data_aquisicao, rooms(nome, sectors(nome, units(nome))), categories(nome)')
        .eq('sala_atual_id', roomId)
        .eq('is_active', true)
        .order('tombo');
      return data || [];
    },
    enabled: !!roomId
  });

  const { data: templates } = useQuery({
    queryKey: ['label-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('label_templates').select('*').order('is_default', { ascending: false });
      return data || [];
    }
  });

  const { data: printerProfiles } = useQuery({
    queryKey: ['printer-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('printer_profiles').select('*').order('is_default', { ascending: false });
      return data || [];
    }
  });

  const selectedTemplate = templates?.find(t => t.id === templateId);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!items) return;
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const resolveVariable = (variable: string, item: any): string => {
    const room: any = item.rooms;
    const local = room ? `${room.sectors?.units?.nome} › ${room.sectors?.nome} › ${room.nome}` : '';
    const map: Record<string, string> = {
      '{{tombo}}': item.tombo || '',
      '{{nome_item}}': item.nome_item || '',
      '{{marca}}': item.marca || '',
      '{{modelo}}': item.modelo || '',
      '{{numero_serie}}': item.numero_serie || '',
      '{{categoria}}': (item.categories as any)?.nome || '',
      '{{local}}': local,
      '{{responsavel}}': item.responsavel || '',
      '{{data_aquisicao}}': item.data_aquisicao || '',
    };
    return map[variable] || variable;
  };

  const buildLabelHtmlForItem = (elements: LabelElement[], item: any): string => {
    let html = '';
    elements.forEach(el => {
      let content = el.variable ? resolveVariable(el.variable, item) : (el.content || '');
      const style = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;${el.rotation ? `transform:rotate(${el.rotation}deg);` : ''}`;
      if (el.type === 'text' || el.type === 'variable') {
        html += `<div style="${style}font-size:${el.fontSize}px;font-weight:${el.fontWeight};text-align:${el.textAlign};overflow:hidden;white-space:nowrap;line-height:${el.height}px;">${content}</div>`;
      } else if (el.type === 'qrcode') {
        const qrContent = el.variable ? resolveVariable(el.variable, item) : (el.content || item.tombo);
        html += `<div style="${style}display:flex;align-items:center;justify-content:center;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=${Math.min(el.width, el.height)}x${Math.min(el.width, el.height)}&data=${encodeURIComponent(qrContent)}" style="max-width:100%;max-height:100%;" /></div>`;
      } else if (el.type === 'barcode') {
        const bcContent = el.variable ? resolveVariable(el.variable, item) : (el.content || item.tombo);
        html += `<div style="${style}display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:8px;text-align:center;">${bcContent}<br/>|||||||||||||||</div>`;
      } else if (el.type === 'line') {
        html += `<div style="${style}border-top:2px solid #000;"></div>`;
      } else if (el.type === 'rect') {
        html += `<div style="${style}border:1px solid #000;"></div>`;
      }
    });
    return html;
  };

  const handlePrint = () => {
    if (!selectedTemplate || selectedItems.size === 0 || !items) {
      toast({ title: 'Selecione um template e ao menos um item', variant: 'destructive' });
      return;
    }

    const elements = (selectedTemplate.elements_json as unknown as LabelElement[]) || [];
    const canvasW = selectedTemplate.largura_mm * MM_TO_PX;
    const canvasH = selectedTemplate.altura_mm * MM_TO_PX;

    const profile = printProfileId && printProfileId !== 'system'
      ? printerProfiles?.find(p => p.id === printProfileId)
      : null;

    const scale = profile ? (profile.escala || 1) : 1;
    const marginTop = profile ? profile.margem_top_mm : 2;
    const marginRight = profile ? profile.margem_right_mm : 2;
    const marginBottom = profile ? profile.margem_bottom_mm : 2;
    const marginLeft = profile ? profile.margem_left_mm : 2;
    const pageW = profile ? profile.largura_mm : selectedTemplate.largura_mm + 10;
    const pageH = profile ? profile.altura_mm : selectedTemplate.altura_mm + 10;
    const orientation = profile?.orientacao === 'landscape' ? 'landscape' : 'portrait';

    const selectedItemsList = items.filter(i => selectedItems.has(i.id));

    const labels = selectedItemsList.map(item => {
      const labelHtml = buildLabelHtmlForItem(elements, item);
      return `<div style="position:relative;width:${canvasW}px;height:${canvasH}px;transform:scale(${scale});transform-origin:top left;page-break-after:always;overflow:hidden;">${labelHtml}</div>`;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Erro', description: 'Bloqueador de pop-ups ativo.', variant: 'destructive' });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Etiquetas em Massa - ${selectedItemsList.length} itens</title>
      <style>
        @page { size: ${pageW}mm ${pageH}mm ${orientation}; margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head>
      <body>${labels}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);

    toast({ title: `${selectedItemsList.length} etiqueta(s) enviada(s) para impressão` });
  };

  const roomLabel = (r: any) => `${(r.sectors as any)?.units?.nome} › ${(r.sectors as any)?.nome} › ${r.nome}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" /> Impressão em Massa por Local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Local (Sala)</Label>
              <Select value={roomId} onValueChange={(v) => { setRoomId(v); setSelectedItems(new Set()); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                <SelectContent>
                  {rooms?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{roomLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template de Etiqueta</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Selecione o template" /></SelectTrigger>
                <SelectContent>
                  {templates?.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome} {t.is_default && '(padrão)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {printerProfiles && printerProfiles.length > 0 && (
            <div className="space-y-2">
              <Label>Perfil de Impressora</Label>
              <Select value={printProfileId} onValueChange={setPrintProfileId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Padrão do sistema</SelectItem>
                  {printerProfiles.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} {p.is_default && '(padrão)'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {roomId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" /> Itens na Sala
                {items && <Badge variant="secondary">{items.length} itens</Badge>}
              </CardTitle>
              {items && items.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  {selectedItems.size === items.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <p className="text-muted-foreground text-sm">Carregando itens...</p>
            ) : items && items.length > 0 ? (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {items.map((item: any) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-sm font-medium text-primary">[{item.tombo}]</span>
                      <span className="text-sm truncate">{item.nome_item}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{item.marca} {item.modelo}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum item ativo nesta sala.</p>
            )}

            {items && items.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {selectedItems.size} de {items.length} selecionado(s)
                </p>
                <Button
                  onClick={handlePrint}
                  disabled={selectedItems.size === 0 || !templateId}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir {selectedItems.size} etiqueta(s)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MassPrint;

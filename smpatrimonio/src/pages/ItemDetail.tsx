import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, ArrowRightLeft, Printer, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Simple Code128 barcode SVG component
const Barcode128: React.FC<{ value: string; width?: number; height?: number; id?: string }> = ({ value, width = 200, height = 50, id }) => {
  // Code128B encoding
  const CODE128B: Record<string, number[]> = {};
  const START_B = [2,1,1,2,1,4];
  const STOP = [2,3,3,1,1,1,2];

  // Build Code128B table (characters 0-94 map to ASCII 32-126)
  const patterns = [
    [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
    [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
    [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
    [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
    [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
    [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
    [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
    [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
    [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
    [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
    [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
    [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
    [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
    [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
    [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
    [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
    [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
    [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
    [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
    [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
    [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1]
  ];

  for (let i = 0; i < 95; i++) {
    CODE128B[String.fromCharCode(32 + i)] = patterns[i];
  }

  let checksum = 104; // Start B value
  const allBars: number[] = [...START_B];

  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i) - 32;
    checksum += charCode * (i + 1);
    allBars.push(...(CODE128B[value[i]] || patterns[0]));
  }

  const checksumChar = checksum % 103;
  allBars.push(...patterns[checksumChar]);
  allBars.push(...STOP);

  const totalUnits = allBars.reduce((a, b) => a + b, 0);
  const unitWidth = width / totalUnits;

  let x = 0;
  const bars: React.ReactNode[] = [];
  allBars.forEach((w, i) => {
    if (i % 2 === 0) {
      bars.push(<rect key={i} x={x} y={0} width={w * unitWidth} height={height} fill="currentColor" />);
    }
    x += w * unitWidth;
  });

  return (
    <svg id={id} width={width} height={height + 20} viewBox={`0 0 ${width} ${height + 20}`} className="text-foreground">
      {bars}
      <text x={width / 2} y={height + 16} textAnchor="middle" fontSize="12" fill="currentColor">{value}</text>
    </svg>
  );
};

const ItemDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const downloadPNG = (svgId: string, filename: string, label: string) => {
    const svg = document.getElementById(svgId);
    if (!svg || !item) return;

    const clone = svg.cloneNode(true) as SVGElement;
    clone.querySelectorAll('[fill="currentColor"]').forEach(el => el.setAttribute('fill', '#000000'));
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', 'white');
    clone.insertBefore(bg, clone.firstChild);

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(clone);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const title = `${label} — Tombo ${item.tombo}`;

    const img = new Image();
    img.onload = () => {
      const scale = 3;
      const padding = 20 * scale;
      const codeW = img.width * scale;
      const codeH = img.height * scale;
      const titleH = 20 * scale;
      const canvasW = Math.max(codeW + padding * 2, 250 * scale);
      const canvasH = padding + titleH + codeW > 0 ? padding + titleH + codeH + padding : padding * 2 + titleH;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = padding + titleH + codeH + padding;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${14 * scale}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, padding + 12 * scale);

      // Code centered
      const codeX = (canvas.width - codeW) / 2;
      ctx.drawImage(img, codeX, padding + titleH, codeW, codeH);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${filename}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const { data: item } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('items')
        .select('*, rooms(nome, sectors(nome, units(nome))), categories(nome)')
        .eq('id', id)
        .single();
      return data;
    }
  });

  const { data: movements } = useQuery({
    queryKey: ['item-movements', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('movements')
        .select('*, de_sala:rooms!movements_de_sala_id_fkey(nome), para_sala:rooms!movements_para_sala_id_fkey(nome)')
        .eq('item_id', id!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id
  });

  const { data: maintenances } = useQuery({
    queryKey: ['item-maintenances', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenances')
        .select('*')
        .eq('item_id', id!)
        .order('data', { ascending: false });
      return data || [];
    },
    enabled: !!id
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['item-audit', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('item_audit_logs')
        .select('*')
        .eq('item_id', id!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (is_active: boolean) => {
      const { error } = await supabase.from('items').update({ is_active }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error('Item não encontrado');
      // Get next tombo
      const { data: nextTombo, error: tomboError } = await supabase.rpc('get_next_tombo');
      if (tomboError) throw tomboError;

      const { data: newItem, error } = await supabase.from('items').insert({
        tombo: nextTombo,
        nome_item: item.nome_item,
        tipo_item: item.tipo_item,
        categoria_id: item.categoria_id,
        marca: item.marca,
        modelo: item.modelo,
        numero_serie: null,
        estado: item.estado,
        criticidade: item.criticidade,
        status: 'EM_USO' as any,
        sala_atual_id: item.sala_atual_id,
        responsavel: item.responsavel,
        valor_aquisicao: item.valor_aquisicao,
        data_aquisicao: item.data_aquisicao,
        observacoes: item.observacoes ? `Duplicado do tombo ${item.tombo}. ${item.observacoes}` : `Duplicado do tombo ${item.tombo}`,
      }).select().single();
      if (error) throw error;
      return newItem;
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Item duplicado!', description: `Novo tombo: ${newItem.tombo}` });
      navigate(`/items/${newItem.id}`);
    },
    onError: (err: any) => toast({ title: 'Erro ao duplicar', description: err.message, variant: 'destructive' })
  });

  if (!item) return <p className="text-muted-foreground">Carregando...</p>;

  const room = item.rooms as any;
  const locationStr = `${room?.sectors?.units?.nome} › ${room?.sectors?.nome} › ${room?.nome}`;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate('/items')}><ArrowLeft className="h-4 w-4" /></Button>
        <h2 className="text-xl font-bold flex-1">
          <span className="text-primary">[{item.tombo}]</span> {item.nome_item}
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={item.is_active} onCheckedChange={(v) => toggleActiveMutation.mutate(v)} />
          {item.is_active ? 'Ativo' : 'Inativo'}
        </label>
        <Button variant="outline" size="sm" onClick={() => navigate(`/items/${id}/edit`)} className="gap-1"><Edit className="h-4 w-4" /> Editar</Button>
        <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending} className="gap-1"><Copy className="h-4 w-4" /> Duplicar</Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/movements?item=${id}`)} className="gap-1"><ArrowRightLeft className="h-4 w-4" /> Movimentar</Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="codes">QR / Código de Barras</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              {[
                ['Tombo', item.tombo],
                ['Tipo', item.tipo_item],
                ['Categoria', (item.categories as any)?.nome || '-'],
                ['Marca', item.marca],
                ['Modelo', item.modelo],
                ['Nº Série', item.numero_serie || '-'],
                ['Nº Anvisa', (item as any).numero_anvisa || '-'],
                ['Estado', item.estado],
                ['Criticidade', item.criticidade],
                ['Status', item.status],
                ['Local', locationStr],
                ['Responsável', item.responsavel || '-'],
                ['Valor Aquisição', item.valor_aquisicao ? `R$ ${Number(item.valor_aquisicao).toFixed(2)}` : '-'],
                ['Data Aquisição', item.data_aquisicao ? format(new Date(item.data_aquisicao), 'dd/MM/yyyy') : '-'],
                ['Ativo', item.is_active ? 'Sim' : 'Não'],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
              {item.observacoes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p>{item.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes">
          <Card>
            <CardContent className="flex flex-col items-center gap-8 p-8">
              <div className="text-center" id="qrcode-container">
                <p className="text-sm font-semibold mb-3">QR Code — Tombo {item.tombo}</p>
                <QRCodeSVG value={item.tombo} size={180} level="H" id="qrcode-svg" />
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => downloadPNG('qrcode-svg', `qrcode-${item.tombo}`, 'QR Code')}>
                    Baixar QR Code (PNG)
                  </Button>
                </div>
              </div>
              <div className="text-center" id="barcode-container">
                <p className="text-sm font-semibold mb-3">Código de Barras (Code128)</p>
                <Barcode128 value={item.tombo} width={280} height={60} id="barcode-svg" />
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => downloadPNG('barcode-svg', `barcode-${item.tombo}`, 'Código de Barras')}>
                    Baixar Código de Barras (PNG)
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Tombo: <span className="font-mono font-bold text-foreground">{item.tombo}</span></p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Movimentações</h3>
              {movements && movements.length > 0 ? (
                <div className="space-y-2">
                  {movements.map((m: any) => (
                    <div key={m.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex justify-between">
                        <span>{(m.de_sala as any)?.nome} → {(m.para_sala as any)?.nome}</span>
                        <span className="text-muted-foreground">{format(new Date(m.created_at), 'dd/MM/yy HH:mm')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.motivo} {m.observacao ? `• ${m.observacao}` : ''}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Sem movimentações.</p>}

              <h3 className="font-semibold mb-3 mt-6">Alterações</h3>
              {auditLogs && auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {auditLogs.map((l: any) => (
                    <div key={l.id} className="rounded-lg border p-3 text-sm">
                      <span className="font-medium">{l.campo}</span>: {l.valor_anterior} → {l.valor_novo}
                      <span className="text-xs text-muted-foreground ml-2">{format(new Date(l.created_at), 'dd/MM/yy HH:mm')}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Sem alterações registradas.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardContent className="p-6">
              {maintenances && maintenances.length > 0 ? (
                <div className="space-y-2">
                  {maintenances.map((m: any) => (
                    <div key={m.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex justify-between">
                        <Badge variant="outline">{m.tipo}</Badge>
                        <span>{format(new Date(m.data), 'dd/MM/yyyy')}</span>
                      </div>
                      {m.fornecedor && <p className="text-xs text-muted-foreground">Fornecedor: {m.fornecedor}</p>}
                      {m.custo && <p className="text-xs">Custo: R$ {Number(m.custo).toFixed(2)}</p>}
                      {m.observacao && <p className="text-xs text-muted-foreground">{m.observacao}</p>}
                      {m.proxima_manutencao_data && (
                        <p className="text-xs text-primary">Próxima: {format(new Date(m.proxima_manutencao_data), 'dd/MM/yyyy')}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Sem registros de manutenção.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ItemDetail;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, ScanLine, CheckCircle, XCircle, AlertTriangle, Camera, X, History } from 'lucide-react';
import { format } from 'date-fns';
import { Html5Qrcode } from 'html5-qrcode';
const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roomId, setRoomId] = useState('');
  const [activeInventory, setActiveInventory] = useState<any>(null);
  const [scanTombo, setScanTombo] = useState('');
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [missingItemsDetail, setMissingItemsDetail] = useState<any[]>([]);
  const [divergentItem, setDivergentItem] = useState<any>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Load active inventory on mount
  useEffect(() => {
    const loadActiveInventory = async () => {
      try {
        const { data: inv } = await supabase
          .from('inventories')
          .select('*')
          .eq('status', 'EM_ANDAMENTO')
          .order('data_inicio', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (inv) {
          setActiveInventory(inv);
          setRoomId(inv.room_id);

          // Load already scanned items for this inventory
          const { data: scans } = await supabase
            .from('inventory_scans')
            .select('item_id, items(id, tombo, nome_item, sala_atual_id)')
            .eq('inventory_id', inv.id);

          if (scans) {
            const loaded = scans.map((s: any) => ({
              item_id: s.item_id,
              id: s.items?.id,
              tombo: s.items?.tombo,
              nome_item: s.items?.nome_item,
              status: s.items?.sala_atual_id === inv.room_id ? 'found' : 'wrong_place',
            }));
            setScannedItems(loaded);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar inventário ativo:', err);
      } finally {
        setLoadingInventory(false);
      }
    };
    loadActiveInventory();
  }, []);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraOpen(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('inventory-scanner');
        html5QrCodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopCamera();
            handleScanWithValue(decodedText);
          },
          () => {}
        );
      } catch (err) {
        toast({ title: 'Erro ao abrir câmera', description: 'Verifique as permissões da câmera.', variant: 'destructive' });
        setCameraOpen(false);
      }
    }, 200);
  }, [stopCamera, toast]);

  const { data: rooms } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('id, nome, sectors(nome, units(nome))');
      return data || [];
    }
  });

  const { data: roomItems } = useQuery({
    queryKey: ['room-items', activeInventory?.room_id],
    queryFn: async () => {
      if (!activeInventory) return [];
      const { data } = await supabase
        .from('items')
        .select('id, tombo, nome_item')
        .eq('sala_atual_id', activeInventory.room_id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!activeInventory
  });

  const { data: historyInventories } = useQuery({
    queryKey: ['inventories-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventories')
        .select('id, room_id, data_inicio, data_fim, status, rooms(nome, sectors(nome, units(nome)))')
        .eq('status', 'CONCLUIDO')
        .order('data_fim', { ascending: false })
        .limit(20);
      if (!data) return [];
      // For each inventory, get scan count
      const results = await Promise.all(data.map(async (inv: any) => {
        const { count } = await supabase
          .from('inventory_scans')
          .select('id', { count: 'exact', head: true })
          .eq('inventory_id', inv.id);
        return { ...inv, scan_count: count || 0 };
      }));
      return results;
    },
    enabled: !activeInventory
  });

  const startInventory = useMutation({
    mutationFn: async () => {
      if (!roomId || !user) return;
      const { data, error } = await supabase
        .from('inventories')
        .insert({ room_id: roomId, iniciado_por_usuario_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setActiveInventory(data);
      setScannedItems([]);
      toast({ title: 'Inventário iniciado!' });
    }
  });

  const handleScanWithValue = async (value: string) => {
    const tomboValue = value.trim();
    if (!tomboValue || !activeInventory || !user) return;

    const { data: item } = await supabase
      .from('items')
      .select('id, tombo, nome_item, sala_atual_id, status, rooms:sala_atual_id(nome, sectors(nome, units(nome)))')
      .eq('tombo', tomboValue)
      .eq('is_active', true)
      .maybeSingle();

    if (!item) {
      toast({ title: 'Item não encontrado', description: `Tombo "${tomboValue}" não existe no sistema.`, variant: 'destructive' });
      setScanTombo('');
      return;
    }

    if (scannedItems.find(s => s.item_id === item.id)) {
      toast({ title: 'Já escaneado' });
      setScanTombo('');
      return;
    }

    await supabase.from('inventory_scans').insert({
      inventory_id: activeInventory.id,
      item_id: item.id,
      usuario_id: user.id
    });

    const status = item.sala_atual_id === activeInventory.room_id ? 'found' : 'wrong_place';
    const room: any = item.rooms;
    const localAtual = room ? `${room.sectors?.units?.nome} › ${room.sectors?.nome} › ${room.nome}` : '';
    setScannedItems(prev => [...prev, { ...item, item_id: item.id, status, local_atual: localAtual }]);
    setScanTombo('');
    if (status === 'wrong_place') {
      setDivergentItem({ ...item, item_id: item.id, local_atual: localAtual, is_divergent: item.status === 'EM_DIVERGENCIA' });
    } else {
      toast({ title: 'Item encontrado!' });
    }
  };

  const handleScan = () => {
    handleScanWithValue(scanTombo);
  };

  const handleFinishClick = async () => {
    if (!activeInventory || !roomItems) return;
    const missing = roomItems.filter(ri => !scannedItems.find(s => s.item_id === ri.id));
    if (missing.length > 0) {
      // Fetch status for missing items
      const ids = missing.map(m => m.id);
      const { data: itemsDetail } = await supabase
        .from('items')
        .select('id, tombo, nome_item, status')
        .in('id', ids);
      setMissingItemsDetail(itemsDetail || missing);
      setShowFinishDialog(true);
    } else {
      await finishInventory();
    }
  };

  const finishInventory = async () => {
    if (!activeInventory) return;
    try {
      const { error } = await supabase.from('inventories').update({ status: 'CONCLUIDO' as any, data_fim: new Date().toISOString() }).eq('id', activeInventory.id);
      if (error) throw error;
      setActiveInventory(null);
      setScannedItems([]);
      setRoomId('');
      setShowFinishDialog(false);
      setMissingItemsDetail([]);
      toast({ title: 'Inventário concluído!' });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    } catch (err: any) {
      toast({ title: 'Erro ao finalizar', description: err.message, variant: 'destructive' });
    }
  };

  const found = scannedItems.filter(s => s.status === 'found');
  const wrongPlace = scannedItems.filter(s => s.status === 'wrong_place');
  const notFound = roomItems?.filter(ri => !scannedItems.find(s => s.item_id === ri.id)) || [];

  if (loadingInventory) {
    return (
      <div className="mx-auto max-w-2xl flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando inventário...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {!activeInventory ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Iniciar Inventário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sala</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                <SelectContent>
                  {rooms?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {(r.sectors as any)?.units?.nome} › {(r.sectors as any)?.nome} › {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => startInventory.mutate()} disabled={!roomId}>Iniciar</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5" /> Escaneando Itens</CardTitle>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={async () => {
                  if (!activeInventory) return;
                  await supabase.from('inventories').update({ status: 'CONCLUIDO' as any, data_fim: new Date().toISOString() }).eq('id', activeInventory.id);
                  setActiveInventory(null);
                  setScannedItems([]);
                  setRoomId('');
                  toast({ title: 'Inventário cancelado' });
                }}>
                  Cancelar
                </Button>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                <span className="text-muted-foreground">Local:</span>
                <span className="font-medium">
                  {rooms?.find((r: any) => r.id === activeInventory.room_id)
                    ? (() => { const r: any = rooms.find((r: any) => r.id === activeInventory.room_id); return `${r.sectors?.units?.nome} › ${r.sectors?.nome} › ${r.nome}`; })()
                    : 'Carregando...'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Escaneie ou digite o tombo..."
                  value={scanTombo}
                  onChange={e => setScanTombo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan()}
                  autoFocus
                  className="text-lg h-12 flex-1"
                />
                <Button
                  variant="default"
                  className="h-12 shrink-0"
                  onClick={handleScan}
                  disabled={!scanTombo.trim()}
                >
                  Buscar
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={cameraOpen ? stopCamera : startCamera}
                  title="Escanear com câmera"
                >
                  {cameraOpen ? <X className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                </Button>
              </div>

              {cameraOpen && (
                <div className="rounded-lg overflow-hidden border">
                  <div id="inventory-scanner" className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-[hsl(var(--success))]/10 p-3">
                  <CheckCircle className="mx-auto h-6 w-6 text-[hsl(var(--success))]" />
                  <p className="text-2xl font-bold">{found.length}</p>
                  <p className="text-xs text-muted-foreground">Encontrados</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-3">
                  <XCircle className="mx-auto h-6 w-6 text-destructive" />
                  <p className="text-2xl font-bold">{notFound.length}</p>
                  <p className="text-xs text-muted-foreground">Não encontrados</p>
                </div>
                <div className="rounded-lg bg-[hsl(var(--warning))]/10 p-3">
                  <AlertTriangle className="mx-auto h-6 w-6 text-[hsl(var(--warning))]" />
                  <p className="text-2xl font-bold">{wrongPlace.length}</p>
                  <p className="text-xs text-muted-foreground">Fora do lugar</p>
                </div>
              </div>

              {scannedItems.length > 0 && (
                <div className="space-y-1">
                  {scannedItems.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded border p-2 text-sm ${
                        s.status === 'wrong_place' ? 'bg-destructive/10 border-destructive/30' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span>[{s.tombo}] {s.nome_item}</span>
                        {s.status === 'wrong_place' && s.local_atual && (
                          <p className="text-xs text-destructive mt-0.5">📍 Pertence a: {s.local_atual}</p>
                        )}
                      </div>
                      <Badge
                        variant={s.status === 'found' ? 'default' : 'destructive'}
                        className="cursor-pointer hover:opacity-80 shrink-0 ml-2"
                        onClick={() => navigate(`/items/${s.item_id}`)}
                      >
                        {s.status === 'found' ? 'OK ›' : 'Outra sala ›'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <Button className="w-full" variant="outline" onClick={handleFinishClick}>
                Finalizar Inventário
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* History section - shown when no active inventory */}
      {!activeInventory && historyInventories && historyInventories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Histórico de Inventários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historyInventories.map((inv: any) => {
                const room = inv.rooms;
                const location = room ? `${room.sectors?.units?.nome} › ${room.sectors?.nome} › ${room.nome}` : 'Sala removida';
                return (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{location}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(inv.data_inicio), 'dd/MM/yyyy HH:mm')}
                        {inv.data_fim && ` → ${format(new Date(inv.data_fim), 'dd/MM/yyyy HH:mm')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{inv.scan_count} itens</Badge>
                      <Badge variant="default">Concluído</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finish confirmation dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Itens Não Encontrados
            </DialogTitle>
            <DialogDescription>
              {missingItemsDetail.length} item(ns) não foram escaneados neste inventário. Deseja finalizar mesmo assim?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 my-2">
            {missingItemsDetail.map((item: any) => {
              const statusLabels: Record<string, string> = {
                'EM_USO': 'Em uso',
                'EM_MANUTENCAO': 'Em manutenção',
                'BAIXADO': 'Baixado',
                'EMPRESTADO': 'Emprestado',
                'EM_DIVERGENCIA': 'Em divergência',
              };
              const isJustified = ['EM_MANUTENCAO', 'BAIXADO', 'EMPRESTADO'].includes(item.status);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded border p-2 text-sm ${
                    isJustified ? 'bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/30' : 'bg-destructive/10 border-destructive/30'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">[{item.tombo}]</span> {item.nome_item}
                  </div>
                  <Badge variant={isJustified ? 'secondary' : 'destructive'} className="shrink-0 ml-2">
                    {statusLabels[item.status] || item.status}
                  </Badge>
                </div>
              );
            })}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button variant="destructive" onClick={async () => {
              // Mark unjustified missing items as EM_DIVERGENCIA
              const unjustified = missingItemsDetail.filter(
                (item: any) => !['EM_MANUTENCAO', 'BAIXADO', 'EMPRESTADO'].includes(item.status)
              );
              if (unjustified.length > 0) {
                const ids = unjustified.map((item: any) => item.id);
                await supabase.from('items').update({ status: 'EM_DIVERGENCIA' as any }).in('id', ids);
              }
              await finishInventory();
              toast({ title: `${unjustified.length} item(ns) marcado(s) em divergência` });
            }}>
              Finalizar e marcar faltantes em divergência
            </Button>
            <Button variant="outline" onClick={finishInventory}>Finalizar sem marcar</Button>
            <Button variant="ghost" onClick={() => setShowFinishDialog(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Divergent item found dialog */}
      <Dialog open={!!divergentItem} onOpenChange={(open) => !open && setDivergentItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> {divergentItem?.is_divergent ? 'Item em Divergência Encontrado' : 'Item de Outra Sala'}
            </DialogTitle>
            <DialogDescription>
              O item <strong>[{divergentItem?.tombo}] {divergentItem?.nome_item}</strong> pertence à sala: <strong>{divergentItem?.local_atual}</strong>.
              {divergentItem?.is_divergent && <> Está marcado como <strong>em divergência</strong>.</>}
              {' '}O que deseja fazer?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={async () => {
              if (!divergentItem || !activeInventory || !user) return;
              await supabase.from('items').update({
                sala_atual_id: activeInventory.room_id,
                status: 'EM_USO' as any
              }).eq('id', divergentItem.item_id);
              await supabase.from('movements').insert({
                item_id: divergentItem.item_id,
                de_sala_id: divergentItem.sala_atual_id,
                para_sala_id: activeInventory.room_id,
                usuario_id: user.id,
                motivo: 'TRANSFERENCIA' as any,
                observacao: `Transferido durante inventário${divergentItem.is_divergent ? ' - item em divergência' : ''}`
              });
              toast({ title: 'Item transferido para esta sala!' });
              setDivergentItem(null);
              queryClient.invalidateQueries({ queryKey: ['room-items'] });
            }}>
              Transferir para esta sala
            </Button>
            <Button variant="secondary" onClick={async () => {
              if (!divergentItem || !activeInventory || !user) return;
              await supabase.from('movements').insert({
                item_id: divergentItem.item_id,
                de_sala_id: activeInventory.room_id,
                para_sala_id: divergentItem.sala_atual_id,
                usuario_id: user.id,
                motivo: 'DEVOLUCAO' as any,
                observacao: 'Item encontrado fora do lugar durante inventário - pendente devolução'
              });
              toast({ title: 'Devolução registrada', description: `Devolver para: ${divergentItem.local_atual}` });
              setDivergentItem(null);
            }}>
              Registrar devolução ao local correto
            </Button>
            <Button variant="outline" onClick={() => {
              toast({ title: 'Item registrado como fora do lugar' });
              setDivergentItem(null);
            }}>
              Apenas registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;

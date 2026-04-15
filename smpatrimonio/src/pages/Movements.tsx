import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Search, Camera, X, ScanLine, ClipboardCheck, Package, History } from 'lucide-react';
import { format } from 'date-fns';
import { Html5Qrcode } from 'html5-qrcode';
import { playBeep } from '@/hooks/use-beep';

const motivoOptions = ['TRANSFERENCIA', 'EMPRESTIMO', 'DEVOLUCAO', 'MANUTENCAO', 'OUTROS'] as const;

const Movements: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tombo, setTombo] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [paraSalaId, setParaSalaId] = useState('');
  const [motivo, setMotivo] = useState<string>('TRANSFERENCIA');
  const [observacao, setObservacao] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanDetected, setScanDetected] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const keyTimestamps = useRef<number[]>([]);
  const keyBuffer = useRef('');
  const tomboInputRef = useRef<HTMLInputElement>(null);

  // USB/Bluetooth reader detection
  const handleTomboKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchItem();
      return;
    }

    const now = Date.now();
    if (e.key.length === 1) {
      keyTimestamps.current.push(now);
      keyBuffer.current += e.key;

      if (keyTimestamps.current.length > 3) {
        const avgInterval =
          (keyTimestamps.current[keyTimestamps.current.length - 1] - keyTimestamps.current[0]) /
          (keyTimestamps.current.length - 1);
        if (avgInterval < 50) {
          setScanDetected(true);
          playBeep();
          toast({ title: 'Código lido pelo leitor!', description: `Tombo: ${keyBuffer.current}` });
          setTimeout(() => setScanDetected(false), 2000);
        }
      }

      setTimeout(() => {
        keyTimestamps.current = [];
        keyBuffer.current = '';
      }, 300);
    }
  }, [toast]);

  // Global key listener for USB reader when input not focused
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        keyTimestamps.current.push(Date.now());
        keyBuffer.current += e.key;
        setTombo(prev => prev + e.key);
        tomboInputRef.current?.focus();
      }
      if (e.key === 'Enter' && keyBuffer.current.length > 0) {
        const avgInterval = keyTimestamps.current.length > 1
          ? (keyTimestamps.current[keyTimestamps.current.length - 1] - keyTimestamps.current[0]) / (keyTimestamps.current.length - 1)
          : 999;
        if (avgInterval < 50) {
          setScanDetected(true);
          playBeep();
          toast({ title: 'Código lido pelo leitor!', description: `Tombo: ${keyBuffer.current}` });
          setTimeout(() => setScanDetected(false), 2000);
        }
        keyTimestamps.current = [];
        keyBuffer.current = '';
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [toast]);

  // Camera scanner
  const startScanner = async () => {
    setScannerOpen(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('movement-scanner');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const cleaned = decodedText.trim();
            setTombo(cleaned);
            playBeep();
            toast({ title: 'Código lido!', description: `Tombo: ${cleaned}` });
            stopScanner();
            setScannerOpen(false);
            // Auto-search
            supabase.from('items').select('*, rooms(nome)').eq('tombo', cleaned).maybeSingle().then(({ data }) => {
              if (data) setSelectedItem(data);
              else toast({ title: 'Item não encontrado', variant: 'destructive' });
            });
          },
          () => {}
        );
      } catch (err) {
        toast({ title: 'Erro ao abrir câmera', variant: 'destructive' });
        setScannerOpen(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      scannerRef.current = null;
    } catch {}
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const { data: rooms } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('id, nome, sectors(nome, units(nome))');
      return data || [];
    }
  });

  // Recent movements history
  const { data: recentMovements } = useQuery({
    queryKey: ['recent-movements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('movements')
        .select('*, items(tombo, nome_item), de_sala:rooms!movements_de_sala_id_fkey(nome), para_sala:rooms!movements_para_sala_id_fkey(nome)')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  // Pre-load item from URL param
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId) {
      supabase.from('items').select('*, rooms(nome)').eq('id', itemId).single().then(({ data }) => {
        if (data) {
          setSelectedItem(data);
          setTombo(data.tombo);
        }
      });
    }
  }, [searchParams]);

  const searchItem = async () => {
    if (!tombo.trim()) return;
    const { data } = await supabase
      .from('items')
      .select('*, rooms(nome)')
      .eq('tombo', tombo.trim())
      .maybeSingle();

    if (data) setSelectedItem(data);
    else toast({ title: 'Item não encontrado', variant: 'destructive' });
  };

  const moveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItem || !paraSalaId || !user) return;

      const { error: moveError } = await supabase.from('movements').insert({
        item_id: selectedItem.id,
        de_sala_id: selectedItem.sala_atual_id,
        para_sala_id: paraSalaId,
        motivo: motivo as any,
        observacao: observacao || null,
        usuario_id: user.id
      });
      if (moveError) throw moveError;

      const { error: updateError } = await supabase
        .from('items')
        .update({ sala_atual_id: paraSalaId })
        .eq('id', selectedItem.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-movements'] });
      queryClient.invalidateQueries({ queryKey: ['recent-movements'] });
      playBeep();
      toast({ title: 'Movimentação registrada!' });
      setSelectedItem(null);
      setTombo('');
      setParaSalaId('');
      setObservacao('');
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const motivoLabels: Record<string, string> = {
    TRANSFERENCIA: 'Transferência',
    EMPRESTIMO: 'Empréstimo',
    DEVOLUCAO: 'Devolução',
    MANUTENCAO: 'Manutenção',
    OUTROS: 'Outros',
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Quick navigation shortcuts */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/scanner')} className="gap-1.5">
          <ScanLine className="h-4 w-4" /> Scanner
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/inventory')} className="gap-1.5">
          <ClipboardCheck className="h-4 w-4" /> Inventário
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/items')} className="gap-1.5">
          <Package className="h-4 w-4" /> Itens
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" /> Nova Movimentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search item */}
          <div className="space-y-2">
            <Label>Tombo do Item</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={tomboInputRef}
                  value={tombo}
                  onChange={e => setTombo(e.target.value)}
                  onKeyDown={handleTomboKeyDown}
                  placeholder="Digite ou escaneie..."
                  className={scanDetected ? 'border-green-500 ring-2 ring-green-300' : ''}
                />
                {scanDetected && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse text-xs font-bold text-green-600">
                    ✓ Lido!
                  </span>
                )}
              </div>
              <Button variant="outline" onClick={searchItem}><Search className="h-4 w-4" /></Button>
              <Button
                variant={scannerOpen ? 'destructive' : 'outline'}
                onClick={scannerOpen ? () => { stopScanner(); setScannerOpen(false); } : startScanner}
              >
                {scannerOpen ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Camera scanner area */}
          {scannerOpen && (
            <div className="overflow-hidden rounded-lg border">
              <div id="movement-scanner" className="w-full" />
            </div>
          )}

          {selectedItem && (
            <>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="font-medium">[{selectedItem.tombo}] {selectedItem.nome_item}</p>
                <p className="text-sm text-muted-foreground">Sala atual: {(selectedItem.rooms as any)?.nome}</p>
              </div>

              <div className="space-y-2">
                <Label>Sala Destino</Label>
                <Select value={paraSalaId} onValueChange={setParaSalaId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {rooms?.filter((r: any) => r.id !== selectedItem.sala_atual_id).map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {(r.sectors as any)?.units?.nome} › {(r.sectors as any)?.nome} › {r.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {motivoOptions.map(m => <SelectItem key={m} value={m}>{motivoLabels[m] || m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} />
              </div>

              <Button className="w-full" onClick={() => moveMutation.mutate()}
                disabled={!paraSalaId || moveMutation.isPending}>
                {moveMutation.isPending ? 'Registrando...' : 'Registrar Movimentação'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent movements history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Últimas Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMovements && recentMovements.length > 0 ? (
            <div className="space-y-2">
              {recentMovements.map((mov: any) => (
                <div key={mov.id} className="flex items-start justify-between rounded-lg border p-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">
                      [{mov.items?.tombo}] {mov.items?.nome_item}
                    </p>
                    <p className="text-muted-foreground">
                      {mov.de_sala?.nome} → {mov.para_sala?.nome}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {motivoLabels[mov.motivo] || mov.motivo}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(mov.created_at), 'dd/MM/yy HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Movements;

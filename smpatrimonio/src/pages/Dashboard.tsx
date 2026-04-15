import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { playBeep } from '@/hooks/use-beep';
import {
  Package, AlertTriangle, Wrench, ArrowRightLeft, CheckCircle,
  XCircle, Search, Camera, X, ScanLine, ClipboardCheck, Activity,
  TrendingUp, Shield
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const motivoOptions = ['TRANSFERENCIA', 'EMPRESTIMO', 'DEVOLUCAO', 'MANUTENCAO', 'OUTROS'] as const;
const motivoLabels: Record<string, string> = {
  TRANSFERENCIA: 'Transferência', EMPRESTIMO: 'Empréstimo', DEVOLUCAO: 'Devolução',
  MANUTENCAO: 'Manutenção', OUTROS: 'Outros',
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tombo, setTombo] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [paraSalaId, setParaSalaId] = useState('');
  const [motivo, setMotivo] = useState<string>('TRANSFERENCIA');
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = useCallback(async () => {
    setScannerOpen(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('dashboard-scanner');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (decodedText) => {
            const cleaned = decodedText.trim();
            setTombo(cleaned);
            playBeep();
            stopScanner();
            supabase.from('items').select('*, rooms(nome)').eq('tombo', cleaned).maybeSingle().then(({ data }) => {
              if (data) setSelectedItem(data);
              else toast({ title: 'Item não encontrado', variant: 'destructive' });
            });
          },
          () => {}
        );
      } catch {
        toast({ title: 'Erro ao abrir câmera', variant: 'destructive' });
        setScannerOpen(false);
      }
    }, 100);
  }, [toast]);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      scannerRef.current = null;
    } catch {}
    setScannerOpen(false);
  }, []);

  useEffect(() => {
    return () => { if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {}); };
  }, []);

  const { data: items } = useQuery({
    queryKey: ['dashboard-items'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id, status, criticidade, is_active').eq('is_active', true);
      return data || [];
    }
  });

  const { data: maintenances } = useQuery({
    queryKey: ['dashboard-maintenances'],
    queryFn: async () => {
      const { data } = await supabase.from('maintenances').select('id, proxima_manutencao_data, item_id');
      return data || [];
    }
  });

  const { data: recentMovements } = useQuery({
    queryKey: ['dashboard-movements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('movements')
        .select('id, created_at, motivo, item_id, items(tombo, nome_item), de_sala:rooms!movements_de_sala_id_fkey(nome), para_sala:rooms!movements_para_sala_id_fkey(nome)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('id, nome, sectors(nome, units(nome))');
      return data || [];
    }
  });

  const total = items?.length || 0;
  const emUso = items?.filter(i => i.status === 'EM_USO').length || 0;
  const emManutencao = items?.filter(i => i.status === 'EM_MANUTENCAO').length || 0;
  const baixados = items?.filter(i => i.status === 'BAIXADO').length || 0;
  const criticos = items?.filter(i => i.criticidade === 'ALTA').length || 0;

  const today = new Date();
  const in15days = new Date(today);
  in15days.setDate(in15days.getDate() + 15);

  const vencidas = maintenances?.filter(m => m.proxima_manutencao_data && new Date(m.proxima_manutencao_data) < today).length || 0;
  const aVencer = maintenances?.filter(m => {
    if (!m.proxima_manutencao_data) return false;
    const d = new Date(m.proxima_manutencao_data);
    return d >= today && d <= in15days;
  }).length || 0;

  const searchItem = async () => {
    if (!tombo.trim()) return;
    const { data } = await supabase
      .from('items').select('*, rooms(nome)')
      .eq('tombo', tombo.trim()).maybeSingle();
    if (data) { setSelectedItem(data); playBeep(); }
    else toast({ title: 'Item não encontrado', variant: 'destructive' });
  };

  const moveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItem || !paraSalaId || !user) return;
      const { error: moveError } = await supabase.from('movements').insert({
        item_id: selectedItem.id, de_sala_id: selectedItem.sala_atual_id,
        para_sala_id: paraSalaId, motivo: motivo as any,
        observacao: null, usuario_id: user.id
      });
      if (moveError) throw moveError;
      const { error: updateError } = await supabase.from('items')
        .update({ sala_atual_id: paraSalaId }).eq('id', selectedItem.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-items'] });
      playBeep();
      toast({ title: 'Movimentação registrada!' });
      setSelectedItem(null); setTombo(''); setParaSalaId('');
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const statCards = [
    { label: 'Total Ativos', value: total, icon: Package, bg: 'bg-primary', path: '/items' },
    { label: 'Em Uso', value: emUso, icon: CheckCircle, bg: 'bg-success', path: '/items?status=EM_USO' },
    { label: 'Em Manutenção', value: emManutencao, icon: Wrench, bg: 'bg-warning', path: '/maintenance' },
    { label: 'Baixados', value: baixados, icon: XCircle, bg: 'bg-muted-foreground', path: '/items?status=BAIXADO' },
  ];

  const alertCards = [
    { label: 'Criticidade Alta', value: criticos, icon: AlertTriangle, variant: 'destructive' as const, path: '/items?criticidade=ALTA' },
    { label: 'Manutenções Vencidas', value: vencidas, icon: AlertTriangle, variant: 'destructive' as const, path: '/maintenance' },
    { label: 'A Vencer (15 dias)', value: aVencer, icon: Wrench, variant: 'warning' as const, path: '/maintenance' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0wIDEyYzEuNjU3IDAgMy0xLjM0MyAzLTNzLTEuMzQzLTMtMy0zLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzem0tMTItMTJjMS42NTcgMCAzLTEuMzQzIDMtM3MtMS4zNDMtMy0zLTMtMyAxLjM0My0zIDMgMS4zNDMgMyAzIDN6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Painel de Controle</h2>
            <p className="text-sm text-primary-foreground/70 mt-1">Visão geral do seu patrimônio</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate('/scanner')} className="gap-1.5 bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/25 backdrop-blur-sm" variant="outline">
              <ScanLine className="h-4 w-4" /> Scanner
            </Button>
            <Button size="sm" onClick={() => navigate('/inventory')} className="gap-1.5 bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/25 backdrop-blur-sm" variant="outline">
              <ClipboardCheck className="h-4 w-4" /> Inventário
            </Button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(c => (
          <Card
            key={c.label}
            className="group overflow-hidden border-0 shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98]"
            onClick={() => navigate(c.path)}
          >
            <CardContent className="relative p-5">
              <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${c.bg} opacity-10 transition-transform duration-300 group-hover:scale-150`} />
              <div className="relative flex flex-col gap-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} text-primary-foreground shadow-md`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight">{c.value}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">{c.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Row */}
      {(criticos > 0 || vencidas > 0 || aVencer > 0) && (
        <div className="flex flex-wrap gap-2">
          {alertCards.filter(a => a.value > 0).map(a => (
            <div
              key={a.label}
              onClick={() => navigate(a.path)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm ${
                a.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:shadow-md'
                  : 'bg-warning text-warning-foreground hover:shadow-md'
              }`}
            >
              <a.icon className="h-4 w-4" />
              <span>{a.value} {a.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Quick Movement Card */}
        <Card className="lg:col-span-2 shadow-md border-0 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-sm">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              Movimentação Rápida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={tombo}
                onChange={e => setTombo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchItem()}
                placeholder="Tombo do item..."
                className="h-10"
              />
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={searchItem}>
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant={scannerOpen ? 'destructive' : 'outline'}
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={scannerOpen ? stopScanner : startScanner}
              >
                {scannerOpen ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </Button>
            </div>

            {scannerOpen && (
              <div className="overflow-hidden rounded-xl border shadow-inner">
                <div id="dashboard-scanner" className="w-full" />
              </div>
            )}

            {selectedItem && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="rounded-xl border-l-4 border-l-primary bg-primary/5 p-3">
                  <p className="font-semibold text-sm">[{selectedItem.tombo}] {selectedItem.nome_item}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">📍 {(selectedItem.rooms as any)?.nome}</p>
                </div>

                <Select value={paraSalaId} onValueChange={setParaSalaId}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sala destino" /></SelectTrigger>
                  <SelectContent>
                    {rooms?.filter((r: any) => r.id !== selectedItem.sala_atual_id).map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {(r.sectors as any)?.units?.nome} › {(r.sectors as any)?.nome} › {r.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {motivoOptions.map(m => <SelectItem key={m} value={m}>{motivoLabels[m]}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button className="flex-1 shadow-sm" size="sm" onClick={() => moveMutation.mutate()}
                    disabled={!paraSalaId || moveMutation.isPending}>
                    {moveMutation.isPending ? 'Registrando...' : 'Registrar'}
                  </Button>
                  <WhatsAppShare
                    defaultMessage={`Movimentação de patrimônio:\nItem: [${selectedItem.tombo}] ${selectedItem.nome_item}\nDestino: ${rooms?.find((r: any) => r.id === paraSalaId)?.nome || ''}\nMotivo: ${motivoLabels[motivo]}`}
                    buttonVariant="outline"
                    buttonSize="sm"
                  />
                </div>
              </div>
            )}

            {!selectedItem && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="rounded-full bg-muted p-3 mb-2">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite o tombo e pressione Enter para buscar
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card className="lg:col-span-3 shadow-md border-0 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-accent/5 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="rounded-xl bg-accent p-2 text-accent-foreground shadow-sm">
                  <Activity className="h-4 w-4" />
                </div>
                Movimentações Recentes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/movements')} className="text-xs font-semibold text-primary hover:text-primary">
                Ver todas →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentMovements && recentMovements.length > 0 ? (
              <div className="space-y-1.5">
                {recentMovements.map((m: any, idx: number) => (
                  <div
                    key={m.id}
                    onClick={() => navigate('/movements')}
                    className="group flex items-start justify-between rounded-xl p-3 transition-all duration-200 hover:bg-muted/60 hover:shadow-sm cursor-pointer"
                  >
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{m.items?.tombo}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold">
                            {motivoLabels[m.motivo] || m.motivo}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {m.items?.nome_item}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                          {m.de_sala?.nome} <ArrowRightLeft className="h-3 w-3 inline" /> {m.para_sala?.nome}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground shrink-0 ml-2 mt-0.5 bg-muted rounded-md px-2 py-0.5">
                      {format(new Date(m.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <ArrowRightLeft className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhuma movimentação registrada</p>
                <p className="text-xs text-muted-foreground/60 mt-1">As movimentações aparecerão aqui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

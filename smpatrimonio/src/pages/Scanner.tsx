import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScanLine, Search, Camera, X, Boxes, CheckCircle2, Circle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';

const Scanner: React.FC = () => {
  const [tombo, setTombo] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [kitData, setKitData] = useState<any>(null);
  const [kitItems, setKitItems] = useState<any[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleSearch = async (value?: string) => {
    const searchTombo = (value || tombo).trim();
    if (!searchTombo) return;

    // First check if it's a kit by tombo on kits table
    let kit: any = null;
    const { data: directKit } = await supabase
      .from('kits')
      .select('*')
      .eq('tombo', searchTombo)
      .eq('is_active', true)
      .maybeSingle();
    
    if (directKit) {
      kit = directKit;
    } else {
      // Check kit_locations table for location-specific tombos
      const { data: kitLoc } = await (supabase.from('kit_locations' as any) as any)
        .select('kit_id, tombo, sala_id, rooms(nome, sectors(nome, units(nome)))')
        .eq('tombo', searchTombo)
        .maybeSingle();
      if (kitLoc) {
        const { data: parentKit } = await supabase
          .from('kits')
          .select('*')
          .eq('id', kitLoc.kit_id)
          .eq('is_active', true)
          .maybeSingle();
        if (parentKit) kit = { ...parentKit, location: kitLoc };
      }
    }

    if (kit) {
      const { data: items } = await supabase
        .from('kit_items')
        .select('id, item_id, items(id, tombo, nome_item, status, rooms:sala_atual_id(nome, sectors(nome, units(nome))))')
        .eq('kit_id', kit.id);
      setKitData(kit);
      setKitItems(items || []);
      setCheckedItems(new Set());
      setTombo('');
      return;
    }

    // Then check items
    const { data } = await supabase
      .from('items')
      .select('id')
      .eq('tombo', searchTombo)
      .maybeSingle();

    if (data) {
      navigate(`/items/${data.id}`);
    } else {
      toast({
        title: 'Não encontrado',
        description: `Tombo "${searchTombo}" não existe como item nem como kit.`,
      });
    }
    setTombo('');
  };

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraOpen(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('scanner-camera');
        html5QrCodeRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopCamera();
            handleSearch(decodedText);
          },
          () => {}
        );
      } catch {
        toast({ title: 'Erro ao abrir câmera', description: 'Verifique as permissões.', variant: 'destructive' });
        setCameraOpen(false);
      }
    }, 200);
  }, [stopCamera, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleCheck = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const statusLabels: Record<string, string> = {
    'EM_USO': 'Em uso', 'EM_MANUTENCAO': 'Manutenção', 'BAIXADO': 'Baixado',
    'EMPRESTADO': 'Emprestado', 'EM_DIVERGENCIA': 'Divergência'
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Scanner de Patrimônio</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use a câmera, leitor de código de barras/QR ou digite o tombo manualmente. Aceita itens e kits.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Escaneie ou digite o tombo..."
                className="pl-9 text-lg h-12"
                value={tombo}
                onChange={e => setTombo(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
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
              <div id="scanner-camera" className="w-full" />
            </div>
          )}

          <Button className="w-full" onClick={() => handleSearch()}>
            Buscar Item / Kit
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            O campo aceita entrada do leitor USB/Bluetooth (foco automático + Enter)
          </p>
        </CardContent>
      </Card>

      {/* Kit Dialog */}
      <Dialog open={!!kitData} onOpenChange={(open) => !open && setKitData(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              Kit: {kitData?.nome}
            </DialogTitle>
            <DialogDescription>
              Tombo: <strong>{kitData?.tombo}</strong>
              {kitData?.descricao && <> — {kitData.descricao}</>}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{kitItems.length} item(ns)</span>
            <span className="font-medium">
              {checkedItems.size}/{kitItems.length} conferidos
            </span>
          </div>

          <div className="space-y-1">
            {kitItems.map((ki: any) => {
              const item = ki.items;
              const isChecked = checkedItems.has(item?.id);
              const room = item?.rooms;
              const loc = room ? `${(room.sectors as any)?.units?.nome} › ${(room.sectors as any)?.nome} › ${room.nome}` : '';
              return (
                <div
                  key={ki.id}
                  className={`flex items-center gap-2 rounded border p-2 text-sm cursor-pointer transition-colors ${
                    isChecked ? 'bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30' : 'hover:bg-accent'
                  }`}
                  onClick={() => toggleCheck(item?.id)}
                >
                  {isChecked
                    ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                    : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  }
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs">[{item?.tombo}]</span> {item?.nome_item}
                    {loc && <p className="text-xs text-muted-foreground">📍 {loc}</p>}
                  </div>
                  <Badge variant={item?.status === 'EM_USO' ? 'default' : 'secondary'} className="shrink-0">
                    {statusLabels[item?.status] || item?.status}
                  </Badge>
                </div>
              );
            })}
          </div>

          {checkedItems.size === kitItems.length && kitItems.length > 0 && (
            <div className="rounded-lg bg-[hsl(var(--success))]/10 p-3 text-center text-sm font-medium text-[hsl(var(--success))]">
              ✅ Todos os itens do kit conferidos!
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setKitData(null)}>Fechar</Button>
            <Button className="flex-1" onClick={() => { navigate('/kits'); setKitData(null); }}>
              <Package className="h-4 w-4 mr-1" /> Ver no Kits
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scanner;

import React, { useEffect, useState } from 'react';
import { usePWA } from './PWAProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, Package, AlertTriangle, Wrench, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OfflineSnapshot {
  kpis: { totalItems: number; emUso: number; manutencao: number; movimentacoes: number };
  recentItems: Array<{ tombo: string; nome_item: string; status: string }>;
  savedAt: string;
}

export const OfflineFallback: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline, lastSyncTime } = usePWA();
  const [snapshot, setSnapshot] = useState<OfflineSnapshot | null>(null);

  useEffect(() => {
    if (!isOnline) {
      const data = localStorage.getItem('offline_snapshot');
      if (data) setSnapshot(JSON.parse(data));
    }
  }, [isOnline]);

  if (isOnline) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <WifiOff className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Modo Offline</h1>
          <p className="text-muted-foreground">
            Sem conexão com a internet.
            {lastSyncTime && (
              <> Última sincronização: <strong>{format(new Date(lastSyncTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</strong></>
            )}
          </p>
        </div>

        {/* KPIs from snapshot */}
        {snapshot && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{snapshot.kpis.totalItems}</p>
                    <p className="text-xs text-muted-foreground">Total de itens</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Package className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">{snapshot.kpis.emUso}</p>
                    <p className="text-xs text-muted-foreground">Em uso</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Wrench className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">{snapshot.kpis.manutencao}</p>
                    <p className="text-xs text-muted-foreground">Em manutenção</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{snapshot.kpis.movimentacoes}</p>
                    <p className="text-xs text-muted-foreground">Movimentações</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent items table */}
            {snapshot.recentItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Últimos itens (cache)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {snapshot.recentItems.slice(0, 10).map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium">{item.nome_item}</p>
                          <p className="text-xs text-muted-foreground">Tombo: {item.tombo}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!snapshot && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum dado em cache disponível.</p>
              <p className="text-xs text-muted-foreground mt-1">Conecte-se à internet para carregar os dados.</p>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar reconectar
          </Button>
        </div>
      </div>
    </div>
  );
};

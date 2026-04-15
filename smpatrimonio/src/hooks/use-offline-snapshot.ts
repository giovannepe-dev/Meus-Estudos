import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOfflineSnapshot = () => {
  useEffect(() => {
    if (!navigator.onLine) return;

    const saveSnapshot = async () => {
      try {
        const [itemsRes, movRes] = await Promise.all([
          supabase.from('items').select('tombo, nome_item, status').order('updated_at', { ascending: false }).limit(50),
          supabase.from('movements').select('id').limit(1000),
        ]);

        const items = itemsRes.data || [];
        const totalItems = items.length;
        const emUso = items.filter(i => i.status === 'EM_USO').length;
        const manutencao = items.filter(i => i.status === 'EM_MANUTENCAO').length;

        const snapshot = {
          kpis: {
            totalItems,
            emUso,
            manutencao,
            movimentacoes: movRes.data?.length || 0,
          },
          recentItems: items.slice(0, 20),
          savedAt: new Date().toISOString(),
        };

        localStorage.setItem('offline_snapshot', JSON.stringify(snapshot));
        localStorage.setItem('lastSyncTime', snapshot.savedAt);
      } catch (e) {
        console.warn('[Offline Snapshot] Erro ao salvar:', e);
      }
    };

    // Save on load + every 5 min
    saveSnapshot();
    const interval = setInterval(saveSnapshot, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
};

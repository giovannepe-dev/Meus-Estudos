import { useEffect, useCallback } from "react";

const SNAPSHOT_KEY = "offline_snapshot";

export interface OfflineSnapshot {
  timestamp: string;
  stats: {
    disponiveis: number;
    emUso: number;
    manutencao: number;
    gastosMes: number;
    kmMes: number;
    avariasAbertas: number;
  };
}

export function saveOfflineSnapshot(data: Omit<OfflineSnapshot, "timestamp">) {
  try {
    const snapshot: OfflineSnapshot = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {}
}

export function getOfflineSnapshot(): OfflineSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useOfflineSnapshot() {
  const save = useCallback((data: Omit<OfflineSnapshot, "timestamp">) => {
    saveOfflineSnapshot(data);
  }, []);

  const load = useCallback(() => {
    return getOfflineSnapshot();
  }, []);

  return { save, load };
}

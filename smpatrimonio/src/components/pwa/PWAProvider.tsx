import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

interface PWAContextType {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  installApp: () => void;
  lastSyncTime: string | null;
}

const PWAContext = createContext<PWAContextType>({
  isOnline: true,
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  installApp: () => {},
  lastSyncTime: null,
});

export const usePWA = () => useContext(PWAContext);

let deferredPrompt: any = null;

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem('lastSyncTime')
  );

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] SW registrado:', swUrl);
      if (registration) {
        // Check for updates every 5 min
        setInterval(() => registration.update(), 5 * 60 * 1000);
        // Also check immediately when user returns to the tab
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Erro ao registrar SW:', error);
    },
  });

  // Update prompt
  useEffect(() => {
    if (needRefresh) {
      toast('Atualização disponível', {
        description: 'Uma nova versão está pronta.',
        action: {
          label: 'Atualizar',
          onClick: () => {
            updateServiceWorker(true);
          },
        },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  // Online/offline
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('lastSyncTime', now);
      toast.success('Conexão restabelecida');
    };
    const goOffline = () => {
      setIsOnline(false);
      toast.warning('Sem conexão — modo offline ativado');
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      deferredPrompt = null;
    }
  };

  return (
    <PWAContext.Provider value={{ isOnline, isInstallable, isInstalled, isIOS, installApp, lastSyncTime }}>
      {children}
    </PWAContext.Provider>
  );
};

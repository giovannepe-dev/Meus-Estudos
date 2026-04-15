import React, { useState } from 'react';
import { usePWA } from './PWAProvider';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';

export const InstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isInstalled) return null;

  // iOS instructions
  if (isIOS && !isInstalled) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg safe-area-pb">
        <div className="flex items-start gap-3 max-w-lg mx-auto">
          <Share className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Instalar SM Patrimônio</p>
            <p className="opacity-90 mt-1">
              Toque em <strong>Compartilhar</strong> <Share className="h-3 w-3 inline" /> e depois em <strong>"Adicionar à Tela de Início"</strong>
            </p>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Standard install prompt
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <Download className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">Instalar SM Patrimônio</p>
          <p className="opacity-90">Acesso rápido como app nativo</p>
        </div>
        <Button size="sm" variant="secondary" onClick={installApp}>
          Instalar
        </Button>
        <button onClick={() => setDismissed(true)} className="p-1 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

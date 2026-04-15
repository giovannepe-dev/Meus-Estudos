import React, { useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export const InstallBanner: React.FC = () => {
  const { canInstall, promptInstall, isIOS, isStandalone } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || isStandalone) return null;

  // iOS instructions
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom">
        <div className="flex items-start gap-3 max-w-lg mx-auto">
          <Share className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Instalar SmartFrota</p>
            <p className="text-xs text-muted-foreground mt-1">
              Toque em <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong>
            </p>
          </div>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg animate-in slide-in-from-bottom">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <Download className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Instalar App</p>
          <p className="text-xs text-muted-foreground">Acesso rápido como app nativo</p>
        </div>
        <Button size="sm" onClick={promptInstall}>Instalar</Button>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export const UpdateToast: React.FC = () => {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-top max-w-sm">
      <RefreshCw className="w-4 h-4 text-primary shrink-0" />
      <p className="text-sm text-foreground flex-1">Atualização disponível</p>
      <Button size="sm" variant="outline" onClick={applyUpdate}>Atualizar</Button>
    </div>
  );
};

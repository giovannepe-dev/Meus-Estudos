import React from 'react';
import { usePWA } from './PWAProvider';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
      <WifiOff className="h-3 w-3" />
      <span>Offline</span>
    </div>
  );
};

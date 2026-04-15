import React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export const OnlineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
      isOnline
        ? "text-success bg-success/10"
        : "text-destructive bg-destructive/10"
    }`}>
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {isOnline ? "Online" : "Offline"}
    </div>
  );
};

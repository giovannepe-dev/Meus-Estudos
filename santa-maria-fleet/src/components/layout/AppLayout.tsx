import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ProductTour } from "@/components/tour/ProductTour";
import { getTourSteps } from "@/components/tour/tourSteps";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Car,
  ArrowRightLeft,
  Fuel,
  AlertTriangle,
  ClipboardCheck,
  Wrench,
  BarChart3,
  Settings,
  ReceiptText,
  LogOut,
  X,
  CalendarDays,
  Shield,
  MapPin,
  HelpCircle,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnlineIndicator } from "@/components/pwa/OnlineIndicator";

const navItems = [
  { path: "/painel", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "frota", "motorista"] },
  { path: "/painel/veiculos", label: "Veículos", icon: Car, roles: ["admin", "frota"] },
  { path: "/painel/checkout", label: "Checkout", icon: ArrowRightLeft, roles: ["admin", "frota", "motorista"] },
  { path: "/painel/agendamentos", label: "Agendamentos", icon: CalendarDays, roles: ["admin", "frota", "motorista"] },
  { path: "/painel/abastecimentos", label: "Abastecimentos", icon: Fuel, roles: ["admin", "frota", "motorista"] },
  { path: "/painel/avarias", label: "Avarias", icon: AlertTriangle, roles: ["admin", "frota", "motorista"] },
  { path: "/painel/multas", label: "Multas", icon: ReceiptText, roles: ["admin", "frota", "motorista"] },
  { path: "/painel/manutencoes", label: "Manutenções", icon: Wrench, roles: ["admin", "frota"] },
  { path: "/painel/inspecoes", label: "Inspeções", icon: ClipboardCheck, roles: ["admin", "frota"] },
  { path: "/painel/relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin", "frota"] },
  { path: "/painel/rastreamento", label: "Rastreamento", icon: MapPin, roles: ["admin", "frota"] },
  { path: "/painel/guia", label: "Guia / Ajuda", icon: HelpCircle, roles: ["admin", "frota", "motorista"] },
  { path: "/painel/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] },
];


export const AppLayout: React.FC = () => {
  const { profile, role, isSuperAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("SmartFrota");

  useEffect(() => {
    if (!profile?.company_id) return;
    supabase.from("companies").select("nome, logo_url").eq("id", profile.company_id).single()
      .then(({ data }) => {
        if (data?.nome) setCompanyName(data.nome);
        if (data?.logo_url) setCompanyLogo(data.logo_url);
      });
  }, [profile?.company_id]);

  const baseNav = navItems.filter((item) => role && item.roles.includes(role));
  const filteredNav = isSuperAdmin
    ? [...baseNav, { path: "/painel/master", label: "Painel Master", icon: Shield, roles: ["admin"] }]
    : baseNav;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <div data-tour="sidebar-logo" className="py-3 lg:py-4 flex items-center gap-2 px-4 border-b border-sidebar-border w-full">
        <img src={companyLogo || "/icon-smartfrota.png"} alt={companyName} className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg object-contain" />
        <span className="text-sm font-bold truncate">{companyName}</span>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-2 lg:py-3 space-y-0.5 overflow-y-auto px-2">
        {filteredNav.map((item) => {
          const tourId = item.path === "/painel" ? "nav-dashboard"
            : item.path === "/painel/veiculos" ? "nav-veiculos"
            : item.path === "/painel/checkout" ? "nav-checkout"
            : undefined;

          return (
            <button
              key={item.path}
              data-tour={tourId}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="py-3 px-2 border-t border-sidebar-border flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground shrink-0">
            {profile?.nome?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="text-xs text-sidebar-foreground/70 truncate">{profile?.nome || ""}</span>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      <ProductTour steps={getTourSteps(role)} storageKey={`tour_${role || "default"}_v1`} />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="flex flex-col w-[200px] lg:w-[220px] bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar text-sidebar-foreground shadow-xl flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          )}
          {!isMobile && <div />}
          <OnlineIndicator />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

import { useAuth } from "@/hooks/useAuth";
import laserproLogo from "@/assets/laserpro-logo.png";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Package, Settings, LogOut, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminBloqueado from "./AdminBloqueado";
import AdminPendente from "./AdminPendente";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Categorias", icon: FolderOpen, path: "/admin/categorias" },
  { label: "Produtos", icon: Package, path: "/admin/produtos" },
  { label: "Carrosséis", icon: SlidersHorizontal, path: "/admin/carrosseis" },
  { label: "Configurações", icon: Settings, path: "/admin/configuracoes" },
];

const AdminLayout = () => {
  const { user, isAdmin, isSuperAdmin, loading, signOut } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  // Check subscription status and ativo for tenant owner (not super admin)
  const { data: tenantData } = useQuery({
    queryKey: ["tenant-subscription", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data } = await supabase
        .from("tenants")
        .select("subscription_status, ativo")
        .eq("id", tenant.id)
        .single();
      return data;
    },
    enabled: !!tenant?.id && !isSuperAdmin,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  // Show pending page if store not yet approved (except super admin)
  if (!isSuperAdmin && tenantData && !(tenantData as any).ativo) {
    return <AdminPendente />;
  }

  // Block access if subscription is blocked or cancelled (except super admin)
  const subStatus = (tenantData as any)?.subscription_status;
  if (!isSuperAdmin && (subStatus === "bloqueado" || subStatus === "cancelado")) {
    return <AdminBloqueado />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col hidden md:flex">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <img src={laserproLogo} alt="LaserPro" className="h-10 w-auto" />
            <span className="font-display font-semibold text-sm">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-card border-b p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={laserproLogo} alt="LaserPro" className="h-10 w-auto" />
            <span className="font-display font-semibold text-sm">Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-b bg-card overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1 px-4 py-3 text-xs whitespace-nowrap border-b-2 transition-colors ${
                location.pathname === item.path
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

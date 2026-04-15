import { useAuth } from "@/hooks/useAuth";
import laserproLogo from "@/assets/laserpro-logo.png";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, FolderOpen, Package, Settings, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Empresas", icon: Users, path: "/super-admin" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/super-admin/dashboard" },
  { label: "Categorias", icon: FolderOpen, path: "/super-admin/categorias" },
  { label: "Produtos", icon: Package, path: "/super-admin/produtos" },
  { label: "Carrosséis", icon: SlidersHorizontal, path: "/super-admin/carrosseis" },
  { label: "Configurações", icon: Settings, path: "/super-admin/configuracoes" },
];

const SuperAdminLayout = () => {
  const { user, isSuperAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user || !isSuperAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-card border-r flex-col hidden md:flex">
        <div className="p-4 border-b">
          <Link to="/super-admin" className="flex items-center gap-2">
            <img src={laserproLogo} alt="LaserPro" className="h-10 w-auto" />
            <span className="font-display font-semibold text-sm">Super Admin</span>
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

      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-card border-b p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-display text-xs font-bold">
              LP
            </div>
            <span className="font-display font-semibold text-sm">Super Admin</span>
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

export default SuperAdminLayout;

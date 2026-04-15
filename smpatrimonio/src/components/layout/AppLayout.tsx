import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Package, MapPin, ScanLine, ArrowRightLeft,
  ClipboardCheck, Wrench, BarChart3, Settings, LogOut, Menu, X,
  Tag, Stamp, Printer, Boxes, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { useOfflineSnapshot } from '@/hooks/use-offline-snapshot';
import logo from '@/assets/logo.png';

interface NavItem {
  label: string;
  icon: React.FC<any>;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Itens', icon: Package, path: '/items', children: [
    { label: 'Kits', icon: Boxes, path: '/kits' },
  ]},
  { label: 'Locais', icon: MapPin, path: '/locations' },
  { label: 'Categorias', icon: Tag, path: '/categories', children: [/* dynamic */] },
  { label: 'Scanner', icon: ScanLine, path: '/scanner' },
  { label: 'Movimentação', icon: ArrowRightLeft, path: '/movements' },
  { label: 'Inventário', icon: ClipboardCheck, path: '/inventory' },
  { label: 'Manutenção', icon: Wrench, path: '/maintenance' },
  { label: 'Relatórios', icon: BarChart3, path: '/reports' },
  { label: 'Etiquetas', icon: Stamp, path: '/label-designer' },
  { label: 'Impressão em Massa', icon: Printer, path: '/mass-print' },
  { label: 'Configurações', icon: Settings, path: '/settings' },
];

const allPaths = navItems.flatMap(i => [i.path, ...(i.children?.map(c => c.path) || [])]);

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useOfflineSnapshot();

  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories-nav'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, nome, is_active').eq('is_active', true).order('nome');
      return data || [];
    }
  });

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  // Auto-expand parent if child is active
  React.useEffect(() => {
    navItems.forEach(item => {
      if (item.children?.some(c => location.pathname.startsWith(c.path))) {
        setExpandedMenus(prev => prev.includes(item.path) ? prev : [...prev, item.path]);
      }
    });
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-4">
          <img src={logo} alt="SM Patrimônio" className="h-14 w-14 rounded-lg object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">SM Patrimônio</span>
            <span className="text-[10px] text-sidebar-foreground/50">Gestão inteligente de ativos</span>
          </div>
          <button className="ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.children && location.pathname.startsWith(item.path));
            const isExpanded = expandedMenus.includes(item.path);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.path}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleMenu(item.path);
                      navigate(item.path);
                      setSidebarOpen(false);
                    } else {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    <span onClick={(e) => { e.stopPropagation(); toggleMenu(item.path); }}>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                  )}
                </button>
                {hasChildren && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                    {item.children!.filter(c => c.label).map(child => {
                      const childActive = location.pathname.startsWith(child.path);
                      return (
                        <button
                          key={child.path}
                          onClick={() => { navigate(child.path); setSidebarOpen(false); }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            childActive
                              ? "bg-sidebar-accent text-sidebar-primary"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          <child.icon className="h-4 w-4 shrink-0" />
                          {child.label}
                        </button>
                      );
                    })}
                    {item.path === '/categories' && categories && categories.length > 0 && (
                      <>
                        {categories.map((cat: any) => (
                          <div
                            key={cat.id}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-sidebar-foreground/60"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{cat.nome}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-medium truncate">{user?.email}</p>
            </div>
            <button onClick={signOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold flex-1">
            {(() => {
              for (const n of navItems) {
                if (n.children) {
                  const child = n.children.find(c => location.pathname.startsWith(c.path));
                  if (child) return child.label;
                }
                if (location.pathname.startsWith(n.path)) return n.label;
              }
              return 'SM Patrimônio';
            })()}
          </h1>
          <OfflineIndicator />
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

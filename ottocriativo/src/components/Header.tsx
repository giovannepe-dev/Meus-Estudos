import { Link } from "react-router-dom";
import laserproLogo from "@/assets/laserpro-logo.png";
import { ShoppingCart, Menu, X, Home, LayoutGrid, Store, LogIn } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useTenant } from "@/contexts/TenantContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const { totalItems } = useCart();
  const { tenant } = useTenant();
  const { data: settings } = useSiteSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  const logoSrc = tenant?.logo_url ?? null;
  const siteName = settings?.nome_site || tenant?.nome || "LaserPro";
  const basePath = tenant ? `/loja/${tenant.slug}` : "/";
  const showCreateStore = !tenant;

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={basePath} className="flex items-center gap-2 shrink-0">
          {logoSrc ? (
            <img src={logoSrc} alt={siteName} className="h-12 w-auto" />
          ) : (
            <img src={laserproLogo} alt="LaserPro" className="h-12 w-auto" />
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            to={basePath}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <Home className="h-4 w-4" />
            Início
          </Link>
          <Link
            to={`${basePath}${basePath === "/" ? "" : "/"}catalogo`}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <LayoutGrid className="h-4 w-4" />
            Catálogo
          </Link>
          <Link
            to={`${basePath}${basePath === "/" ? "" : "/"}carrinho`}
            className="relative inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            Carrinho
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
          {showCreateStore && (
            <>
              <Link
                to="/criar-loja"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <Store className="h-4 w-4" />
                Criar Loja
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            </>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to={`${basePath}${basePath === "/" ? "" : "/"}carrinho`}
            className="relative p-2 rounded-full bg-muted"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full bg-muted">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-card border-b overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-2">
              <Link to={basePath} onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-all">
                <Home className="h-4 w-4" /> Início
              </Link>
              <Link to={`${basePath}${basePath === "/" ? "" : "/"}catalogo`} onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-all">
                <LayoutGrid className="h-4 w-4" /> Catálogo
              </Link>
              {showCreateStore && (
                <>
                  <Link to="/criar-loja" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                    <Store className="h-4 w-4" /> Criar Loja
                  </Link>
                  <Link to="/admin/login" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-2 text-sm font-medium py-2.5 px-4 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-all">
                    <LogIn className="h-4 w-4" /> Entrar
                  </Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

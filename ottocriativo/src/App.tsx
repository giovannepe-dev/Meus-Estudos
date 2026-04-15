import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { PublicLayout } from "@/components/PublicLayout";
import Index from "./pages/Index";
import LaserPro from "./pages/LaserPro";
import Catalogo from "./pages/Catalogo";
import Categoria from "./pages/Categoria";
import Produto from "./pages/Produto";
import Carrinho from "./pages/Carrinho";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategorias from "./pages/admin/AdminCategorias";
import AdminProdutos from "./pages/admin/AdminProdutos";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminCarroseis from "./pages/admin/AdminCarroseis";
import SuperAdminLayout from "./pages/admin/SuperAdminLayout";
import SuperAdminEmpresas from "./pages/admin/SuperAdminEmpresas";
import CriarLoja from "./pages/CriarLoja";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <TenantProvider>
          <CartProvider>
            <Sonner />
            <Routes>
              {/* Public storefront */}
              {/* Landing page */}
              <Route path="/" element={<LaserPro />} />

              {/* Tenant via slug */}
              <Route path="/loja/:tenantSlug" element={<PublicLayout />}>
                <Route index element={<Index />} />
                <Route path="catalogo" element={<Catalogo />} />
                <Route path="categoria/:slug" element={<Categoria />} />
                <Route path="produto/:slug" element={<Produto />} />
                <Route path="carrinho" element={<Carrinho />} />
              </Route>

              {/* Normalize global routes if user typed them inside a tenant URL */}
              <Route path="/loja/:tenantSlug/criar-loja" element={<Navigate to="/criar-loja" replace />} />
              <Route path="/loja/:tenantSlug/admin/login" element={<Navigate to="/admin/login" replace />} />

              {/* Create store */}
              <Route path="/criar-loja" element={<CriarLoja />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="produtos" element={<AdminProdutos />} />
                <Route path="carrosseis" element={<AdminCarroseis />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
              </Route>

              {/* Super Admin */}
              <Route path="/super-admin" element={<SuperAdminLayout />}>
                <Route index element={<SuperAdminEmpresas />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="produtos" element={<AdminProdutos />} />
                <Route path="carrosseis" element={<AdminCarroseis />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </TenantProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

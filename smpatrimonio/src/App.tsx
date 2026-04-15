import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { OfflineFallback } from "@/components/pwa/OfflinePage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Items from "./pages/Items";
import ItemForm from "./pages/ItemForm";
import ItemDetail from "./pages/ItemDetail";
import Locations from "./pages/Locations";
import Categories from "./pages/Categories";
import Scanner from "./pages/Scanner";
import Movements from "./pages/Movements";
import Inventory from "./pages/Inventory";
import Maintenance from "./pages/Maintenance";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import LabelDesigner from "./pages/LabelDesigner";
import MassPrint from "./pages/MassPrint";
import Kits from "./pages/Kits";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PWAProvider>
        <OfflineFallback>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/items" element={<Items />} />
                  <Route path="/items/new" element={<ItemForm />} />
                  <Route path="/items/:id" element={<ItemDetail />} />
                  <Route path="/items/:id/edit" element={<ItemForm />} />
                  <Route path="/locations" element={<Locations />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/scanner" element={<Scanner />} />
                  <Route path="/movements" element={<Movements />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/label-designer" element={<LabelDesigner />} />
                  <Route path="/mass-print" element={<MassPrint />} />
                  <Route path="/kits" element={<Kits />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
          <InstallBanner />
        </OfflineFallback>
      </PWAProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

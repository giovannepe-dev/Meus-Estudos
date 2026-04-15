import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MasterPanel from "./pages/MasterPanel";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Checkout from "./pages/Checkout";
import FuelRecords from "./pages/FuelRecords";
import Incidents from "./pages/Incidents";
import Maintenance from "./pages/Maintenance";
import Inspections from "./pages/Inspections";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import Bookings from "./pages/Bookings";
import TrafficTickets from "./pages/TrafficTickets";
import GuidePage from "./pages/GuidePage";
const Tracking = React.lazy(() => import("./pages/Tracking"));
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { UpdateToast } from "@/components/pwa/UpdateToast";
import { BookingReminder } from "@/components/BookingReminder";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Carregando...</p></div>;
  if (!isSuperAdmin) return <Navigate to="/painel" replace />;
  return <>{children}</>;
};

const PublicOnly = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><p>Carregando...</p></div>;
  if (user) return <Navigate to="/painel" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallBanner />
      <UpdateToast />
      <BrowserRouter>
        <AuthProvider>
          <BookingReminder />
          <Routes>
            <Route path="/" element={<PublicOnly><LandingPage /></PublicOnly>} />
            <Route path="/login" element={<Login />} />
            <Route path="/c/:slug" element={<Signup />} />
            <Route path="/cadastro" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/painel" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="veiculos" element={<Vehicles />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="abastecimentos" element={<FuelRecords />} />
              <Route path="avarias" element={<Incidents />} />
              <Route path="manutencoes" element={<Maintenance />} />
              <Route path="inspecoes" element={<Inspections />} />
              <Route path="relatorios" element={<Reports />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="agendamentos" element={<Bookings />} />
              <Route path="multas" element={<TrafficTickets />} />
              <Route path="rastreamento" element={<Suspense fallback={<div className="p-8 text-center">Carregando mapa...</div>}><Tracking /></Suspense>} />
              <Route path="guia" element={<GuidePage />} />
              <Route path="master" element={<SuperAdminRoute><MasterPanel /></SuperAdminRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

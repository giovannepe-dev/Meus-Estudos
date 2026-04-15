import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PlatformLayout from "./components/PlatformLayout";
import DashboardPage from "./pages/DashboardPage";
import AmbientalPage from "./pages/AmbientalPage";
import SocialPage from "./pages/SocialPage";
import GovernancaPage from "./pages/GovernancaPage";
import MetasPage from "./pages/MetasPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import EvidenciasPage from "./pages/EvidenciasPage";
import AssistentePage from "./pages/AssistentePage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import DadosPage from "./pages/DadosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><PlatformLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="ambiental" element={<AmbientalPage />} />
              <Route path="social" element={<SocialPage />} />
              <Route path="governanca" element={<GovernancaPage />} />
              <Route path="dados" element={<DadosPage />} />
              <Route path="metas" element={<MetasPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="evidencias" element={<EvidenciasPage />} />
              <Route path="assistente" element={<AssistentePage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

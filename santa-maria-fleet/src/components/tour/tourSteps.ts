import type { TourStep } from "./ProductTour";

// Tour para Admin e Frota — funcionalidades completas
export const adminTourSteps: TourStep[] = [
  {
    target: "sidebar-logo",
    title: "🚗 Bem-vindo ao SmartFrota!",
    description: "Este é o seu painel de gestão de frotas. Vamos fazer um tour rápido para você conhecer todas as funcionalidades disponíveis.",
    position: "right",
  },
  {
    target: "nav-dashboard",
    title: "📊 Dashboard",
    description: "Visão geral da frota: veículos disponíveis, gastos do mês, km rodados, alertas de manutenção e multas pendentes.",
    position: "right",
  },
  {
    target: "nav-veiculos",
    title: "🚘 Veículos",
    description: "Cadastre e gerencie todos os veículos. Veja histórico completo, status em tempo real e alertas de revisão por km.",
    position: "right",
  },
  {
    target: "nav-checkout",
    title: "🔑 Checkout",
    description: "Registre retiradas e devoluções com foto do hodômetro, assinatura digital e validação automática de km.",
    position: "right",
  },
  {
    target: "stat-cards",
    title: "📈 Cards de Resumo",
    description: "Acompanhe os números da frota em tempo real: disponibilidade, gastos com combustível e manutenção, km rodados e avarias.",
    position: "bottom",
  },
  {
    target: "quick-actions",
    title: "⚡ Ações Rápidas",
    description: "Retirar ou devolver veículos com um clique, sem navegar pelos menus.",
    position: "top",
  },
  {
    target: "nav-mais",
    title: "📋 Mais Funcionalidades",
    description: "Acesse: Abastecimentos, Avarias, Multas (com identificação automática do motorista), Manutenções, Inspeções, Relatórios, Rastreamento e Configurações.",
    position: "right",
  },
];

// Tour para Motorista — funcionalidades limitadas ao seu perfil
export const motoristaTourSteps: TourStep[] = [
  {
    target: "sidebar-logo",
    title: "🚗 Bem-vindo, Motorista!",
    description: "Este é o seu painel pessoal. Aqui você acompanha seus registros de uso, agendamentos e informações da frota.",
    position: "right",
  },
  {
    target: "nav-dashboard",
    title: "📊 Seu Painel",
    description: "Veja seus km rodados no mês, veículos disponíveis para uso e suas avarias ou multas registradas.",
    position: "right",
  },
  {
    target: "nav-checkout",
    title: "🔑 Retirar / Devolver",
    description: "Use esta seção para registrar a retirada e devolução de veículos. Tire foto do hodômetro e assine na tela do celular.",
    position: "right",
  },
  {
    target: "stat-cards",
    title: "📈 Seus Números",
    description: "Acompanhe quantos km você rodou, veículos disponíveis e se há alguma avaria ou multa registrada no seu nome.",
    position: "bottom",
  },
  {
    target: "quick-actions",
    title: "⚡ Ações Rápidas",
    description: "Retire ou devolva veículos rapidamente com estes botões. Lembre-se de tirar a foto do hodômetro!",
    position: "top",
  },
  {
    target: "nav-mais",
    title: "📋 Outras Opções",
    description: "Acesse seus agendamentos de veículos e consulte suas multas registradas.",
    position: "right",
  },
];

// Função para retornar o tour correto baseado no perfil
export function getTourSteps(role: string | null): TourStep[] {
  if (role === "motorista") return motoristaTourSteps;
  return adminTourSteps;
}

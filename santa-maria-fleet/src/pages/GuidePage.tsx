import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { generateGuidePdf } from "@/utils/guidePdf";
import {
  Car, ClipboardCheck, Fuel, Wrench, AlertTriangle, CalendarDays,
  MapPin, ReceiptText, BarChart3, Settings, FileDown, Users, Shield,
  ClipboardList,
} from "lucide-react";

interface GuideSection {
  icon: React.ElementType;
  title: string;
  description: string;
  steps: string[];
  roles: string[];
}

const sections: GuideSection[] = [
  {
    icon: Car,
    title: "Veiculos",
    description: "Cadastre e gerencie todos os veiculos da frota.",
    steps: [
      "Acesse 'Veiculos' no menu lateral",
      "Clique em 'Novo Veiculo' para cadastrar",
      "Preencha: Placa, Prefixo, Marca, Modelo, Ano, Tipo combustivel e Km atual",
      "Configure o intervalo de revisao (km) para alertas automaticos",
      "No detalhe do veiculo, veja historico completo de checkouts, abastecimentos e manutencoes",
    ],
    roles: ["admin", "frota"],
  },
  {
    icon: ClipboardCheck,
    title: "Checkout (Retirada / Devolucao)",
    description: "Registre a retirada e devolucao de veiculos com foto, assinatura e validacao.",
    steps: [
      "Acesse 'Checkout' no menu",
      "Para RETIRAR: selecione veiculo, motorista, motivo de uso",
      "Informe o Km e tire foto do hodometro com a camera",
      "Assine na tela do celular (assinatura digital)",
      "Para DEVOLVER: selecione o checkout aberto",
      "Informe Km de devolucao, foto e assinatura",
      "Se houve avaria, registre no momento da devolucao",
      "O sistema calcula o Km rodado e envia resumo por WhatsApp",
    ],
    roles: ["admin", "frota", "motorista"],
  },
  {
    icon: Fuel,
    title: "Abastecimentos",
    description: "Controle de combustivel com comprovantes e relatorios.",
    steps: [
      "Acesse 'Abastecimentos' no menu",
      "Clique em 'Novo Abastecimento'",
      "Preencha: Veiculo, Motorista, Data, Tipo combustivel, Litros, Valor",
      "Opcional: Nome do posto e foto do comprovante",
      "Use filtros por periodo, veiculo e motorista",
      "Acompanhe o total gasto no periodo selecionado",
    ],
    roles: ["admin", "frota"],
  },
  {
    icon: AlertTriangle,
    title: "Avarias e Ocorrencias",
    description: "Registro de danos com fotos, gravidade e acompanhamento.",
    steps: [
      "Acesse 'Avarias' no menu",
      "Clique em 'Nova Avaria'",
      "Selecione: Veiculo, Motorista, Tipo (arranhao, amassado, pneu, etc.)",
      "Defina a gravidade: leve, media ou grave",
      "Adicione pelo menos 1 foto e informe custo estimado",
      "Indique se o veiculo ficou imobilizado",
      "Acompanhe o status: Aberta > Em andamento > Resolvida",
    ],
    roles: ["admin", "frota"],
  },
  {
    icon: ReceiptText,
    title: "Multas de Transito",
    description: "Cadastro de multas com identificacao automatica do motorista.",
    steps: [
      "Acesse 'Multas' no menu",
      "Clique em 'Nova Multa'",
      "Preencha: Veiculo, Data da infracao, Descricao, Valor, Pontos",
      "Salve a multa",
      "Clique em 'Sincronizar Motoristas' para identificar automaticamente o responsavel",
      "O sistema cruza o horario da infracao com os checkouts",
      "Notificacao automatica via WhatsApp para o admin",
    ],
    roles: ["admin", "frota", "motorista"],
  },
  {
    icon: Wrench,
    title: "Manutencoes",
    description: "Agendamento e historico de servicos com alertas por km.",
    steps: [
      "Acesse 'Manutencoes' no menu",
      "Clique em 'Nova Manutencao' e selecione o veiculo",
      "Preencha: Tipo de servico, Data agendada",
      "Quando realizada, atualize com: Data, Km, Custo e Comprovante",
      "O sistema alerta quando o veiculo esta proximo da revisao",
      "Veiculos com revisao vencida sao bloqueados automaticamente",
    ],
    roles: ["admin", "frota"],
  },
  {
    icon: ClipboardList,
    title: "Inspecoes",
    description: "Inspecoes periodicas de veiculos.",
    steps: [
      "Acesse 'Inspecoes' no menu",
      "Clique em 'Nova Inspecao' e selecione o veiculo",
      "Verifique: nivel de oleo, agua, calibracao de pneus, abastecimento",
      "Registre avarias encontradas e observacoes",
      "A inspecao fica vinculada ao historico do veiculo",
    ],
    roles: ["admin", "frota"],
  },
  {
    icon: CalendarDays,
    title: "Agendamentos",
    description: "Reserve veiculos com antecedencia e receba lembretes.",
    steps: [
      "Acesse 'Agendamentos' no menu",
      "Clique em 'Novo Agendamento'",
      "Selecione: Veiculo, Motorista, Data inicio e fim, Motivo",
      "Salve a reserva",
      "Lembretes automaticos sao enviados na vespera e no dia",
    ],
    roles: ["admin", "frota", "motorista"],
  },
  {
    icon: MapPin,
    title: "Rastreamento em Tempo Real",
    description: "Acompanhe motoristas no mapa com trajeto percorrido.",
    steps: [
      "Pre-requisito: Ative o rastreamento em Configuracoes > Empresa",
      "Acesse 'Rastreamento' no menu",
      "Veja todos os motoristas em rota no mapa via satelite",
      "O trajeto percorrido aparece como linha tracejada azul",
      "Use o filtro para selecionar um motorista especifico",
      "Os dados atualizam em tempo real automaticamente",
    ],
    roles: ["admin", "frota"],
  },
  {
    icon: BarChart3,
    title: "Relatorios",
    description: "Dados completos da frota com exportacao CSV.",
    steps: [
      "Acesse 'Relatorios' no menu",
      "Selecione o periodo desejado",
      "Visualize: Km rodado, Gastos combustivel, Consumo medio",
      "Veja avarias por veiculo/motorista com custos",
      "Exporte os dados filtrados em CSV",
      "Gere o fechamento mensal em PDF",
    ],
    roles: ["admin", "frota"],
  },
  {
    icon: Settings,
    title: "Configuracoes",
    description: "Gerencie usuarios, motivos de uso e parametros do sistema.",
    steps: [
      "Acesse 'Configuracoes' no menu (apenas Admin)",
      "Configure o intervalo km padrao para revisao",
      "Gerencie os motivos de uso padrao (adicionar/remover)",
      "Cadastre o WhatsApp do admin para notificacoes",
      "Ative ou desative o rastreamento",
      "Gerencie usuarios: ativar, editar perfil, alterar funcao, desativar",
    ],
    roles: ["admin"],
  },
  {
    icon: Users,
    title: "Perfis de Acesso",
    description: "Entenda os diferentes niveis de acesso do sistema.",
    steps: [
      "Super Admin: Cria e gerencia todas as empresas do sistema",
      "Admin: Gestao completa de uma empresa (veiculos, usuarios, configuracoes)",
      "Frota: Gestao operacional (checkouts, abastecimentos, manutencoes)",
      "Motorista: Apenas seus proprios checkouts, agendamentos e multas",
      "Todo novo cadastro fica inativo ate ativacao manual pelo Admin",
    ],
    roles: ["admin", "frota", "motorista"],
  },
];

const GuidePage: React.FC = () => {
  const { role } = useAuth();
  const userRole = role || "motorista";

  const visibleSections = sections.filter((s) => s.roles.includes(userRole));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Guia do Sistema
          </h1>
          <p className="text-sm text-muted-foreground">
            Aprenda a usar cada funcionalidade do SmartFrota
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={generateGuidePdf} className="gap-2">
          <FileDown className="w-4 h-4" />
          Baixar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleSections.map((section) => (
          <Card key={section.title} className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span>{section.title}</span>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">
                    {section.description}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="space-y-1.5">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GuidePage;

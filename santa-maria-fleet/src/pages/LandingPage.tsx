import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, ClipboardCheck, Fuel, Shield, Wrench, CalendarCheck, MapPin, FileWarning, BarChart3, MessageSquare, FileDown } from "lucide-react";
import { generateGuidePdf } from "@/utils/guidePdf";

const features = [
  { icon: Car, title: "Controle de Veículos", desc: "Gerencie toda a frota com status em tempo real, histórico completo e alertas de revisão" },
  { icon: ClipboardCheck, title: "Checkout Inteligente", desc: "Retirada e devolução com foto do hodômetro, assinatura digital e validação de km" },
  { icon: MapPin, title: "Rastreamento em Tempo Real", desc: "Acompanhe a localização dos motoristas no mapa com trajeto percorrido e filtro por motorista" },
  { icon: FileWarning, title: "Multas Automatizadas", desc: "Identificação automática do motorista responsável cruzando horário da infração com checkouts" },
  { icon: Fuel, title: "Abastecimentos", desc: "Controle de combustível com comprovantes, consumo médio e relatórios por veículo" },
  { icon: Wrench, title: "Manutenções", desc: "Agendamento, histórico de serviços e alertas automáticos por quilometragem" },
  { icon: Shield, title: "Avarias e Ocorrências", desc: "Registro com fotos, gravidade, custo e timeline de atualizações" },
  { icon: CalendarCheck, title: "Agendamentos", desc: "Reserve veículos com antecedência e receba lembretes automáticos" },
  { icon: BarChart3, title: "Relatórios Completos", desc: "Km rodado, gastos, consumo médio e exportação CSV por período" },
  { icon: MessageSquare, title: "Notificações WhatsApp", desc: "Resumo automático de devoluções e multas enviado direto no WhatsApp do admin" },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <img src="/logo-smartfrota.png" alt="SmartFrota" className="h-12 w-auto" />
            <span className="text-xl font-bold">SmartFrota</span>
          </div>
          <Button onClick={() => navigate("/login")}>Entrar</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Gestão <span className="text-primary">inteligente</span> de frotas
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Controle veículos, motoristas, abastecimentos e manutenções em uma única plataforma. 
          Multi-empresa com isolamento total de dados.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={() => navigate("/login")}>
            Acessar Plataforma
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
              Fale Conosco
            </a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground space-y-3">
        <Button variant="ghost" size="sm" onClick={generateGuidePdf} className="gap-2">
          <FileDown className="w-4 h-4" />
          Baixar Guia do Sistema (PDF)
        </Button>
        <p>© {new Date().getFullYear()} SmartFrota — Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

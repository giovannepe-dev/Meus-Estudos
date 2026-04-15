import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import FloatingLeaves from "@/components/FloatingLeaves";
import {
  BarChart3, Target, FileText, Shield, Brain, Gauge, Leaf, ArrowRight,
  CheckCircle, TrendingUp, Eye, Users, TreePine
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { icon: BarChart3, title: "Monitoramento ESG", desc: "Acompanhe indicadores ambientais, sociais e de governança em um único painel." },
  { icon: Gauge, title: "Dashboard Inteligente", desc: "Visualize métricas ESG com gráficos e indicadores em tempo real." },
  { icon: Target, title: "Gestão de Metas", desc: "Defina metas sustentáveis e acompanhe o progresso." },
  { icon: FileText, title: "Gestão de Evidências", desc: "Anexe documentos e evidências para auditorias ESG." },
  { icon: Shield, title: "Relatórios Automáticos", desc: "Gere relatórios prontos para auditorias e investidores." },
  { icon: TrendingUp, title: "Score ESG Automático", desc: "O sistema calcula automaticamente o desempenho ESG da empresa." },
  { icon: Brain, title: "Assistente ESG com IA", desc: "Receba recomendações inteligentes baseadas nos dados da empresa." },
];

const steps = [
  { num: "01", title: "Cadastrar empresa", desc: "Crie sua conta e configure os dados da empresa." },
  { num: "02", title: "Adicionar indicadores ESG", desc: "Insira os indicadores ambientais, sociais e de governança." },
  { num: "03", title: "Monitorar e gerar relatórios", desc: "Acompanhe o progresso e exporte relatórios." },
];

const benefits = [
  "Centralização de dados ESG",
  "Melhor tomada de decisão",
  "Preparação para auditorias",
  "Transparência corporativa",
  "Sustentabilidade mensurável",
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingLeaves />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Leaf className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">ESG FLOW</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
          <a href="#beneficios" className="hover:text-foreground transition-colors">Benefícios</a>
        </nav>
        <Link to="/login">
          <Button variant="outline" size="sm">Entrar</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-28 max-w-4xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <TreePine className="h-4 w-4" /> Plataforma ESG
          </div>
        </motion.div>
        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-gradient-esg">
          ESG FLOW
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
          Gestão inteligente de indicadores ESG para empresas sustentáveis.
        </motion.p>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
          <Link to="/login">
            <Button size="lg" className="gap-2 text-base px-8">Começar agora <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="gap-2 text-base px-8"><Eye className="h-4 w-4" /> Ver demonstração</Button>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Funcionalidades</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Tudo que você precisa para gerenciar seus indicadores ESG.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <Card className="h-full hover:shadow-lg transition-shadow border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="relative z-10 px-6 py-20 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Como funciona</h2>
            <p className="text-muted-foreground">Simples, rápido e eficiente.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center">
                <div className="text-5xl font-extrabold text-primary/20 mb-2">{s.num}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Benefícios</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div key={b} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50">
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
              <span className="font-medium text-sm">{b}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary to-esg-green-dark rounded-2xl p-12 text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Comece a transformar sua gestão ESG hoje.</h2>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="text-base px-8 mt-4">Criar conta gratuita</Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-semibold">ESG FLOW</span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Sobre</a>
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
            <a href="#" className="hover:text-foreground transition-colors">Política de privacidade</a>
          </nav>
          <p className="text-xs text-muted-foreground">© ESG FLOW</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

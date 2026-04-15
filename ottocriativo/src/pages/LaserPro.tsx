import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, Zap, Shield, BarChart3, ArrowRight, Layers, Smartphone } from "lucide-react";
import laserproLogo from "@/assets/laserpro-logo.png";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Store,
    title: "Sua Vitrine Digital",
    description: "Crie seu catálogo online profissional em minutos, sem precisar de conhecimento técnico.",
  },
  {
    icon: Smartphone,
    title: "100% Responsivo",
    description: "Seu catálogo funciona perfeitamente em celulares, tablets e computadores.",
  },
  {
    icon: Layers,
    title: "Multi-Categorias",
    description: "Organize seus produtos em categorias ilimitadas com imagens e descrições.",
  },
  {
    icon: Zap,
    title: "WhatsApp Integrado",
    description: "Seus clientes pedem orçamento direto pelo WhatsApp com um clique.",
  },
  {
    icon: Shield,
    title: "Domínio Próprio",
    description: "Use seu próprio domínio ou nosso link exclusivo para compartilhar.",
  },
  {
    icon: BarChart3,
    title: "Painel Administrativo",
    description: "Gerencie produtos, categorias, pedidos e personalize tudo pelo painel.",
  },
];

const steps = [
  { number: "01", title: "Crie sua conta", description: "Cadastre-se com e-mail e senha em segundos." },
  { number: "02", title: "Monte sua loja", description: "Preencha os dados da empresa e personalize." },
  { number: "03", title: "Publique e venda", description: "Após aprovação, compartilhe e receba pedidos." },
];

const LaserPro = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img src={laserproLogo} alt="LaserPro" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <Link to="/admin/login">
              <Button variant="ghost" size="sm" className="rounded-full">
                Entrar
              </Button>
            </Link>
            <Link to="/criar-loja">
              <Button size="sm" className="rounded-full">
                Criar Loja Grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="container mx-auto px-4 py-24 md:py-36 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              🚀 Catálogo digital para empresas
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Seu catálogo online{" "}
              <span className="text-primary">profissional</span> em minutos
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Crie sua vitrine digital, organize produtos por categoria, receba pedidos pelo WhatsApp e gerencie tudo pelo painel administrativo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/criar-loja">
                <Button size="lg" className="rounded-full text-base px-8 gap-2">
                  Criar Minha Loja <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#como-funciona">
                <Button variant="outline" size="lg" className="rounded-full text-base px-8">
                  Como funciona?
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Tudo que você precisa
            </h2>
            <p className="text-muted-foreground text-lg">
              Ferramentas completas para vender mais online.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Como funciona?
            </h2>
            <p className="text-muted-foreground text-lg">
              Três passos simples para começar.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="text-center"
              >
                <span className="font-display text-5xl font-extrabold text-primary/20">{s.number}</span>
                <h3 className="font-display font-bold text-xl mt-2 mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Crie sua loja agora mesmo e comece a receber pedidos pelo WhatsApp.
          </p>
          <Link to="/criar-loja">
            <Button size="lg" variant="secondary" className="rounded-full text-base px-8 gap-2">
              Criar Minha Loja Grátis <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LaserPro. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default LaserPro;

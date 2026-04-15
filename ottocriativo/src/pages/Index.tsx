import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Instagram, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import defaultHeroBg from "@/assets/hero-bg.jpg";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCategories } from "@/hooks/useCategories";
import { useHomeCarousels } from "@/hooks/useHomeCarousels";
import { HomeCarouselSection } from "@/components/HomeCarouselSection";
import { useTenant } from "@/contexts/TenantContext";

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: settings } = useSiteSettings();
  const { data: categories } = useCategories();
  const { data: carousels } = useHomeCarousels();
  const { tenant } = useTenant();

  // Tenant-aware values
  const logoSrc = tenant?.logo_url ?? null;
  const siteName = settings?.nome_site ?? tenant?.nome ?? "LaserPro";
  const slogan = settings?.slogan ?? "Seu catálogo digital profissional";
  const heroBg = settings?.hero_bg_url || defaultHeroBg;
  const basePath = tenant ? `/loja/${tenant.slug}` : "";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-background/80" />
        <div className="relative container mx-auto px-6 md:px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            {logoSrc && (
              <img src={logoSrc} alt={siteName} className="h-24 md:h-36 mx-auto mb-6 drop-shadow-lg" />
            )}
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 drop-shadow-sm">
              {siteName}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 px-2 drop-shadow-sm">
              {slogan}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row justify-center px-2">
              <Button asChild size="lg" className="rounded-full px-8 font-display font-semibold shadow-lg">
                <Link to={`${basePath}/catalogo`}>
                  Ver Catálogo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {settings?.whatsapp && (
                <Button asChild size="lg" className="rounded-full px-8 font-display bg-[#25D366] hover:bg-[#1da851] text-white border-none shadow-lg">
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
                  </a>
                </Button>
              )}
              {settings?.instagram && (
                <Button asChild size="lg" className="rounded-full px-8 font-display bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] hover:opacity-90 text-white border-none shadow-lg">
                  <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer">
                    <Instagram className="mr-2 h-4 w-4" /> Instagram
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dynamic Carousels */}
      {carousels?.map((carousel) => (
        <HomeCarouselSection key={carousel.id} carousel={carousel} />
      ))}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto px-1 md:px-4 py-10 md:py-12">
          <h2 className="font-display text-xl md:text-2xl font-bold mb-4 text-center">Categorias</h2>
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos ou categorias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) navigate(`${basePath}/catalogo?q=${encodeURIComponent(search.trim())}`); }}
              className="pl-10 rounded-full bg-card"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`${basePath}/categoria/${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border hover:shadow-md hover:border-primary/20 transition-all text-center group"
                >
                  <span className="text-3xl">{cat.emoji || "📁"}</span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{cat.nome}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Building, Database, Target, FileCheck, CheckCircle2,
  ChevronRight, Sparkles, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: typeof Building;
  route: string;
  completed: boolean;
}

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkProgress();
  }, [companyId]);

  const checkProgress = async () => {
    const hasCompany = !!companyId;
    let hasIndicators = false;
    let hasValues = false;
    let hasGoals = false;
    let hasEvidences = false;

    if (companyId) {
      const [indRes, valRes, goalRes, evRes] = await Promise.all([
        supabase.from("indicators").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("indicator_values").select("id", { count: "exact", head: true }),
        supabase.from("goals").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("evidences").select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ]);
      hasIndicators = (indRes.count ?? 0) > 0;
      hasValues = (valRes.count ?? 0) > 0;
      hasGoals = (goalRes.count ?? 0) > 0;
      hasEvidences = (evRes.count ?? 0) > 0;
    }

    setSteps([
      {
        id: "empresa",
        title: "Cadastrar Empresa",
        description: "Preencha nome, CNPJ, setor e porte",
        icon: Building,
        route: "/dashboard/configuracoes",
        completed: hasCompany,
      },
      {
        id: "indicadores",
        title: "Criar Indicadores",
        description: "Cadastre indicadores ESG (ambiental, social, governança)",
        icon: Database,
        route: "/dashboard/dados",
        completed: hasIndicators,
      },
      {
        id: "valores",
        title: "Registrar Valores",
        description: "Informe os valores mensais dos indicadores",
        icon: Database,
        route: "/dashboard/dados",
        completed: hasValues,
      },
      {
        id: "metas",
        title: "Definir Metas",
        description: "Crie metas com prazo e responsável",
        icon: Target,
        route: "/dashboard/metas",
        completed: hasGoals,
      },
      {
        id: "evidencias",
        title: "Anexar Evidências",
        description: "Registre documentos para auditorias",
        icon: FileCheck,
        route: "/dashboard/evidencias",
        completed: hasEvidences,
      },
    ]);
    setLoading(false);
  };

  if (loading) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find((s) => !s.completed);

  if (allComplete || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Bem-vindo ao ESG Flow!</h3>
                <p className="text-xs text-muted-foreground">Siga os passos abaixo para configurar tudo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs font-medium">
                {completedCount}/{steps.length} concluídos
              </Badge>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setDismissed(true)}>
                Fechar
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-secondary mb-5">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <button
                  onClick={() => navigate(step.route)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    step.completed
                      ? "bg-primary/5 opacity-70"
                      : step.id === nextStep?.id
                      ? "bg-primary/10 ring-1 ring-primary/30 shadow-sm"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    step.completed ? "bg-primary/20" : "bg-secondary"
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <step.icon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                      {i + 1}. {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                  </div>
                  {!step.completed && step.id === nextStep?.id && (
                    <Badge className="shrink-0 text-xs gap-1">
                      Próximo <ArrowRight className="h-3 w-3" />
                    </Badge>
                  )}
                  {!step.completed && step.id !== nextStep?.id && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OnboardingWizard;

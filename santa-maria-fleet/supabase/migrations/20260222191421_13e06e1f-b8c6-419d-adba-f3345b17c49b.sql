
-- Create inspections table for weekly vehicle inspections
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id),
  inspecionado_por_user_id UUID NOT NULL,
  data_inspecao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  calibracao_pneus TEXT NOT NULL DEFAULT 'ok',
  nivel_agua TEXT NOT NULL DEFAULT 'ok',
  nivel_oleo TEXT NOT NULL DEFAULT 'ok',
  abastecido BOOLEAN NOT NULL DEFAULT false,
  km_inspecao NUMERIC DEFAULT 0,
  avarias_encontradas TEXT DEFAULT NULL,
  observacoes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and frota can manage inspections"
ON public.inspections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'frota'::app_role));

CREATE POLICY "Authenticated can view inspections"
ON public.inspections FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_inspections_updated_at
BEFORE UPDATE ON public.inspections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Create km_divergences table
CREATE TABLE public.km_divergences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id),
  checkout_id UUID NOT NULL REFERENCES public.checkouts(id),
  motorista_id UUID NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  km_esperado NUMERIC NOT NULL,
  km_informado NUMERIC NOT NULL,
  km_divergente NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'justificado', 'resolvido')),
  justificativa TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.km_divergences ENABLE ROW LEVEL SECURITY;

-- Admin and frota can view all
CREATE POLICY "Admin and frota can view km_divergences"
ON public.km_divergences FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'frota'::app_role));

-- Motorista can view own
CREATE POLICY "Motorista can view own km_divergences"
ON public.km_divergences FOR SELECT
USING (auth.uid() = motorista_id);

-- Authenticated can insert
CREATE POLICY "Authenticated can insert km_divergences"
ON public.km_divergences FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admin and frota can update (for status/justificativa)
CREATE POLICY "Admin and frota can update km_divergences"
ON public.km_divergences FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'frota'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_km_divergences_updated_at
BEFORE UPDATE ON public.km_divergences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add km_divergente flag to checkouts
ALTER TABLE public.checkouts ADD COLUMN IF NOT EXISTS km_divergente BOOLEAN NOT NULL DEFAULT false;

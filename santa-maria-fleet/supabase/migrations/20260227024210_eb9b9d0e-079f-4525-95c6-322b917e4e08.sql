
-- Tabela de multas de trânsito
CREATE TABLE public.traffic_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id),
  motorista_id UUID, -- auto-detectado via checkout
  data_infracao TIMESTAMP WITH TIME ZONE NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  numero_auto TEXT,
  descricao TEXT NOT NULL,
  pontos INTEGER DEFAULT 0,
  local_infracao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  comprovante_foto TEXT,
  observacoes TEXT,
  registrado_por_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.traffic_tickets ENABLE ROW LEVEL SECURITY;

-- Admin e frota podem gerenciar
CREATE POLICY "Admin and frota can manage traffic_tickets"
  ON public.traffic_tickets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'frota'::app_role));

-- Motoristas podem ver suas próprias multas
CREATE POLICY "Motoristas can view own traffic_tickets"
  ON public.traffic_tickets FOR SELECT
  USING (auth.uid() = motorista_id);

-- Trigger para updated_at
CREATE TRIGGER update_traffic_tickets_updated_at
  BEFORE UPDATE ON public.traffic_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

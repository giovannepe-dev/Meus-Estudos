
-- Create vehicle bookings table
CREATE TABLE public.vehicle_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  veiculo_id UUID NOT NULL REFERENCES public.vehicles(id),
  motorista_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  destino TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'concluido')),
  notificado_vespera BOOLEAN NOT NULL DEFAULT false,
  notificado_dia BOOLEAN NOT NULL DEFAULT false,
  ciente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin and frota can manage bookings"
ON public.vehicle_bookings FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'frota'));

CREATE POLICY "Authenticated can create bookings"
ON public.vehicle_bookings FOR INSERT
WITH CHECK (auth.uid() = motorista_id);

CREATE POLICY "Users can view own bookings"
ON public.vehicle_bookings FOR SELECT
USING (auth.uid() = motorista_id);

CREATE POLICY "Users can update own bookings"
ON public.vehicle_bookings FOR UPDATE
USING (auth.uid() = motorista_id);

-- Trigger for updated_at
CREATE TRIGGER update_vehicle_bookings_updated_at
BEFORE UPDATE ON public.vehicle_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_bookings;


-- Add tracking toggle to settings
ALTER TABLE public.settings ADD COLUMN rastreamento_ativo boolean NOT NULL DEFAULT false;

-- Table for driver locations during active checkouts
CREATE TABLE public.driver_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_id uuid NOT NULL REFERENCES public.checkouts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  motorista_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_driver_locations_checkout ON public.driver_locations(checkout_id);
CREATE INDEX idx_driver_locations_company ON public.driver_locations(company_id);
CREATE INDEX idx_driver_locations_recorded ON public.driver_locations(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can insert their own location
CREATE POLICY "driver_insert_location" ON public.driver_locations
  FOR INSERT WITH CHECK (auth.uid() = motorista_id);

-- Drivers can view their own locations
CREATE POLICY "driver_view_own_location" ON public.driver_locations
  FOR SELECT USING (auth.uid() = motorista_id AND company_id = get_user_company_id(auth.uid()));

-- Admin/frota can view all company locations
CREATE POLICY "co_admin_view_locations" ON public.driver_locations
  FOR SELECT USING (
    company_id = get_user_company_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'frota'::app_role))
  );

-- Super admin full access
CREATE POLICY "sa_locations" ON public.driver_locations
  FOR ALL USING (is_super_admin(auth.uid()));

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

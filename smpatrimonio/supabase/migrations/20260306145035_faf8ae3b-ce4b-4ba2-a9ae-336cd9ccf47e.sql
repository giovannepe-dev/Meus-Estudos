
CREATE TABLE public.kit_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.kits(id) ON DELETE CASCADE,
  sala_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  tombo text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(kit_id, sala_id),
  UNIQUE(tombo)
);

ALTER TABLE public.kit_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Patrimonio can manage kit locations" ON public.kit_locations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));

CREATE POLICY "Authenticated can view kit locations" ON public.kit_locations
  FOR SELECT USING (true);

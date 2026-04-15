
-- Table for kits
CREATE TABLE public.kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tombo text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  sala_id uuid REFERENCES public.rooms(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Junction table for kit items
CREATE TABLE public.kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.kits(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(kit_id, item_id)
);

-- Enable RLS
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for kits
CREATE POLICY "Admin/Patrimonio can manage kits" ON public.kits
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));

CREATE POLICY "Authenticated can view kits" ON public.kits
  FOR SELECT TO authenticated
  USING (true);

-- RLS policies for kit_items
CREATE POLICY "Admin/Patrimonio can manage kit items" ON public.kit_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'patrimonio'::app_role));

CREATE POLICY "Authenticated can view kit items" ON public.kit_items
  FOR SELECT TO authenticated
  USING (true);

-- Trigger for updated_at on kits
CREATE TRIGGER update_kits_updated_at
  BEFORE UPDATE ON public.kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.home_carousels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  emoji text DEFAULT '📦',
  tipo text NOT NULL DEFAULT 'categoria',
  categoria_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.home_carousels.tipo IS 'novidades, destaques, categoria';

ALTER TABLE public.home_carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active home carousels"
  ON public.home_carousels FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage home carousels"
  ON public.home_carousels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

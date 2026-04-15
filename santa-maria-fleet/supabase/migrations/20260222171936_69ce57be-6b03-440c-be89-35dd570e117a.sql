
CREATE TABLE public.monthly_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia text NOT NULL,
  gerado_por_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage monthly_closings" ON public.monthly_closings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view monthly_closings" ON public.monthly_closings
FOR SELECT USING (auth.uid() IS NOT NULL);

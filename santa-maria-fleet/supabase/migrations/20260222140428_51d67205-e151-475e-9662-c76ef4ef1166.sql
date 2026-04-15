CREATE POLICY "Admin and frota can delete km_divergences"
ON public.km_divergences
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'frota'::app_role));
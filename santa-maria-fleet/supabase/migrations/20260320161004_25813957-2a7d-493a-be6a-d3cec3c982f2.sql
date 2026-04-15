CREATE POLICY "co_delete_checkouts" ON public.checkouts FOR DELETE TO authenticated USING (
  (company_id = get_user_company_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'frota'::app_role))
);
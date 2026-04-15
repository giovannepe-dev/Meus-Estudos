
CREATE POLICY "co_admin_update_company"
ON public.companies
FOR UPDATE
USING (
  id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

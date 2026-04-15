
-- 1. Create trigger to auto-assign admin role when a tenant is created with an owner
CREATE OR REPLACE FUNCTION public.assign_admin_on_tenant_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_admin_on_tenant_create
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_on_tenant_create();

-- 2. Fix tenants RLS: allow super_admin to manage tenants too
DROP POLICY IF EXISTS "Admins can manage tenants" ON public.tenants;
CREATE POLICY "Admins can manage tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

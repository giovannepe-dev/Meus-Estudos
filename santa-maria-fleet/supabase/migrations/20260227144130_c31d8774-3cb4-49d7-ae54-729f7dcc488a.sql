
CREATE OR REPLACE FUNCTION public.auto_create_company_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.settings (company_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_settings
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_company_settings();

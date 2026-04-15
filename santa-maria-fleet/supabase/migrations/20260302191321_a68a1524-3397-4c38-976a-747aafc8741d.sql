-- Add column to track if company was ever activated
ALTER TABLE public.companies ADD COLUMN ja_ativada boolean NOT NULL DEFAULT false;

-- Mark existing active companies as already activated
UPDATE public.companies SET ja_ativada = true WHERE ativo = true;

-- Create trigger to auto-set ja_ativada when company is activated
CREATE OR REPLACE FUNCTION public.mark_company_activated()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ativo = true AND OLD.ativo = false THEN
    NEW.ja_ativada := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_company_activated
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.mark_company_activated();
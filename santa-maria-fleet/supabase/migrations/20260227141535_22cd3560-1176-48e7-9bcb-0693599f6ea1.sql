
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _company_id uuid;
  _empresa_slug text;
  _role app_role;
BEGIN
  _empresa_slug := NEW.raw_user_meta_data->>'empresa_slug';
  
  IF _empresa_slug IS NOT NULL AND _empresa_slug != '' THEN
    SELECT id INTO _company_id FROM public.companies WHERE slug = _empresa_slug AND ativo = true;
    IF _company_id IS NULL THEN
      RAISE EXCEPTION 'Empresa não encontrada ou inativa';
    END IF;
  ELSE
    INSERT INTO public.companies (nome, slug)
    VALUES (
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'empresa_nome', ''), 'Empresa de ' || COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email)),
      LOWER(REPLACE(NEW.id::text, '-', ''))
    )
    RETURNING id INTO _company_id;
  END IF;

  INSERT INTO public.profiles (user_id, nome, email, setor, telefone, ativo, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'setor',
    NEW.raw_user_meta_data->>'telefone',
    false,
    _company_id
  );
  
  -- First user of a company becomes admin, others become motorista
  IF NOT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.user_id = ur.user_id WHERE p.company_id = _company_id AND ur.role = 'admin') THEN
    _role := 'admin';
  ELSE
    _role := 'motorista';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;

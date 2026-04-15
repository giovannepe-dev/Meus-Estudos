
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, setor, telefone, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'setor',
    NEW.raw_user_meta_data->>'telefone',
    false
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'motorista');
  
  RETURN NEW;
END;
$function$;

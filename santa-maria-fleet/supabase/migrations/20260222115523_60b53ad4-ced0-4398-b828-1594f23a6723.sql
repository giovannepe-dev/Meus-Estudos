
-- Update handle_new_user to set ativo=false (pending approval) and auto-assign motorista role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, ativo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email, false);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'motorista');
  
  RETURN NEW;
END;
$$;

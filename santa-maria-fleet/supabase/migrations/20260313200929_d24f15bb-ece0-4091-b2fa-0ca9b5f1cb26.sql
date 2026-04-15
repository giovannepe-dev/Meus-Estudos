
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_checkout(
  _vehicle_id uuid,
  _new_status vehicle_status,
  _km numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify the vehicle belongs to the user's company
  IF NOT EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE id = _vehicle_id
      AND company_id = get_user_company_id(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Vehicle not found or access denied';
  END IF;

  IF _km IS NOT NULL THEN
    UPDATE public.vehicles
    SET status = _new_status,
        km_atual = GREATEST(_km, km_atual),
        updated_at = now()
    WHERE id = _vehicle_id;
  ELSE
    UPDATE public.vehicles
    SET status = _new_status,
        updated_at = now()
    WHERE id = _vehicle_id;
  END IF;
END;
$$;

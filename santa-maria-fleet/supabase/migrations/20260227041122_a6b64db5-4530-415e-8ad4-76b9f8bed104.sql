-- Create a function that prevents overlapping bookings for the same vehicle
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.vehicle_bookings
    WHERE veiculo_id = NEW.veiculo_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND status IN ('agendado', 'confirmado')
      AND data_inicio < NEW.data_fim
      AND data_fim > NEW.data_inicio
  ) THEN
    RAISE EXCEPTION 'Já existe um agendamento para este veículo neste período';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for insert and update
CREATE TRIGGER check_booking_overlap_trigger
  BEFORE INSERT OR UPDATE ON public.vehicle_bookings
  FOR EACH ROW
  WHEN (NEW.status IN ('agendado', 'confirmado'))
  EXECUTE FUNCTION public.check_booking_overlap();
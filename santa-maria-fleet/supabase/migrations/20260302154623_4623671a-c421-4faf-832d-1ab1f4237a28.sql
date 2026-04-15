
-- Create BEFORE INSERT triggers to auto-set company_id from the user's profile
-- This uses the existing auto_set_company_id() function

CREATE TRIGGER set_company_id_checkouts
  BEFORE INSERT ON public.checkouts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_fuel_records
  BEFORE INSERT ON public.fuel_records
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_incidents
  BEFORE INSERT ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_inspections
  BEFORE INSERT ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_maintenance
  BEFORE INSERT ON public.maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_monthly_closings
  BEFORE INSERT ON public.monthly_closings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_traffic_tickets
  BEFORE INSERT ON public.traffic_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_vehicle_bookings
  BEFORE INSERT ON public.vehicle_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_km_divergences
  BEFORE INSERT ON public.km_divergences
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();

CREATE TRIGGER set_company_id_driver_locations
  BEFORE INSERT ON public.driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_company_id();


-- Fix INSERT policies to be more restrictive

-- Checkouts: ensure motorista_id or criado_por matches auth.uid()
DROP POLICY "Authenticated can create checkouts" ON public.checkouts;
CREATE POLICY "Authenticated can create checkouts" ON public.checkouts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = criado_por_user_id);

-- Fuel records: ensure registrado_por matches auth.uid()
DROP POLICY "Authenticated can create fuel records" ON public.fuel_records;
CREATE POLICY "Authenticated can create fuel records" ON public.fuel_records FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = registrado_por_user_id);

-- Incidents: ensure registrado_por matches auth.uid()
DROP POLICY "Create incidents" ON public.incidents;
CREATE POLICY "Create incidents" ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = registrado_por_user_id);

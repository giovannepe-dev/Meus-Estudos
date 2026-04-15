-- Drop existing booking policies
DROP POLICY IF EXISTS "Admin and frota can manage bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Authenticated can create bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.vehicle_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.vehicle_bookings;

-- Everyone authenticated can view all bookings
CREATE POLICY "Authenticated can view all bookings"
ON public.vehicle_bookings FOR SELECT
TO authenticated
USING (true);

-- Anyone authenticated can create their own bookings
CREATE POLICY "Users can create own bookings"
ON public.vehicle_bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = motorista_id);

-- Only the motorista who created the booking (or admin) can update
CREATE POLICY "Owner or admin can update bookings"
ON public.vehicle_bookings FOR UPDATE
TO authenticated
USING (auth.uid() = motorista_id OR has_role(auth.uid(), 'admin'::app_role));

-- Only the motorista who created the booking (or admin) can delete
CREATE POLICY "Owner or admin can delete bookings"
ON public.vehicle_bookings FOR DELETE
TO authenticated
USING (auth.uid() = motorista_id OR has_role(auth.uid(), 'admin'::app_role));
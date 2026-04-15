
-- Fix: Replace overly permissive INSERT policy with a scoped one
DROP POLICY "System can insert notifications" ON public.notifications;

-- Only allow insert if the notification is for the inserting user OR via SECURITY DEFINER functions
CREATE POLICY "Authenticated can insert own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

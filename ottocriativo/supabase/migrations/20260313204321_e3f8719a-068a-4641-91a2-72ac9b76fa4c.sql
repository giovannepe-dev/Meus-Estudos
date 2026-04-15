
-- Only service_role can access bot state (used by edge function)
CREATE POLICY "Service role only" ON public.telegram_bot_state FOR ALL USING (false);

-- Only service_role can manage telegram messages
CREATE POLICY "Service role only" ON public.telegram_messages FOR ALL USING (false);

-- Admins can view telegram messages
CREATE POLICY "Admins can view telegram messages" ON public.telegram_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

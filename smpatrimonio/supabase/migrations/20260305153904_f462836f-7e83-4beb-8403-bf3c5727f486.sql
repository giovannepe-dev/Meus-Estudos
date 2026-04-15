
-- Fix permissive audit log insert policy
DROP POLICY "System can insert audit logs" ON public.item_audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.item_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

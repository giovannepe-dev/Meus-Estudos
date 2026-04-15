
-- Allow admins to DELETE from inventory_scans
CREATE POLICY "Admin can delete inventory scans"
ON public.inventory_scans FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to DELETE from item_audit_logs
CREATE POLICY "Admin can delete audit logs"
ON public.item_audit_logs FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to DELETE from movements
CREATE POLICY "Admin can delete movements"
ON public.movements FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to DELETE from notifications
CREATE POLICY "Admin can delete notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

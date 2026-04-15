
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'INFO',
  titulo text NOT NULL,
  mensagem text,
  lida boolean NOT NULL DEFAULT false,
  referencia_id uuid,
  referencia_tipo text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- System can insert notifications (via trigger/function)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notifications for all users with relevant roles when a movement is created
CREATE OR REPLACE FUNCTION public.notify_on_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _item_name text;
  _tombo text;
  _user_record record;
BEGIN
  SELECT nome_item, tombo INTO _item_name, _tombo FROM public.items WHERE id = NEW.item_id;
  
  FOR _user_record IN 
    SELECT DISTINCT ur.user_id FROM public.user_roles ur 
    WHERE ur.role IN ('admin', 'patrimonio')
  LOOP
    INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, referencia_id, referencia_tipo)
    VALUES (
      _user_record.user_id, 
      'MOVIMENTACAO', 
      'Nova movimentação registrada',
      'Item [' || _tombo || '] ' || _item_name || ' foi movimentado.',
      NEW.id,
      'movement'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger on movements insert
CREATE TRIGGER on_movement_created
AFTER INSERT ON public.movements
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_movement();

-- Function to check and notify overdue maintenances (can be called periodically)
CREATE OR REPLACE FUNCTION public.notify_overdue_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _maintenance record;
  _user_record record;
BEGIN
  FOR _maintenance IN
    SELECT m.id, m.item_id, m.proxima_manutencao_data, i.nome_item, i.tombo
    FROM public.maintenances m
    JOIN public.items i ON i.id = m.item_id
    WHERE m.proxima_manutencao_data <= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.referencia_id = m.id 
      AND n.referencia_tipo = 'maintenance_overdue'
      AND n.created_at > (CURRENT_DATE - INTERVAL '1 day')
    )
  LOOP
    FOR _user_record IN 
      SELECT DISTINCT ur.user_id FROM public.user_roles ur 
      WHERE ur.role IN ('admin', 'patrimonio')
    LOOP
      INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, referencia_id, referencia_tipo)
      VALUES (
        _user_record.user_id,
        'MANUTENCAO',
        'Manutenção vencida',
        'Item [' || _maintenance.tombo || '] ' || _maintenance.nome_item || ' tem manutenção vencida.',
        _maintenance.id,
        'maintenance_overdue'
      );
    END LOOP;
  END LOOP;
END;
$$;

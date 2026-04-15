
-- Add new columns to km_divergences for enhanced KM validation
ALTER TABLE public.km_divergences
  ADD COLUMN IF NOT EXISTS severidade text NOT NULL DEFAULT 'alerta',
  ADD COLUMN IF NOT EXISTS motivo text,
  ADD COLUMN IF NOT EXISTS foto_odometro text,
  ADD COLUMN IF NOT EXISTS km_ocr numeric,
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS geolocation text,
  ADD COLUMN IF NOT EXISTS image_hash text;

-- Update status column default to match new flow
ALTER TABLE public.km_divergences ALTER COLUMN status SET DEFAULT 'pendente';

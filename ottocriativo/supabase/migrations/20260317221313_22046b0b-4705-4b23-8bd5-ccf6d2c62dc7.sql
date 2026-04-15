
-- Add subscription fields to tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS subscription_start_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS subscription_due_date timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_grace_until timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_blocked_at timestamptz;

-- Add super_admin to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

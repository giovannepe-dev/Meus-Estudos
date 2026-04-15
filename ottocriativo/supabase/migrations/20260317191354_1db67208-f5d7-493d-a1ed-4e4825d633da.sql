
-- Add fiscal/identity fields to tenants
ALTER TABLE public.tenants ADD COLUMN tipo_pessoa text NOT NULL DEFAULT 'fisica';
ALTER TABLE public.tenants ADD COLUMN documento text;
ALTER TABLE public.tenants ADD COLUMN nome_responsavel text;

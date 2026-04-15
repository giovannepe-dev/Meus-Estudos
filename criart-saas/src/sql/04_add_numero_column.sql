-- Migration: Add sequential numero column to products
-- Purpose: Track product sequence numbers (001, 002, 003...) from Telegram bot

-- Add column to global_products
ALTER TABLE global_products
ADD COLUMN IF NOT EXISTS numero INTEGER UNIQUE;

-- Add column to tenant_products
ALTER TABLE tenant_products
ADD COLUMN IF NOT EXISTS numero INTEGER UNIQUE;

-- Create sequence for global products numbering
CREATE SEQUENCE IF NOT EXISTS global_products_numero_seq
START WITH 1
INCREMENT BY 1
MINVALUE 1;

-- Create sequence for tenant products numbering
CREATE SEQUENCE IF NOT EXISTS tenant_products_numero_seq
START WITH 1
INCREMENT BY 1
MINVALUE 1;

-- Create indexes for faster lookup by numero
CREATE INDEX IF NOT EXISTS idx_global_products_numero ON global_products(numero);
CREATE INDEX IF NOT EXISTS idx_tenant_products_numero ON tenant_products(numero);

-- Create indexes for search by nome
CREATE INDEX IF NOT EXISTS idx_global_products_nome ON global_products(nome);
CREATE INDEX IF NOT EXISTS idx_tenant_products_nome ON tenant_products(nome);

-- Add comment explaining the numero field
COMMENT ON COLUMN global_products.numero IS 'Sequential product number (001, 002, 003...) assigned by Telegram bot, used for quick reference by customers';
COMMENT ON COLUMN tenant_products.numero IS 'Sequential product number (001, 002, 003...) assigned by Telegram bot, used for quick reference by customers';

-- Add banner_style column to tenant_settings
ALTER TABLE tenant_settings
ADD COLUMN banner_style VARCHAR(50) DEFAULT 'laser'
CHECK (banner_style IN ('laser', 'pixel', 'aurora', 'gradient', 'orbs', 'static'));

-- Create index for faster lookups
CREATE INDEX idx_tenant_settings_banner_style ON tenant_settings(banner_style);

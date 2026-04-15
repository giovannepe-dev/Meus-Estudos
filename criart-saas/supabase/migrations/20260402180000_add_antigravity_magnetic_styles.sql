-- Add antigravity and magnetic banner styles
ALTER TABLE tenant_settings
DROP CONSTRAINT tenant_settings_banner_style_check;

ALTER TABLE tenant_settings
ADD CONSTRAINT tenant_settings_banner_style_check
CHECK (banner_style IN ('laser', 'pixel', 'aurora', 'gradient', 'orbs', 'antigravity', 'magnetic', 'static'));

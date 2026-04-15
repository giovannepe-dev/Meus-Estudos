
ALTER TABLE public.settings 
ADD COLUMN validacao_placa_ocr boolean NOT NULL DEFAULT true,
ADD COLUMN validacao_qrcode boolean NOT NULL DEFAULT true;

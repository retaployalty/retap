-- Migration: aggiunta campi profilo business a merchants
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS hours jsonb,
  ADD COLUMN IF NOT EXISTS annual_closures jsonb,
  ADD COLUMN IF NOT EXISTS gallery_images jsonb;

-- Facoltativo: commenti per documentazione
COMMENT ON COLUMN public.merchants.logo_url IS 'URL del logo del negozio';
COMMENT ON COLUMN public.merchants.cover_image_url IS 'URL dell''immagine di copertina del negozio';
COMMENT ON COLUMN public.merchants.phone IS 'Numero di telefono del negozio';
COMMENT ON COLUMN public.merchants.google_maps_url IS 'Link Google Maps del negozio';
COMMENT ON COLUMN public.merchants.hours IS 'Orari di apertura in formato JSON';
COMMENT ON COLUMN public.merchants.annual_closures IS 'Chiusure annuali in formato JSON';
COMMENT ON COLUMN public.merchants.gallery_images IS 'Array di URL immagini aggiuntive (galleria)'; 
-- Aggiungi valori di default per gli array di immagini
ALTER TABLE public.merchants 
  ALTER COLUMN cover_image_url SET DEFAULT '{}'::text[],
  ALTER COLUMN gallery_images SET DEFAULT '{}'::text[];

-- Aggiorna i record esistenti impostando array vuoti dove NULL
UPDATE public.merchants 
SET cover_image_url = '{}'::text[] 
WHERE cover_image_url IS NULL;

UPDATE public.merchants 
SET gallery_images = '{}'::text[] 
WHERE gallery_images IS NULL;

-- Aggiorna i commenti dei campi
COMMENT ON COLUMN public.merchants.cover_image_url IS 'Array di URL immagini di copertina del negozio';
COMMENT ON COLUMN public.merchants.gallery_images IS 'Array di URL immagini aggiuntive (galleria)'; 
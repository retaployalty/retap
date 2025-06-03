-- Migrate existing images from merchants.cover_image_url to merchant_images
INSERT INTO merchant_images (merchant_id, image_path, is_primary)
SELECT 
    id as merchant_id,
    cover_image_url[1] as image_path, -- Prendi la prima immagine come primaria
    true as is_primary
FROM merchants
WHERE cover_image_url IS NOT NULL 
AND array_length(cover_image_url, 1) > 0;

-- Aggiungi anche le altre immagini come non primarie
INSERT INTO merchant_images (merchant_id, image_path, is_primary)
SELECT 
    id as merchant_id,
    unnest(cover_image_url[2:]) as image_path, -- Prendi tutte le altre immagini
    false as is_primary
FROM merchants
WHERE cover_image_url IS NOT NULL 
AND array_length(cover_image_url, 1) > 1;

-- Aggiorna l'endpoint /merchants per usare sia le vecchie che le nuove immagini
CREATE OR REPLACE FUNCTION get_merchant_primary_image(merchant_id UUID)
RETURNS TEXT AS $$
DECLARE
    primary_image TEXT;
BEGIN
    -- Prima cerca nella nuova tabella merchant_images
    SELECT image_path INTO primary_image
    FROM merchant_images
    WHERE merchant_id = $1
    AND is_primary = true
    LIMIT 1;

    -- Se non trova nulla, usa la prima immagine da cover_image_url
    IF primary_image IS NULL THEN
        SELECT cover_image_url[1] INTO primary_image
        FROM merchants
        WHERE id = $1
        AND cover_image_url IS NOT NULL
        AND array_length(cover_image_url, 1) > 0;
    END IF;

    RETURN primary_image;
END;
$$ LANGUAGE plpgsql; 
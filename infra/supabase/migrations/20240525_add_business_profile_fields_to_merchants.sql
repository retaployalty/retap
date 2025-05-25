-- Abilita RLS sulla tabella merchants se non è già abilitata
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Policy per permettere ai merchant di aggiornare il proprio profilo
CREATE POLICY "Merchants can update their own profile"
ON public.merchants
FOR UPDATE
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Policy per permettere ai merchant di vedere il proprio profilo
CREATE POLICY "Merchants can view their own profile"
ON public.merchants
FOR SELECT
USING (auth.uid() = profile_id);

-- Policy per permettere ai merchant di inserire il proprio profilo
CREATE POLICY "Merchants can insert their own profile"
ON public.merchants
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Policy per permettere ai merchant di eliminare il proprio profilo
CREATE POLICY "Merchants can delete their own profile"
ON public.merchants
FOR DELETE
USING (auth.uid() = profile_id);

-- Storage policies per business-media
CREATE POLICY "Merchants can upload business media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Merchants can view business media"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'business-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Merchants can update business media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'business-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Merchants can delete business media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-media' AND
  auth.role() = 'authenticated'
); 
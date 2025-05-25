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
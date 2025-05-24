-- Create storage bucket for reward images
INSERT INTO storage.buckets (id, name, public)
VALUES ('rewards', 'rewards', true);

-- Create policy to allow merchants to upload their own reward images
CREATE POLICY "Merchants can upload reward images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'rewards' AND
    auth.uid() IN (
        SELECT profile_id 
        FROM public.merchants 
        WHERE id = (
            SELECT merchant_id 
            FROM public.rewards 
            WHERE image_path = name
        )
    )
);

-- Create policy to allow merchants to update their own reward images
CREATE POLICY "Merchants can update their reward images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'rewards' AND
    auth.uid() IN (
        SELECT profile_id 
        FROM public.merchants 
        WHERE id = (
            SELECT merchant_id 
            FROM public.rewards 
            WHERE image_path = name
        )
    )
);

-- Create policy to allow merchants to delete their own reward images
CREATE POLICY "Merchants can delete their reward images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'rewards' AND
    auth.uid() IN (
        SELECT profile_id 
        FROM public.merchants 
        WHERE id = (
            SELECT merchant_id 
            FROM public.rewards 
            WHERE image_path = name
        )
    )
);

-- Create policy to allow public access to reward images
CREATE POLICY "Public can view reward images"
ON storage.objects FOR SELECT
USING (bucket_id = 'rewards'); 
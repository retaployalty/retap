-- Create merchant_images table
CREATE TABLE IF NOT EXISTS merchant_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE merchant_images ENABLE ROW LEVEL SECURITY;

-- Allow merchants to manage their own images
CREATE POLICY "Merchants can manage their own images"
ON merchant_images
FOR ALL
USING (auth.uid() = merchant_id)
WITH CHECK (auth.uid() = merchant_id);

-- Allow public to view images
CREATE POLICY "Anyone can view merchant images"
ON merchant_images
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_merchant_images_merchant_id ON merchant_images(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_images_primary ON merchant_images(merchant_id, is_primary) WHERE is_primary = true; 
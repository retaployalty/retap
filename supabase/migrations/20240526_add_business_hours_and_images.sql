-- Add business hours and image fields
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Add comment to explain the JSONB structure
COMMENT ON COLUMN merchants.opening_hours IS 'JSONB object with opening hours for each day of the week. Format: {"monday": {"open": "09:00", "close": "20:00"}, ...}';

-- Add RLS policies for the new columns
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow merchants to update their own hours and image
CREATE POLICY "Merchants can update their own hours and image"
ON merchants
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy to allow public to view hours and image
CREATE POLICY "Anyone can view hours and image"
ON merchants
FOR SELECT
USING (true); 
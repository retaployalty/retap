-- Add coordinates fields to merchants table
ALTER TABLE public.merchants 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add comment for documentation
COMMENT ON COLUMN public.merchants.latitude IS 'Latitude coordinate of the merchant location';
COMMENT ON COLUMN public.merchants.longitude IS 'Longitude coordinate of the merchant location';

-- Create index for geospatial queries
CREATE INDEX idx_merchants_coordinates ON public.merchants(latitude, longitude); 
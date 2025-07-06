-- Add subscription fields to merchants table
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_status text,
ADD COLUMN IF NOT EXISTS last_payment_date timestamp with time zone;

-- Add comments
COMMENT ON COLUMN public.merchants.subscription_status IS 'Status of the subscription (active, cancelled, expired, pending)';
COMMENT ON COLUMN public.merchants.subscription_start_date IS 'Start date of the subscription';
COMMENT ON COLUMN public.merchants.subscription_end_date IS 'End date of the subscription';
COMMENT ON COLUMN public.merchants.payment_status IS 'Status of the last payment (active, failed, pending)';
COMMENT ON COLUMN public.merchants.last_payment_date IS 'Date of the last payment'; 
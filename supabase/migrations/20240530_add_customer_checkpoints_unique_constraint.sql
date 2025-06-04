-- Add unique constraint for customer_checkpoints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'customer_checkpoints_customer_merchant_offer_unique'
    ) THEN
        ALTER TABLE public.customer_checkpoints
        ADD CONSTRAINT customer_checkpoints_customer_merchant_offer_unique 
        UNIQUE (customer_id, merchant_id, offer_id);
    END IF;
END $$; 
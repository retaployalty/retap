-- Aggiungi campi per gestire le subscription speciali del merchant signup
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS activation_fee_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_first_month_special BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_month_end_date TIMESTAMP WITH TIME ZONE;

-- Aggiungi indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_merchants_subscription_dates ON merchants(subscription_start_date, subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_merchants_first_month ON merchants(is_first_month_special, first_month_end_date);

-- Aggiungi commenti per documentare i nuovi campi
COMMENT ON COLUMN merchants.subscription_start_date IS 'Start date of the subscription';
COMMENT ON COLUMN merchants.subscription_end_date IS 'End date of the subscription';
COMMENT ON COLUMN merchants.payment_status IS 'Payment status: pending, paid, failed, etc.';
COMMENT ON COLUMN merchants.activation_fee_paid IS 'Whether the activation fee has been paid';
COMMENT ON COLUMN merchants.is_first_month_special IS 'Whether this merchant has the special first month pricing';
COMMENT ON COLUMN merchants.first_month_end_date IS 'End date of the special first month period'; 
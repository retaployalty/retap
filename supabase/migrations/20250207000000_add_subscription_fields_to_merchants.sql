-- Aggiungi campi per gestire le subscription Stripe
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_failed TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Aggiungi indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_merchants_stripe_subscription_id ON merchants(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_merchants_stripe_customer_id ON merchants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_merchants_subscription_status ON merchants(subscription_status);

-- Aggiungi commenti per documentare i nuovi campi
COMMENT ON COLUMN merchants.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN merchants.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN merchants.subscription_status IS 'Subscription status: inactive, active, past_due, canceled, etc.';
COMMENT ON COLUMN merchants.trial_end IS 'End date of trial period';
COMMENT ON COLUMN merchants.current_period_end IS 'End date of current billing period';
COMMENT ON COLUMN merchants.last_payment_date IS 'Date of last successful payment';
COMMENT ON COLUMN merchants.last_payment_failed IS 'Date of last failed payment';
COMMENT ON COLUMN merchants.canceled_at IS 'Date when subscription was canceled'; 
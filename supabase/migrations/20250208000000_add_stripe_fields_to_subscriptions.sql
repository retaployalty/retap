-- Add Stripe fields to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);

-- Add comments
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID for tracking';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'Stripe customer ID for tracking'; 
-- Aggiungi colonne Stripe alla tabella merchants
ALTER TABLE "public"."merchants" 
ADD COLUMN IF NOT EXISTS "stripe_customer_id" text,
ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text,
ADD COLUMN IF NOT EXISTS "subscription_status" text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS "subscription_start_date" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "subscription_end_date" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "last_payment_date" timestamp with time zone;

-- Aggiungi commenti per documentazione
COMMENT ON COLUMN "public"."merchants"."stripe_customer_id" IS 'Stripe customer ID';
COMMENT ON COLUMN "public"."merchants"."stripe_subscription_id" IS 'Stripe subscription ID';
COMMENT ON COLUMN "public"."merchants"."subscription_status" IS 'Subscription status: active, inactive, cancelled, expired';
COMMENT ON COLUMN "public"."merchants"."subscription_start_date" IS 'Subscription start date';
COMMENT ON COLUMN "public"."merchants"."subscription_end_date" IS 'Subscription end date';
COMMENT ON COLUMN "public"."merchants"."payment_status" IS 'Payment status: pending, active, failed';
COMMENT ON COLUMN "public"."merchants"."last_payment_date" IS 'Last payment date';

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS "idx_merchants_stripe_customer_id" ON "public"."merchants" ("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_merchants_subscription_status" ON "public"."merchants" ("subscription_status");
CREATE INDEX IF NOT EXISTS "idx_merchants_payment_status" ON "public"."merchants" ("payment_status"); 
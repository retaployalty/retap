-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Merchants can view their customers' redeemed rewards" ON "public"."redeemed_rewards";
DROP POLICY IF EXISTS "Merchants can insert redeemed rewards" ON "public"."redeemed_rewards";
DROP POLICY IF EXISTS "Merchants can update their customers' redeemed rewards" ON "public"."redeemed_rewards";

-- Enable RLS
ALTER TABLE "public"."redeemed_rewards" ENABLE ROW LEVEL SECURITY;

-- Policy per permettere l'inserimento di nuovi record
CREATE POLICY "Merchants can insert redeemed rewards"
ON "public"."redeemed_rewards"
FOR INSERT
WITH CHECK (
  merchant_id IN (
    SELECT id FROM merchants 
    WHERE profile_id = auth.uid()
  )
);

-- Policy per permettere la lettura dei record
CREATE POLICY "Merchants can view their redeemed rewards"
ON "public"."redeemed_rewards"
FOR SELECT
USING (
  merchant_id IN (
    SELECT id FROM merchants 
    WHERE profile_id = auth.uid()
  )
);

-- Policy per permettere l'aggiornamento dei record
CREATE POLICY "Merchants can update their redeemed rewards"
ON "public"."redeemed_rewards"
FOR UPDATE
USING (
  merchant_id IN (
    SELECT id FROM merchants 
    WHERE profile_id = auth.uid()
  )
); 
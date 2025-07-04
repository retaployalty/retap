-- Migration: Add simple checkpoint reward validation
-- Date: 2025-02-08
-- Description: Add simple validation to prevent duplicate redemptions of the same reward
--              This is a simpler approach that just checks if the reward was already redeemed

-- Drop the current function
DROP FUNCTION IF EXISTS "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid");

-- Create the updated function with simple validation
CREATE OR REPLACE FUNCTION "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_already_redeemed boolean;
BEGIN
  -- Simple check: see if this exact reward has already been redeemed for this customer/merchant/step
  SELECT EXISTS(
    SELECT 1 
    FROM redeemed_checkpoint_rewards rcr
    WHERE rcr.customer_id = p_customer_id
    AND rcr.merchant_id = p_merchant_id
    AND rcr.checkpoint_reward_id = p_checkpoint_reward_id
    AND rcr.checkpoint_step_id = p_checkpoint_step_id
    AND rcr.status = 'completed'
  ) INTO v_already_redeemed;

  -- If already redeemed, raise exception
  IF v_already_redeemed THEN
    RAISE EXCEPTION 'Reward already redeemed for this step';
  END IF;

  -- Insert into redeemed_checkpoint_rewards
  INSERT INTO public.redeemed_checkpoint_rewards (
    customer_id,
    merchant_id,
    checkpoint_reward_id,
    checkpoint_step_id,
    status,
    redeemed_at
  ) VALUES (
    p_customer_id,
    p_merchant_id,
    p_checkpoint_reward_id,
    p_checkpoint_step_id,
    'completed',
    now()
  );
END;
$$;

-- Grant permissions
GRANT ALL ON FUNCTION "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid") TO "service_role";

-- Set ownership
ALTER FUNCTION "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid") OWNER TO "postgres"; 
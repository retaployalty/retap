-- Migration: Rollback checkpoint reward redemption logic
-- Date: 2025-02-08
-- Description: Rollback to the previous working version of redeem_checkpoint_reward function
--              Remove the validation logic that was causing issues

-- Drop the current function
DROP FUNCTION IF EXISTS "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid");

-- Create the original working function (without validation)
CREATE OR REPLACE FUNCTION "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
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
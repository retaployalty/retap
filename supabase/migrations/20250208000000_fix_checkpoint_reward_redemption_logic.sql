-- Migration: Fix checkpoint reward redemption logic
-- Date: 2025-02-08
-- Description: Add validation to prevent multiple redemptions of the same reward in the same cycle
--              Allow multiple redemptions only when the cycle restarts (step goes back to 1)

-- Drop the existing function
DROP FUNCTION IF EXISTS "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid");

-- Create the updated function with proper validation
CREATE OR REPLACE FUNCTION "public"."redeem_checkpoint_reward"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_checkpoint_reward_id" "uuid", "p_checkpoint_step_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_step integer;
    v_step_number integer;
    v_already_redeemed boolean;
BEGIN
  -- Get current step and step number
  SELECT 
    cp.current_step,
    cs.step_number
  INTO 
    v_current_step,
    v_step_number
  FROM customer_checkpoints cp
  JOIN checkpoint_steps cs ON cs.id = p_checkpoint_step_id
  WHERE cp.customer_id = p_customer_id
  AND cp.merchant_id = p_merchant_id
  AND cs.offer_id = cp.offer_id;

  -- Check if this reward has already been redeemed for this step in the current cycle
  -- We allow multiple redemptions only when the cycle restarts (step goes back to 1)
  SELECT EXISTS(
    SELECT 1 
    FROM redeemed_checkpoint_rewards rcr
    WHERE rcr.customer_id = p_customer_id
    AND rcr.merchant_id = p_merchant_id
    AND rcr.checkpoint_reward_id = p_checkpoint_reward_id
    AND rcr.checkpoint_step_id = p_checkpoint_step_id
    AND rcr.status = 'completed'
    -- Only block if we're not at step 1 (cycle restart)
    AND v_current_step > 1
  ) INTO v_already_redeemed;

  -- If already redeemed and not at cycle restart, raise exception
  IF v_already_redeemed THEN
    RAISE EXCEPTION 'Reward already redeemed for this step in current cycle. Complete the cycle to redeem again.';
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
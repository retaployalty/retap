-- Create function to redeem checkpoint reward
CREATE OR REPLACE FUNCTION public.redeem_checkpoint_reward(
  p_customer_id uuid,
  p_merchant_id uuid,
  p_checkpoint_reward_id uuid,
  p_checkpoint_step_id uuid
) RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.redeem_checkpoint_reward TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_checkpoint_reward TO service_role; 
-- Drop the existing function first
DROP FUNCTION IF EXISTS "public"."get_card_balance"("card_id" "uuid");

-- Create the updated get_card_balance function to include current reward name
CREATE OR REPLACE FUNCTION "public"."get_card_balance"("card_id" "uuid") RETURNS TABLE("merchant_id" "uuid", "merchant_name" "text", "balance" bigint, "is_issuer" boolean, "industry" "text", "logo_url" "text", "hours" "jsonb", "latitude" numeric, "longitude" numeric, "checkpoints_current" integer, "checkpoints_total" integer, "reward_steps" integer[], "current_reward_name" text)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN QUERY
  WITH merchant_balances AS (
    SELECT 
      cm.merchant_id as mb_merchant_id,
      m.name as merchant_name,
      COALESCE(SUM(t.points), 0) as balance,
      c.issuing_merchant_id = cm.merchant_id as is_issuer,
      m.industry,
      m.logo_url,
      m.hours,
      m.latitude,
      m.longitude
    FROM public.cards c
    JOIN public.card_merchants cm ON cm.card_id = c.id
    JOIN public.merchants m ON m.id = cm.merchant_id
    LEFT JOIN public.transactions t ON t.card_merchant_id = cm.id
    WHERE c.id = $1
    GROUP BY cm.merchant_id, m.name, c.issuing_merchant_id, m.industry, m.logo_url, m.hours, m.latitude, m.longitude
  ),
  active_subscriptions AS (
    SELECT DISTINCT m.id as merchant_id
    FROM public.merchants m
    JOIN public.subscriptions s ON s.profile_id = m.profile_id
    WHERE s.status = 'active'
    AND (s.end_date IS NULL OR s.end_date > now())
  ),
  checkpoints AS (
    SELECT
      cp.merchant_id as cp_merchant_id,
      cp.current_step,
      co.total_steps,
      co.id as offer_id
    FROM public.customer_checkpoints cp
    JOIN public.cards c ON c.customer_id = cp.customer_id
    JOIN public.checkpoint_offers co ON co.merchant_id = cp.merchant_id
    WHERE c.id = $1
  ),
  best_checkpoint AS (
    SELECT cp_merchant_id, current_step, total_steps, offer_id
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY cp_merchant_id ORDER BY current_step DESC) as rn
      FROM checkpoints
    ) ranked
    WHERE rn = 1
  ),
  reward_steps AS (
    SELECT 
      bc.cp_merchant_id,
      ARRAY_AGG(cs.step_number ORDER BY cs.step_number) as steps
    FROM best_checkpoint bc
    JOIN public.checkpoint_steps cs ON cs.offer_id = bc.offer_id
    WHERE cs.reward_id IS NOT NULL
    GROUP BY bc.cp_merchant_id
  ),
  redeemed_checkpoints AS (
    SELECT 
      rcr.merchant_id,
      rcr.checkpoint_step_id,
      cs.step_number,
      cr.name as reward_name
    FROM public.redeemed_checkpoint_rewards rcr
    JOIN public.checkpoint_steps cs ON cs.id = rcr.checkpoint_step_id
    JOIN public.checkpoint_rewards cr ON cr.id = cs.reward_id
    WHERE rcr.status = 'completed'
  ),
  current_reward AS (
    SELECT 
      bc.cp_merchant_id,
      CASE 
        -- Se hai riscattato qualcosa, mostra l'ultimo riscattato
        WHEN EXISTS (SELECT 1 FROM redeemed_checkpoints rc WHERE rc.merchant_id = bc.cp_merchant_id) THEN
          (SELECT cr.name 
           FROM redeemed_checkpoints rc
           JOIN public.checkpoint_steps cs ON cs.id = rc.checkpoint_step_id
           JOIN public.checkpoint_rewards cr ON cr.id = cs.reward_id
           WHERE rc.merchant_id = bc.cp_merchant_id
           ORDER BY rc.step_number DESC
           LIMIT 1)
        -- Altrimenti, mostra il prossimo reward che sbloccherai
        ELSE
          (SELECT cr.name
           FROM public.checkpoint_steps cs
           JOIN public.checkpoint_rewards cr ON cr.id = cs.reward_id
           WHERE cs.offer_id = bc.offer_id
           AND cs.reward_id IS NOT NULL
           AND cs.step_number > bc.current_step
           ORDER BY cs.step_number ASC
           LIMIT 1)
      END as reward_name,
      CASE 
        -- Se hai riscattato qualcosa, è un reward già riscattato
        WHEN EXISTS (SELECT 1 FROM redeemed_checkpoints rc WHERE rc.merchant_id = bc.cp_merchant_id) THEN true
        -- Altrimenti, è un reward che puoi riscattare ora
        ELSE
          EXISTS (
            SELECT 1
            FROM public.checkpoint_steps cs
            WHERE cs.offer_id = bc.offer_id
            AND cs.reward_id IS NOT NULL
            AND cs.step_number = bc.current_step
          )
      END as is_redeemable
    FROM best_checkpoint bc
  )
  SELECT 
    mb.mb_merchant_id as merchant_id,
    mb.merchant_name,
    mb.balance,
    mb.is_issuer,
    mb.industry,
    mb.logo_url,
    mb.hours,
    mb.latitude,
    mb.longitude,
    COALESCE(bc.current_step, 0) as checkpoints_current,
    COALESCE(bc.total_steps, 0) as checkpoints_total,
    COALESCE(rs.steps, ARRAY[]::integer[]) as reward_steps,
    cr.reward_name as current_reward_name,
    cr.is_redeemable as is_redeemable
  FROM merchant_balances mb
  JOIN active_subscriptions asub ON asub.merchant_id = mb.mb_merchant_id
  LEFT JOIN best_checkpoint bc ON bc.cp_merchant_id = mb.mb_merchant_id
  LEFT JOIN reward_steps rs ON rs.cp_merchant_id = mb.mb_merchant_id
  LEFT JOIN current_reward cr ON cr.cp_merchant_id = mb.mb_merchant_id
  ORDER BY mb.balance DESC;
END;
$_$;

-- Grant permissions
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "service_role"; 
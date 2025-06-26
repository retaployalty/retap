-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_card_balance(uuid);

-- Recreate the function with coordinates
CREATE OR REPLACE FUNCTION "public"."get_card_balance"("card_id" "uuid") RETURNS TABLE("merchant_id" "uuid", "merchant_name" "text", "balance" bigint, "is_issuer" boolean, "industry" "text", "logo_url" "text", "hours" "jsonb", "latitude" numeric, "longitude" numeric, "checkpoints_current" integer, "checkpoints_total" integer, "reward_steps" integer[])
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
    COALESCE(rs.steps, ARRAY[]::integer[]) as reward_steps
  FROM merchant_balances mb
  LEFT JOIN best_checkpoint bc ON bc.cp_merchant_id = mb.mb_merchant_id
  LEFT JOIN reward_steps rs ON rs.cp_merchant_id = mb.mb_merchant_id
  ORDER BY mb.balance DESC;
END;
$_$;

-- Grant permissions
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "service_role"; 
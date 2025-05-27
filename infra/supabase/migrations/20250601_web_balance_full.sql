-- Elimina la funzione esistente
DROP FUNCTION IF EXISTS get_card_balance(uuid);

-- Funzione aggiornata per ottenere il saldo di una carta per ogni merchant, con logo, orari e checkpoint
CREATE OR REPLACE FUNCTION get_card_balance(card_id uuid)
RETURNS TABLE (
  merchant_id uuid,
  merchant_name text,
  balance bigint,
  is_issuer boolean,
  industry text,
  logo_url text,
  hours jsonb,
  checkpoints_current int,
  checkpoints_total int
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH merchant_balances AS (
    SELECT 
      cm.merchant_id,
      m.name as merchant_name,
      COALESCE(SUM(t.points), 0) as balance,
      c.issuing_merchant_id = cm.merchant_id as is_issuer,
      m.industry,
      m.logo_url,
      m.hours
    FROM public.cards c
    JOIN public.card_merchants cm ON cm.card_id = c.id
    JOIN public.merchants m ON m.id = cm.merchant_id
    LEFT JOIN public.transactions t ON t.card_merchant_id = cm.id
    WHERE c.id = $1
    GROUP BY cm.merchant_id, m.name, c.issuing_merchant_id, m.industry, m.logo_url, m.hours
  ),
  checkpoints AS (
    SELECT
      cp.merchant_id,
      cp.current_step,
      co.total_steps
    FROM public.customer_checkpoints cp
    JOIN public.cards c ON c.customer_id = cp.customer_id
    JOIN public.checkpoint_offers co ON co.merchant_id = cp.merchant_id
    WHERE c.id = $1
  ),
  best_checkpoint AS (
    SELECT merchant_id, current_step, total_steps
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY merchant_id ORDER BY current_step DESC) as rn
      FROM checkpoints
    ) ranked
    WHERE rn = 1
  )
  SELECT 
    mb.merchant_id,
    mb.merchant_name,
    mb.balance,
    mb.is_issuer,
    mb.industry,
    mb.logo_url,
    mb.hours,
    COALESCE(bc.current_step, 0) as checkpoints_current,
    COALESCE(bc.total_steps, 0) as checkpoints_total
  FROM merchant_balances mb
  LEFT JOIN best_checkpoint bc ON bc.merchant_id = mb.merchant_id
  ORDER BY mb.balance DESC;
END;
$$; 
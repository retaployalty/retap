-- Elimina la funzione esistente
DROP FUNCTION IF EXISTS get_card_balance(uuid);

-- Funzione per ottenere il saldo di una carta per ogni merchant
CREATE OR REPLACE FUNCTION get_card_balance(card_id uuid)
RETURNS TABLE (
  merchant_id uuid,
  merchant_name text,
  balance bigint,
  is_issuer boolean,
  industry text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH merchant_balances AS (
    SELECT 
      cm.merchant_id,
      m.name as merchant_name,
      COALESCE(SUM(t.points), 0) as balance,
      c.issuing_merchant_id = cm.merchant_id as is_issuer,
      m.industry
    FROM public.cards c
    JOIN public.card_merchants cm ON cm.card_id = c.id
    JOIN public.merchants m ON m.id = cm.merchant_id
    LEFT JOIN public.transactions t ON t.card_merchant_id = cm.id
    WHERE c.id = $1
    GROUP BY cm.merchant_id, m.name, c.issuing_merchant_id, m.industry
  )
  SELECT 
    mb.merchant_id,
    mb.merchant_name,
    mb.balance,
    mb.is_issuer,
    mb.industry
  FROM merchant_balances mb
  ORDER BY mb.balance DESC;
END;
$$; 
-- Create function to get merchant customers with additional info
CREATE OR REPLACE FUNCTION public.get_merchant_customers(p_merchant_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  cards_count bigint,
  total_points bigint,
  last_transaction timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH customer_stats AS (
    SELECT 
      c.id as customer_id,
      COUNT(DISTINCT cd.id) as cards_count,
      COALESCE(SUM(t.points), 0) as total_points,
      MAX(t.created_at) as last_transaction
    FROM public.customers c
    LEFT JOIN public.cards cd ON cd.customer_id = c.id
    LEFT JOIN public.card_merchants cm ON cm.card_id = cd.id
    LEFT JOIN public.transactions t ON t.card_merchant_id = cm.id
    WHERE cm.merchant_id = p_merchant_id
    GROUP BY c.id
  )
  SELECT 
    c.id,
    c.email,
    c.created_at,
    COALESCE(cs.cards_count, 0) as cards_count,
    COALESCE(cs.total_points, 0) as total_points,
    cs.last_transaction
  FROM public.customers c
  JOIN public.cards cd ON cd.customer_id = c.id
  JOIN public.card_merchants cm ON cm.card_id = cd.id
  LEFT JOIN customer_stats cs ON cs.customer_id = c.id
  WHERE cm.merchant_id = p_merchant_id
  GROUP BY c.id, c.email, c.created_at, cs.cards_count, cs.total_points, cs.last_transaction
  ORDER BY c.created_at DESC;
END;
$$; 
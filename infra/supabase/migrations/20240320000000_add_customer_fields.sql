-- Add new fields to customers table
ALTER TABLE public.customers
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN phone_number text;

-- Add comment to explain the fields
COMMENT ON COLUMN public.customers.first_name IS 'Nome del cliente';
COMMENT ON COLUMN public.customers.last_name IS 'Cognome del cliente';
COMMENT ON COLUMN public.customers.phone_number IS 'Numero di telefono del cliente';

-- Update RLS policies to allow merchants to update these fields
CREATE POLICY "Merchants can update customer personal info"
ON public.customers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.cards c
    JOIN public.card_merchants cm ON cm.card_id = c.id
    WHERE c.customer_id = customers.id
    AND cm.merchant_id IN (
      SELECT id
      FROM public.merchants
      WHERE profile_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.cards c
    JOIN public.card_merchants cm ON cm.card_id = c.id
    WHERE c.customer_id = customers.id
    AND cm.merchant_id IN (
      SELECT id
      FROM public.merchants
      WHERE profile_id = auth.uid()
    )
  )
); 
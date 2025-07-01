-- Migrazione: Fix funzione trigger create_customer_checkpoint per card_merchants
-- Data: 2024-06-10

-- 1. Rimuovi il trigger
DROP TRIGGER IF EXISTS on_card_merchant_created ON public.card_merchants;

-- 2. Droppa la funzione
DROP FUNCTION IF EXISTS public.create_customer_checkpoint();

-- 3. Ricrea la funzione corretta
CREATE OR REPLACE FUNCTION public.create_customer_checkpoint() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  offer_record RECORD;
  v_customer_id uuid;
BEGIN
  -- Recupera il customer_id dalla tabella cards usando NEW.card_id
  SELECT customer_id INTO v_customer_id FROM public.cards WHERE id = NEW.card_id;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer_id non trovato per la card_id %', NEW.card_id;
  END IF;

  -- Get all active offers for this merchant
  FOR offer_record IN 
    SELECT id FROM public.checkpoint_offers 
    WHERE merchant_id = NEW.merchant_id
  LOOP
    -- Insert a record in customer_checkpoints for each offer
    INSERT INTO public.customer_checkpoints (
      customer_id, 
      merchant_id, 
      offer_id,
      current_step
    )
    VALUES (
      v_customer_id, 
      NEW.merchant_id, 
      offer_record.id,
      0
    )
    ON CONFLICT (customer_id, merchant_id, offer_id) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- 4. Ricrea il trigger
CREATE TRIGGER on_card_merchant_created
AFTER INSERT ON public.card_merchants
FOR EACH ROW EXECUTE FUNCTION public.create_customer_checkpoint(); 
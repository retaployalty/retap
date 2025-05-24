-- Aggiungi la colonna payment_method alla tabella checkout_billing
ALTER TABLE public.checkout_billing
ADD COLUMN payment_method text CHECK (payment_method IN ('card', 'bank_transfer'));

-- Imposta un valore di default per i record esistenti
UPDATE public.checkout_billing
SET payment_method = 'card'
WHERE payment_method IS NULL; 
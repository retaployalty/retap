-- Rimuove i vincoli UNIQUE su customer_id per permettere più carte per customer
-- Questo permette il modello: 1 customer = 1 carta (ma ogni merchant può creare più carte)

-- Rimuove il primo vincolo UNIQUE
ALTER TABLE "public"."cards" DROP CONSTRAINT IF EXISTS "cards_customer_id_key";

-- Rimuove il secondo vincolo UNIQUE (duplicato)
ALTER TABLE "public"."cards" DROP CONSTRAINT IF EXISTS "cards_customer_id_unique";

-- Aggiunge un commento per documentare il cambiamento
COMMENT ON TABLE "public"."cards" IS 'Cards table - each customer can have one card, but merchants can create multiple cards'; 
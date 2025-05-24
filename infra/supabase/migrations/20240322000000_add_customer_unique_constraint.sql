-- Aggiungi il vincolo UNIQUE su customer_id nella tabella cards
ALTER TABLE "public"."cards" 
    ADD CONSTRAINT "cards_customer_id_key" UNIQUE ("customer_id");

-- Verifica che non ci siano duplicati prima di aggiungere il vincolo
DO $$
BEGIN
    IF EXISTS (
        SELECT customer_id, COUNT(*)
        FROM "public"."cards"
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Ci sono customers con più di una carta. Risolvere i duplicati prima di aggiungere il vincolo UNIQUE.';
    END IF;
END $$; 
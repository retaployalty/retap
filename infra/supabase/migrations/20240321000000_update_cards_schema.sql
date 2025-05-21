-- Rimuovi le vecchie policy
DROP POLICY IF EXISTS "Merchant can insert cards" ON "public"."cards";
DROP POLICY IF EXISTS "Merchant can select cards" ON "public"."cards";
DROP POLICY IF EXISTS "Merchant can update cards" ON "public"."cards";
DROP POLICY IF EXISTS "Merchant can insert transactions" ON "public"."transactions";
DROP POLICY IF EXISTS "Merchant can select transactions" ON "public"."transactions";
DROP POLICY IF EXISTS "Merchant can update transactions" ON "public"."transactions";

-- Rimuovi le vecchie foreign keys
ALTER TABLE "public"."cards" DROP CONSTRAINT IF EXISTS "cards_merchant_id_fkey";
ALTER TABLE "public"."transactions" DROP CONSTRAINT IF EXISTS "transactions_card_id_fkey";
ALTER TABLE "public"."transactions" DROP CONSTRAINT IF EXISTS "transactions_merchant_id_fkey";

-- Crea la nuova tabella card_merchants
CREATE TABLE IF NOT EXISTS "public"."card_merchants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "card_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "card_merchants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "card_merchants_card_id_merchant_id_key" UNIQUE ("card_id", "merchant_id"),
    CONSTRAINT "card_merchants_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE,
    CONSTRAINT "card_merchants_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE
);

-- Aggiungi la colonna issuing_merchant_id alla tabella cards (permettendo NULL inizialmente)
ALTER TABLE "public"."cards" 
    ADD COLUMN "issuing_merchant_id" "uuid",
    ADD CONSTRAINT "cards_issuing_merchant_id_fkey" 
    FOREIGN KEY ("issuing_merchant_id") REFERENCES "public"."merchants"("id");

-- Migra i dati delle transazioni esistenti
INSERT INTO "public"."card_merchants" ("card_id", "merchant_id")
SELECT DISTINCT t."card_id", t."merchant_id"
FROM "public"."transactions" t;

-- Aggiungi le relazioni card_merchants per le carte senza transazioni
INSERT INTO "public"."card_merchants" ("card_id", "merchant_id")
SELECT c."id", c."merchant_id"
FROM "public"."cards" c
LEFT JOIN "public"."card_merchants" cm ON cm."card_id" = c."id"
WHERE cm."id" IS NULL;

-- Aggiorna i dati esistenti per issuing_merchant_id
UPDATE "public"."cards" c
SET "issuing_merchant_id" = COALESCE(
    -- Prima prova a prendere il merchant dalla prima transazione
    (SELECT cm."merchant_id"
    FROM "public"."card_merchants" cm
    WHERE cm."card_id" = c."id"
    ORDER BY cm."created_at" ASC
    LIMIT 1),
    -- Se non ci sono transazioni, usa il merchant_id della carta
    c."merchant_id"
);

-- Verifica che tutte le carte abbiano un issuing_merchant_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "public"."cards" WHERE "issuing_merchant_id" IS NULL
    ) THEN
        RAISE EXCEPTION 'Alcune carte non hanno un issuing_merchant_id valido';
    END IF;
END $$;

-- Rendi issuing_merchant_id NOT NULL dopo la verifica
ALTER TABLE "public"."cards" 
    ALTER COLUMN "issuing_merchant_id" SET NOT NULL;

-- Aggiorna la tabella transactions
ALTER TABLE "public"."transactions" 
    ADD COLUMN "card_merchant_id" "uuid",
    ADD CONSTRAINT "transactions_card_merchant_id_fkey" 
    FOREIGN KEY ("card_merchant_id") REFERENCES "public"."card_merchants"("id") ON DELETE CASCADE;

-- Aggiorna i dati delle transazioni
UPDATE "public"."transactions" t
SET "card_merchant_id" = (
    SELECT cm."id"
    FROM "public"."card_merchants" cm
    WHERE cm."card_id" = t."card_id"
    AND cm."merchant_id" = t."merchant_id"
);

-- Verifica che tutte le transazioni abbiano un card_merchant_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "public"."transactions" WHERE "card_merchant_id" IS NULL
    ) THEN
        RAISE EXCEPTION 'Alcune transazioni non hanno un card_merchant_id valido';
    END IF;
END $$;

-- Rimuovi le vecchie colonne
ALTER TABLE "public"."cards" DROP COLUMN IF EXISTS "merchant_id";
ALTER TABLE "public"."transactions" DROP COLUMN IF EXISTS "card_id";
ALTER TABLE "public"."transactions" DROP COLUMN IF EXISTS "merchant_id";

-- Crea le nuove policy
CREATE POLICY "Merchant can insert cards" ON "public"."cards" 
    FOR INSERT WITH CHECK (("issuing_merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can select cards" ON "public"."cards" 
    FOR SELECT USING (("issuing_merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can update cards" ON "public"."cards" 
    FOR UPDATE USING (("issuing_merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can insert card_merchants" ON "public"."card_merchants" 
    FOR INSERT WITH CHECK (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can select card_merchants" ON "public"."card_merchants" 
    FOR SELECT USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can update card_merchants" ON "public"."card_merchants" 
    FOR UPDATE USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can insert transactions" ON "public"."transactions" 
    FOR INSERT WITH CHECK (("card_merchant_id" IN (
        SELECT id FROM public.card_merchants WHERE merchant_id IN (
            SELECT id FROM public.merchants WHERE profile_id = auth.uid()
        )
    )));

CREATE POLICY "Merchant can select transactions" ON "public"."transactions" 
    FOR SELECT USING (("card_merchant_id" IN (
        SELECT id FROM public.card_merchants WHERE merchant_id IN (
            SELECT id FROM public.merchants WHERE profile_id = auth.uid()
        )
    )));

CREATE POLICY "Merchant can update transactions" ON "public"."transactions" 
    FOR UPDATE USING (("card_merchant_id" IN (
        SELECT id FROM public.card_merchants WHERE merchant_id IN (
            SELECT id FROM public.merchants WHERE profile_id = auth.uid()
        )
    )));

-- Crea la funzione per ottenere il saldo
CREATE OR REPLACE FUNCTION "public"."get_card_balance"("card_id" uuid)
RETURNS TABLE (
    merchant_id uuid,
    merchant_name text,
    balance integer,
    is_issuer boolean
)
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as merchant_id,
        m.name as merchant_name,
        COALESCE(SUM(t.points), 0)::integer as balance,
        (c.issuing_merchant_id = m.id) as is_issuer
    FROM public.cards c
    JOIN public.card_merchants cm ON cm.card_id = c.id
    JOIN public.merchants m ON m.id = cm.merchant_id
    LEFT JOIN public.transactions t ON t.card_merchant_id = cm.id
    WHERE c.id = $1
    GROUP BY m.id, m.name, c.issuing_merchant_id;
END;
$$;

-- Grant permissions
GRANT ALL ON TABLE "public"."card_merchants" TO "anon";
GRANT ALL ON TABLE "public"."card_merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."card_merchants" TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_card_balance"(uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_card_balance"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_card_balance"(uuid) TO "service_role"; 
-- Tabella per tracciare i rewards riscattati
CREATE TABLE IF NOT EXISTS "public"."redeemed_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "reward_id" "uuid" NOT NULL,
    "points_spent" integer NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::text NOT NULL,
    CONSTRAINT "redeemed_rewards_status_check" CHECK (("status" = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])))
);

-- Tabella per tracciare i premi dei checkpoint riscattati
CREATE TABLE IF NOT EXISTS "public"."redeemed_checkpoint_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "checkpoint_reward_id" "uuid" NOT NULL,
    "checkpoint_step_id" "uuid" NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::text NOT NULL,
    CONSTRAINT "redeemed_checkpoint_rewards_status_check" CHECK (("status" = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])))
);

-- Aggiungi le chiavi primarie
ALTER TABLE ONLY "public"."redeemed_rewards"
    ADD CONSTRAINT "redeemed_rewards_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_pkey" PRIMARY KEY ("id");

-- Aggiungi le chiavi esterne
ALTER TABLE ONLY "public"."redeemed_rewards"
    ADD CONSTRAINT "redeemed_rewards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."redeemed_rewards"
    ADD CONSTRAINT "redeemed_rewards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."redeemed_rewards"
    ADD CONSTRAINT "redeemed_rewards_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_checkpoint_reward_id_fkey" FOREIGN KEY ("checkpoint_reward_id") REFERENCES "public"."checkpoint_rewards"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_checkpoint_step_id_fkey" FOREIGN KEY ("checkpoint_step_id") REFERENCES "public"."checkpoint_steps"("id") ON DELETE CASCADE;

-- Aggiungi i trigger per updated_at
CREATE TRIGGER "on_redeemed_rewards_updated" BEFORE UPDATE ON "public"."redeemed_rewards" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

CREATE TRIGGER "on_redeemed_checkpoint_rewards_updated" BEFORE UPDATE ON "public"."redeemed_checkpoint_rewards" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- Aggiungi le policy RLS
CREATE POLICY "Merchants can view their customers' redeemed rewards" ON "public"."redeemed_rewards" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));

CREATE POLICY "Merchants can insert redeemed rewards" ON "public"."redeemed_rewards" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));

CREATE POLICY "Merchants can update their customers' redeemed rewards" ON "public"."redeemed_rewards" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));

CREATE POLICY "Merchants can view their customers' redeemed checkpoint rewards" ON "public"."redeemed_checkpoint_rewards" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));

CREATE POLICY "Merchants can insert redeemed checkpoint rewards" ON "public"."redeemed_checkpoint_rewards" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));

CREATE POLICY "Merchants can update their customers' redeemed checkpoint rewards" ON "public"."redeemed_checkpoint_rewards" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));

-- Abilita RLS
ALTER TABLE "public"."redeemed_rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."redeemed_checkpoint_rewards" ENABLE ROW LEVEL SECURITY;

-- Aggiungi i commenti
COMMENT ON TABLE "public"."redeemed_rewards" IS 'Traccia i rewards riscattati dai clienti';
COMMENT ON TABLE "public"."redeemed_checkpoint_rewards" IS 'Traccia i premi dei checkpoint riscattati dai clienti';

-- Enable RLS
ALTER TABLE "public"."redeemed_rewards" ENABLE ROW LEVEL SECURITY;

-- Policy per permettere l'inserimento di nuovi record
CREATE POLICY "Merchants can insert redeemed rewards"
ON "public"."redeemed_rewards"
FOR INSERT
WITH CHECK (
  merchant_id IN (
    SELECT id FROM merchants 
    WHERE profile_id = auth.uid()
  )
);

-- Policy per permettere la lettura dei record
CREATE POLICY "Merchants can view their redeemed rewards"
ON "public"."redeemed_rewards"
FOR SELECT
USING (
  merchant_id IN (
    SELECT id FROM merchants 
    WHERE profile_id = auth.uid()
  )
);

-- Policy per permettere l'aggiornamento dei record
CREATE POLICY "Merchants can update their redeemed rewards"
ON "public"."redeemed_rewards"
FOR UPDATE
USING (
  merchant_id IN (
    SELECT id FROM merchants 
    WHERE profile_id = auth.uid()
  )
); 


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid") RETURNS TABLE("current_step" integer, "total_steps" integer, "reward_id" "uuid", "reward_name" "text", "reward_description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_step integer;
    v_total_steps integer;
    v_next_step integer;
    v_reward_id uuid;
    v_reward_name text;
    v_reward_description text;
BEGIN
    -- Get or create customer checkpoint
    INSERT INTO customer_checkpoints (customer_id, merchant_id, current_step)
    VALUES (p_customer_id, p_merchant_id, 1)
    ON CONFLICT (customer_id, merchant_id) DO NOTHING;

    -- Get current step and total steps
    SELECT 
        cp.current_step,
        cs.total_steps
    INTO 
        v_current_step,
        v_total_steps
    FROM customer_checkpoints cp
    JOIN checkpoint_steps cs ON cs.merchant_id = cp.merchant_id
    WHERE cp.customer_id = p_customer_id
    AND cp.merchant_id = p_merchant_id
    LIMIT 1;

    -- Calculate next step
    v_next_step := v_current_step + 1;
    IF v_next_step > v_total_steps THEN
        v_next_step := 1;
    END IF;

    -- Update customer checkpoint
    UPDATE customer_checkpoints
    SET 
        current_step = v_next_step,
        last_updated = now()
    WHERE customer_id = p_customer_id
    AND merchant_id = p_merchant_id;

    -- Check if there's a reward at this step
    SELECT 
        cs.reward_id,
        cr.name,
        cr.description
    INTO 
        v_reward_id,
        v_reward_name,
        v_reward_description
    FROM checkpoint_steps cs
    LEFT JOIN checkpoint_rewards cr ON cr.id = cs.reward_id
    WHERE cs.merchant_id = p_merchant_id
    AND cs.step_number = v_next_step;

    RETURN QUERY
    SELECT 
        v_next_step,
        v_total_steps,
        v_reward_id,
        v_reward_name,
        v_reward_description;
END;
$$;


ALTER FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_offer_id" "uuid") RETURNS TABLE("current_step" integer, "total_steps" integer, "reward_id" "uuid", "reward_name" "text", "reward_description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_step integer;
    v_total_steps integer;
    v_next_step integer;
    v_reward_id uuid;
    v_reward_name text;
    v_reward_description text;
BEGIN
    -- Get or create customer checkpoint
    INSERT INTO customer_checkpoints (customer_id, merchant_id, current_step)
    VALUES (p_customer_id, p_merchant_id, 1)
    ON CONFLICT (customer_id, merchant_id) DO NOTHING;

    -- Get current step and total steps from the offer
    SELECT 
        cp.current_step,
        co.total_steps
    INTO 
        v_current_step,
        v_total_steps
    FROM customer_checkpoints cp
    JOIN checkpoint_offers co ON co.merchant_id = cp.merchant_id
    WHERE cp.customer_id = p_customer_id
    AND cp.merchant_id = p_merchant_id
    AND co.id = p_offer_id;

    -- Calculate next step
    v_next_step := v_current_step + 1;
    IF v_next_step > v_total_steps THEN
        v_next_step := 1;
    END IF;

    -- Update customer checkpoint
    UPDATE customer_checkpoints
    SET 
        current_step = v_next_step,
        last_updated = now()
    WHERE customer_id = p_customer_id
    AND merchant_id = p_merchant_id;

    -- Check if there's a reward at this step
    SELECT 
        cs.reward_id,
        cr.name,
        cr.description
    INTO 
        v_reward_id,
        v_reward_name,
        v_reward_description
    FROM checkpoint_steps cs
    LEFT JOIN checkpoint_rewards cr ON cr.id = cs.reward_id
    WHERE cs.offer_id = p_offer_id
    AND cs.step_number = v_next_step;

    RETURN QUERY
    SELECT 
        v_next_step,
        v_total_steps,
        v_reward_id,
        v_reward_name,
        v_reward_description;
END;
$$;


ALTER FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_offer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_card_balance"("card_id" "uuid") RETURNS TABLE("merchant_id" "uuid", "merchant_name" "text", "balance" integer, "is_issuer" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
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
$_$;


ALTER FUNCTION "public"."get_card_balance"("card_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_subscription"("profile_id" "uuid") RETURNS TABLE("plan_type" "text", "billing_type" "text", "status" "text", "start_date" timestamp with time zone, "end_date" timestamp with time zone, "days_remaining" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_type,
    s.billing_type,
    s.status,
    s.start_date,
    s.end_date,
    CASE 
      WHEN s.end_date IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (s.end_date - now()))
    END::integer as days_remaining
  FROM public.subscriptions s
  WHERE s.profile_id = $1
  AND s.status = 'active'
  AND (s.end_date IS NULL OR s.end_date > now())
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$_$;


ALTER FUNCTION "public"."get_current_subscription"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_subscription_history"("profile_id" "uuid") RETURNS TABLE("plan_type" "text", "billing_type" "text", "status" "text", "start_date" timestamp with time zone, "end_date" timestamp with time zone, "payment_amount" numeric, "payment_status" "text", "payment_date" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_type,
    s.billing_type,
    s.status,
    s.start_date,
    s.end_date,
    p.amount as payment_amount,
    p.status as payment_status,
    p.created_at as payment_date
  FROM public.subscriptions s
  LEFT JOIN public.payments p ON p.subscription_id = s.id
  WHERE s.profile_id = $1
  ORDER BY s.created_at DESC;
END;
$_$;


ALTER FUNCTION "public"."get_subscription_history"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_subscription_usage"("profile_id" "uuid") RETURNS TABLE("total_cards" integer, "cards_this_month" integer, "plan_limit" integer, "usage_percentage" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  current_plan text;
  plan_limit integer;
BEGIN
  -- Get current plan
  SELECT s.plan_type INTO current_plan
  FROM public.subscriptions s
  WHERE s.profile_id = $1
  AND s.status = 'active'
  AND (s.end_date IS NULL OR s.end_date > now())
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Set plan limit based on plan type
  plan_limit := CASE current_plan
    WHEN 'base' THEN 100
    WHEN 'premium' THEN 400
    WHEN 'top' THEN 1000
    ELSE 0
  END;

  RETURN QUERY
  WITH card_counts AS (
    SELECT 
      COUNT(*) as total_cards,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())) as cards_this_month
    FROM public.cards c
    JOIN public.merchants m ON m.id = c.merchant_id
    WHERE m.profile_id = $1
  )
  SELECT 
    cc.total_cards,
    cc.cards_this_month,
    plan_limit,
    CASE 
      WHEN plan_limit = 0 THEN 0
      ELSE (cc.cards_this_month::numeric / plan_limit) * 100
    END as usage_percentage
  FROM card_counts cc;
END;
$_$;


ALTER FUNCTION "public"."get_subscription_usage"("profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_email_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_email_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_active_subscription"("profile_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE profile_id = $1
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  );
END;
$_$;


ALTER FUNCTION "public"."has_active_subscription"("profile_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."card_merchants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "card_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."card_merchants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "customer_id" "uuid",
    "uid" "text",
    "issuing_merchant_id" "uuid" NOT NULL
);


ALTER TABLE "public"."cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkout_billing" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "city" "text",
    "zip_code" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "first_name" "text",
    "last_name" "text",
    "street_address" "text",
    "address_extra" "text",
    "address_info" "text",
    "is_company" boolean,
    "company_name" "text",
    "phone" "text",
    "payment_method" "text",
    "subscription_type" "text",
    "payment_successful" boolean,
    CONSTRAINT "checkout_billing_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['card'::"text", 'bank_transfer'::"text"])))
);


ALTER TABLE "public"."checkout_billing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkpoint_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "total_steps" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."checkpoint_offers" OWNER TO "postgres";


COMMENT ON TABLE "public"."checkpoint_offers" IS 'Offerte di checkpoint per i programmi fedeltà';



CREATE TABLE IF NOT EXISTS "public"."checkpoint_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" DEFAULT 'gift'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."checkpoint_rewards" OWNER TO "postgres";


COMMENT ON TABLE "public"."checkpoint_rewards" IS 'Premi associati ai checkpoint';



CREATE TABLE IF NOT EXISTS "public"."checkpoint_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "step_number" integer NOT NULL,
    "total_steps" integer NOT NULL,
    "reward_id" "uuid",
    "offer_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."checkpoint_steps" OWNER TO "postgres";


COMMENT ON TABLE "public"."checkpoint_steps" IS 'Step dei checkpoint con i relativi premi';



CREATE TABLE IF NOT EXISTS "public"."customer_checkpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "current_step" integer DEFAULT 1 NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "customer_checkpoints_step_valid" CHECK (("current_step" > 0))
);


ALTER TABLE "public"."customer_checkpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "merchant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."merchants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid",
    "country" "text" NOT NULL,
    "industry" "text" NOT NULL,
    "address" "text" NOT NULL,
    "logo_url" "text",
    "cover_image_url" "text"[],
    "phone" "text",
    "google_maps_url" "text",
    "hours" "jsonb",
    "annual_closures" "jsonb",
    "gallery_images" "jsonb"
);


ALTER TABLE "public"."merchants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."merchants"."logo_url" IS 'URL del logo del negozio';



COMMENT ON COLUMN "public"."merchants"."cover_image_url" IS 'Array di URL delle immagini di copertina del negozio';



COMMENT ON COLUMN "public"."merchants"."phone" IS 'Numero di telefono del negozio';



COMMENT ON COLUMN "public"."merchants"."google_maps_url" IS 'Link Google Maps del negozio';



COMMENT ON COLUMN "public"."merchants"."hours" IS 'Orari di apertura in formato JSON';



COMMENT ON COLUMN "public"."merchants"."annual_closures" IS 'Chiusure annuali in formato JSON';



COMMENT ON COLUMN "public"."merchants"."gallery_images" IS 'Array di URL immagini aggiuntive (galleria)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone_number" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "email" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image_path" "text" NOT NULL,
    "price_coins" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "plan_type" "text" NOT NULL,
    "billing_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_date" timestamp with time zone,
    "trial_end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_billing_type_check" CHECK (("billing_type" = ANY (ARRAY['monthly'::"text", 'annual'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "card_merchant_id" "uuid"
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."card_merchants"
    ADD CONSTRAINT "card_merchants_card_id_merchant_id_key" UNIQUE ("card_id", "merchant_id");



ALTER TABLE ONLY "public"."card_merchants"
    ADD CONSTRAINT "card_merchants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_uid_key" UNIQUE ("uid");



ALTER TABLE ONLY "public"."checkout_billing"
    ADD CONSTRAINT "checkout_billing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkpoint_offers"
    ADD CONSTRAINT "checkpoint_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkpoint_rewards"
    ADD CONSTRAINT "checkpoint_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkpoint_steps"
    ADD CONSTRAINT "checkpoint_steps_offer_step_unique" UNIQUE ("offer_id", "step_number");



ALTER TABLE ONLY "public"."checkpoint_steps"
    ADD CONSTRAINT "checkpoint_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_checkpoints"
    ADD CONSTRAINT "customer_checkpoints_customer_merchant_unique" UNIQUE ("customer_id", "merchant_id");



ALTER TABLE ONLY "public"."customer_checkpoints"
    ADD CONSTRAINT "customer_checkpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "on_checkpoint_offers_updated" BEFORE UPDATE ON "public"."checkpoint_offers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_checkpoint_rewards_updated" BEFORE UPDATE ON "public"."checkpoint_rewards" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_checkpoint_steps_updated" BEFORE UPDATE ON "public"."checkpoint_steps" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_rewards_updated" BEFORE UPDATE ON "public"."rewards" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_subscriptions_updated" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."card_merchants"
    ADD CONSTRAINT "card_merchants_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_merchants"
    ADD CONSTRAINT "card_merchants_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_issuing_merchant_id_fkey" FOREIGN KEY ("issuing_merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."checkpoint_offers"
    ADD CONSTRAINT "checkpoint_offers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkpoint_rewards"
    ADD CONSTRAINT "checkpoint_rewards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkpoint_steps"
    ADD CONSTRAINT "checkpoint_steps_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkpoint_steps"
    ADD CONSTRAINT "checkpoint_steps_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."checkpoint_offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkpoint_steps"
    ADD CONSTRAINT "checkpoint_steps_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."checkpoint_rewards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_checkpoints"
    ADD CONSTRAINT "customer_checkpoints_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_checkpoints"
    ADD CONSTRAINT "customer_checkpoints_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_card_merchant_id_fkey" FOREIGN KEY ("card_merchant_id") REFERENCES "public"."card_merchants"("id") ON DELETE CASCADE;



CREATE POLICY "Merchant can insert" ON "public"."customers" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can insert card_merchants" ON "public"."card_merchants" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can insert cards" ON "public"."cards" FOR INSERT WITH CHECK (("issuing_merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can insert transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("card_merchant_id" IN ( SELECT "card_merchants"."id"
   FROM "public"."card_merchants"
  WHERE ("card_merchants"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Merchant can select" ON "public"."customers" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can select card_merchants" ON "public"."card_merchants" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can select cards" ON "public"."cards" FOR SELECT USING (("issuing_merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can select transactions" ON "public"."transactions" FOR SELECT USING (("card_merchant_id" IN ( SELECT "card_merchants"."id"
   FROM "public"."card_merchants"
  WHERE ("card_merchants"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Merchant can update" ON "public"."customers" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can update card_merchants" ON "public"."card_merchants" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can update cards" ON "public"."cards" FOR UPDATE USING (("issuing_merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can update transactions" ON "public"."transactions" FOR UPDATE USING (("card_merchant_id" IN ( SELECT "card_merchants"."id"
   FROM "public"."card_merchants"
  WHERE ("card_merchants"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Merchants are viewable by their profile owner" ON "public"."merchants" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can be created by authenticated users" ON "public"."merchants" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can be deleted by their profile owner" ON "public"."merchants" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can be updated by their profile owner" ON "public"."merchants" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can create their own checkpoint offers" ON "public"."checkpoint_offers" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can create their own checkpoint rewards" ON "public"."checkpoint_rewards" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can create their own checkpoint steps" ON "public"."checkpoint_steps" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can create their own rewards" ON "public"."rewards" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can delete their own checkpoint offers" ON "public"."checkpoint_offers" FOR DELETE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can delete their own checkpoint rewards" ON "public"."checkpoint_rewards" FOR DELETE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can delete their own checkpoint steps" ON "public"."checkpoint_steps" FOR DELETE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can delete their own profile" ON "public"."merchants" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can delete their own rewards" ON "public"."rewards" FOR DELETE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can insert their own profile" ON "public"."merchants" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can update their customers' checkpoints" ON "public"."customer_checkpoints" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can update their own checkpoint offers" ON "public"."checkpoint_offers" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can update their own checkpoint rewards" ON "public"."checkpoint_rewards" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can update their own checkpoint steps" ON "public"."checkpoint_steps" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can update their own profile" ON "public"."merchants" FOR UPDATE USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can update their own rewards" ON "public"."rewards" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view their customers' checkpoints" ON "public"."customer_checkpoints" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view their own checkpoint offers" ON "public"."checkpoint_offers" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view their own checkpoint rewards" ON "public"."checkpoint_rewards" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view their own checkpoint steps" ON "public"."checkpoint_steps" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view their own profile" ON "public"."merchants" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can view their own rewards" ON "public"."rewards" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can create their own subscriptions" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own subscriptions" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "profile_id"));



ALTER TABLE "public"."checkpoint_offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoint_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoint_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."merchants" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_offer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_offer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_customer_checkpoint"("p_customer_id" "uuid", "p_merchant_id" "uuid", "p_offer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_subscription"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_subscription"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_subscription"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_subscription_history"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_subscription_history"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_subscription_history"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_subscription_usage"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_subscription_usage"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_subscription_usage"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_email_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_email_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_email_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_active_subscription"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_active_subscription"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_active_subscription"("profile_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."card_merchants" TO "anon";
GRANT ALL ON TABLE "public"."card_merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."card_merchants" TO "service_role";



GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON TABLE "public"."checkout_billing" TO "anon";
GRANT ALL ON TABLE "public"."checkout_billing" TO "authenticated";
GRANT ALL ON TABLE "public"."checkout_billing" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoint_offers" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_offers" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoint_rewards" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoint_steps" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_steps" TO "service_role";



GRANT ALL ON TABLE "public"."customer_checkpoints" TO "anon";
GRANT ALL ON TABLE "public"."customer_checkpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_checkpoints" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."merchants" TO "anon";
GRANT ALL ON TABLE "public"."merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."merchants" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

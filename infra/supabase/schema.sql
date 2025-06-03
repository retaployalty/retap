

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
    VALUES (p_customer_id, p_merchant_id, 0)  -- Changed from 1 to 0
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


CREATE OR REPLACE FUNCTION "public"."create_customer_checkpoint"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  offer_record RECORD;
BEGIN
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
      NEW.customer_id, 
      NEW.merchant_id, 
      offer_record.id,
      0
    )
    ON CONFLICT (customer_id, merchant_id, offer_id) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_customer_checkpoint"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_card_balance"("card_id" "uuid") RETURNS TABLE("merchant_id" "uuid", "merchant_name" "text", "balance" bigint, "is_issuer" boolean, "industry" "text", "logo_url" "text", "hours" "jsonb", "checkpoints_current" integer, "checkpoints_total" integer, "reward_steps" integer[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN QUERY
  WITH merchant_balances AS (
    SELECT 
      cm.merchant_id as mb_merchant_id,
      m.name as merchant_name,
      COALESCE(SUM(t.points), 0) as balance,
      c.issuing_merchant_id = cm.merchant_id as is_issuer,
      m.industry,
      m.logo_url,
      m.hours
    FROM public.cards c
    JOIN public.card_merchants cm ON cm.card_id = c.id
    JOIN public.merchants m ON m.id = cm.merchant_id
    LEFT JOIN public.transactions t ON t.card_merchant_id = cm.id
    WHERE c.id = $1
    GROUP BY cm.merchant_id, m.name, c.issuing_merchant_id, m.industry, m.logo_url, m.hours
  ),
  checkpoints AS (
    SELECT
      cp.merchant_id as cp_merchant_id,
      cp.current_step,
      co.total_steps,
      co.id as offer_id
    FROM public.customer_checkpoints cp
    JOIN public.cards c ON c.customer_id = cp.customer_id
    JOIN public.checkpoint_offers co ON co.merchant_id = cp.merchant_id
    WHERE c.id = $1
  ),
  best_checkpoint AS (
    SELECT cp_merchant_id, current_step, total_steps, offer_id
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY cp_merchant_id ORDER BY current_step DESC) as rn
      FROM checkpoints
    ) ranked
    WHERE rn = 1
  ),
  reward_steps AS (
    SELECT 
      bc.cp_merchant_id,
      ARRAY_AGG(cs.step_number ORDER BY cs.step_number) as steps
    FROM best_checkpoint bc
    JOIN public.checkpoint_steps cs ON cs.offer_id = bc.offer_id
    WHERE cs.reward_id IS NOT NULL
    GROUP BY bc.cp_merchant_id
  )
  SELECT 
    mb.mb_merchant_id as merchant_id,
    mb.merchant_name,
    mb.balance,
    mb.is_issuer,
    mb.industry,
    mb.logo_url,
    mb.hours,
    COALESCE(bc.current_step, 0) as checkpoints_current,
    COALESCE(bc.total_steps, 0) as checkpoints_total,
    COALESCE(rs.steps, ARRAY[]::integer[]) as reward_steps
  FROM merchant_balances mb
  LEFT JOIN best_checkpoint bc ON bc.cp_merchant_id = mb.mb_merchant_id
  LEFT JOIN reward_steps rs ON rs.cp_merchant_id = mb.mb_merchant_id
  ORDER BY mb.balance DESC;
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


CREATE OR REPLACE FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_customer_id uuid;
BEGIN
    -- Cerca un customer esistente per questo merchant
    SELECT c.id INTO v_customer_id
    FROM public.customers c
    JOIN public.cards cd ON cd.customer_id = c.id
    JOIN public.card_merchants cm ON cm.card_id = cd.id
    WHERE cm.merchant_id = p_merchant_id
    LIMIT 1;

    -- Se non esiste, crea un nuovo customer
    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (id)
        VALUES (gen_random_uuid())
        RETURNING id INTO v_customer_id;
    END IF;

    RETURN v_customer_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid", "p_card_uid" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_customer_id uuid;
    v_card_id uuid;
BEGIN
    -- Prima cerchiamo se esiste già una carta con questo UID
    SELECT c.id, c.customer_id INTO v_card_id, v_customer_id
    FROM public.cards c
    WHERE c.uid = p_card_uid
    LIMIT 1;

    -- Se la carta esiste, usiamo il customer_id esistente
    IF v_customer_id IS NOT NULL THEN
        -- Aggiungiamo la relazione card_merchants se non esiste
        INSERT INTO public.card_merchants (card_id, merchant_id)
        VALUES (v_card_id, p_merchant_id)
        ON CONFLICT (card_id, merchant_id) DO NOTHING;
        
        RETURN v_customer_id;
    END IF;

    -- Se la carta non esiste, creiamo un nuovo customer
    INSERT INTO public.customers (id)
    VALUES (gen_random_uuid())
    RETURNING id INTO v_customer_id;

    RETURN v_customer_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid", "p_card_uid" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."redeem_reward"("p_merchant_id" "uuid", "p_reward_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_balance integer;
  v_price_coins integer;
begin
  -- Get the current balance
  select balance into v_balance
  from get_card_balance(p_merchant_id);

  -- Get the reward price
  select price_coins into v_price_coins
  from rewards
  where id = p_reward_id
    and merchant_id = p_merchant_id;

  -- Check if user has enough points
  if v_balance < v_price_coins then
    raise exception 'Insufficient points to redeem this reward';
  end if;

  -- Create the redemption transaction
  insert into reward_redemptions (
    merchant_id,
    reward_id,
    points_spent
  ) values (
    p_merchant_id,
    p_reward_id,
    v_price_coins
  );
end;
$$;


ALTER FUNCTION "public"."redeem_reward"("p_merchant_id" "uuid", "p_reward_id" "uuid") OWNER TO "postgres";

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
    "current_step" integer DEFAULT 0 NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "offer_id" "uuid",
    CONSTRAINT "customer_checkpoints_step_valid" CHECK (("current_step" >= 0))
);


ALTER TABLE "public"."customer_checkpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
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
    "gallery_images" "jsonb",
    "image_path" "text",
    "opening_hours" "jsonb"
);


ALTER TABLE "public"."merchants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."merchants"."logo_url" IS 'URL del logo del negozio';



COMMENT ON COLUMN "public"."merchants"."cover_image_url" IS 'Array di URL delle immagini di copertina del negozio';



COMMENT ON COLUMN "public"."merchants"."phone" IS 'Numero di telefono del negozio';



COMMENT ON COLUMN "public"."merchants"."google_maps_url" IS 'Link Google Maps del negozio';



COMMENT ON COLUMN "public"."merchants"."hours" IS 'Orari di apertura in formato JSON';



COMMENT ON COLUMN "public"."merchants"."annual_closures" IS 'Chiusure annuali in formato JSON';



COMMENT ON COLUMN "public"."merchants"."gallery_images" IS 'Array di URL immagini aggiuntive (galleria)';



COMMENT ON COLUMN "public"."merchants"."opening_hours" IS 'JSONB object with opening hours for each day of the week. Format: {"monday": {"open": "09:00", "close": "20:00"}, ...}';



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


CREATE TABLE IF NOT EXISTS "public"."redeemed_checkpoint_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "checkpoint_reward_id" "uuid" NOT NULL,
    "checkpoint_step_id" "uuid" NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "redeemed_checkpoint_rewards_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."redeemed_checkpoint_rewards" OWNER TO "postgres";


COMMENT ON TABLE "public"."redeemed_checkpoint_rewards" IS 'Traccia i premi dei checkpoint riscattati dai clienti';



CREATE TABLE IF NOT EXISTS "public"."redeemed_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "reward_id" "uuid" NOT NULL,
    "points_spent" integer NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    CONSTRAINT "redeemed_rewards_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."redeemed_rewards" OWNER TO "postgres";


COMMENT ON TABLE "public"."redeemed_rewards" IS 'Traccia i rewards riscattati dai clienti';



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
    ADD CONSTRAINT "cards_customer_id_unique" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_uid_key" UNIQUE ("uid");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_uid_unique" UNIQUE ("uid");



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
    ADD CONSTRAINT "customer_checkpoints_customer_merchant_offer_unique" UNIQUE ("customer_id", "merchant_id", "offer_id");



ALTER TABLE ONLY "public"."customer_checkpoints"
    ADD CONSTRAINT "customer_checkpoints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redeemed_rewards"
    ADD CONSTRAINT "redeemed_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "on_card_merchant_created" AFTER INSERT ON "public"."card_merchants" FOR EACH ROW EXECUTE FUNCTION "public"."create_customer_checkpoint"();



CREATE OR REPLACE TRIGGER "on_checkpoint_offers_updated" BEFORE UPDATE ON "public"."checkpoint_offers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_checkpoint_rewards_updated" BEFORE UPDATE ON "public"."checkpoint_rewards" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_checkpoint_steps_updated" BEFORE UPDATE ON "public"."checkpoint_steps" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_redeemed_checkpoint_rewards_updated" BEFORE UPDATE ON "public"."redeemed_checkpoint_rewards" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_redeemed_rewards_updated" BEFORE UPDATE ON "public"."redeemed_rewards" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



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



ALTER TABLE ONLY "public"."customer_checkpoints"
    ADD CONSTRAINT "customer_checkpoints_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."checkpoint_offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_checkpoint_reward_id_fkey" FOREIGN KEY ("checkpoint_reward_id") REFERENCES "public"."checkpoint_rewards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_checkpoint_step_id_fkey" FOREIGN KEY ("checkpoint_step_id") REFERENCES "public"."checkpoint_steps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redeemed_checkpoint_rewards"
    ADD CONSTRAINT "redeemed_checkpoint_rewards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redeemed_rewards"
    ADD CONSTRAINT "redeemed_rewards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redeemed_rewards"
    ADD CONSTRAINT "redeemed_rewards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redeemed_rewards"
    ADD CONSTRAINT "redeemed_rewards_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_card_merchant_id_fkey" FOREIGN KEY ("card_merchant_id") REFERENCES "public"."card_merchants"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view hours and image" ON "public"."merchants" FOR SELECT USING (true);



CREATE POLICY "Merchant can insert card_merchants" ON "public"."card_merchants" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can insert cards" ON "public"."cards" FOR INSERT WITH CHECK (("issuing_merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can insert customers" ON "public"."customers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."cards" "c"
     JOIN "public"."card_merchants" "cm" ON (("cm"."card_id" = "c"."id")))
  WHERE (("c"."customer_id" = "customers"."id") AND ("cm"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"())))))));



CREATE POLICY "Merchant can insert transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("card_merchant_id" IN ( SELECT "card_merchants"."id"
   FROM "public"."card_merchants"
  WHERE ("card_merchants"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Merchant can select card_merchants" ON "public"."card_merchants" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can select cards" ON "public"."cards" FOR SELECT USING (("issuing_merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can select customers" ON "public"."customers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."cards" "c"
     JOIN "public"."card_merchants" "cm" ON (("cm"."card_id" = "c"."id")))
  WHERE (("c"."customer_id" = "customers"."id") AND ("cm"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"())))))));



CREATE POLICY "Merchant can select transactions" ON "public"."transactions" FOR SELECT USING (("card_merchant_id" IN ( SELECT "card_merchants"."id"
   FROM "public"."card_merchants"
  WHERE ("card_merchants"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Merchant can update card_merchants" ON "public"."card_merchants" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can update cards" ON "public"."cards" FOR UPDATE USING (("issuing_merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchant can update customers" ON "public"."customers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."cards" "c"
     JOIN "public"."card_merchants" "cm" ON (("cm"."card_id" = "c"."id")))
  WHERE (("c"."customer_id" = "customers"."id") AND ("cm"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"())))))));



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



CREATE POLICY "Merchants can insert redeemed checkpoint rewards" ON "public"."redeemed_checkpoint_rewards" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can insert redeemed rewards" ON "public"."redeemed_rewards" FOR INSERT WITH CHECK (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can insert their own profile" ON "public"."merchants" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can update their customers' checkpoints" ON "public"."customer_checkpoints" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can update their customers' redeemed checkpoint rewar" ON "public"."redeemed_checkpoint_rewards" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
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



CREATE POLICY "Merchants can update their own hours and image" ON "public"."merchants" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Merchants can update their own profile" ON "public"."merchants" FOR UPDATE USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can update their own rewards" ON "public"."rewards" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can update their redeemed rewards" ON "public"."redeemed_rewards" FOR UPDATE USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view their customers' checkpoints" ON "public"."customer_checkpoints" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Merchants can view their customers' redeemed checkpoint rewards" ON "public"."redeemed_checkpoint_rewards" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
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



CREATE POLICY "Merchants can view their redeemed rewards" ON "public"."redeemed_rewards" FOR SELECT USING (("merchant_id" IN ( SELECT "merchants"."id"
   FROM "public"."merchants"
  WHERE ("merchants"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can create their own subscriptions" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own subscriptions" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "profile_id"));





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



GRANT ALL ON FUNCTION "public"."create_customer_checkpoint"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_customer_checkpoint"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_customer_checkpoint"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_card_balance"("card_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_subscription"("profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_subscription"("profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_subscription"("profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid", "p_card_uid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid", "p_card_uid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_customer"("p_merchant_id" "uuid", "p_card_uid" "text") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."redeem_reward"("p_merchant_id" "uuid", "p_reward_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_reward"("p_merchant_id" "uuid", "p_reward_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_reward"("p_merchant_id" "uuid", "p_reward_id" "uuid") TO "service_role";


















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



GRANT ALL ON TABLE "public"."redeemed_checkpoint_rewards" TO "anon";
GRANT ALL ON TABLE "public"."redeemed_checkpoint_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."redeemed_checkpoint_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."redeemed_rewards" TO "anon";
GRANT ALL ON TABLE "public"."redeemed_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."redeemed_rewards" TO "service_role";



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

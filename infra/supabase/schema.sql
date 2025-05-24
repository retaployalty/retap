

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
    "address" "text" NOT NULL
);


ALTER TABLE "public"."merchants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "stripe_payment_method_id" "text",
    "card_last4" "text",
    "card_brand" "text",
    "card_exp_month" integer,
    "card_exp_year" integer,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_methods_type_check" CHECK (("type" = ANY (ARRAY['card'::"text", 'bank_transfer'::"text"])))
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "status" "text" NOT NULL,
    "payment_method" "text" NOT NULL,
    "payment_intent_id" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['card'::"text", 'bank_transfer'::"text"]))),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


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
    CONSTRAINT "subscriptions_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['base'::"text", 'premium'::"text", 'top'::"text"]))),
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


CREATE TABLE IF NOT EXISTS "public"."checkout_billing" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "zip_code" "text" NOT NULL,
    "country" "text" NOT NULL,
    "vat_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checkout_billing" OWNER TO "postgres";


ALTER TABLE public.checkout_billing
  ADD COLUMN title text,
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN street_address text,
  ADD COLUMN address_extra text,
  ADD COLUMN address_info text,
  ADD COLUMN is_company boolean,
  ADD COLUMN company_name text,
  ADD COLUMN phone text;


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



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "on_payment_methods_updated" BEFORE UPDATE ON "public"."payment_methods" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_payments_updated" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_subscriptions_updated" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."card_merchants"
    ADD CONSTRAINT "card_merchants_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_merchants"
    ADD CONSTRAINT "card_merchants_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_issuing_merchant_id_fkey" FOREIGN KEY ("issuing_merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



CREATE POLICY "Merchant can insert transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("card_merchant_id" IN ( SELECT "card_merchants"."id"
   FROM "public"."card_merchants"
  WHERE ("card_merchants"."merchant_id" IN ( SELECT "merchants"."id"
           FROM "public"."merchants"
          WHERE ("merchants"."profile_id" = "auth"."uid"()))))));


CREATE POLICY "Merchants are viewable by their profile owner" ON "public"."merchants" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can be created by authenticated users" ON "public"."merchants" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Merchants can be deleted by their profile owner" ON "public"."merchants" FOR DELETE USING (("auth"."uid"() = "profile_id"));


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



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can create their own payment methods" ON "public"."payment_methods" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can create their own payments" ON "public"."payments" FOR INSERT WITH CHECK (("subscription_id" IN ( SELECT "subscriptions"."id"
   FROM "public"."subscriptions"
  WHERE ("subscriptions"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Users can create their own subscriptions" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can delete their own payment methods" ON "public"."payment_methods" FOR DELETE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own payment methods" ON "public"."payment_methods" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own subscriptions" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own payment methods" ON "public"."payment_methods" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view their own payments" ON "public"."payments" FOR SELECT USING (("subscription_id" IN ( SELECT "subscriptions"."id"
   FROM "public"."subscriptions"
  WHERE ("subscriptions"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "profile_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































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



GRANT ALL ON TABLE "public"."card_merchants" TO "anon";
GRANT ALL ON TABLE "public"."card_merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."card_merchants" TO "service_role";



GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."merchants" TO "anon";
GRANT ALL ON TABLE "public"."merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."merchants" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



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

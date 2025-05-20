

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

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "customer_id" "uuid",
    "uid" "text",
    "merchant_id" "uuid" NOT NULL
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
    "country" "text" NOT NULL,
    "industry" "text" NOT NULL,
    "address" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    CONSTRAINT "merchants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);


ALTER TABLE "public"."merchants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone_number" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "plan_type" "text" NOT NULL CHECK (plan_type IN ('base', 'premium', 'top')),
    "billing_type" "text" NOT NULL CHECK (billing_type IN ('monthly', 'annual')),
    "status" "text" NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_date" timestamp with time zone,
    "trial_end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscriptions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" NOT NULL DEFAULT 'EUR',
    "status" "text" NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    "payment_method" "text" NOT NULL CHECK (payment_method IN ('card', 'bank_transfer')),
    "payment_intent_id" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "type" "text" NOT NULL CHECK (type IN ('card', 'bank_transfer')),
    "stripe_payment_method_id" "text",
    "card_last4" "text",
    "card_brand" "text",
    "card_exp_month" integer,
    "card_exp_year" integer,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_methods_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE
);


ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_uid_key" UNIQUE ("uid");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."merchants"
    ADD CONSTRAINT "merchants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id");



CREATE POLICY "Merchants are viewable by their profile owner" ON "public"."merchants"
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Merchants can be created by authenticated users" ON "public"."merchants"
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Merchants can be updated by their profile owner" ON "public"."merchants"
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Merchants can be deleted by their profile owner" ON "public"."merchants"
    FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Merchant can insert" ON "public"."customers" 
    FOR INSERT WITH CHECK (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can select" ON "public"."customers" 
    FOR SELECT USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can update" ON "public"."customers" 
    FOR UPDATE USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can insert cards" ON "public"."cards" 
    FOR INSERT WITH CHECK (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can select cards" ON "public"."cards" 
    FOR SELECT USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can update cards" ON "public"."cards" 
    FOR UPDATE USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can insert transactions" ON "public"."transactions" 
    FOR INSERT WITH CHECK (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can select transactions" ON "public"."transactions" 
    FOR SELECT USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchant can update transactions" ON "public"."transactions" 
    FOR UPDATE USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."handle_email_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_email_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_email_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."merchants" TO "anon";
GRANT ALL ON TABLE "public"."merchants" TO "authenticated";
GRANT ALL ON TABLE "public"."merchants" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



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

-- Add RLS policies for subscriptions
CREATE POLICY "Merchants can view their own subscriptions" ON "public"."subscriptions"
    FOR SELECT USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchants can create their own subscriptions" ON "public"."subscriptions"
    FOR INSERT WITH CHECK (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchants can update their own subscriptions" ON "public"."subscriptions"
    FOR UPDATE USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

-- Add RLS policies for payments
CREATE POLICY "Merchants can view their own payments" ON "public"."payments"
    FOR SELECT USING (("subscription_id" IN (
        SELECT id FROM public.subscriptions WHERE merchant_id IN (
            SELECT id FROM public.merchants WHERE profile_id = auth.uid()
        )
    )));

CREATE POLICY "Merchants can create their own payments" ON "public"."payments"
    FOR INSERT WITH CHECK (("subscription_id" IN (
        SELECT id FROM public.subscriptions WHERE merchant_id IN (
            SELECT id FROM public.merchants WHERE profile_id = auth.uid()
        )
    )));

-- Add RLS policies for payment methods
CREATE POLICY "Merchants can view their own payment methods" ON "public"."payment_methods"
    FOR SELECT USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchants can create their own payment methods" ON "public"."payment_methods"
    FOR INSERT WITH CHECK (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchants can update their own payment methods" ON "public"."payment_methods"
    FOR UPDATE USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Merchants can delete their own payment methods" ON "public"."payment_methods"
    FOR DELETE USING (("merchant_id" IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    )));

-- Add triggers for updated_at
CREATE TRIGGER "on_subscriptions_updated" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE TRIGGER "on_payments_updated" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE TRIGGER "on_payment_methods_updated" BEFORE UPDATE ON "public"."payment_methods" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- Grant permissions
GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";

GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";

GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";

-- Function to check if a merchant has an active subscription
CREATE OR REPLACE FUNCTION "public"."has_active_subscription"("merchant_id" uuid)
RETURNS boolean
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE merchant_id = $1
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$;

-- Function to get current subscription details
CREATE OR REPLACE FUNCTION "public"."get_current_subscription"("merchant_id" uuid)
RETURNS TABLE (
  plan_type text,
  billing_type text,
  status text,
  start_date timestamptz,
  end_date timestamptz,
  days_remaining integer
)
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
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
  WHERE s.merchant_id = $1
  AND s.status = 'active'
  AND (s.end_date IS NULL OR s.end_date > now())
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Function to get subscription history
CREATE OR REPLACE FUNCTION "public"."get_subscription_history"("merchant_id" uuid)
RETURNS TABLE (
  plan_type text,
  billing_type text,
  status text,
  start_date timestamptz,
  end_date timestamptz,
  payment_amount numeric,
  payment_status text,
  payment_date timestamptz
)
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
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
  WHERE s.merchant_id = $1
  ORDER BY s.created_at DESC;
END;
$$;

-- Function to get subscription usage stats
CREATE OR REPLACE FUNCTION "public"."get_subscription_usage"("merchant_id" uuid)
RETURNS TABLE (
  total_cards integer,
  cards_this_month integer,
  plan_limit integer,
  usage_percentage numeric
)
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
  current_plan text;
  plan_limit integer;
BEGIN
  -- Get current plan
  SELECT s.plan_type INTO current_plan
  FROM public.subscriptions s
  WHERE s.merchant_id = $1
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
    FROM public.cards
    WHERE merchant_id = $1
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
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION "public"."has_active_subscription"(uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."has_active_subscription"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."has_active_subscription"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_current_subscription"(uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_current_subscription"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_current_subscription"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_subscription_history"(uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_subscription_history"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_subscription_history"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_subscription_usage"(uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_subscription_usage"(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_subscription_usage"(uuid) TO "service_role";

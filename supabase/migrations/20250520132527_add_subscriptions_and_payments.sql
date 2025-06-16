-- Create subscriptions table
CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "plan_type" "text" NOT NULL CHECK (plan_type IN ('base', 'premium', 'top')),
    "billing_type" "text" NOT NULL CHECK (billing_type IN ('monthly', 'annual')),
    "status" "text" NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_date" timestamp with time zone,
    "trial_end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscriptions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- Create payments table
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

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
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
    CONSTRAINT "payment_methods_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

-- Add RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions"
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own subscriptions" ON "public"."subscriptions"
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own subscriptions" ON "public"."subscriptions"
    FOR UPDATE USING (auth.uid() = profile_id);

-- Add RLS policies for payments
CREATE POLICY "Users can view their own payments" ON "public"."payments"
    FOR SELECT USING (("subscription_id" IN (
        SELECT id FROM public.subscriptions WHERE profile_id = auth.uid()
    )));

CREATE POLICY "Users can create their own payments" ON "public"."payments"
    FOR INSERT WITH CHECK (("subscription_id" IN (
        SELECT id FROM public.subscriptions WHERE profile_id = auth.uid()
    )));

-- Add RLS policies for payment methods
CREATE POLICY "Users can view their own payment methods" ON "public"."payment_methods"
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own payment methods" ON "public"."payment_methods"
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own payment methods" ON "public"."payment_methods"
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own payment methods" ON "public"."payment_methods"
    FOR DELETE USING (auth.uid() = profile_id);

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

-- Create helper functions
CREATE OR REPLACE FUNCTION "public"."has_active_subscription"("profile_id" uuid)
RETURNS boolean
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE profile_id = $1
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_current_subscription"("profile_id" uuid)
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
  WHERE s.profile_id = $1
  AND s.status = 'active'
  AND (s.end_date IS NULL OR s.end_date > now())
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_subscription_history"("profile_id" uuid)
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
  WHERE s.profile_id = $1
  ORDER BY s.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_subscription_usage"("profile_id" uuid)
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

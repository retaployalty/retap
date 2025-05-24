-- Create rewards table
CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image_path" "text" NOT NULL,
    "price_coins" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "rewards_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;

-- Policy for merchants to view their own rewards
CREATE POLICY "Merchants can view their own rewards" ON "public"."rewards"
    FOR SELECT USING (
        "merchant_id" IN (
            SELECT "id" FROM "public"."merchants"
            WHERE "profile_id" = "auth"."uid"()
        )
    );

-- Policy for merchants to create their own rewards
CREATE POLICY "Merchants can create their own rewards" ON "public"."rewards"
    FOR INSERT WITH CHECK (
        "merchant_id" IN (
            SELECT "id" FROM "public"."merchants"
            WHERE "profile_id" = "auth"."uid"()
        )
    );

-- Policy for merchants to update their own rewards
CREATE POLICY "Merchants can update their own rewards" ON "public"."rewards"
    FOR UPDATE USING (
        "merchant_id" IN (
            SELECT "id" FROM "public"."merchants"
            WHERE "profile_id" = "auth"."uid"()
        )
    );

-- Policy for merchants to delete their own rewards
CREATE POLICY "Merchants can delete their own rewards" ON "public"."rewards"
    FOR DELETE USING (
        "merchant_id" IN (
            SELECT "id" FROM "public"."merchants"
            WHERE "profile_id" = "auth"."uid"()
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER "on_rewards_updated"
    BEFORE UPDATE ON "public"."rewards"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_updated_at"();

-- Grant permissions
GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role"; 
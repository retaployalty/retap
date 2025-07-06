-- Migration: Add merchant card allocation tracking
-- Date: 2024-12-20

-- Create table to track card allocation for merchants
CREATE TABLE IF NOT EXISTS "public"."merchant_card_allocation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "total_cards_allocated" integer DEFAULT 100 NOT NULL,
    "cards_distributed" integer DEFAULT 0 NOT NULL,
    "cards_available" integer DEFAULT 100 NOT NULL,
    "last_allocation_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "merchant_card_allocation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "merchant_card_allocation_merchant_id_key" UNIQUE ("merchant_id"),
    CONSTRAINT "merchant_card_allocation_cards_check" CHECK (("total_cards_allocated" >= 0 AND "cards_distributed" >= 0 AND "cards_available" >= 0))
);

-- Add comments
COMMENT ON TABLE "public"."merchant_card_allocation" IS 'Tracks card allocation and distribution for each merchant';
COMMENT ON COLUMN "public"."merchant_card_allocation"."total_cards_allocated" IS 'Total cards allocated to merchant (default 100)';
COMMENT ON COLUMN "public"."merchant_card_allocation"."cards_distributed" IS 'Number of cards actually distributed to customers';
COMMENT ON COLUMN "public"."merchant_card_allocation"."cards_available" IS 'Cards still available for distribution';

-- Add foreign key constraint
ALTER TABLE "public"."merchant_card_allocation" 
    ADD CONSTRAINT "merchant_card_allocation_merchant_id_fkey" 
    FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER "on_merchant_card_allocation_updated" 
    BEFORE UPDATE ON "public"."merchant_card_allocation" 
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- Create function to automatically create allocation record for new merchants
CREATE OR REPLACE FUNCTION "public"."create_merchant_card_allocation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.merchant_card_allocation (
        merchant_id,
        total_cards_allocated,
        cards_distributed,
        cards_available
    ) VALUES (
        NEW.id,
        100, -- Default allocation
        0,   -- No cards distributed yet
        100  -- All cards available
    );
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create allocation when merchant is created
CREATE OR REPLACE TRIGGER "on_merchant_created" 
    AFTER INSERT ON "public"."merchants" 
    FOR EACH ROW EXECUTE FUNCTION "public"."create_merchant_card_allocation"();

-- Create function to update cards_distributed when a card is created
CREATE OR REPLACE FUNCTION "public"."update_merchant_cards_distributed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update the cards_distributed count for the merchant
    UPDATE public.merchant_card_allocation 
    SET 
        cards_distributed = cards_distributed + 1,
        cards_available = cards_available - 1,
        updated_at = now()
    WHERE merchant_id = NEW.issuing_merchant_id;
    
    RETURN NEW;
END;
$$;

-- Create trigger to update distributed count when card is created
CREATE OR REPLACE TRIGGER "on_card_created" 
    AFTER INSERT ON "public"."cards" 
    FOR EACH ROW EXECUTE FUNCTION "public"."update_merchant_cards_distributed"();

-- Grant permissions
GRANT ALL ON TABLE "public"."merchant_card_allocation" TO "anon";
GRANT ALL ON TABLE "public"."merchant_card_allocation" TO "authenticated";
GRANT ALL ON TABLE "public"."merchant_card_allocation" TO "service_role";

-- Create RLS policies
CREATE POLICY "Merchants can view their own card allocation" ON "public"."merchant_card_allocation" 
    FOR SELECT USING ("merchant_id" IN ( 
        SELECT "merchants"."id" FROM "public"."merchants" WHERE "merchants"."profile_id" = "auth"."uid"() 
    ));

CREATE POLICY "Merchants can update their own card allocation" ON "public"."merchant_card_allocation" 
    FOR UPDATE USING ("merchant_id" IN ( 
        SELECT "merchants"."id" FROM "public"."merchants" WHERE "merchants"."profile_id" = "auth"."uid"() 
    ));

-- Insert allocation records for existing merchants (if any)
INSERT INTO public.merchant_card_allocation (merchant_id, total_cards_allocated, cards_distributed, cards_available)
SELECT 
    m.id,
    100,
    COALESCE(card_count.count, 0),
    100 - COALESCE(card_count.count, 0)
FROM public.merchants m
LEFT JOIN (
    SELECT issuing_merchant_id, COUNT(*) as count
    FROM public.cards
    GROUP BY issuing_merchant_id
) card_count ON card_count.issuing_merchant_id = m.id
ON CONFLICT (merchant_id) DO NOTHING; 
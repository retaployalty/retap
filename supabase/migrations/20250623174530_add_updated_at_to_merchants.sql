-- Add updated_at column to merchants table
ALTER TABLE "public"."merchants" 
ADD COLUMN "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL;

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION "public"."handle_merchants_updated_at"()
RETURNS "trigger"
LANGUAGE "plpgsql"
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Create trigger for merchants table
CREATE TRIGGER "on_merchants_updated" 
    BEFORE UPDATE ON "public"."merchants" 
    FOR EACH ROW 
    EXECUTE FUNCTION "public"."handle_merchants_updated_at"();

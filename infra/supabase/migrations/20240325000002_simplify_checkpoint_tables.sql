-- Create new simplified checkpoints table
CREATE TABLE IF NOT EXISTS "public"."checkpoints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "merchant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "total_steps" integer NOT NULL,
    "step_number" integer NOT NULL,
    "reward_name" "text",
    "reward_description" "text",
    "reward_icon" "text" DEFAULT 'gift',
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checkpoints_merchant_step_unique" UNIQUE ("merchant_id", "step_number"),
    CONSTRAINT "checkpoints_total_steps_positive" CHECK (total_steps > 0),
    CONSTRAINT "checkpoints_step_number_positive" CHECK (step_number > 0),
    CONSTRAINT "checkpoints_step_number_valid" CHECK (step_number <= total_steps),
    CONSTRAINT "checkpoints_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE CASCADE
);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER "on_checkpoints_updated" 
BEFORE UPDATE ON "public"."checkpoints" 
FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- Migrate data from old tables
INSERT INTO public.checkpoints (
    merchant_id,
    name,
    description,
    total_steps,
    step_number,
    reward_name,
    reward_description,
    reward_icon
)
SELECT 
    co.merchant_id,
    co.name,
    co.description,
    co.total_steps,
    cs.step_number,
    cr.name as reward_name,
    cr.description as reward_description,
    COALESCE(cr.icon, 'gift') as reward_icon
FROM public.checkpoint_offers co
JOIN public.checkpoint_steps cs ON cs.offer_id = co.id
LEFT JOIN public.checkpoint_rewards cr ON cr.id = cs.reward_id;

-- Drop old tables
DROP TABLE IF EXISTS public.checkpoint_steps;
DROP TABLE IF EXISTS public.checkpoint_rewards;
DROP TABLE IF EXISTS public.checkpoint_offers;

-- Update customer_checkpoints to reference new table
ALTER TABLE public.customer_checkpoints
ADD CONSTRAINT "customer_checkpoints_step_valid"
CHECK (current_step > 0);

-- Add comment to explain the structure
COMMENT ON TABLE public.checkpoints IS 'Unified table for checkpoint offers and rewards. Each row represents a step in a loyalty program with its associated reward.'; 
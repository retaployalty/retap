-- Drop the simplified checkpoints table
DROP TABLE IF EXISTS public.checkpoints;

-- Recreate the original checkpoint tables
CREATE TABLE IF NOT EXISTS public.checkpoint_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    total_steps integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checkpoint_offers_pkey PRIMARY KEY (id),
    CONSTRAINT checkpoint_offers_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.checkpoint_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL DEFAULT 'gift',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checkpoint_rewards_pkey PRIMARY KEY (id),
    CONSTRAINT checkpoint_rewards_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.checkpoint_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    merchant_id uuid NOT NULL,
    step_number integer NOT NULL,
    total_steps integer NOT NULL,
    reward_id uuid,
    offer_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checkpoint_steps_pkey PRIMARY KEY (id),
    CONSTRAINT checkpoint_steps_offer_step_unique UNIQUE (offer_id, step_number),
    CONSTRAINT checkpoint_steps_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE,
    CONSTRAINT checkpoint_steps_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.checkpoint_offers(id) ON DELETE CASCADE,
    CONSTRAINT checkpoint_steps_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.checkpoint_rewards(id) ON DELETE SET NULL
);

-- Add comments
COMMENT ON TABLE public.checkpoint_offers IS 'Offerte di checkpoint per i programmi fedeltà';
COMMENT ON TABLE public.checkpoint_rewards IS 'Premi associati ai checkpoint';
COMMENT ON TABLE public.checkpoint_steps IS 'Step dei checkpoint con i relativi premi';

-- Enable RLS
ALTER TABLE public.checkpoint_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_steps ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for checkpoint_offers
CREATE POLICY "Merchants can create their own checkpoint offers" ON public.checkpoint_offers
    FOR INSERT WITH CHECK (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can view their own checkpoint offers" ON public.checkpoint_offers
    FOR SELECT USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can update their own checkpoint offers" ON public.checkpoint_offers
    FOR UPDATE USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can delete their own checkpoint offers" ON public.checkpoint_offers
    FOR DELETE USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

-- Add RLS policies for checkpoint_rewards
CREATE POLICY "Merchants can create their own checkpoint rewards" ON public.checkpoint_rewards
    FOR INSERT WITH CHECK (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can view their own checkpoint rewards" ON public.checkpoint_rewards
    FOR SELECT USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can update their own checkpoint rewards" ON public.checkpoint_rewards
    FOR UPDATE USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can delete their own checkpoint rewards" ON public.checkpoint_rewards
    FOR DELETE USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

-- Add RLS policies for checkpoint_steps
CREATE POLICY "Merchants can create their own checkpoint steps" ON public.checkpoint_steps
    FOR INSERT WITH CHECK (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can view their own checkpoint steps" ON public.checkpoint_steps
    FOR SELECT USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can update their own checkpoint steps" ON public.checkpoint_steps
    FOR UPDATE USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

CREATE POLICY "Merchants can delete their own checkpoint steps" ON public.checkpoint_steps
    FOR DELETE USING (merchant_id IN (
        SELECT id FROM public.merchants WHERE profile_id = auth.uid()
    ));

-- Add triggers for updated_at
CREATE TRIGGER on_checkpoint_offers_updated
    BEFORE UPDATE ON public.checkpoint_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_checkpoint_rewards_updated
    BEFORE UPDATE ON public.checkpoint_rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_checkpoint_steps_updated
    BEFORE UPDATE ON public.checkpoint_steps
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 
-- Enable RLS
ALTER TABLE public.checkpoint_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_steps ENABLE ROW LEVEL SECURITY;

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
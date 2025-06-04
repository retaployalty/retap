-- Create table to track checkpoint advancements
CREATE TABLE IF NOT EXISTS public.checkpoint_advancements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    merchant_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    step_number integer NOT NULL,
    total_steps integer NOT NULL,
    advanced_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checkpoint_advancements_pkey PRIMARY KEY (id),
    CONSTRAINT checkpoint_advancements_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
    CONSTRAINT checkpoint_advancements_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE,
    CONSTRAINT checkpoint_advancements_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.checkpoint_offers(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.checkpoint_advancements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view their customers' checkpoint advancements"
    ON public.checkpoint_advancements
    FOR SELECT
    USING (merchant_id IN (
        SELECT id FROM public.merchants
        WHERE profile_id = auth.uid()
    ));

-- Modify the advance_customer_checkpoint function to record advancements
CREATE OR REPLACE FUNCTION public.advance_customer_checkpoint(
    p_customer_id uuid,
    p_merchant_id uuid,
    p_offer_id uuid
) RETURNS TABLE(
    current_step integer,
    total_steps integer,
    reward_id uuid,
    reward_name text,
    reward_description text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_step integer;
    v_total_steps integer;
    v_next_step integer;
    v_reward_id uuid;
    v_reward_name text;
    v_reward_description text;
BEGIN
    -- Get or create customer checkpoint
    BEGIN
        INSERT INTO customer_checkpoints (
            customer_id,
            merchant_id,
            offer_id,
            current_step
        )
        VALUES (
            p_customer_id,
            p_merchant_id,
            p_offer_id,
            0
        );
    EXCEPTION WHEN unique_violation THEN
        -- If insert fails due to unique constraint, do nothing
        NULL;
    END;

    -- Get current step and total steps from the offer
    SELECT 
        cp.current_step,
        co.total_steps
    INTO 
        v_current_step,
        v_total_steps
    FROM customer_checkpoints cp
    JOIN checkpoint_offers co ON co.id = cp.offer_id
    WHERE cp.customer_id = p_customer_id
    AND cp.merchant_id = p_merchant_id
    AND cp.offer_id = p_offer_id;

    -- Calculate next step
    v_next_step := v_current_step + 1;
    IF v_next_step > v_total_steps THEN
        v_next_step := 1;
    END IF;

    -- Record the advancement
    INSERT INTO checkpoint_advancements (
        customer_id,
        merchant_id,
        offer_id,
        step_number,
        total_steps
    ) VALUES (
        p_customer_id,
        p_merchant_id,
        p_offer_id,
        v_next_step,
        v_total_steps
    );

    -- Update customer checkpoint
    UPDATE customer_checkpoints
    SET 
        current_step = v_next_step,
        last_updated = now()
    WHERE customer_id = p_customer_id
    AND merchant_id = p_merchant_id
    AND offer_id = p_offer_id;

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
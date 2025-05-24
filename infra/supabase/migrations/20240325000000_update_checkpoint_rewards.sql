-- Remove image_path column and add icon column to checkpoint_rewards
ALTER TABLE public.checkpoint_rewards
DROP COLUMN image_path,
ADD COLUMN icon text NOT NULL DEFAULT 'gift';

-- Update existing rewards to use the default icon
UPDATE public.checkpoint_rewards
SET icon = 'gift'
WHERE icon IS NULL;

-- Add comment to explain the icon field
COMMENT ON COLUMN public.checkpoint_rewards.icon IS 'Icon name from Lucide icons library'; 
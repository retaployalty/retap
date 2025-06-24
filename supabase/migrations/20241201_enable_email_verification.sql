-- Enable email verification for new users
-- This migration updates Supabase configuration to require email verification

-- Note: Main configuration has already been updated in supabase/config.toml
-- This migration serves as documentation and for any additional configurations

-- Ensure the profiles table has the necessary fields for verification
-- (already present in existing schema)

-- Add a comment to document the change
COMMENT ON TABLE profiles IS 'User profiles - now requires email verification for activation'; 
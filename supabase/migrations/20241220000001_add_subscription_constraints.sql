-- Migration per aggiungere constraint alla tabella subscriptions
-- Aggiungi constraint unico su profile_id per permettere upsert
ALTER TABLE "public"."subscriptions"
  ADD CONSTRAINT "subscriptions_profile_id_unique"
  UNIQUE ("profile_id");

-- Aggiungi constraint check per lo status
ALTER TABLE "public"."subscriptions"
  ADD CONSTRAINT "subscriptions_status_check"
  CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'inactive')); 
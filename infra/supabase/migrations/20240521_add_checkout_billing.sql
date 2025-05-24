-- Migrazione: crea tabella checkout_billing per dati di fatturazione checkout

CREATE TABLE IF NOT EXISTS public.checkout_billing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    zip_code text NOT NULL,
    country text NOT NULL,
    vat_number text,
    created_at timestamp with time zone DEFAULT now()
);
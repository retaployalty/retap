-- Table: public.merchants

create table public.merchants (
  id uuid not null default gen_random_uuid (),
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint merchants_pkey primary key (id)
) TABLESPACE pg_default;


-- Table: public.customers

create table public.customers (
  id uuid not null default gen_random_uuid (),
  email text null,
  merchant_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint customers_pkey primary key (id),
  constraint customers_merchant_id_fkey foreign key (merchant_id) references merchants (id)
) TABLESPACE pg_default;


-- Table: public.cards

create table public.cards (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  customer_id uuid null,
  uid text null,
  constraint cards_pkey primary key (id),
  constraint cards_uid_key unique (uid),
  constraint cards_customer_id_fkey foreign key (customer_id) references customers (id)
) TABLESPACE pg_default;


-- Table: public.transactions

create table public.transactions (
  id uuid not null default gen_random_uuid (),
  merchant_id uuid not null,
  card_id uuid not null,
  points integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_card_id_fkey foreign key (card_id) references cards (id),
  constraint transactions_merchant_id_fkey foreign key (merchant_id) references merchants (id)
) TABLESPACE pg_default;
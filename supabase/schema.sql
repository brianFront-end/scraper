create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists tracked_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  url text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists price_checks (
  id uuid primary key default gen_random_uuid(),
  tracked_product_id uuid not null references tracked_products(id) on delete cascade,
  price numeric not null,
  currency text not null default 'GBP',
  checked_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  tracked_product_id uuid not null references tracked_products(id) on delete cascade,
  email text not null,
  sent_at timestamptz default now(),
  payload jsonb,
  provider_message_id text,
  delivery_status text default 'queued',
  status_updated_at timestamptz,
  provider_payload jsonb
);

create table if not exists product_alert_settings (
  id uuid primary key default gen_random_uuid(),
  tracked_product_id uuid not null unique references tracked_products(id) on delete cascade,
  target_price numeric,
  target_discount_percent numeric,
  custom_message text,
  updated_at timestamptz default now()
);

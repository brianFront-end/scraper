-- Canonical product comparison model
-- Run this in Supabase SQL Editor

create table if not exists canonical_products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  canonical_name text not null,
  normalized_specs jsonb,
  created_at timestamptz default now(),
  unique (brand, model)
);

create table if not exists product_offers (
  id uuid primary key default gen_random_uuid(),
  canonical_product_id uuid not null references canonical_products(id) on delete cascade,
  tracked_product_id uuid references tracked_products(id) on delete set null,
  store text not null,
  url text not null,
  external_sku text,
  active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_product_offers_canonical_product_id
  on product_offers(canonical_product_id);

create index if not exists idx_product_offers_store
  on product_offers(store);

-- Optional: migrate existing tracked_products into offers quickly
-- 1) create canonical rows manually first
-- 2) link offers to tracked_products with updates like:
-- update product_offers set tracked_product_id = '...' where id = '...';

-- View: latest offer price by store for each canonical product
create or replace view canonical_offer_latest_prices as
select
  cp.id as canonical_product_id,
  cp.canonical_name,
  po.id as offer_id,
  po.store,
  po.url,
  pc.price,
  pc.currency,
  pc.checked_at
from canonical_products cp
join product_offers po on po.canonical_product_id = cp.id
left join lateral (
  select pch.price, pch.currency, pch.checked_at
  from price_checks pch
  where pch.tracked_product_id = po.tracked_product_id
  order by pch.checked_at desc
  limit 1
) pc on true;

-- Helper view: best current price per canonical product
create or replace view canonical_best_price as
select distinct on (canonical_product_id)
  canonical_product_id,
  canonical_name,
  store,
  url,
  price,
  currency,
  checked_at
from canonical_offer_latest_prices
where price is not null
order by canonical_product_id, price asc;

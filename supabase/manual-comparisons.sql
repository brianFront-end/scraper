-- Manual comparisons (A vs B vs C...)

create table if not exists comparison_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists comparison_group_items (
  id uuid primary key default gen_random_uuid(),
  comparison_group_id uuid not null references comparison_groups(id) on delete cascade,
  tracked_product_id uuid not null references tracked_products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (comparison_group_id, tracked_product_id)
);

create index if not exists idx_comparison_group_items_group on comparison_group_items(comparison_group_id);
create index if not exists idx_comparison_group_items_product on comparison_group_items(tracked_product_id);

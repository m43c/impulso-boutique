create index if not exists idx_sales_created_at_id_desc on public.sales (created_at desc, id);

create index if not exists idx_sales_created_at_id_asc on public.sales (created_at asc, id);

create index if not exists idx_sales_profile_id on public.sales (profile_id);

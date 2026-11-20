create table public.sale_details (
  id uuid primary key default gen_random_uuid (),
  sale_id uuid not null references public.sales (id),
  product_unit_id uuid not null references public.product_units (id),
  unit_price decimal(10, 2) not null,
  created_at timestamptz not null default now(),
  constraint chk_sale_details_unit_price_positive check (unit_price > 0)
);

create unique index uq_sale_details_sale_unit on public.sale_details (sale_id, product_unit_id);

create trigger set_sale_details_immutable before
update
or delete on public.sale_details for each row
execute function public.prevent_immutable_changes ();

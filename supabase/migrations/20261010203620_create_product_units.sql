create type product_unit_status as enum('available', 'sold', 'returned', 'unavailable');

create table public.product_units (
  id uuid primary key default gen_random_uuid (),
  product_id uuid not null references public.products (id),
  status product_unit_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_product_units_updated_at before
update on public.product_units for each row
execute function public.set_updated_at ();

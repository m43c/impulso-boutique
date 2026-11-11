create table public.suppliers (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  phone text not null,
  country text default 'Bolivia',
  city text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_suppliers_name_not_blank check (name ~ '\S'),
  constraint chk_suppliers_name_length check (length(name) <= 200),
  constraint chk_suppliers_phone_not_blank check (phone ~ '\S'),
  constraint chk_suppliers_phone_length check (length(phone) <= 30),
  constraint chk_suppliers_country_not_blank check (country ~ '\S'),
  constraint chk_suppliers_country_length check (length(country) <= 100),
  constraint chk_suppliers_city_not_blank check (city ~ '\S'),
  constraint chk_suppliers_city_length check (length(city) <= 100)
);

create unique index uq_suppliers_name on public.suppliers (lower(name))
where
  is_active = true;

create trigger set_suppliers_updated_at before
update on public.suppliers for each row
execute function public.set_updated_at ();

alter table public.products enable row level security;

create policy "Anyone can view products" on public.products for
select
  to authenticated using (true);

create policy "Admins can insert products" on public.products for insert to authenticated
with
  check (public.is_admin ());

create policy "Admins can update products" on public.products
for update
  to authenticated using (public.is_admin ())
with
  check (public.is_admin ());

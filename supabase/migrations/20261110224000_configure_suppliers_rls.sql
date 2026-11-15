alter table public.suppliers enable row level security;

create policy "Anyone can view suppliers" on public.suppliers for
select
  to authenticated using (true);

create policy "Admins can insert suppliers" on public.suppliers for insert to authenticated
with
  check (public.is_admin ());

create policy "Admins can update suppliers" on public.suppliers
for update
  to authenticated using (public.is_admin ())
with
  check (public.is_admin ());

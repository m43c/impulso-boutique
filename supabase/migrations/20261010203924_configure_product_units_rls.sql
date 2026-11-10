alter table public.product_units enable row level security;

create policy "Anyone can view product units" on public.product_units for
select
  to authenticated using (true);

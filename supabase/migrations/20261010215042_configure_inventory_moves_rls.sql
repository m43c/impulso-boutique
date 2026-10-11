alter table public.inventory_moves enable row level security;

create policy "Anyone can view inventory moves" on public.inventory_moves for
select
  to authenticated using (true);

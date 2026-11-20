alter table public.sales enable row level security;

create policy "Admins can view sales" on public.sales for
select
  to authenticated using (public.is_admin ());

alter table public.returns enable row level security;

create policy "Admins can view returns" on public.returns for
select
  to authenticated using (public.is_admin ());

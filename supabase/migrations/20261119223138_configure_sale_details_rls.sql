alter table public.sale_details enable row level security;

create policy "Admins can view sale details" on public.sale_details for
select
  to authenticated using (public.is_admin ());

alter table public.profiles enable row level security;

create or replace function public.is_admin () returns boolean language plpgsql security definer
set
  search_path = public as $$
begin
    return exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'admin'
          and is_active = true
    );
end;
$$;

create policy "Users can view their own profile" on public.profiles for
select
  to authenticated using (id = auth.uid ());

create policy "Admins can view all profiles" on public.profiles for
select
  to authenticated using (public.is_admin ());

create policy "Admins can insert profiles" on public.profiles for insert to authenticated
with
  check (public.is_admin ());

create policy "Admins can update profiles" on public.profiles
for update
  to authenticated using (public.is_admin ())
with
  check (public.is_admin ());

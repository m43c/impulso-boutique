create or replace function public.is_admin_or_cashier () returns boolean language plpgsql security definer
set
  search_path = public as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid ()
      and role in ('admin', 'cashier')
      and is_active = true
  );
end;
$$;

revoke all on function public.is_admin_or_cashier ()
from
  public,
  anon;

grant
execute on function public.is_admin_or_cashier () to authenticated;

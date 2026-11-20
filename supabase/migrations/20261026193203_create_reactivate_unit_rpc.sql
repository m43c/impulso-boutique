create or replace function public.reactivate_unit (p_unit_id uuid, p_note text default null) returns void language plpgsql security definer
set
  search_path = public as $$
declare
  v_status public.product_unit_status;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden reactivar unidades';
  end if;

  select status
    into v_status
    from public.product_units
   where id = p_unit_id
     for update;

  if not found then
    raise exception 'La unidad no existe';
  end if;

  if v_status <> 'unavailable' then
    raise exception 'Solo se pueden reactivar unidades no disponibles (estado actual: %)', v_status;
  end if;

  update public.product_units
     set status = 'available'
   where id = p_unit_id;

  insert into public.inventory_moves (
    product_unit_id, profile_id, type, reason,
    previous_status, new_status, note
  ) values (
    p_unit_id, auth.uid(), 'adjustment', 'correction',
    'unavailable', 'available', nullif(btrim(p_note), '')
  );
end;
$$;

revoke
execute on function public.reactivate_unit (uuid, text)
from
  public,
  anon;

grant
execute on function public.reactivate_unit (uuid, text) to authenticated;

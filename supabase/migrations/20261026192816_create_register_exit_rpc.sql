create or replace function public.register_exit (
  p_unit_id uuid,
  p_reason public.move_reason,
  p_note text default null
) returns void language plpgsql security definer
set
  search_path = public as $$
declare
  v_status public.product_unit_status;
begin
  if not public.is_admin() then
    raise exception 'Solo administradores pueden registrar salidas de inventario';
  end if;

  if p_reason is null or p_reason not in ('loss', 'damage') then
    raise exception 'Razón % no es válida para una salida manual', p_reason;
  end if;

  select status
    into v_status
    from public.product_units
   where id = p_unit_id
     for update;

  if not found then
    raise exception 'La unidad no existe';
  end if;

  if v_status <> 'available' then
    raise exception 'Solo se pueden dar de baja unidades disponibles (estado actual: %)', v_status;
  end if;

  update public.product_units
     set status = 'unavailable'
   where id = p_unit_id;

  insert into public.inventory_moves (
    product_unit_id, profile_id, type, reason,
    previous_status, new_status, note
  ) values (
    p_unit_id, auth.uid(), 'exit', p_reason,
    'available', 'unavailable', nullif(btrim(p_note), '')
  );
end;
$$;

revoke
execute on function public.register_exit (uuid, public.move_reason, text)
from
  public,
  anon;

grant
execute on function public.register_exit (uuid, public.move_reason, text) to authenticated;
